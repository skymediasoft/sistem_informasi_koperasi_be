import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateGroupAuthDto {
    @IsNumber()
    menuAuthId?: number;

    @IsNotEmpty()
    @IsNumber()
    groupId: number;

    @IsNotEmpty()
    @IsNumber()
    menuId: number;

    @IsNotEmpty()
    @IsNumber()
    access: number;
}