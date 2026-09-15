import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsString()
    userlogin: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    newPassword: string;
}