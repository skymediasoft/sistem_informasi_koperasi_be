import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Pool, PoolConnection } from 'mysql2/promise';
import { MYSQL_POOL } from './database.constants';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  /**
   * Returns the raw driver result: rows for SELECT,
   * [resultSets..., ResultSetHeader] for CALL, ResultSetHeader for DML.
   * Uses the text protocol, so `undefined` params become NULL like before.
   */
  async query<T = any>(
    sql: string,
    params: unknown[] = [],
    conn: Pool | PoolConnection = this.pool,
  ): Promise<T> {
    const bound = params.map((p) => (typeof p === 'bigint' ? p.toString() : p));
    const [result] = await conn.query(sql, bound);
    return result as T;
  }

  async withConnection<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
    const conn = await this.pool.getConnection();
    try {
      return await fn(conn);
    } finally {
      conn.release();
    }
  }

  async transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
    return this.withConnection(async (conn) => {
      await conn.beginTransaction();
      try {
        const out = await fn(conn);
        await conn.commit();
        return out;
      } catch (e) {
        try {
          await conn.rollback();
        } catch {
          // keep the original error
        }
        throw e;
      }
    });
  }

  /** CALL sp(..., @p_Message) then SELECT @p_Message on the SAME connection. */
  async callWithMessage(callSql: string, params: unknown[]): Promise<string | undefined> {
    return this.withConnection(async (conn) => {
      await this.query(callSql, params, conn);
      const rows = await this.query<{ p_Message: string }[]>(
        'SELECT @p_Message AS p_Message',
        [],
        conn,
      );
      return rows[0]?.p_Message;
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
