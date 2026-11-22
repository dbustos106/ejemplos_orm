import { Module } from '@nestjs/common';
import { WitnessController } from './witness.controller';
import { WitnessService } from './witness.service';

@Module({
  controllers: [WitnessController],
  providers: [WitnessService]
})
export class WitnessModule {}
