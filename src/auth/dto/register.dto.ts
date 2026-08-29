import { IsEmail, IsNotEmpty, IsNumber, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  userlogin: string;

  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @IsNumber()
  groupId?: number;
}