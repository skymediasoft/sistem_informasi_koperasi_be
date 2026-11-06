import { Injectable } from '@nestjs/common';
import { ViewTransaksiPenarikanDto  } from '../dto/view-transaksi-penarikan.dto';
import { SubmitTransaksiPenarikanDto } from '../dto/submit-transaksi-penarikan.dto';
import { GetSaldoPenarikanDto } from '../dto/get-saldo-penarikan.dto';
import { DatabaseService } from '../../database/database.service';
import { CloseTransaksiPenarikanDto } from '../dto/close-transaksi-penarikan.dto';
import { SubmitTransaksiPenarikanResignDto } from '../dto/submit-transaksi-penarikan-resign.dto';

@Injectable()
export class TransaksiPenarikanService {
	constructor(private readonly db: DatabaseService) {}

	// penarikan biasa
	async ViewTransaksiSimpananPenarikan(dto: ViewTransaksiPenarikanDto) {
		const queryResult = await this.db.query('CALL sp_Transaksi_Penarikan_Simpanan_View(?, ?, ?, ?);',
			[dto.Status, dto.DateFrom, dto.DateTo, dto.NoKaryawan]
		);

		return queryResult[0];
	}

	async GetTransaksiSimpananPenarikan(idPengambilan: string) {
		const queryResult = await this.db.query('CALL sp_Transaksi_Penarikan_Simpanan_Get(?);',
			[idPengambilan]
		);
		return queryResult[0];	
	}

	// select b.NoEmployee, b.NoAnggota, b.Nama, SUM(Jumlah) as Saldo
	private async fetchSaldoRow(noEmployee: string, jenisSimpanan: string) {
		const saldoTable = await this.db.query('CALL sp_Transaksi_Penarikan_Simpanan_Get_Saldo(?, ?);',
			[noEmployee, jenisSimpanan]
		);

		return saldoTable?.[0]?.[0];
	}

	async GetSaldoSimpananPenarikan(dto: GetSaldoPenarikanDto) {
		const rowSaldo = await this.fetchSaldoRow(dto.NoEmployee, dto.JenisSimpanan);

		// SP tidak mengembalikan baris bila anggota tidak ditemukan / bukan AKTIF / belum ada mutasi,
		// sama seperti cek saldo di submit: dianggap saldo 0.
		return {
			NoEmployee: rowSaldo?.NoEmployee ?? dto.NoEmployee,
			NoAnggota: rowSaldo?.NoAnggota ?? null,
			Nama: rowSaldo?.Nama ?? null,
			JenisSimpanan: dto.JenisSimpanan,
			Saldo: Number(rowSaldo?.Saldo ?? 0),
		};
	}

	async SubmitTransaksiSimpananPenarikan(dto: SubmitTransaksiPenarikanDto, createdUser: string) {
		const rowSaldo = await this.fetchSaldoRow(dto.NoEmployee, dto.JenisSimpanan);
		const totalSaldo = Number(rowSaldo?.Saldo ?? 0);

		if(totalSaldo < dto.Jumlah) {
			throw new Error(`Saldo tidak mencukupi.`);
		}

		return await this.db.callWithMessage('CALL sp_Transaksi_Penarikan_Simpanan_Submit(?, ?, ?, ?, ?, ?, ?, @p_Message);',
			[dto.IDPengambilan, dto.IDTransaksiSimpanan, dto.Tanggal, dto.NoEmployee, dto.JenisSimpanan, dto.Jumlah, createdUser]
		);
	}

	async CloseTransaksiSimpananPenarikan(dto: CloseTransaksiPenarikanDto) {
		const queryResult = await this.db.query('CALL sp_Transaksi_Penarikan_Simpanan_Close_Transaksi(?, ?, ?);',
			[dto.IDPengambilan, dto.TanggalTransfer, dto.NoRef]
		);

		return queryResult[0];
	}

	// penarikan resign
	async ViewTransaksiSimpananPenarikanResign(dto: ViewTransaksiPenarikanDto) {
		const queryResult = await this.db.query('CALL sp_Transaksi_Penarikan_Simpanan_Resign_View(?, ?, ?, ?);',
			[dto.Status, dto.DateFrom, dto.DateTo, dto.NoKaryawan]
		);

		return queryResult[0];
	}

	async GetTransaksiSimpananPenarikanResign(idPengambilan: string) {
		const queryResult = await this.db.query('CALL sp_Transaksi_Penarikan_Simpanan_Resign_Get(?);',
			[idPengambilan]
		);
		return queryResult[0];	
	}

	async SubmitTransaksiSimpananPenarikanResign(dto: SubmitTransaksiPenarikanResignDto, createdUser: string) {
		return await this.db.callWithMessage('CALL sp_Transaksi_Penarikan_Simpanan_Resign_Submit(?, ?, ?, ?, ?, ?, ?, @p_Message);',
			[dto.IDPengambilan, dto.Tanggal, dto.NoAnggota, dto.SimpananPokok, dto.SimpananWajib, dto.SimpananSukarela, createdUser]
		);
	}

	async CloseTransaksiSimpananPenarikanResign(dto: CloseTransaksiPenarikanDto) {
		const queryResult = await this.db.query('CALL sp_Transaksi_Penarikan_Simpanan_Resign_Close_Transaksi(?, ?, ?);',
			[dto.IDPengambilan, dto.TanggalTransfer, dto.NoRef]
		);

		return queryResult[0];
	}
}
