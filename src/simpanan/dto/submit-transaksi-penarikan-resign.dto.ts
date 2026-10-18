import { IsNumber, IsString, IsDate, IsNotEmpty } from 'class-validator';

export class SubmitTransaksiPenarikanResignDto {
    @IsNumber()
    @IsNotEmpty()
    IDPengambilan: number;

    @IsDate()
    @IsNotEmpty()
    Tanggal: Date;

    @IsString()
    @IsNotEmpty()
    NoAnggota: string;

    @IsNumber()
    @IsNotEmpty()
    SimpananPokok: number;

    @IsNumber()
    @IsNotEmpty()
    SimpananWajib: number;

    @IsNumber()
    @IsNotEmpty()
    SimpananSukarela: number;
}
