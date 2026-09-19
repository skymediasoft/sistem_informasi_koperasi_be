import { IsEmail, IsInt, IsNotEmpty, IsNumber, isString, IsString, MinLength } from 'class-validator';

export class RegisterAnggotaDto {
  @IsString()
  @IsNotEmpty()
  NoEmployee: string;

  @IsString()
  @IsNotEmpty()
  Nama: string;

  @IsString()
  @IsNotEmpty()
  Alamat: string;

  @IsString()
  @IsNotEmpty()
  Telpon: string;

  @IsString()
  @IsNotEmpty()
  JenisKelamin: string;

  @IsString()
  @IsNotEmpty()
  DepartmentId: string;

  @IsString()
  @IsNotEmpty()
  JenisAnggota: string;

  @IsString()
  @IsNotEmpty()
  TanggalMasuk: string;

  @IsString()
  @IsNotEmpty()
  NoRekening: string;

  @IsInt()
  @IsNotEmpty()
  SimpananPokok: number;

  @IsInt()
  @IsNotEmpty()
  SimpananWajib: number;

  @IsInt()
  @IsNotEmpty()
  SimpananSukarela: number;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  AlamatEmail: string;
}