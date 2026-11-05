import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { buildUpdate } from '../database/sql.util';
import { Menu } from './models/menu.model';

const SELECT = `SELECT MenuID AS menuID, MenuName AS menuName, MenuParentID AS menuParentID,
  MenuRoute AS menuRoute, MenuSort AS menuSort, PostBy AS postBy, PostDate AS postDate FROM M_Menu`;

const UPDATE_COLUMNS = { menuName: 'MenuName', menuRoute: 'MenuRoute', menuSort: 'MenuSort' };

// Replaces Menu.toJSON(): bigint parent id is always a string.
const toMenu = (r: Menu): Menu => ({ ...r, menuParentID: r.menuParentID == null ? r.menuParentID : String(r.menuParentID) });

@Injectable()
export class MenuRepository {
  constructor(private readonly db: DatabaseService) {}

  async findParents(): Promise<Menu[]> {
    return (await this.db.query<Menu[]>(`${SELECT} WHERE MenuParentID = 0`)).map(toMenu);
  }

  async findChildren(parentId: bigint | string): Promise<Menu[]> {
    return (await this.db.query<Menu[]>(`${SELECT} WHERE MenuParentID = ?`, [parentId.toString()])).map(toMenu);
  }

  async existsByName(menuName: string, excludeId?: number): Promise<boolean> {
    const rows = excludeId === undefined
      ? await this.db.query<unknown[]>('SELECT 1 FROM M_Menu WHERE MenuName = ? LIMIT 1', [menuName])
      : await this.db.query<unknown[]>('SELECT 1 FROM M_Menu WHERE MenuName = ? AND MenuID <> ? LIMIT 1', [menuName, excludeId]);
    return rows.length > 0;
  }

  async insert(m: { menuName: string; menuRoute: string; menuSort: number; menuParentID: bigint; postBy: string }): Promise<Menu> {
    const res = await this.db.query<{ insertId: number }>(
      'INSERT INTO M_Menu (MenuName, MenuRoute, MenuSort, MenuParentID, PostBy, PostDate) VALUES (?, ?, ?, ?, ?, NOW())',
      [m.menuName, m.menuRoute, m.menuSort, m.menuParentID.toString(), m.postBy],
    );
    const rows = await this.db.query<Menu[]>(`${SELECT} WHERE MenuID = ?`, [res.insertId]);
    return toMenu(rows[0]);
  }

  /** Returns affected rows. */
  async update(id: number, dto: { menuName?: string; menuRoute?: string; menuSort?: number }): Promise<number> {
    const { sql, params } = buildUpdate('M_Menu', UPDATE_COLUMNS, dto, 'MenuID = ?', [id]);
    return (await this.db.query<{ affectedRows: number }>(sql, params)).affectedRows;
  }

  async deleteWithChildren(id: number): Promise<number> {
    return (await this.db.query<{ affectedRows: number }>('DELETE FROM M_Menu WHERE MenuID = ? OR MenuParentID = ?', [id, id])).affectedRows;
  }
}
