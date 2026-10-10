import { IsString, IsNotEmpty, IsDate, IsNumber } from 'class-validator';

export class SubmitTransaksiSimpananTunaiDto {
  @IsString()
  @IsNotEmpty()
  IDTransaksi: string;

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

  @IsNumber()
  @IsNotEmpty()
  JumlahBulan: number;

  @IsString()
  @IsNotEmpty()
  CreatedUser: string;
}