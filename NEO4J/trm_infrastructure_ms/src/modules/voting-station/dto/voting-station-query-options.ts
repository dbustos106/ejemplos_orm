import { PaginationQueryOptionsDto } from "src/common/dto/pagination-query-options.dto";
import { IsOptional, IsString } from "class-validator";

export class VotingStationQueryOptionsDto extends PaginationQueryOptionsDto {

  @IsOptional() 
  @IsString() 
  votingCenterId?: string;

  @IsOptional() 
  @IsString() 
  zoneId?: string;

  @IsOptional() 
  @IsString() 
  managerId?: string;

}
