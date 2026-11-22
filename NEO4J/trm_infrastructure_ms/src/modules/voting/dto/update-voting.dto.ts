import { CreateVotingDto } from "./create-voting.dto";
import { PartialType } from '@nestjs/mapped-types';

export class UpdateVotingDto extends PartialType(CreateVotingDto) {}
