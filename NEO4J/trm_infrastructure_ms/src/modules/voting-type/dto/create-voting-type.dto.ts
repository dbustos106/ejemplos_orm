import { IsNotEmpty, IsString } from "class-validator";

export class CreateVotingTypeDto {
  
  @IsNotEmpty()
  @IsString()
  name: string;
   
}
