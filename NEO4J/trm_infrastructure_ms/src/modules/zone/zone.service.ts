import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { buildTreeFromSequences, toExpandTrees } from 'src/common/utils/trees';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { Neo4jService } from 'nest-neo4j/dist';
import neo4j from 'neo4j-driver';

@Injectable()
export class ZoneService {
  constructor(private readonly neo4jService: Neo4jService) { }

  private readonly relMap: Record<string, { filter: string; isArray: boolean }> = {
    parent: { filter: '<HAS_CHILD', isArray: false },
    childrens: { filter: 'HAS_CHILD>', isArray: true }
  };

  async create(createDto: CreateZoneDto) {
    const { name, type, parentZoneId } = createDto;

    const parentMatch = parentZoneId ? `
      MATCH (parent:Zone {id: $parentZoneId})
      CALL apoc.util.validate(parent IS NULL, 'Parent Zone not found.', [])
    `: '';

    const linkParent = parentZoneId
      ? `CREATE (parent)-[:HAS_CHILD]->(z)`
      : '';

    const query = `
      ${parentMatch}
      CREATE (z:Zone {
        id: randomUUID(),
        name: $name,
        type: $type
      })
      ${linkParent}
      RETURN z AS zone
    `;

    const params: Record<string, any> = { name, type };
    if (parentZoneId) params.parentZoneId = parentZoneId;

    const res = await this.neo4jService.write(query, params);
    if (!res.records.length) throw new InternalServerErrorException('Failed to create Zone');
    return res.records[0].get('zone');
  }

  async findAllTree(query: PaginationDto) {
    const { page = 1, pageSize = 10, orderBy = 'name:ASC' } = query;
    const skip = (page - 1) * pageSize;

    // Sanitizar orderBy
    const allowed = ['id', 'name'];
    const [rawField, rawDir] = orderBy.split(':');
    const field = allowed.includes(rawField) ? rawField : 'name';
    const dir = rawDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderClause = `ORDER BY z.${field} ${dir}`;

    const cypher = `
      CALL {
        MATCH (z:Zone)
        WHERE NOT ()-[:HAS_CHILD]->(z)
        RETURN count(z) AS totalElements
      }
      WITH totalElements

      CALL {
        MATCH (z:Zone)
        WHERE NOT ()-[:HAS_CHILD]->(z)
        ${orderClause}
        SKIP $skip LIMIT $pageSize
        RETURN collect(z) AS roots
      }
      
      WITH totalElements, roots
      UNWIND roots AS z
      CALL apoc.path.spanningTree(
        z,
        { relationshipFilter: 'HAS_CHILD>', minLevel: 0 }
      ) YIELD path

      WITH totalElements, collect(path) AS paths
      CALL apoc.paths.toJsonTree(paths) YIELD value AS subtree
      RETURN totalElements, collect(subtree) AS data
    `;

    const params = {
      skip: neo4j.int(skip),
      pageSize: neo4j.int(pageSize)
    };

    const res = await this.neo4jService.read(cypher, params);
    const rec = res.records[0];
    return {
      currentPage: page,
      pageSize,
      totalElements: rec.get('totalElements').toNumber(),
      totalPages: Math.ceil(rec.get('totalElements').toNumber() / pageSize),
      data: rec.get('data'),
    };
  }

  async findOne(
    id: string,
    query: BaseQueryOptionsDto = {}
  ): Promise<{ zone: any }> {
    const { relations = [] } = query;
    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('z', relations, this.relMap);

    const returnClause = [
      'z { .* } AS root',
      ...specs.map(s => s.pathVar)
    ].join(',\n      ');

    const cypher = `
      MATCH (z:Zone {id: $id})
      ${expandCypher}
      RETURN 
      ${returnClause}
    `;

    const params = { id, ...expandParams };
    const res = await this.neo4jService.read(cypher, params);
    if (!res.records.length) throw new NotFoundException(`Zone with id ${id} not found`);

    const record = res.records[0];
    const rootNode = record.get('root');

    return { zone: buildTreeFromSequences(rootNode, specs, record) }
  }

  async update(id: string, dto: UpdateZoneDto) {
    const { parentZoneId, ...props } = dto;

    const query = `
      MATCH (z:Zone {id: $id})
      
      //
      OPTIONAL MATCH path=(z)-[:HAS_CHILD*]->(descendant)
      WITH z, collect(descendant.id) AS descendants
      CALL apoc.util.validate(
        $parentZoneId IS NOT NULL AND $parentZoneId IN descendants,
        'Cannot assign a node as parent to one of its own descendants', [0]
      )
      
      // 
      FOREACH (_ IN CASE WHEN $parentZoneId IS NOT NULL THEN [1] ELSE [] END |
        OPTIONAL MATCH (oldParent:Zone)-[oldRel:HAS_CHILD]->(z)
        FOREACH (__ IN CASE WHEN oldRel IS NOT NULL THEN [1] ELSE [] END |
          DELETE oldRel
        )
      )

      //
      FOREACH (_ IN CASE WHEN $parentZoneId IS NOT NULL THEN [1] ELSE [] END |
        OPTIONAL MATCH (newParent:Zone {id: $parentZoneId})
        FOREACH (__ IN CASE WHEN newParent IS NOT NULL THEN [1] ELSE [] END |
          CREATE (newParent)-[:HAS_CHILD]->(z)
        )
      )

      // 
      SET z += $props      
      RETURN z
    `;

    const result = await this.neo4jService.write(query, {
      id,
      parentZoneId,
      props,
    });

    if (!result.records.length) throw new NotFoundException(`Zone with id ${id} not found`);
    return result.records[0].get('z').properties;
  }

  async remove(id: string) {
    const checkQuery = `
      MATCH (z:Zone {id: $id})
      OPTIONAL MATCH (z)-[:HAS_CHILD]->(child:Zone)
      OPTIONAL MATCH (z)-[:HAS_CENTER]->(center:VotingCenter)
      RETURN count(child) AS childZones, count(center) AS centers
    `;

    const checkResult = await this.neo4jService.read(checkQuery, { id });

    const childZones = checkResult.records[0].get('childZones').toInt();
    const centers = checkResult.records[0].get('centers').toInt();

    if (childZones > 0 || centers > 0) {
      throw new BadRequestException(
        `Cannot delete Zone with id ${id} because it has ${childZones > 0 ? 'child zones' : ''
        }${childZones > 0 && centers > 0 ? ' and ' : ''}${centers > 0 ? 'voting centers' : ''
        }.`
      );
    }

    const deleteQuery = `
      MATCH (z:Zone {id: $id})
      DETACH DELETE z
      RETURN count(*) as deleted
    `;

    const result = await this.neo4jService.write(deleteQuery, { id });
    const deleted = result.records[0]?.get('deleted')?.toInt() ?? 0;
    if (!deleted) throw new NotFoundException(`Zone with id ${id} not found`);

    return { message: 'Zone deleted' };
  }

}
