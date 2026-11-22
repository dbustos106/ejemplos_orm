import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class CreatePartyDto {
  
  @IsNotEmpty()
  @IsString()
  name: string;  

  @IsNotEmpty()
  @IsString()
  @IsUUID()
  adminId: string;

}
