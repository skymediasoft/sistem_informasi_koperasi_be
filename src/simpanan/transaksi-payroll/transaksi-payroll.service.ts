import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SubmitTransaksiSimpananPostingDto } from '../dto/submit-transaksi-simpanan-posting.dto';
import { HistoryTransaksiSimpananPostingDto } from '../dto/history-transaksi-simpanan-posting.dto';

@Injectable()
export class TransaksiPayrollService {
  constructor(private readonly db: DatabaseService) {}
  
  async GetTransaksiSimpananPosting() {
    const queryResult = await this.db.query(
      'CALL sp_Transaksi_Simpanan_Posting_Get();'
    );
    return queryResult[0];
  }

  async SubmitTransaksiSimpananPosting(dto: SubmitTransaksiSimpananPostingDto, createdUser: string) {
    return await this.db.callWithMessage(
      'CALL sp_Transaksi_Simpanan_Posting_Submit(?, ?, @p_Message);',
      [ dto.Tanggal, createdUser ]
    );
  }

  async HistoryTransaksiSimpananPosting(dto: HistoryTransaksiSimpananPostingDto) {
    const queryResult = await this.db.query(
      'CALL sp_Transaksi_Simpanan_Posting_View(?);',
      [dto.Tahun]
    );
    return queryResult[0];
  }

  async ViewDetailTransaksiSimpananPosting(IDTransaksi: string) {
    const queryResult = await this.db.query(
      'CALL sp_Transaksi_Simpanan_Posting_View_Detail(?);',
      [IDTransaksi]
    );
    return queryResult[0];
  }
}
