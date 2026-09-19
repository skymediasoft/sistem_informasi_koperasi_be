import { IsString, IsDate, IsInt } from "class-validator";

export class SubmitTransaksiSimpananPostingDto {
    @IsString()
    IDTransaksi: string;

    @IsDate()
    Tanggal: Date;

    @IsInt()
    TotalAnggota: number;

    @IsInt()
    TotalSimpananPokok: number;

    @IsInt()
    TotalSimpananWajib: number;

    @IsInt()
    TotalSimpananSukarela: number;

    @IsInt()
    TotalSimpanan: number;
}
