import { Module } from '@nestjs/common';
import { VotingTypeController } from './voting-type.controller';
import { VotingTypeService } from './voting-type.service';

@Module({
  controllers: [VotingTypeController],
  providers: [VotingTypeService]
})
export class VotingTypeModule {}
