import { IsInt, IsOptional} from "class-validator";

export class HistoryTransaksiSimpananPostingDto {
    @IsInt()
    @IsOptional()
    Tahun: number = new Date().getFullYear();
}
