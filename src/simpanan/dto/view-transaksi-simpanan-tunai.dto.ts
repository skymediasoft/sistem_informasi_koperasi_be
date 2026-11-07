import { IsString, IsDate, IsOptional } from 'class-validator';

export class ViewTransaksiSimpananTunaiDto {
  @IsString()
  @IsOptional()
  JenisSimpanan: string = '%';

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