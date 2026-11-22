import { IsLatitude, IsLongitude, IsNotEmpty, IsString, IsUrl, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class Address {
  
  @IsNotEmpty()
  @IsLatitude()
  latitude: string;

  @IsNotEmpty()
  @IsLongitude()
  longitude: string;

}

export class CreateVotingCenterDto {

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Address)
  address: Address;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  urlMaps: string;

  @IsNotEmpty()
  @IsUUID()
  zoneId: string;
  
}
