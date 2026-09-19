import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { TransaksiSimpanan } from './entities/transaksi-simpanan.entity';

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

  async PostingTransaksiSimpanan() {
    const queryResult = await this.transaksiSimpananRepository.query(
      'CALL sp_Posting_Transaksi_Simpanan();'
    );
    return queryResult[0];
  }
}
