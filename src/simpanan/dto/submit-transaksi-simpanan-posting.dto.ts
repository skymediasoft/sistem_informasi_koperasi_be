import { IsString, IsDate, IsInt } from "class-validator";

export class SubmitTransaksiSimpananPostingDto {
    @IsDate()
    Tanggal: Date;
}
