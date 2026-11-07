import { IsString, IsDate, IsOptional } from 'class-validator';

export class ViewTransaksiSimpananTunaiDto {
  @IsString()
  @IsOptional()
  JenisSimpanan: string = '%';

  @IsDate()
  @IsOptional()
  DateFrom: Date = new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 1 day ago

  @IsDate()
  @IsOptional()
  DateTo: Date = new Date();

  @IsString()
  @IsOptional()
  NoKaryawan: string = '%';
}