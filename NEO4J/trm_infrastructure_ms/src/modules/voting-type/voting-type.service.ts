import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PaginationQueryOptionsDto } from 'src/common/dto/pagination-query-options.dto';
import { buildTreeFromSequences, toExpandTrees } from 'src/common/utils/trees';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { CreateVotingTypeDto } from './dto/create-voting-type.dto';
import { UpdateVotingTypeDto } from './dto/update-voting-type.dto';
import { Neo4jService } from 'nest-neo4j/dist';
import neo4j from 'neo4j-driver';

@Injectable()
export class VotingTypeService {
  constructor(private readonly neo4jService: Neo4jService) { }

  private readonly relMap: Record<string, { filter: string; isArray: boolean }> = {
    votings: { filter: 'INCLUDES>', isArray: true },
  };

  async create(createDto: CreateVotingTypeDto) {
    const { name } = createDto;
    const query = `
      OPTIONAL MATCH (other:VotingType {name: $name})
      CALL apoc.util.validate(other IS NOT NULL, 'A VotingType with that name already exists', [])

      CREATE (vt:VotingType {
        id: randomUUID(),
        name: $name
      })
      RETURN vt AS votingType
    `;

    const params = { name };
    const res = await this.neo4jService.write(query, params);
    if (!res.records.length) throw new InternalServerErrorException('Failed to create VotingType');
    return res.records[0].get('votingType');
  }

  async findAll(query: PaginationQueryOptionsDto) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'name:ASC',
      relations = [],
    } = query;
    const skip = (page - 1) * pageSize;

    // Sanitizar orderBy
    const allowed = ['id', 'name'];
    const [rawField, rawDir] = orderBy.split(':');
    const field = allowed.includes(rawField) ? rawField : 'name';
    const dir = rawDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderClause = `ORDER BY vt.${field} ${dir}`;

    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('vt', relations, this.relMap);

    const returnClause = [
      'root: vt { .* }',
      ...specs.map(s => `${s.pathVar}: ${s.pathVar}`)
    ].join(',\n      ');

    const cypher = `
      CALL {
        MATCH (vt:VotingType)
        RETURN count(vt) AS totalElements
      }

      CALL {
        MATCH (vt:VotingType)
        ${orderClause}
        SKIP $skip LIMIT $pageSize
        RETURN collect(vt) AS types
      }

      UNWIND types AS vt
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
    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('vt', relations, this.relMap);

    const returnClause = [
      'vt { .* } AS root',
      ...specs.map(s => s.pathVar)
    ].join(',\n      ');

    const cypher = `
      MATCH (vt:VotingType {id: $id})
      ${expandCypher}
      RETURN 
      ${returnClause}
    `;

    const params = { id, ...expandParams };
    const res = await this.neo4jService.read(cypher, params);
    if (!res.records.length) throw new NotFoundException(`VotingType with id ${id} not found`);

    const record = res.records[0];
    const rootNode = record.get('root');

    return { zone: buildTreeFromSequences(rootNode, specs, record) }
  }

  async update(id: string, updateDto: UpdateVotingTypeDto) {

  }

  async remove(id: string) {

  }

}
