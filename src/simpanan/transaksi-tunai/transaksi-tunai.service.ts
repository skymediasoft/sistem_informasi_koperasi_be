import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ViewTransaksiSimpananTunaiDto } from '../dto/view-transaksi-simpanan-tunai.dto';
import { SubmitTransaksiSimpananTunaiDto } from '../dto/submit-transaksi-simpanan-tunai.dto';

@Injectable()
export class TransaksiTunaiService {
  constructor(private readonly db: DatabaseService) {}

  async ViewTransaksiSimpananTunai(dto: ViewTransaksiSimpananTunaiDto) {
    const queryResult = await this.db.query(
      'CALL sp_Transaksi_Simpanan_Tunai_View(?, ?, ?, ?);',
      [dto.JenisSimpanan, dto.DateFrom, dto.DateTo, dto.NoKaryawan]
    );
    return queryResult[0];
  }

  async GetTransaksiSimpananTunai(idTransaksi: string) {
    const queryResult = await this.db.query(
      'CALL sp_Transaksi_Simpanan_Tunai_Get(?);',
      [idTransaksi]
    );
    return queryResult[0];
  }

  async SubmitTransaksiSimpananTunai(dto: SubmitTransaksiSimpananTunaiDto, createdUser: string) {
    await this.db.query(
      'CALL sp_Transaksi_Simpanan_Tunai_Submit(?, ?, ?, ?, ?, ?, ?);',
      [dto.IDTransaksi, dto.Tanggal, dto.NoAnggota, dto.JenisSimpanan, dto.Jumlah, dto.JumlahBulan, createdUser]
    );
  }
}
