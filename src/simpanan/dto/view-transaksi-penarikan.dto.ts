import { IsString, IsDate, IsNotEmpty } from 'class-validator';

export class ViewTransaksiPenarikanDto {
    @IsString()
    @IsNotEmpty()
    Status: string;

    @IsDate()
    @IsNotEmpty()
    DateFrom: Date;

    @IsDate()
    @IsNotEmpty()
    DateTo: Date;

    @IsString()
    @IsNotEmpty()
    NoKaryawan: string;
}