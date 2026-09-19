import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateSimpananDto {
    @IsInt()
    @IsNotEmpty()
    SimpananPokok: number;

    @IsInt()
    @IsNotEmpty()
    SimpananWajib: number;

    @IsInt()
    @IsNotEmpty()
    SimpananSukarela: number;
}
