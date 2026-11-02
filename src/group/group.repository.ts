import { Injectable } from '@nestjs/common';
import type { PoolConnection } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { buildUpdate } from '../database/sql.util';
import { Group } from './models/group.model';
import { GroupAuthorization, GroupAuthRow } from './models/group-authorization.model';

const GROUP_COLS =
  'GroupID AS groupId, GroupName AS groupName, GroupNote AS groupNote, PostBy, PostDate';

@Injectable()
export class GroupRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByNameOrId(groupName: string, groupId: number): Promise<Group | null> {
    const rows = await this.db.query<Group[]>(
      `SELECT ${GROUP_COLS} FROM M_User_Group WHERE GroupName = ? OR GroupID = ? LIMIT 1`,
      [groupName, groupId],
    );
    return rows[0] ?? null;
  }

  async findById(groupId: number): Promise<Group | null> {
    const rows = await this.db.query<Group[]>(
      `SELECT ${GROUP_COLS} FROM M_User_Group WHERE GroupID = ? LIMIT 1`,
      [groupId],
    );
    return rows[0] ?? null;
  }

  findAll(): Promise<Group[]> {
    return this.db.query<Group[]>(`SELECT ${GROUP_COLS} FROM M_User_Group`);
  }

  // GroupID is client-supplied (no auto-increment); PostDate comes from the DB default.
  async insert(g: { groupId: number; groupName: string; groupNote: string }, postBy: string) {
    await this.db.query(
      'INSERT INTO M_User_Group (GroupID, GroupName, GroupNote, PostBy) VALUES (?, ?, ?, ?)',
      [g.groupId, g.groupName, g.groupNote, postBy],
    );
  }

  async update(groupId: number, dto: { groupName?: string; groupNote?: string }): Promise<number> {
    const { sql, params } = buildUpdate(
      'M_User_Group',
      { groupName: 'GroupName', groupNote: 'GroupNote' },
      dto as Record<string, unknown>,
      'GroupID = ?',
      [groupId],
    );
    return (await this.db.query<{ affectedRows: number }>(sql, params)).affectedRows;
  }

  async delete(groupId: number): Promise<number> {
    const res = await this.db.query<{ affectedRows: number }>(
      'DELETE FROM M_User_Group WHERE GroupID = ?',
      [groupId],
    );
    return res.affectedRows;
  }

  // Menus are read here (not via src/menu); MenuID is an int, so no stringifying needed.
  findAllMenuIds(): Promise<{ menuID: number }[]> {
    return this.db.query('SELECT MenuID AS menuID FROM M_Menu');
  }

  findAuthsByGroup(groupId: number): Promise<GroupAuthorization[]> {
    return this.db.query(
      'SELECT MenuAuthId AS menuAuthId, GroupId AS groupId, MenuId AS menuId, Access AS access ' +
        'FROM M_Group_Authorization WHERE GroupId = ?',
      [groupId],
    );
  }

  async deleteAuthsByGroup(groupId: number, conn?: PoolConnection): Promise<number> {
    const res = await this.db.query<{ affectedRows: number }>(
      'DELETE FROM M_Group_Authorization WHERE GroupId = ?',
      [groupId],
      conn,
    );
    return res.affectedRows;
  }

  async insertAuths(rows: GroupAuthRow[], conn?: PoolConnection): Promise<void> {
    await this.db.query(
      'INSERT INTO M_Group_Authorization (GroupId, MenuId, Access) VALUES ?',
      [rows.map((r) => [r.groupId, r.menuId, r.access])],
      conn,
    );
  }
}
