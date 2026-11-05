import { Injectable } from '@nestjs/common';
import { CreateSettingSimpananDto } from '../dto/create-setting-simpanan.dto';
import { UpdateSettingSimpananDto } from '../dto/update-setting-simpanan.dto';
import { DatabaseService } from '../../database/database.service';
import { buildUpdate } from '../../database/sql.util';

const SETTING_COLUMNS = {
  SimpananPokok: 'SimpananPokok',
  SimpananWajib: 'SimpananWajib',
  SimpananSukarela: 'SimpananSukarela',
};

@Injectable()
export class SettingSimpananService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    const rows = await this.db.query(
      'SELECT ID, SimpananPokok, SimpananWajib, SimpananSukarela FROM M_Setting_Simpanan ORDER BY ID LIMIT 1',
    );
    return rows[0];
  }

  async update(id: number, dto: UpdateSettingSimpananDto) {
    const { sql, params } = buildUpdate('M_Setting_Simpanan', SETTING_COLUMNS, { ...dto }, 'ID = ?', [id]);
    const result = await this.db.query(sql, params);
    return { affected: result.affectedRows };
  }

  // Single statement: the old SET @var + CALL pair could land on different pooled connections.
  async updateApply(dto: CreateSettingSimpananDto) {
    return await this.db.query('CALL sp_Update_Setting_Simpanan(?, ?, ?)', [
      dto.SimpananPokok,
      dto.SimpananWajib,
      dto.SimpananSukarela,
    ]);
  }

  remove(id: number) {
    return `This action removes a #${id} simpanan`;
  }
}
