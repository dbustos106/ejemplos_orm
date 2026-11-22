import { Module } from '@nestjs/common';
import { VotingCenterController } from './voting-center.controller';
import { VotingCenterService } from './voting-center.service';

@Module({
  controllers: [VotingCenterController],
  providers: [VotingCenterService]
})
export class VotingCenterModule {}
