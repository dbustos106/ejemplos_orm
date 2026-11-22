import { PaginationQueryOptionsDto } from "src/common/dto/pagination-query-options.dto";
import { IsOptional, IsString } from "class-validator";

export class VotingCenterQueryOptionsDto extends PaginationQueryOptionsDto {
  
  @IsOptional()
  @IsString()
  zoneId?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

}
