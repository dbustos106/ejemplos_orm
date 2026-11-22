import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { VotingCenterQueryOptionsDto } from './dto/voting-center-query-options';
import { buildTreeFromSequences, toExpandTrees } from 'src/common/utils/trees';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { CreateVotingCenterDto } from './dto/create-voting-center.dto';
import { UpdateVotingCenterDto } from './dto/update-voting-center.dto';
import { Neo4jService } from 'nest-neo4j/dist';
import neo4j from 'neo4j-driver';

@Injectable()
export class VotingCenterService {
  constructor(private readonly neo4jService: Neo4jService) { }

  private readonly relMap: Record<string, { filter: string; isArray: boolean }> = {
    zone: { filter: '<MANAGES_CENTER', isArray: false },
    votingStations: { filter: 'HAS_STATION>', isArray: true },
    assignments: { filter: 'RECEIVES>', isArray: true },
    witness: { filter: '<OBSERVES', isArray: true }
  };

  async create(createDto: CreateVotingCenterDto) {
    const { name, urlMaps, address, zoneId } = createDto;

    const query = `
      OPTIONAL MATCH (z:Zone {id: $zoneId})
      WHERE NOT (z)-[:HAS_CHILD]->()
      CALL apoc.util.validate(z IS NULL, 'Zone not found or it is not a leaf node.', [])

      OPTIONAL MATCH (z)-[:HAS_CENTER]->(other:VotingCenter {name: $name})
      CALL apoc.util.validate(other IS NOT NULL, 'A VotingCenter with that name already exists in this zone.', [])

      CREATE (vc:VotingCenter {
        id: randomUUID(),
        name: $name,
        urlMaps: $urlMaps,
        latitude: $latitude,
        longitude: $longitude
      })
      CREATE (z)-[:HAS_CENTER]->(vc)
      RETURN vc
    `;

    const params = {
      zoneId,
      name,
      urlMaps,
      latitude: address.latitude,
      longitude: address.longitude,
    };

    const result = await this.neo4jService.write(query, params);
    if (!result.records.length) throw new InternalServerErrorException('Failed to create votingCenter: No votingCenter data returned.');
    return result.records[0].get('vc');
  }

