import { PaginationQueryOptionsDto } from "src/common/dto/pagination-query-options.dto";
import { IsOptional, IsString } from "class-validator";

export class PartyQueryOptionsDto extends PaginationQueryOptionsDto {
  
  @IsOptional()
  @IsString()
  votingId?: string;

}
