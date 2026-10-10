import {IsNumber, IsString, IsDate, IsNotEmpty} from 'class-validator';

export class SubmitTransaksiPenarikanDto {
    @IsNumber()
    @IsNotEmpty()
    IDPengambilan: number;

    @IsNumber()
    @IsNotEmpty()
    IDTransaksiSimpanan: number;

    @IsDate()
    @IsNotEmpty()
    Tanggal: Date;

    @IsString()
    @IsNotEmpty()
    NoAnggota: string;

    @IsString()
    @IsNotEmpty()
    JenisSimpanan: string;

    @IsNumber()
    @IsNotEmpty()
    Jumlah: number;
}