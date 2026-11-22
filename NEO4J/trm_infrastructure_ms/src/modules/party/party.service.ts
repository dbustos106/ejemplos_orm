import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { buildTreeFromSequences, toExpandTrees } from 'src/common/utils/trees';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { PartyQueryOptionsDto } from './dto/party-query-options.dto';
import { CreatePartyDto } from './dto/create-party.dto';
import { UpdatePartyDto } from './dto/update-party.dto';
import { Neo4jService } from 'nest-neo4j/dist';
import neo4j from 'neo4j-driver';

@Injectable()
export class PartyService {
  constructor(private readonly neo4jService: Neo4jService) { }

  private readonly relMap: Record<string, { filter: string; isArray: boolean }> = {
    managers: { filter: 'HAS_MANAGER>', isArray: true },
    participations: { filter: 'PARTICIPATES_IN>', isArray: true },
    assignments: { filter: 'CREATES>', isArray: true },
    voting: { filter: '<HAS_PARTICIPATION', isArray: false },
    witnesses: { filter: '<OBSERVES', isArray: true }
  };

  async create(createDto: CreatePartyDto) {
    const { name, adminId } = createDto;

    const query = `
      OPTIONAL MATCH (otherByName:Party {name: $name})
      CALL apoc.util.validate(otherByName IS NOT NULL, 'Another Party with that name already exists', [])

      OPTIONAL MATCH (otherByAdmin:Party {adminId: $adminId})
      CALL apoc.util.validate(otherByAdmin IS NOT NULL, 'A Party with that adminId already exists', [])

      CREATE (p:Party {
        id: randomUUID(),
        name: $name,
        adminId: $adminId
      })
      RETURN p AS party
    `;

    const params = { name, adminId };
    const res = await this.neo4jService.write(query, params);
    if (!res.records.length) throw new InternalServerErrorException('Failed to create Party');
    return res.records[0].get('party');
  }

  async findAll(query: PartyQueryOptionsDto) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'name:ASC',
      relations = [],
      votingId = null,
    } = query;
    const skip = (page - 1) * pageSize;

    // Sanitizar orderBy
    const allowed = ['id', 'name'];
    const [rawField, rawDir] = orderBy.split(':');
    const field = allowed.includes(rawField) ? rawField : 'name';
    const dir = rawDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderClause = `ORDER BY p.${field} ${dir}`;

    const matchClauses: string[] = [];
    if (votingId) matchClauses.push(`MATCH (p)-[:PARTICIPATES]->(:Participation)<-[:HAS_PARTICIPATION]-(:Voting {id:$votingId})`);
    const matchBlock = matchClauses.join('\n');

    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('p', relations, this.relMap);

    const returnClause = [
      'root: p { .* }',
      ...specs.map(s => `${s.pathVar}: ${s.pathVar}`)
    ].join(',\n      ');

    const cypher = `
      CALL {
        MATCH (p:Party)
        ${matchBlock}
        RETURN count(p) AS totalElements
      }
      
      CALL {
        MATCH (p:Party)
        ${matchBlock}
        ${orderClause}
        SKIP $skip LIMIT $pageSize
        RETURN collect(p) AS parties
      }

      UNWIND parties AS p
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
      votingId,
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
    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('p', relations, this.relMap);

    const returnClause = [
      'p { .* } AS root',
      ...specs.map(s => s.pathVar)
    ].join(',\n      ');

    const cypher = `
      MATCH (p:Party {id: $id})
      ${expandCypher}
      RETURN 
      ${returnClause}
    `;

    const params = { id, ...expandParams };
    const res = await this.neo4jService.read(cypher, params);
    if (!res.records.length) throw new NotFoundException(`Party with id ${id} not found`);

    const record = res.records[0];
    const rootNode = record.get('root');

    return { zone: buildTreeFromSequences(rootNode, specs, record) }
  }

  async update(id: string, updateDto: UpdatePartyDto) {

  }

  async remove(id: string) {

  }

}
