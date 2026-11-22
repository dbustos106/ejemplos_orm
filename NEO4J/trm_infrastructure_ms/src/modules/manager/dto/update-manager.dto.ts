import { IsUUID, IsOptional, IsArray } from 'class-validator';

export class UpdateManagerDto {

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  addZoneIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  removeZoneIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  addVotingCenterIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  removeVotingCenterIds?: string[];

}
