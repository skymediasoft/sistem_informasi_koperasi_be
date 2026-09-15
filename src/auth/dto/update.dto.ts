import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class UpdateDto {
  @IsNotEmpty()
  @IsString()
  userlogin?: string;

  @IsNotEmpty()
  @IsString()
  userloginInput?: string;

  @IsNotEmpty()
  @IsString()
  username?: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email?: string;

  @IsNumber()
  groupId?: number;
}