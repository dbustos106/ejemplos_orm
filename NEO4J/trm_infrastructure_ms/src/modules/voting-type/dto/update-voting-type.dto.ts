import { CreateVotingTypeDto } from './create-voting-type.dto';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateVotingTypeDto extends PartialType(CreateVotingTypeDto) {}
