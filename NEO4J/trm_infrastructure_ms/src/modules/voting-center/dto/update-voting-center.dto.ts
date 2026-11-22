import { CreateVotingCenterDto } from './create-voting-center.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateVotingCenterDto extends PartialType(CreateVotingCenterDto) {}
