import { IsNotEmpty, IsString } from "class-validator";

export class CreateVotingStationDto {
  
  @IsNotEmpty()
  @IsString()
  name: string;
  
  @IsNotEmpty()
  votingCenterId: string;
  
}
