import { Injectable } from '@nestjs/common';
import { ViewTransaksiPenarikanDto  } from '../dto/view-transaksi-penarikan.dto';
import { SubmitTransaksiPenarikanDto } from '../dto/submit-transaksi-penarikan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { TransaksiPenarikan } from '../entities/transaksi-penarikan.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { CloseTransaksiPenarikanDto } from '../dto/close-transaksi-penarikan.dto';
import { TransaksiPenarikanResign } from '../entities/transaksi-penarikan-resign.entity';
import { SubmitTransaksiPenarikanResignDto } from '../dto/submit-transaksi-penarikan-resign.dto';

@Injectable()
export class TransaksiPenarikanService {
	constructor(
		@InjectRepository(TransaksiPenarikan)
		private readonly transaksiPenarikanRepository: Repository<TransaksiPenarikan>,
		@InjectRepository(TransaksiPenarikanResign)
		private readonly transaksiPenarikanResignRepository: Repository<TransaksiPenarikanResign>
	) {}

	// penarikan biasa
	async ViewTransaksiSimpananPenarikan(dto: ViewTransaksiPenarikanDto) {
		const queryResult = await this.transaksiPenarikanRepository.query('CALL sp_Transaksi_Penarikan_Simpanan_View(?, ?, ?, ?);',
			[dto.Status, dto.DateFrom, dto.DateTo, dto.NoKaryawan]
		);

		return queryResult[0];
	}

	async GetTransaksiSimpananPenarikan(idPengambilan: string) {
		const queryResult = await this.transaksiPenarikanRepository.query('CALL sp_Transaksi_Penarikan_Simpanan_Get(?);',
			[idPengambilan]
		);
		return queryResult[0];	
	}

	async SubmitTransaksiSimpananPenarikan(dto: SubmitTransaksiPenarikanDto, createdUser: string) {
		const queryResult = await this.transaksiPenarikanRepository.query('CALL sp_Transaksi_Penarikan_Simpanan_Submit(?, ?, ?, ?, ?, ?, ?, @p_Message);',
			[dto.IDPengambilan, dto.IDTransaksiSimpanan, dto.Tanggal, dto.NoAnggota, dto.JenisSimpanan, dto.Jumlah, createdUser]
		);

		const [out] = await this.transaksiPenarikanRepository.query(
			'SELECT @p_Message AS p_Message',
		);

		return out?.p_Message as string;
	}

	async CloseTransaksiSimpananPenarikan(dto: CloseTransaksiPenarikanDto) {
		const queryResult = await this.transaksiPenarikanRepository.query('CALL sp_Transaksi_Penarikan_Simpanan_Close_Transaksi(?, ?, ?);',
			[dto.IDPengambilan, dto.TanggalTransfer, dto.NoRef]
		);

		return queryResult[0];
	}

	// penarikan resign
	async ViewTransaksiSimpananPenarikanResign(dto: ViewTransaksiPenarikanDto) {
		const queryResult = await this.transaksiPenarikanResignRepository.query('CALL sp_Transaksi_Penarikan_Simpanan_Resign_View(?, ?, ?, ?);',
			[dto.Status, dto.DateFrom, dto.DateTo, dto.NoKaryawan]
		);

		return queryResult[0];
	}

	async GetTransaksiSimpananPenarikanResign(idPengambilan: string) {
		const queryResult = await this.transaksiPenarikanResignRepository.query('CALL sp_Transaksi_Penarikan_Simpanan_Resign_Get(?);',
			[idPengambilan]
		);
		return queryResult[0];	
	}

	async SubmitTransaksiSimpananPenarikanResign(dto: SubmitTransaksiPenarikanResignDto, createdUser: string) {
		const queryResult = await this.transaksiPenarikanResignRepository.query('CALL sp_Transaksi_Penarikan_Simpanan_Resign_Submit(?, ?, ?, ?, ?, ?, ?, @p_Message);',
			[dto.IDPengambilan, dto.Tanggal, dto.NoAnggota, dto.SimpananPokok, dto.SimpananWajib, dto.SimpananSukarela, createdUser]
		);

		const [out] = await this.transaksiPenarikanResignRepository.query(
			'SELECT @p_Message AS p_Message',
		);

		return out?.p_Message as string;
	}

	async CloseTransaksiSimpananPenarikanResign(dto: CloseTransaksiPenarikanDto) {
		const queryResult = await this.transaksiPenarikanResignRepository.query('CALL sp_Transaksi_Penarikan_Simpanan_Resign_Close_Transaksi(?, ?, ?);',
			[dto.IDPengambilan, dto.TanggalTransfer, dto.NoRef]
		);

		return queryResult[0];
	}
}
