import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateVotingCenterDto } from '../voting-center/dto/update-voting-center.dto';
import { buildTreeFromSequences, toExpandTrees } from 'src/common/utils/trees';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { ManagerQueryOptionsDto } from './dto/manager-query-options.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { Neo4jService } from 'nest-neo4j/dist';
import neo4j from 'neo4j-driver';

@Injectable()
export class ManagerService {
  constructor(private readonly neo4jService: Neo4jService) { }

  private readonly relMap: Record<string, { filter: string; isArray: boolean }> = {
    centers: { filter: 'MANAGES_CENTER>', isArray: true },
    zones: { filter: 'MANAGES_ZONE>', isArray: true },
    party: { filter: '<HAS_MANAGER', isArray: false }
  };

  async create(createDto: CreateManagerDto) {
    const { managerId, partyId, adminId, votingCenterIds = [], zoneIds = [] } = createDto;

    const query = `
      OPTIONAL MATCH (existing:Manager {id: $managerId})
      CALL apoc.util.validate(existing IS NOT NULL, 'Manager with that id already exists', [])

      ${partyId
        ? `
        OPTIONAL MATCH (p:Party {id: $partyId})
        CALL apoc.util.validate(p IS NULL, 'Party not found', [])
        `
        : `
        OPTIONAL MATCH (p:Party {id: $adminId})
        CALL apoc.util.validate(p IS NULL, 'Party not found', [])
        `
      }

      CREATE (m:Manager {id: $managerId})
      CREATE (p)-[:HAS_MANAGER]->(m)

      WITH m
      CALL {
        WITH m
        UNWIND $votingCenterIds AS vcid
        OPTIONAL MATCH (vc:VotingCenter {id: vcid})
        CALL apoc.util.validate(vc IS NULL, 'VotingCenter with id ' + vcid + ' not found', [])
        CREATE (m)-[:MANAGES_CENTER]->(vc)
        RETURN count(*) AS _
      }

      WITH m
      CALL {
        WITH m
        UNWIND $zoneIds AS zid
        OPTIONAL MATCH (z:Zone {id: zid})
        CALL apoc.util.validate(z IS NULL, 'Zone with id ' + zid + ' not found', [])
        CREATE (m)-[:MANAGES_ZONE]->(z)
        RETURN count(*) AS _
      }

      RETURN m AS manager
    `;

    const params: Record<string, any> = {
      managerId,
      votingCenterIds,
      zoneIds
    };
    if (partyId) params.partyId = partyId;
    if (adminId) params.adminId = adminId;

    const res = await this.neo4jService.write(query, params);
    if (!res.records.length) throw new InternalServerErrorException('Failed to create Manager');
    return res.records[0].get('manager');
  }

  async findAll(query: ManagerQueryOptionsDto) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'id:ASC',
      relations = [],
      votingCenterId = null,
      zoneId = null,
      partyId = null
    } = query;
    const skip = (page - 1) * pageSize;

    // Sanitizar orderBy
    const allowed = ['id'];
    const [rawField, rawDir] = orderBy.split(':');
    const field = allowed.includes(rawField) ? rawField : 'id';
    const dir = rawDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderClause = `ORDER BY m.${field} ${dir}`;

    const matchClauses: string[] = [];
    if (votingCenterId) matchClauses.push(`MATCH (m)-[:MANAGES_CENTER]->(:VotingCenter {id: $votingCenterId})`);
    if (zoneId) matchClauses.push(`MATCH (m)-[:MANAGES_ZONE]->(:Zone)<-[:HAS_CHILD*0..]-(:Zone {id: $zoneId})`);
    if (partyId) matchClauses.push(`MATCH (:Party {id: $partyId})-[:HAS_MANAGER]->(m)`);
    const matchBlock = matchClauses.join('\n');

    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('m', relations, this.relMap);

    const returnClause = [
      'root: m { .* }',
      ...specs.map(s => `${s.pathVar}: ${s.pathVar}`)
    ].join(',\n      ');

    const cypher = `
      CALL {
        MATCH (m:Manager)
        ${matchBlock}
        RETURN count(m) AS totalElements
      }

      CALL {
        MATCH (m:Manager)
        ${matchBlock}
        ${orderClause}
        SKIP $skip LIMIT $pageSize
        RETURN collect(m) AS managers
      }

      UNWIND managers AS m
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
      partyId,
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
    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('m', relations, this.relMap);

    const returnClause = [
      'm { .* } AS root',
      ...specs.map(s => s.pathVar)
    ].join(',\n      ');

    const cypher = `
      MATCH (m:Manager {id: $id})
      ${expandCypher}
      RETURN 
      ${returnClause}
    `;

    const params = { id, ...expandParams };
    const res = await this.neo4jService.read(cypher, params);
    if (!res.records.length) throw new NotFoundException(`Manager with id ${id} not found`);

    const record = res.records[0];
    const rootNode = record.get('root');

    return { zone: buildTreeFromSequences(rootNode, specs, record) }
  }

  async update(id: string, updateDto: UpdateVotingCenterDto) {

  }

  async remove(id: string) {

  }

}
