import { BadRequestException } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { buildUpdate } from './sql.util';

function setup() {
  const conn = { query: vi.fn(), release: vi.fn(), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn() };
  const pool = { query: vi.fn(), getConnection: vi.fn().mockResolvedValue(conn), end: vi.fn() };
  return { conn, pool, db: new DatabaseService(pool as any) };
}

describe('DatabaseService', () => {
  it('query returns first tuple element and stringifies bigint', async () => {
    const { pool, db } = setup();
    pool.query.mockResolvedValue([[{ a: 1 }], []]);
    expect(await db.query('SELECT ?', [10n])).toEqual([{ a: 1 }]);
    expect(pool.query).toHaveBeenCalledWith('SELECT ?', ['10']);
  });

  it('transaction commits, and rolls back + releases on failure', async () => {
    const { conn, db } = setup();
    await db.transaction(async () => 'ok');
    expect(conn.commit).toHaveBeenCalled();
    await expect(db.transaction(async () => { throw new Error('x'); })).rejects.toThrow('x');
    expect(conn.rollback).toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalledTimes(2);
  });

  it('withConnection releases when callback throws', async () => {
    const { conn, db } = setup();
    await expect(db.withConnection(async () => { throw new Error('x'); })).rejects.toThrow();
    expect(conn.release).toHaveBeenCalledTimes(1);
  });

  it('callWithMessage uses one connection and returns the message', async () => {
    const { conn, pool, db } = setup();
    conn.query.mockResolvedValueOnce([[], []]).mockResolvedValueOnce([[{ p_Message: 'done' }], []]);
    expect(await db.callWithMessage('CALL sp(?, @p_Message)', [1])).toBe('done');
    expect(conn.query).toHaveBeenCalledTimes(2);
    expect(pool.query).not.toHaveBeenCalled();
    expect(conn.release).toHaveBeenCalledTimes(1);
  });
});

describe('buildUpdate', () => {
  const cols = { a: 'ColA', b: 'ColB' };
  it('skips undefined and unknown keys', () => {
    expect(buildUpdate('T', cols, { a: 1, b: undefined, evil: 'x' }, 'Id = ?', [5])).toEqual({
      sql: 'UPDATE T SET ColA = ? WHERE Id = ?',
      params: [1, 5],
    });
  });
  it('rejects an empty update', () => {
    expect(() => buildUpdate('T', cols, { b: undefined }, 'Id = ?', [5])).toThrow(BadRequestException);
  });
});
