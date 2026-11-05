import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Anggota } from './models/anggota.model';

// Explicit list: PasswordLogin must never be selected. TanggalMasuk as YYYY-MM-DD string.
const ANGGOTA_COLUMNS = `NoAnggota, NoEmployee, Nama, Alamat, Telpon, JenisKelamin, DepartmentId, JenisAnggota,
  DATE_FORMAT(TanggalMasuk, '%Y-%m-%d') AS TanggalMasuk, NoRekening, IsNew, SimpananPokok, SimpananWajib,
  SimpananSukarela, StatusAnggota, AlamatEmail, CreatedUser, CreatedDate, UpdatedUser, UpdatedDate`;

@Injectable()
export class AnggotaRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByNoAnggota(noAnggota: string): Promise<Anggota | null> {
    const rows = await this.db.query<Anggota[]>(
      `SELECT ${ANGGOTA_COLUMNS} FROM M_Anggota WHERE NoAnggota = ? LIMIT 1`,
      [noAnggota],
    );
    return rows[0] ?? null;
  }

  /** GET /members: the view has no PasswordLogin. */
  listView(): Promise<unknown[]> {
    return this.db.query('SELECT * FROM vw_M_Anggota');
  }

  async delete(noAnggota: string): Promise<number> {
    return (await this.db.query<{ affectedRows: number }>('DELETE FROM M_Anggota WHERE NoAnggota = ?', [noAnggota]))
      .affectedRows;
  }

  /** sp_Get_Anggota_Login: first row incl. PasswordLogin hash, for login only. */
  async getLoginRow(noAnggota: string): Promise<any | undefined> {
    const [rows] = await this.db.query<any[][]>('CALL sp_Get_Anggota_Login(?)', [noAnggota]);
    return rows[0];
  }

  /** CALL + SELECT @p_Message on the same connection (14 IN params). */
  insertViaProcedure(params: unknown[]): Promise<string | undefined> {
    return this.db.callWithMessage(
      'CALL sp_M_Anggota_Insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @p_Message)',
      params,
    );
  }

  /**
   * Same-connection CALL + SELECT @p_Message (16 IN params). Also returns the CALL's
   * affectedRows because the service keeps the legacy "No data was updated." check on it.
   */
  updateViaProcedure(params: unknown[]): Promise<{ affectedRows?: number; message?: string }> {
    return this.db.withConnection(async (conn) => {
      const result = await this.db.query<{ affectedRows?: number }>(
        'CALL sp_M_Anggota_Update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @p_Message)',
        params,
        conn,
      );
      const rows = await this.db.query<{ p_Message: string }[]>('SELECT @p_Message AS p_Message', [], conn);
      return { affectedRows: result?.affectedRows, message: rows[0]?.p_Message };
    });
  }
}
