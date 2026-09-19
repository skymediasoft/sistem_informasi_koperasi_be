import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { TransaksiSimpanan } from './entities/transaksi-simpanan.entity';
import { SubmitTransaksiSimpananPostingDto } from './dto/submit-transaksi-simpanan-posting.dto';

@Injectable()
export class TransaksiSimpananService {
  constructor(
    @InjectRepository(TransaksiSimpanan)
    private readonly transaksiSimpananRepository: Repository<TransaksiSimpanan>
  ) {}

  async findAll() {
    const queryResult = await this.transaksiSimpananRepository.query(
      'CALL sp_Get_Transaksi_Simpanan_Posting();'
    );
    return queryResult[0];
  }

  async SubmitTransaksiSimpananPosting(dto: SubmitTransaksiSimpananPostingDto, createdUser: string) {
    const queryResult = await this.transaksiSimpananRepository.query(
      'CALL sp_Submit_Transaksi_Simpanan_Posting(?, ?, ?, ?, ?, ?, ?, ?, @p_Message);',
      [ dto. IDTransaksi, dto.Tanggal, dto.TotalAnggota, dto.TotalSimpananPokok, dto.TotalSimpananWajib, dto.TotalSimpananSukarela, dto.TotalSimpanan, createdUser ]
    );

    const [out] = await this.transaksiSimpananRepository.query(
      'SELECT @p_Message AS p_Message',
    );

    return out?.p_Message as string;
  }
}
