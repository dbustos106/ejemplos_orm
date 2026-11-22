import { IsString, IsUUID, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateVotingDto {
  
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()  
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsUUID()
  @IsNotEmpty()
  votingTypeId: string;

}
