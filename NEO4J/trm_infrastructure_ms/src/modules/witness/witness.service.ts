import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { buildTreeFromSequences, toExpandTrees } from 'src/common/utils/trees';
import { BaseQueryOptionsDto } from 'src/common/dto/base-query-options.dto';
import { WitnessQueryOptionsDto } from './dto/witness-query-options.dto';
import { CreateWitnessDto } from './dto/create-witness.dto';
import { Neo4jService } from 'nest-neo4j/dist';
import neo4j from 'neo4j-driver';

@Injectable()
export class WitnessService {
  constructor(private readonly neo4jService: Neo4jService) { }

  private readonly relMap: Record<string, { filter: string; isArray: boolean }> = {
    assignments: { filter: 'OBSERVES>', isArray: true },
    participation: { filter: '<CREATES', isArray: false },
    party: { filter: '<PARTICIPATES_IN', isArray: false },
    voting: { filter: '<HAS_PARTICIPATION', isArray: false },
    votingStation: { filter: '<RECEIVES', isArray: false },
    votingCenter: { filter: '<HAS_STATION', isArray: false },
    zone: { filter: '<HAS_CENTER|<HAS_CHILD', isArray: false }
  };

  async create(createDto: CreateWitnessDto) {
    const { witnessId, partyId, votingId, votingStationId } = createDto;

    const query = `
      OPTIONAL MATCH (Party {id: $partyId})-[:PARTICIPATES_IN]->(p:Participation)<-[:HAS_PARTICIPATION]-(v:Voting {id: $votingId})
      CALL apoc.util.validate(p IS NULL, 'Participation not found for given partyId and votingId', [])

      OPTIONAL MATCH (v)-[:COVERS]->(:Zone)-[:HAS_CHILD*0..]->(Zone)-[:HAS_CENTER]->(VotingCenter)-[:HAS_STATION]->(vs:VotingStation {id: $votingStationId})
      CALL apoc.util.validate(vs IS NULL, 'Voting does not cover any zone that contains the given VotingStation', [])

      OPTIONAL MATCH (w1:Witness {id: $witnessId})-[:OBSERVES]->(existing:Assignment)<-[:CREATES]-(p)
      CALL apoc.util.validate(existing IS NOT NULL, 'Assignment already exists for this witness and participation', [])

      MERGE (w:Witness {id: $witnessId})
      CREATE (a:Assignment { id: randomUUID() })
      CREATE (p)-[:CREATES]->(a)
      CREATE (vs)-[:RECEIVES]->(a)
      CREATE (w)-[:OBSERVES]->(a)

      RETURN w AS witness
    `;

    const params = { witnessId, partyId, votingId, votingStationId };
    const res = await this.neo4jService.write(query, params);
    if (!res.records.length) throw new InternalServerErrorException('Failed to create Witness');
    return res.records[0].get('witness');
  }

  async findAll(query: WitnessQueryOptionsDto) {
    const {
      page = 1,
      pageSize = 10,
      orderBy = 'witnessId:ASC',
      relations = [],
      partyId,
      votingId,
      votingStationId,
      votingCenterId,
      zoneId
    } = query;
    const skip = (page - 1) * pageSize;

    // Sanitizar orderBy
    const allowed = ['witnessId'];
    const [rawField, rawDir] = orderBy.split(':');
    const field = allowed.includes(rawField) ? rawField : 'witnessId';
    const dir = rawDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const orderClause = `ORDER BY w.${field} ${dir}`;

    const matchClauses: string[] = [];
    if (partyId) matchClauses.push(`MATCH (party:Party {id:$partyId})-[:PARTICIPATES_IN]->(p)`);
    if (votingId) matchClauses.push(`MATCH (v:Voting {id:$votingId})-[:HAS_PARTICIPATION]->(p)`);
    if (votingStationId) matchClauses.push(`MATCH (vs:VotingStation {id:$votingStationId})-[:RECEIVES]->(a)`);
    if (votingCenterId) matchClauses.push(`MATCH (vc:VotingCenter {id:$votingCenterId})-[:HAS_STATION]->(vs)`);
    if (zoneId) matchClauses.push(`MATCH (:Zone {id:$zoneId})<-[:HAS_CHILD*0..]-(:Zone)-[:HAS_CENTER]->(vc)`);
    const matchBlock = matchClauses.join('\n');

    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('w', relations, this.relMap);

    const returnClause = [
      'root: w { .* }',
      ...specs.map(s => `${s.pathVar}: ${s.pathVar}`)
    ].join(',\n      ');

    const cypher = `
      CALL {
        MATCH (w:Witness)-[:OBSERVES]->(a:Assignment)<-[:CREATES]-(p:Participation)
        ${matchBlock}
        RETURN count(DISTINCT w) AS totalElements
      }

      CALL {
        MATCH (w:Witness)-[:OBSERVES]->(a:Assignment)<-[:CREATES]-(p:Participation)
        ${matchBlock}
        ${orderClause}
        SKIP $skip LIMIT $pageSize
        RETURN collect(DISTINCT w) AS witnesses
      }

      UNWIND witnesses AS w
      ${expandCypher}

      RETURN 
        totalElements,
        collect({
          ${returnClause}
        }) AS items 
    `;

    console.log("Cypher", cypher);

    const params = {
      skip: neo4j.int(skip),
      pageSize: neo4j.int(pageSize),
      partyId,
      votingId,
      votingStationId,
      votingCenterId,
      zoneId,
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
    const { cypher: expandCypher, params: expandParams, specs } = toExpandTrees('w', relations, this.relMap);

    const returnClause = [
      'w { .* } AS root',
      ...specs.map(s => s.pathVar)
    ].join(',\n      ');

    const cypher = `
      MATCH (w:Witness {id: $id})
      ${expandCypher}
      RETURN 
      ${returnClause}
    `;

    const params = { id, ...expandParams };
    const res = await this.neo4jService.read(cypher, params);
    if (!res.records.length) throw new NotFoundException(`Witness with id ${id} not found`);

    const record = res.records[0];
    const rootNode = record.get('root');

    return { zone: buildTreeFromSequences(rootNode, specs, record) }
  }

  async remove(id: string) {

  }

}
