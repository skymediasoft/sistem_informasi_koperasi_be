import { IsString, IsDate, IsNumber, IsNotEmpty } from 'class-validator';

export class CloseTransaksiPenarikanDto {
    @IsNumber()
    @IsNotEmpty()
    IDPengambilan: number;

    @IsDate()
    @IsNotEmpty()
    TanggalTransfer: Date;

    @IsString()
    @IsNotEmpty()
    NoRef: string;
}