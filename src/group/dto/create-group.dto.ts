import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateGroupDto {
    @IsNotEmpty()
    @IsInt()
    groupId: number;

    @IsNotEmpty()
    @IsString()
    groupName: string;

    @IsNotEmpty()
    @IsString()
    groupNote: string;
}

