import { IsString, IsDate } from 'class-validator';

export class ViewTransaksiSimpananTunaiDto {
  @IsString()
  JenisSimpanan: string;

  @IsDate()
  DateFrom: Date;

  @IsDate()
  DateTo: Date;

  @IsString()
  NoKaryawan: string;
}