  async findAll(query: VotingCenterQueryOptionsDto) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'name:ASC',
      relations = [],
      zoneId = null,
      managerId = null,
    } = query;
    const skip = (page - 1) * pageSize;

    // Sanitizar orderBy
    const allowed = ['id', 'name'];
    const [rawField, rawDir] = orderBy.split(':');
    const field = allowed.includes(rawField) ? rawField : 'name';
    const dir = rawDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderClause = `ORDER BY vc.${field} ${dir}`;

    // Filtros puntuales
    const matchClauses: string[] = [];
    if (zoneId) matchClauses.push(`MATCH (vc)<-[:HAS_CENTER]-(:Zone {id:$zoneId})`);
    if (managerId) matchClauses.push(`
      MATCH (vs)<-[:HAS_STATION]-(:VotingCenter)<-[:MANAGES_CENTER]-(:Manager {id:$managerId})
      OR
      MATCH (vs)<-[:HAS_STATION]-(:VotingCenter)<-[:HAS_CENTER]-(:Zone)<-[:HAS_CHILD*0..]-(:Zone)<-[:MANAGES_ZONE]-(:Manager {id:$managerId})
    `);
    const matchBlock = matchClauses.join('\n');

    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('vc', relations, this.relMap);

    const returnClause = [
      'root: vc { .* }',
      ...specs.map(s => `${s.pathVar}: ${s.pathVar}`)
    ].join(',\n      ');

    const cypher = `
      CALL {
        MATCH (vc:VotingCenter)
        ${matchBlock}
        RETURN count(vc) AS totalElements
      }

      CALL {
        MATCH (vc:VotingCenter)
        ${matchBlock}
        ${orderClause}
        SKIP $skip LIMIT $pageSize
        RETURN collect(vc) AS centers
      }

      UNWIND centers AS vc
      ${expandCypher}
      
      RETURN 
        totalElements,
        collect({
          ${returnClause}
        }) AS items 
    `;

    const params = {
      skip: neo4j.int(skip),
      pageSize: neo4j.int(pageSize),
      zoneId, 
      managerId,
      ...expandParams
    };

    const result = await this.neo4jService.read(cypher, params);
    const record = result.records[0];

    const totalElements = record.get('totalElements').toInt();
    const itemsRaw = record.get('items');

    const items = itemsRaw.map(item =>
      buildTreeFromSequences(
        item.root,
        specs,
        { get: key => item[key] }
      )
    );

    return {
      currentPage: page,
      pageSize,
      totalElements: totalElements,
      totalPages: Math.ceil(totalElements / pageSize),
      data: items,
    };
  }

  async findOne(
    id: string,
    query: BaseQueryOptionsDto = {}
  ): Promise<{ zone: any }> {
    const { relations = [] } = query;
    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('vc', relations, this.relMap);

    const returnClause = [
      'vc { .* } AS root',
      ...specs.map(s => s.pathVar)
    ].join(',\n      ');

    const cypher = `
      MATCH (vc:VotingCenter {id: $id})
      ${expandCypher}
      RETURN 
      ${returnClause}
    `;

    const params = { id, ...expandParams };
    const res = await this.neo4jService.read(cypher, params);
    if (!res.records.length) throw new NotFoundException(`VotingCenter with id ${id} not found`);

    const record = res.records[0];
    const rootNode = record.get('root');

    return { zone: buildTreeFromSequences(rootNode, specs, record) }
  }

  async update(id: string, updateDto: UpdateVotingCenterDto) {
    const { zoneId, ...props } = updateDto;

    const checkStationsQuery = `
      MATCH (vc:VotingCenter {id: $id})<-[:BELONGS_TO]-(vs:VotingStation)
      RETURN count(vs) AS stationCount
    `;

    const checkResult = await this.neo4jService.read(checkStationsQuery, { id });
    const stationCount = checkResult.records[0].get('stationCount').toInt();
    if (stationCount > 0) throw new BadRequestException('No se puede actualizar el centro porque tiene estaciones asignadas');

    const updateQuery = `
      MATCH (vc:VotingCenter {id: $id})

      FOREACH (_ IN CASE WHEN $zoneId IS NOT NULL THEN [1] ELSE [] END |
        OPTIONAL MATCH (newZone:Zone {id: $zoneId})
  
        FOREACH (__ IN CASE WHEN newZone IS NOT NULL THEN [1] ELSE [] END |
          OPTIONAL MATCH (oldZone:Zone)-[rel:HAS_CENTER]->(vc)
          FOREACH (___ IN CASE WHEN rel IS NOT NULL THEN [1] ELSE [] END | DELETE rel)
          CREATE (newZone)-[:HAS_CENTER]->(vc)
        )
      )

      SET vc += $props
      RETURN vc
    `;

    const result = await this.neo4jService.write(updateQuery, { id, zoneId, props });
    if (result.records.length === 0) throw new NotFoundException('Centro de votación no encontrado');

    return result.records[0].get('votingCenter');
  }

  async remove(id: string) {
    const checkQuery = `
      MATCH (vc:VotingCenter {id: $id})<-[:IN_CENTER]-(vs:VotingStation)
      RETURN COUNT(vs) AS stationCount
    `;
    const result = await this.neo4jService.read(checkQuery, { id });
    const count = result.records[0].get('stationCount').toNumber();

    if (count > 0) {
      throw new BadRequestException('Cannot delete: VotingCenter has stations.');
    }

    const deleteQuery = `
      MATCH (vc:VotingCenter {id: $id})
      DETACH DELETE vc
    `;
    await this.neo4jService.write(deleteQuery, { id });
    return { message: 'Deleted successfully' };
  }

}
