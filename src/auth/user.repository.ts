import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { buildUpdate } from '../database/sql.util';
import { User } from './models/user.model';

const USER_COLUMNS = `UserLogin AS userLogin, UserName AS userName, UserEmail AS userEmail,
  PostBy AS postBy, PostDate AS postDate, GroupID AS groupId`;

// dto key -> column. Never includes UserPassword (see updatePassword).
const UPDATE_COLUMNS = {
  userLogin: 'UserLogin',
  userName: 'UserName',
  userEmail: 'UserEmail',
  groupId: 'GroupID',
};

@Injectable()
export class UserRepository {
  constructor(private readonly db: DatabaseService) {}

  /** Never returns the password hash. */
  async findByLogin(userLogin: string): Promise<User | null> {
    const rows = await this.db.query<User[]>(
      `SELECT ${USER_COLUMNS} FROM M_Users WHERE UserLogin = ? LIMIT 1`,
      [userLogin],
    );
    return rows[0] ?? null;
  }

  async existsByLogin(userLogin: string): Promise<boolean> {
    const rows = await this.db.query<unknown[]>('SELECT 1 FROM M_Users WHERE UserLogin = ? LIMIT 1', [userLogin]);
    return rows.length > 0;
  }

  async insert(u: {
    userLogin: string;
    userName: string;
    userPassword: string;
    userEmail?: string;
    groupId?: number;
    postBy: string;
  }): Promise<void> {
    await this.db.query(
      `INSERT INTO M_Users (UserLogin, UserPassword, UserName, UserEmail, GroupID, PostBy, PostDate)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [u.userLogin, u.userPassword, u.userName, u.userEmail, u.groupId, u.postBy],
    );
  }

  /** Returns affectedRows (matched rows). */
  async update(
    userLogin: string,
    dto: { userLogin?: string; userName?: string; userEmail?: string; groupId?: number },
  ): Promise<number> {
    const { sql, params } = buildUpdate('M_Users', UPDATE_COLUMNS, dto, 'UserLogin = ?', [userLogin]);
    return (await this.db.query<{ affectedRows: number }>(sql, params)).affectedRows;
  }

  async updatePassword(userLogin: string, hashedPassword: string): Promise<void> {
    await this.db.query('UPDATE M_Users SET UserPassword = ? WHERE UserLogin = ?', [hashedPassword, userLogin]);
  }

  async delete(userLogin: string): Promise<number> {
    return (await this.db.query<{ affectedRows: number }>('DELETE FROM M_Users WHERE UserLogin = ?', [userLogin]))
      .affectedRows;
  }

  /** GET /users: the view has no password column. */
  listLoginView(): Promise<unknown[]> {
    return this.db.query('SELECT * FROM vw_M_User_Login');
  }

  /** Raw rows, kept as-is for the (known-buggy, out of scope) token groupName payload. */
  findGroupNameRows(groupId?: number): Promise<any> {
    return this.db.query('SELECT GroupName FROM M_User_Group WHERE GroupID = ?', [groupId]);
  }

  /** sp_Get_Users_Login: first row incl. UserPassword hash, for login only. */
  async getLoginRow(userLogin: string): Promise<any | undefined> {
    const [rows] = await this.db.query<any[][]>('CALL sp_Get_Users_Login(?)', [userLogin]);
    return rows[0];
  }

  async getGroupAuthorization(groupId: number): Promise<any[]> {
    const [rows] = await this.db.query<any[][]>('CALL sp_get_group_authorization(?)', [groupId]);
    return rows || [];
  }
}
