import { CreateVotingStationDto } from './create-voting-station.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateVotingStationDto extends PartialType(CreateVotingStationDto) {}
