import { PaginationQueryOptionsDto } from "src/common/dto/pagination-query-options.dto";
import { IsOptional, IsString, IsUUID } from "class-validator";

export class WitnessQueryOptionsDto extends PaginationQueryOptionsDto {

  @IsOptional()
  @IsString()
  @IsUUID()
  partyId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  votingId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  votingStationId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  votingCenterId?: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  zoneId?: string;

}
