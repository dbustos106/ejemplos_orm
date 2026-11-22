import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreateWitnessDto {
  
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  witnessId: string;
  
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  partyId: string;
  
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  votingId: string;

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  votingStationId: string;

}
