import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class JwtPayloadDto {
  @IsNotEmpty()
  @IsString()
  userlogin: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNumber()
  groupId?: number;

  @IsString()
  groupName?: string;

  @IsString()
  noAnggota?: string;
}