import { IsString, IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateZoneDto {

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  parentZoneId?: string;
  
}
