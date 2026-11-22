import { VotingStationModule } from './modules/voting-station/voting-station.module';
import { VotingCenterModule } from './modules/voting-center/voting-center.module';
import { VotingTypeModule } from './modules/voting-type/voting-type.module';
import { ManagerModule } from './modules/manager/manager.module';
import { WitnessModule } from './modules/witness/witness.module';
import { VotingModule } from './modules/voting/voting.module';
import { PartyModule } from './modules/party/party.module';
import { ZoneModule } from './modules/zone/zone.module';
import { Neo4jModule } from 'nest-neo4j/dist';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    Neo4jModule.forRoot({
      scheme: 'bolt',
      host: 'trm-neo4j-db-service',
      port: 7687,
      username: 'neo4j',
      password: 'test1234', 
    }),
    VotingStationModule,
    VotingCenterModule,
    VotingTypeModule,
    ManagerModule,
    WitnessModule,
    VotingModule,
    PartyModule,
    ZoneModule,
  ],
})
export class AppModule {}
