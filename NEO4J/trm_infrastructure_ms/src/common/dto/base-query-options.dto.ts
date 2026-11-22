import { IsArray, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class BaseQueryOptionsDto {
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  relations?: string[] = [];

}
