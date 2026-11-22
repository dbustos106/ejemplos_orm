import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { VotingStationQueryOptionsDto } from './dto/voting-station-query-options';
import { buildTreeFromSequences, toExpandTrees } from 'src/common/utils/trees';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { CreateVotingStationDto } from './dto/create-voting-station.dto';
import { UpdateVotingStationDto } from './dto/update-voting-station.dto';
import { Neo4jService } from 'nest-neo4j/dist';
import neo4j from 'neo4j-driver';

@Injectable()
export class VotingStationService {
  constructor(private readonly neo4jService: Neo4jService) { }

  private readonly relMap: Record<string, { filter: string; isArray: boolean }> = {
    votingCenter: { filter: '<HAS_STATION', isArray: false },
    assignments: { filter: 'RECEIVES>', isArray: true },
    witnesses: { filter: '<OBSERVES', isArray: true }
  };

  async create(createDto: CreateVotingStationDto) {
    const query = `
      OPTIONAL MATCH (vc:VotingCenter {id: $votingCenterId})
      CALL apoc.util.validate(vc IS NULL, 'VotingCenter not found', [])

      OPTIONAL MATCH (vc)-[:HAS_STATION]->(existing:VotingStation {name: $name})
      CALL apoc.util.validate(existing IS NOT NULL, 'VotingStation name already in use in this center', [])

      CREATE (vs:VotingStation {
        id: randomUUID(), 
        name: $name
      })
      CREATE (vc)-[:HAS_STATION]->(vs)
      RETURN vs AS votingStation
    `;

    const result = await this.neo4jService.write(query, {
      votingCenterId: createDto.votingCenterId,
      name: createDto.name,
    });

    if (!result.records.length) throw new InternalServerErrorException('Failed to create votingStation: No votingStation data returned.');
    return result.records[0].get('votingStation');
  }

  async findAll(query: VotingStationQueryOptionsDto) {
    const {
      page = 1,
      pageSize = 10,
      relations = [],
      orderBy = 'name:ASC',
      votingCenterId = null,
      zoneId = null,
      managerId = null
    } = query;
    const skip = (page - 1) * pageSize;

    // Sanitizar orderBy
    const allowed = ['id', 'name'];
    const [rawField, rawDir] = orderBy.split(':');
    const field = allowed.includes(rawField) ? rawField : 'name';
    const dir = rawDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderClause = `ORDER BY vc.${field} ${dir}`;

    const matchClauses: string[] = [];
    if (votingCenterId) matchClauses.push(`MATCH (vs)<-[:HAS_STATION]-(:VotingCenter {id:$votingCenterId})`);
    if (zoneId) matchClauses.push(`MATCH (vs)<-[:HAS_STATION]-(:VotingCenter)<-[:HAS_CENTER]-(:Zone)<-[:HAS_CHILD*0..]-(:Zone {id:$zoneId})`);
    if (managerId) matchClauses.push(`
      MATCH (vs)<-[:HAS_STATION]-(:VotingCenter)<-[:MANAGES_CENTER]-(:Manager {id:$managerId})
      OR
      MATCH (vs)<-[:HAS_STATION]-(:VotingCenter)<-[:HAS_CENTER]-(:Zone)<-[:HAS_CHILD*0..]-(:Zone)<-[:MANAGES_ZONE]-(:Manager {id:$managerId})
    `);
    const matchBlock = matchClauses.join('\n');

    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('vs', relations, this.relMap);

    const returnClause = [
      'root: vs { .* }',
      ...specs.map(s => `${s.pathVar}: ${s.pathVar}`)
    ].join(',\n      ');

    const cypher = `
      CALL {
        MATCH (vs:VotingStation)
        ${matchBlock}
        RETURN count(vs) AS totalElements
      }

      CALL {
        MATCH (vs:VotingStation)
        ${matchBlock}
        ${orderClause}
        SKIP $skip LIMIT $pageSize
        RETURN collect(vs) AS stations
      }

      UNWIND stations AS vs
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
      votingCenterId, 
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
    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('vs', relations, this.relMap);

    const returnClause = [
      'vs { .* } AS root',
      ...specs.map(s => s.pathVar)
    ].join(',\n      ');

    const cypher = `
      MATCH (vs:VotingStation {id: $id})
      ${expandCypher}
      RETURN 
      ${returnClause}
    `;

    const params = { id, ...expandParams };
    const res = await this.neo4jService.read(cypher, params);
    if (!res.records.length) throw new NotFoundException(`VotingStation with id ${id} not found`);

    const record = res.records[0];
    const rootNode = record.get('root');

    return { zone: buildTreeFromSequences(rootNode, specs, record) }
  }

  async update(
    id: string,
    dto: UpdateVotingStationDto & { votingCenterId?: string },
  ): Promise<{ votingStation: any }> {
    const { votingCenterId, name, ...props } = dto;

    const query = `
      OPTIONAL MATCH (vs:VotingStation {id: $id})
      WITH vs CALL apoc.util.validate(vs IS NULL, 'VotingStation not found', [])
      
      WITH vs OPTIONAL MATCH (oldVC:VotingCenter)-[oldRel:HAS_STATION]->(vs)
      OPTIONAL MATCH (newVC:VotingCenter {id: $votingCenterId})
      CALL apoc.util.validate($votingCenterId IS NOT NULL AND newVC IS NULL, 'New VotingCenter not found', [])
      WITH vs, oldVC, oldRel, newVC

      WITH vs, oldVC, newVC, $name AS newName
      CALL {
        WITH vs, oldVC, newVC, newName
        WITH coalesce(newVC, oldVC) AS vcToCheck, vs, newName
        OPTIONAL MATCH (vcToCheck)-[:HAS_STATION]->(other:VotingStation {name: newName})
        WHERE other.id <> vs.id
        RETURN other LIMIT 1
      }
      CALL apoc.util.validate(other IS NOT NULL, 'Station name already in use in this votingCenter', [])
      WITH vs, oldVC, oldRel, newVC

      FOREACH (_ IN CASE WHEN newVC IS NOT NULL AND (oldVC IS NULL OR oldVC.id <> newVC.id) THEN [1] ELSE [] END |
        DELETE oldRel
        CREATE (newVC)-[:HAS_STATION]->(vs)
      )

      SET vs.name = $name, vs += $props
      RETURN vs { .id, .name } AS votingStation
    `;

    const params = { id, votingCenterId, name, props };
    const res = await this.neo4jService.write(query, params);
    const station = res.records[0]?.get('votingStation');
    return { votingStation: station };
  }

  async remove(id: string): Promise<{ message: string }> {
    const query = `
      OPTIONAL MATCH (vs:VotingStation {id: $id})
      WITH vs CALL apoc.util.validate(vs IS NULL, 'VotingStation not found', [])
      WITH vs

      CALL {
        WITH vs
        OPTIONAL MATCH (vs)<-[:PARTICIPATED_IN]-(p:Participation)
        RETURN count(p) AS cnt
      }
      CALL apoc.util.validate(cnt > 0, 'Cannot delete VotingStation with existing participations', [])
      WITH vs

      DETACH DELETE vs
      RETURN true AS deleted
    `;

    const result = await this.neo4jService.write(query, { id });
    return { message: 'VotingStation deleted successfully' };
  }

}
