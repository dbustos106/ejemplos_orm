import { IsInt, IsOptional, IsString, Min } from "class-validator";
import { BaseQueryOptionsDto } from "./base-query-options.dto";
import { Type } from "class-transformer";

export class PaginationQueryOptionsDto extends BaseQueryOptionsDto {
  
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 10;

  @IsOptional()
  @IsString()
  orderBy?: string;

}
