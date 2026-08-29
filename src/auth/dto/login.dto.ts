import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  userlogin: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}