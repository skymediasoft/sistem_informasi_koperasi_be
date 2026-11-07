import { IsString, IsDate, IsNotEmpty, IsOptional } from 'class-validator';

export class ViewTransaksiPenarikanDto {
    @IsString()
    @IsNotEmpty()
    Status: string;

    @IsDate()
    @IsOptional()
    DateFrom: Date = new Date();

    @IsDate()
    @IsOptional()
    DateTo: Date = new Date();

    @IsString()
    @IsOptional()
    NoKaryawan: string = '%';
}