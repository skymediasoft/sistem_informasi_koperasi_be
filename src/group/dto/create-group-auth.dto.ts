import { IsIn, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateGroupAuthDto {
    @IsOptional()
    @IsNumber()
    menuAuthId?: number;

    @IsNotEmpty()
    @IsNumber()
    groupId: number;

    @IsNotEmpty()
    @IsNumber()
    menuId: number;

    @IsNotEmpty()
    @IsIn([0, 1])
    access: number;
}
