import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransaksiSimpanan } from '../entities/transaksi-simpanan.entity';
import { SubmitTransaksiSimpananPostingDto } from '../dto/submit-transaksi-simpanan-posting.dto';
import { HistoryTransaksiSimpananPostingDto } from '../dto/history-transaksi-simpanan-posting.dto';

@Injectable()
export class TransaksiPayrollService {
  constructor(
    @InjectRepository(TransaksiSimpanan)
    private readonly transaksiSimpananRepository: Repository<TransaksiSimpanan>
  ) {}
  
  async GetTransaksiSimpananPosting() {
    const queryResult = await this.transaksiSimpananRepository.query(
      'CALL sp_Transaksi_Simpanan_Posting_Get();'
    );
    return queryResult[0];
  }

  async SubmitTransaksiSimpananPosting(dto: SubmitTransaksiSimpananPostingDto, createdUser: string) {
    const queryResult = await this.transaksiSimpananRepository.query(
      'CALL sp_Transaksi_Simpanan_Posting_Submit(?, ?, @p_Message);',
      [ dto.Tanggal, createdUser ]
    );

    const [out] = await this.transaksiSimpananRepository.query(
      'SELECT @p_Message AS p_Message',
    );

    return out?.p_Message as string;
  }

  async HistoryTransaksiSimpananPosting(dto: HistoryTransaksiSimpananPostingDto) {
    const queryResult = await this.transaksiSimpananRepository.query(
      'CALL sp_Transaksi_Simpanan_Posting_View(?);',
      [dto.Tahun]
    );
    return queryResult[0];
  }

  async ViewDetailTransaksiSimpananPosting(IDTransaksi: string) {
    const queryResult = await this.transaksiSimpananRepository.query(
      'CALL sp_Transaksi_Simpanan_Posting_View_Detail(?);',
      [IDTransaksi]
    );
    return queryResult[0];
  }
}
