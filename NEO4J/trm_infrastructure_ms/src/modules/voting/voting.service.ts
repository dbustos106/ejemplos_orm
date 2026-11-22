import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { buildTreeFromSequences, toExpandTrees } from 'src/common/utils/trees';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { VotingQueryOptionsDto } from './dto/voting-query-options.dto';
import { CreateVotingDto } from './dto/create-voting.dto';
import { UpdateVotingDto } from './dto/update-voting.dto';
import { Neo4jService } from 'nest-neo4j/dist';
import neo4j from 'neo4j-driver';

@Injectable()
export class VotingService {
  constructor(private readonly neo4jService: Neo4jService) { }

  private readonly relMap: Record<string, { filter: string; isArray: boolean }> = {
    type: { filter: '<INCLUDES', isArray: false },
    covers: { filter: 'COVERS>', isArray: true },
    participations: { filter: 'HAS_PARTICIPATION>', isArray: true },
    party: { filter: '<PARTICIPATES_IN', isArray: false },
    assignments: { filter: 'CREATES>', isArray: true },
    votingStation: { filter: '<RECEIVES', isArray: false },
    witness: { filter: 'OBSERVES>', isArray: true }
  };

  async create(createDto: CreateVotingDto) {
    const { name, date, startTime, endTime, votingTypeId } = createDto;
    const query = `
      OPTIONAL MATCH (vt:VotingType {id: $votingTypeId})
      CALL apoc.util.validate(vt IS NULL, 'VotingType not found', [])

      CREATE (v:Voting {
        id: randomUUID(),
        name: $name,
        date: date($date),
        startTime: $startTime,
        endTime: $endTime
      })
      CREATE (vt)-[:INCLUDES]->(v)
      RETURN v AS voting
    `;
    const params = { name, date, startTime, endTime, votingTypeId };
    const res = await this.neo4jService.write(query, params);
    if (!res.records.length) throw new InternalServerErrorException('Failed to create Voting');
    return res.records[0].get('voting');
  }

  async createParticipation(votingId: string, partyId: string) {
    const createdAt = new Date().toISOString();

    const query = `
      OPTIONAL MATCH (v:Voting {id: $votingId})
      OPTIONAL MATCH (p:Party  {id: $partyId})
      CALL apoc.util.validate(v IS NULL OR p IS NULL, 'Voting or Party not found', [])
      
      CREATE (part:Participation {
        id: randomUUID(),
        createdAt: datetime($createdAt)
      })
      CREATE (v)-[:HAS_PARTICIPATION]->(part)
      CREATE (p)-[:PARTICIPATES_IN]->(part)
      RETURN part AS participation
    `;

    const params = { votingId, partyId, createdAt }
    const result = await this.neo4jService.write(query, params);
    if (result.records.length === 0) throw new NotFoundException(`Failed to create participation`);
    return result.records[0].get('participation');
  }

  async createCover(votingId: string, zoneId: string) {
    const query = `
      OPTIONAL MATCH (v:Voting {id: $votingId})
      OPTIONAL MATCH (z:Zone {id: $zoneId})
      CALL apoc.util.validate(v IS NULL OR z IS NULL, 'Voting or Zone not found', [])
      MERGE (v)-[:COVERS]->(z)
      RETURN v, z
    `;

    const result = await this.neo4jService.write(query, { votingId, zoneId });
    if (result.records.length === 0) throw new NotFoundException(`Failed to create covers`);
    return { message: "Success" }
  }

  async findAll(query: VotingQueryOptionsDto) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'date:DESC',
      relations = [],
      votingTypeId = null
    } = query;
    const skip = (page - 1) * pageSize;

    // Sanitizar orderBy (permitimos 'name' o 'date')
    const allowed = ['id', 'name', 'date'];
    const [rawField, rawDir] = orderBy.split(':');
    const field = allowed.includes(rawField) ? rawField : 'date';
    const dir = rawDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderClause = `ORDER BY v.${field} ${dir}`;

    const matchBlock = votingTypeId
      ? `MATCH (vt)-[:INCLUDES]->(v) AND vt.id = $votingTypeId`
      : '';

    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('v', relations, this.relMap);

    const returnClause = [
      'root: v { .* }',
      ...specs.map(s => `${s.pathVar}: ${s.pathVar}`)
    ].join(',\n      ');

    const cypher = `
      CALL {
        MATCH (v:Voting)
        ${matchBlock}
        RETURN count(v) AS totalElements
      }
      
      CALL {
        MATCH (vt:VotingType)-[:INCLUDES]->(v:Voting)
        ${matchBlock}
        ${orderClause}
        SKIP $skip LIMIT $pageSize
        RETURN collect(v) AS votings
      }

      UNWIND votings AS v
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
      votingTypeId,
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
    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('v', relations, this.relMap);

    const returnClause = [
      'v { .* } AS root',
      ...specs.map(s => s.pathVar)
    ].join(',\n      ');

    const cypher = `
      MATCH (v:Voting {id: $id})
      ${expandCypher}
      RETURN 
      ${returnClause}
    `;

    const params = { id, ...expandParams };
    const res = await this.neo4jService.read(cypher, params);
    if (!res.records.length) throw new NotFoundException(`Voting with id ${id} not found`);

    const record = res.records[0];
    const rootNode = record.get('root');

    return { zone: buildTreeFromSequences(rootNode, specs, record) }
  }

  async update(id: string, updateDto: UpdateVotingDto) {

  }

  async remove(id: string) {

  }

}
