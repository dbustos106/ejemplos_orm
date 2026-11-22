import { CreatePartyDto } from "./create-party.dto";
import { PartialType } from '@nestjs/mapped-types';

export class UpdatePartyDto extends PartialType(CreatePartyDto) {}
