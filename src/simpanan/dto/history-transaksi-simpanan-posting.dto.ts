import { IsInt } from "class-validator";

export class HistoryTransaksiSimpananPostingDto {
    @IsInt()
    Tahun: number;
}
