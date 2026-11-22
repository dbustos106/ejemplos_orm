import { Module } from '@nestjs/common';
import { VotingStationController } from './voting-station.controller';
import { VotingStationService } from './voting-station.service';

@Module({
  controllers: [VotingStationController],
  providers: [VotingStationService]
})
export class VotingStationModule {}
