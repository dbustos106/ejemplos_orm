import { ArrayUnique, IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";

export class CreateManagerDto {
  
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  managerId: string;
  
  @ValidateIf((o) => !o.adminId)
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  partyId: string;

  @ValidateIf((o) => !o.partyId)
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  adminId: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  votingCenterIds: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  zoneIds: string[];

}
