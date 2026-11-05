import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { buildUpdate } from '../database/sql.util';
import { Department } from './models/department.model';

const SELECT = `SELECT DepartmentId AS departmentId, DepartmentName AS departmentName,
  PostBy AS PostBy, PostDate AS PostDate FROM M_Department`;

@Injectable()
export class DepartmentRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByName(departmentName: string): Promise<Department | null> {
    const rows = await this.db.query<Department[]>(`${SELECT} WHERE DepartmentName = ? LIMIT 1`, [departmentName]);
    return rows[0] ?? null;
  }

  async findById(departmentId: string): Promise<Department | null> {
    const rows = await this.db.query<Department[]>(`${SELECT} WHERE DepartmentId = ? LIMIT 1`, [departmentId]);
    return rows[0] ?? null;
  }

  findAll(): Promise<Department[]> {
    return this.db.query<Department[]>(SELECT);
  }

  async insert(d: { departmentId: string; departmentName: string; PostBy: string }) {
    await this.db.query(
      'INSERT INTO M_Department (DepartmentId, DepartmentName, PostBy, PostDate) VALUES (?, ?, ?, NOW())',
      [d.departmentId, d.departmentName, d.PostBy],
    );
    return d;
  }

  /** Returns affected rows. */
  async updateName(departmentId: string, departmentName?: string): Promise<number> {
    const { sql, params } = buildUpdate('M_Department', { departmentName: 'DepartmentName' }, { departmentName }, 'DepartmentId = ?', [departmentId]);
    return (await this.db.query<{ affectedRows: number }>(sql, params)).affectedRows;
  }

  async delete(departmentId: string): Promise<number> {
    return (await this.db.query<{ affectedRows: number }>('DELETE FROM M_Department WHERE DepartmentId = ?', [departmentId])).affectedRows;
  }
}
