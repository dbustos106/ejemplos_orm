import { PaginationQueryOptionsDto } from "src/common/dto/pagination-query-options.dto";
import { IsOptional, IsString } from "class-validator";

export class VotingQueryOptionsDto extends PaginationQueryOptionsDto {
  
  @IsOptional()
  @IsString()
  votingTypeId?: string;

}
