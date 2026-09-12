import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDate } from 'class-validator';

export class CreateMenuDto {
    @IsNotEmpty()
    @IsString()
    menuName: string;

    @IsNotEmpty()
    @IsString()
    menuRoute: string;

    @IsNotEmpty()
    @IsNumber()
    menuSort: number;
    
    @IsOptional()
    @IsNumber()
    menuParentId?: number;

    @IsNotEmpty()
    @IsString()
    postBy: string;

    @IsDate()
    @IsOptional()
    postDate?: Date;
}
