/**
 * Verifier 7C: simpanan endpoints + DatabaseService pool hygiene, run against the shared DEV database from .env.
 * Safety: only touches rows it creates (NoAnggota 'E2EC_0001', employee 'E2EC_T01', CreatedUser 'E2EC_user'),
 * never runs procedures that rewrite ALL rows (payroll posting submit, savings-settings/apply), restores nothing
 * because the only setting write is a no-op PATCH with the current value. Cleans up in afterAll.
 * Run: pnpm vitest run --config ./vitest.config.e2e.ts test/simpanan.e2e-spec.ts
 */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DatabaseService } from '../src/database/database.service';

process.env.SQL_POOL_LIMIT = '3'; // only pool size is overridden; host/credentials come from .env as usual
const POOL_LIMIT = 3;

const NO = 'E2EC_0001'; // M_Anggota.NoAnggota (varchar 15; SP params are varchar(10) so keep <= 10)
const EMP = 'E2EC_T01'; // NoEmployee (varchar 10)
const USER = 'E2EC_user'; // CreatedUser written by every submit (JWT payload name)
const SUKARELA = 'SIMPANAN SUKARELA';

// every pre-existing row of these must be untouched (E2E* rows from the three verifiers are excluded)
const GUARDED: [string, string][] = [
  ['M_Setting_Simpanan', '1=1'],
  ['M_Anggota', "NoAnggota NOT LIKE 'E2E%' AND Nama NOT LIKE 'E2E%'"],
  ['T_Simpanan_Anggota', "NoAnggota NOT LIKE 'E2E%'"],
  ['T_Simpanan_Penarikan', "NoAnggota NOT LIKE 'E2E%'"],
  ['T_Simpanan_Penarikan_Resign', "NoAnggota NOT LIKE 'E2E%'"],
  ['T_Simpanan_Posting', '1=1'],
  ['T_Simpanan_Posting_Detail', "NoAnggota NOT LIKE 'E2E%'"],
];

describe('simpanan + DatabaseService (shared dev DB, E2EC_ rows only)', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let token: string;
  let before: Record<string, string>;
  const http = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const q = (sql: string, params: unknown[] = []) => db.query<any[]>(sql, params);

  async function checksums() {
    const out: Record<string, string> = {};
    for (const [t, where] of GUARDED) {
      const cols = (await q('SELECT COLUMN_NAME c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? ORDER BY ordinal_position', [t])).map((r) => "IFNULL(CAST(`" + r.c + "` AS CHAR), '<null>')");
      const r = (await q(`SELECT COUNT(*) n, IFNULL(SUM(CRC32(CONCAT_WS('|', ${cols.join(',')}))), 0) s FROM ${t} WHERE ${where}`))[0];
      out[t] = `${r.n}:${r.s}`;
    }
    return out;
  }

  async function cleanup() {
    await q('DELETE FROM T_Simpanan_Penarikan_Resign WHERE NoAnggota = ?', [NO]);
    await q('DELETE FROM T_Simpanan_Penarikan WHERE NoAnggota = ?', [NO]);
    await q('DELETE FROM T_Simpanan_Anggota WHERE NoAnggota = ?', [NO]); // also cascades, explicit anyway
    await q('DELETE FROM M_Anggota WHERE NoAnggota = ?', [NO]);
  }

  beforeAll(async () => {
    expect(process.env.SQL_POOL_LIMIT).toBe('3');
    const { AppModule } = await import('../src/app.module');
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }),
    );
    await app.init();
    db = app.get(DatabaseService);

    // JwtStrategy.validate trusts the payload (no DB lookup), so mint a token for a synthetic principal
    token = app.get(JwtService, { strict: false }).sign({ sub: USER, name: USER, email: 'e2ec@example.invalid', groupId: 0, groupName: 'E2EC' });

    await cleanup(); // leftovers of an aborted earlier run (only E2EC_0001)
    before = await checksums();
    await q(
      `INSERT INTO M_Anggota (NoAnggota, NoEmployee, Nama, Alamat, JenisAnggota, TanggalMasuk, IsNew, SimpananPokok, SimpananWajib, SimpananSukarela, StatusAnggota, AlamatEmail, CreatedUser, CreatedDate)
       VALUES (?, ?, 'E2EC_Tester', 'E2EC', 'KARYAWAN', '2026-01-01', 0, 0, 12345, 0, 'AKTIF', 'e2ec_0001@example.invalid', ?, NOW())`,
      [NO, EMP, USER],
    );
  }, 60000);

  afterAll(async () => {
    try {
      if (db) {
        await cleanup();
        const left = {
          M_Anggota: (await q("SELECT COUNT(*) c FROM M_Anggota WHERE NoAnggota LIKE 'E2EC\\_%' OR Nama LIKE 'E2EC\\_%'"))[0].c,
          T_Simpanan_Anggota: (await q("SELECT COUNT(*) c FROM T_Simpanan_Anggota WHERE NoAnggota LIKE 'E2EC\\_%' OR CreatedUser = ?", [USER]))[0].c,
          T_Simpanan_Penarikan: (await q("SELECT COUNT(*) c FROM T_Simpanan_Penarikan WHERE NoAnggota LIKE 'E2EC\\_%' OR CreatedUser = ?", [USER]))[0].c,
          T_Simpanan_Penarikan_Resign: (await q("SELECT COUNT(*) c FROM T_Simpanan_Penarikan_Resign WHERE NoAnggota LIKE 'E2EC\\_%' OR CreatedUser = ?", [USER]))[0].c,
          T_Simpanan_Posting: (await q('SELECT COUNT(*) c FROM T_Simpanan_Posting WHERE CreatedUser = ?', [USER]))[0].c,
        };
        console.log('[cleanup] remaining E2EC rows:', JSON.stringify(left));
        const after = await checksums();
        console.log('[cleanup] pre-existing rows unchanged:', JSON.stringify(after) === JSON.stringify(before), JSON.stringify(before) === JSON.stringify(after) ? '' : JSON.stringify({ before, after }));
        for (const v of Object.values(left)) expect(Number(v)).toBe(0);
        expect(after).toEqual(before);
      }
    } finally {
      await app?.close();
    }
  }, 60000);

  // ------------------------------------------------------------------ setting-simpanan (read / no-op write only)
  describe('setting-simpanan', () => {
    it('GET /savings-settings returns the first row (ID + 3 numbers) or empty', async () => {
      const res = await http().get('/savings-settings');
      expect(res.status).toBe(200);
      if (res.text) expect(Object.keys(res.body).sort()).toEqual(['ID', 'SimpananPokok', 'SimpananSukarela', 'SimpananWajib']);
    });

    it('PATCH /savings-settings/:id with the CURRENT value is a no-op write -> { affected: 1 }; value unchanged', async () => {
      const cur = (await http().get('/savings-settings')).body;
      if (!cur?.ID) return;
      const res = await http().patch(`/savings-settings/${cur.ID}`).send({ SimpananPokok: cur.SimpananPokok });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ affected: 1 }); // ORIGINAL: UpdateResult { generatedMaps:[], raw:[], affected:1 } (plan decision D2)
      expect((await http().get('/savings-settings')).body).toEqual(cur);
    });

    it('PATCH unknown id -> { affected: 0 }; empty body -> 400 (ORIGINAL: 500 UpdateValuesMissingError)', async () => {
      const r1 = await http().patch('/savings-settings/987654321').send({ SimpananWajib: 1 });
      expect(r1.status).toBe(200);
      expect(r1.body).toEqual({ affected: 0 });
      const r2 = await http().patch('/savings-settings/1').send({});
      expect(r2.status).toBe(400);
      expect(r2.body.message).toBe('No fields to update');
    });

    it('POST /savings-settings/apply: validation only (NOT executed: the SP rewrites the global setting + every AKTIF member)', async () => {
      expect((await http().post('/savings-settings/apply').send({ SimpananPokok: 1 })).status).toBe(400);
      expect((await http().post('/savings-settings/apply').send({ SimpananPokok: 1, SimpananWajib: 2, SimpananSukarela: 3, x: 1 })).status).toBe(400);
    });

    it('DELETE stub returns the placeholder text', async () => {
      const d = await http().delete('/savings-settings/1');
      expect(d.status).toBe(200);
      expect(d.text).toBe('This action removes a #1 simpanan');
    });
  });

  // ------------------------------------------------------------------ payroll (read-only)
  describe('transaksi-payroll (read-only; POST submit NOT executed: posts for every KARYAWAN member)', () => {
    it('GET /payroll-postings lists the E2EC member; Total is a string', async () => {
      const res = await http().get('/payroll-postings');
      expect(res.status).toBe(200);
      const row = res.body.find((r: any) => r.NoAnggota === NO);
      expect(row).toMatchObject({ NoEmployee: EMP, SimpananPokok: 0, SimpananWajib: 12345, SimpananSukarela: 0 });
      expect(typeof row.Total).toBe('string');
      expect(row.Total).toBe('12345');
    });

    it('POST /payroll-postings without JWT -> 401 (no DB access)', async () => {
      expect((await http().post('/payroll-postings').send({ Tanggal: '2026-11-02' })).status).toBe(401);
    });

    it('history/:year and detail/:id return first result sets (pre-formatted dates, string totals)', async () => {
      const y = new Date().getFullYear();
      const h = await http().get(`/payroll-postings/history/${y}`);
      expect(h.status).toBe(200);
      expect(Array.isArray(h.body)).toBe(true);
      const withData = await http().get('/payroll-postings/history/2026');
      expect(withData.status).toBe(200);
      const first = withData.body[0] ?? h.body[0];
      if (first) {
        expect(first.Tanggal).toMatch(/^\d{2}-[A-Za-z]{3}-\d{4}$/);
        const d = await http().get(`/payroll-postings/${first.IDTransaksi}`);
        expect(d.status).toBe(200);
        expect(Array.isArray(d.body)).toBe(true);
        if (d.body.length) expect(typeof d.body[0].TotalSimpanan).toBe('string');
      }
      const bad = await http().get('/payroll-postings/history/abc'); // @Param typed number, no ParseInt: NaN reaches the SP
      console.log('[info] history/abc ->', bad.status, bad.body.error, '|', bad.body.message);
      expect([400, 500]).toContain(bad.status);
    });
  });

  // ------------------------------------------------------------------ tunai
  describe('transaksi-tunai', () => {
    let id: string;
    const body = { IDTransaksi: '0', Tanggal: '2026-11-02', NoAnggota: NO, JenisSimpanan: SUKARELA, Jumlah: 1000000, JumlahBulan: 0 };

    it('POST without JWT -> 401; invalid body -> 400', async () => {
      expect((await http().post('/cash-transactions').send(body)).status).toBe(401);
      expect((await http().post('/cash-transactions').set(auth()).send({ IDTransaksi: '0' })).status).toBe(400);
    });

    it('POST /cash-transactions (id "0") -> 201 empty body, row inserted', async () => {
      const res = await http().post('/cash-transactions').set(auth()).send(body);
      expect(res.status).toBe(201);
      expect(res.text).toBe('');
      const r = await q("SELECT IDTransaksi, JenisPosting, JenisTransaksi, CreatedUser FROM T_Simpanan_Anggota WHERE NoAnggota = ?", [NO]);
      expect(r).toHaveLength(1);
      expect(r[0]).toMatchObject({ JenisPosting: 'MANUAL', JenisTransaksi: 'SETORAN', CreatedUser: USER });
      id = String(r[0].IDTransaksi);
    });

    it('GET list + by id: arrays; IDTransaksi string, Jumlah number, Tanggal ISO', async () => {
      const list = await http().get('/cash-transactions').query({ JenisSimpanan: '%', DateFrom: '2026-01-01', DateTo: '2026-12-31', NoKaryawan: EMP });
      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]).toMatchObject({ IDTransaksi: id, NoAnggota: NO, NoEmployee: EMP, JenisSimpanan: SUKARELA, Jumlah: 1000000 });
      expect(typeof list.body[0].IDTransaksi).toBe('string');
      expect(list.body[0].Tanggal).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      const one = await http().get(`/cash-transactions/${id}`);
      expect(one.status).toBe(200);
      expect(one.body).toHaveLength(1);
      expect(one.body[0]).toMatchObject({ IDTransaksi: id, Jumlah: 1000000, BulanAktif: 0 });
    });

    it('POST with the existing id updates that row', async () => {
      const res = await http().post('/cash-transactions').set(auth()).send({ ...body, IDTransaksi: id, Jumlah: 1100000, JumlahBulan: 2 });
      expect(res.status).toBe(201);
      expect((await http().get(`/cash-transactions/${id}`)).body[0]).toMatchObject({ Jumlah: 1100000, BulanAktif: 2 });
    });

    it('non-numeric IDTransaksi (Bruno sample "TRX-2026-0001") is a DB-level failure', async () => {
      const res = await http().post('/cash-transactions').set(auth()).send({ ...body, IDTransaksi: 'TRX-2026-0001' });
      console.log('[info] tunai non-numeric id ->', res.status, res.body.error, '|', res.body.message);
      expect([400, 500]).toContain(res.status);
      expect(await q('SELECT 1 FROM T_Simpanan_Anggota WHERE NoAnggota = ?', [NO])).toHaveLength(1);
    });
  });

  // ------------------------------------------------------------------ penarikan
  describe('transaksi-penarikan', () => {
    let pid: number;
    let sid: number;
    const base = { Tanggal: '2026-11-02', NoEmployee: EMP, JenisSimpanan: SUKARELA };
    const f = { DateFrom: '2026-01-01', DateTo: '2026-12-31', NoKaryawan: EMP };

    it('saldo-insufficient -> 500 "Saldo tidak mencukupi.", nothing written', async () => {
      const res = await http().post('/withdrawals').set(auth()).send({ ...base, IDPengambilan: 0, IDTransaksiSimpanan: 0, Jumlah: 99999999 });
      expect(res.status).toBe(500);
      expect(res.body).toMatchObject({ success: false, statusCode: 500, message: 'Saldo tidak mencukupi.', error: 'Error' });
      expect(await q('SELECT 1 FROM T_Simpanan_Penarikan WHERE NoAnggota = ?', [NO])).toHaveLength(0);
    });

    it('POST /withdrawals (new) -> "success" text/html; negative ledger row + OPEN row', async () => {
      const res = await http().post('/withdrawals').set(auth()).send({ ...base, IDPengambilan: 0, IDTransaksiSimpanan: 0, Jumlah: 200000 });
      expect(res.status).toBe(201);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toBe('success');
      const p = (await q('SELECT IDPengambilan, IDTransaksiSimpanan, Jumlah, StatusTransaksi, CreatedUser FROM T_Simpanan_Penarikan WHERE NoAnggota = ?', [NO]))[0];
      expect(p).toMatchObject({ Jumlah: 200000, StatusTransaksi: 'OPEN', CreatedUser: USER });
      pid = Number(p.IDPengambilan);
      sid = Number(p.IDTransaksiSimpanan);
      expect((await q('SELECT Jumlah j, JenisTransaksi t FROM T_Simpanan_Anggota WHERE IDTransaksi = ?', [sid]))[0]).toEqual({ j: -200000, t: 'PENARIKAN' });
      expect(Number((await q('SELECT SUM(Jumlah) s FROM T_Simpanan_Anggota WHERE NoAnggota = ? AND JenisSimpanan = ?', [NO, SUKARELA]))[0].s)).toBe(1100000 - 200000);
    });

    it('SP handler-error path: unknown employee + Jumlah 0 -> 201 text with the SP-produced "Error 1048 ..." message, nothing written', async () => {
      const n = (await q('SELECT COUNT(*) c FROM T_Simpanan_Anggota WHERE NoAnggota = ?', [NO]))[0].c;
      const res = await http().post('/withdrawals').set(auth()).send({ ...base, NoEmployee: 'E2EC_NONE', IDPengambilan: 0, IDTransaksiSimpanan: 0, Jumlah: 0 });
      expect(res.status).toBe(201);
      expect(res.text).toBe("Error 1048 (23000): Column 'NoAnggota' cannot be null");
      expect((await q('SELECT COUNT(*) c FROM T_Simpanan_Anggota WHERE NoAnggota = ?', [NO]))[0].c).toEqual(n);
    });

    it('INFO: over-long JenisSimpanan (column is varchar(20), SP param varchar(50)) is NOT caught by the SP handler -> HTTP 500', async () => {
      const res = await http().post('/withdrawals').set(auth()).send({ ...base, JenisSimpanan: 'X'.repeat(30), IDPengambilan: 0, IDTransaksiSimpanan: 0, Jumlah: 0 });
      console.log('[info] long JenisSimpanan ->', res.status, '|', res.body.message ?? res.text);
      expect(await q('SELECT 1 FROM T_Simpanan_Penarikan WHERE NoAnggota = ? AND JenisSimpanan <> ?', [NO, SUKARELA])).toHaveLength(0);
    });

    it('GET /withdrawals (OPEN) and /:id', async () => {
      const list = await http().get('/withdrawals').query({ Status: 'OPEN', ...f });
      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(1);
      expect(list.body[0]).toMatchObject({ NoAnggota: NO, NoEmployee: EMP, Jumlah: 200000, StatusTransaksi: 'OPEN' });
      expect(typeof list.body[0].IDPengambilan).toBe('string');
      const one = await http().get(`/withdrawals/${pid}`);
      expect(one.status).toBe(200);
      expect(one.body).toHaveLength(1);
      expect(typeof one.body[0].IDTransaksiSimpanan).toBe('string');
      expect(Number(one.body[0].IDTransaksiSimpanan)).toBe(sid);
    });

    it('POST /withdrawals update path (existing ids)', async () => {
      const res = await http().post('/withdrawals').set(auth()).send({ ...base, IDPengambilan: pid, IDTransaksiSimpanan: sid, Jumlah: 150000 });
      expect(res.text).toBe('success');
      expect((await q('SELECT Jumlah j FROM T_Simpanan_Penarikan WHERE IDPengambilan = ?', [pid]))[0].j).toBe(150000);
      expect((await q('SELECT Jumlah j FROM T_Simpanan_Anggota WHERE IDTransaksi = ?', [sid]))[0].j).toBe(-150000);
    });

    it('POST /withdrawals/close -> 201 empty; CLOSE status; views follow', async () => {
      expect((await http().post('/withdrawals/close').send({})).status).toBe(401);
      const res = await http().post('/withdrawals/close').set(auth()).send({ IDPengambilan: pid, TanggalTransfer: '2026-11-03', NoRef: 'E2EC-1' });
      expect(res.status).toBe(201);
      expect(res.text).toBe('');
      expect((await q('SELECT StatusTransaksi s, NoRef r FROM T_Simpanan_Penarikan WHERE IDPengambilan = ?', [pid]))[0]).toEqual({ s: 'CLOSE', r: 'E2EC-1' });
      expect((await http().get('/withdrawals').query({ Status: 'CLOSE', ...f })).body).toHaveLength(1);
      expect((await http().get('/withdrawals').query({ Status: 'OPEN', ...f })).body).toHaveLength(0);
    });

    it('resign: submit "success" (status NULL, known), views empty, get = known 500, close, undo via delete path', async () => {
      const body = { IDPengambilan: 0, Tanggal: '2026-11-02', NoAnggota: NO, SimpananPokok: 100, SimpananWajib: 200, SimpananSukarela: 300 };
      const res = await http().post('/withdrawals/resignations').set(auth()).send(body);
      expect(res.status).toBe(201);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toBe('success');
      const r = (await q('SELECT IDPengambilan id, StatusTransaksi s, SimpananPokok p, CreatedUser u FROM T_Simpanan_Penarikan_Resign WHERE NoAnggota = ?', [NO]))[0];
      expect(r).toMatchObject({ s: null, p: 100, u: USER });
      expect((await q('SELECT StatusAnggota s FROM M_Anggota WHERE NoAnggota = ?', [NO]))[0].s).toBe('RESIGN');
      const rid = Number(r.id);

      for (const Status of ['OPEN', 'CLOSE']) {
        const v = await http().get('/withdrawals/resignations').query({ Status, ...f });
        // live SP sp_Transaksi_Penarikan_Simpanan_Resign_View selects unqualified SimpananPokok/Wajib/Sukarela that exist in both
        // joined tables -> MySQL 1052 "ambiguous": the endpoint is always HTTP 500 (DB-side bug, identical before the migration).
        // If the SP is ever fixed, NULL StatusTransaksi would make the result empty.
        if (v.status === 500) expect(v.body.message).toMatch(/Column 'SimpananPokok' in field list is ambiguous/);
        else expect(v.body).toEqual([]);
        console.log('[info] resign view', Status, '->', v.status);
      }

      const g = await http().get(`/withdrawals/resignations/${rid}`);
      expect(g.status).toBe(500); // known: SP selects non-existent column Jumlah
      expect(g.body.message).toMatch(/Unknown column 'Jumlah'/);
      console.log('[info] resign-get: error field =', g.body.error, '(ORIGINAL TypeORM: "QueryFailedError")');

      const c = await http().post('/withdrawals/resignations/close').set(auth()).send({ IDPengambilan: rid, TanggalTransfer: '2026-11-03', NoRef: 'E2EC-R1' });
      expect(c.status).toBe(201);
      expect(c.text).toBe('');
      expect((await q('SELECT StatusTransaksi s FROM T_Simpanan_Penarikan_Resign WHERE IDPengambilan = ?', [rid]))[0].s).toBe('CLOSE');

      const u = await http().post('/withdrawals/resignations').set(auth()).send({ ...body, IDPengambilan: rid });
      expect(u.text).toBe('success');
      expect(await q('SELECT 1 FROM T_Simpanan_Penarikan_Resign WHERE NoAnggota = ?', [NO])).toHaveLength(0);
      expect((await q('SELECT StatusAnggota s FROM M_Anggota WHERE NoAnggota = ?', [NO]))[0].s).toBe('AKTIF');
    });

    it('validation: Bruno sample field NoAnggota on POST /withdrawals is rejected (forbidNonWhitelisted)', async () => {
      const res = await http().post('/withdrawals').set(auth()).send({ IDPengambilan: 1, IDTransaksiSimpanan: 1, Tanggal: '2026-10-11', NoAnggota: NO, JenisSimpanan: 'WAJIB', Jumlah: 1 });
      expect(res.status).toBe(400);
    });
  });

  // ------------------------------------------------------------------ pool hygiene
  describe('DatabaseService pool hygiene (SQL_POOL_LIMIT=3)', () => {
    const poolSize = () => ((db as any).pool.pool._allConnections as { length: number }).length;

    it('30 concurrent callWithMessage/HTTP requests: all succeed, own message each, <= 3 connections', async () => {
      const ids = new Set<number>();
      const echo = Array.from({ length: 20 }, (_, i) =>
        db.callWithMessage("SET @p_Message = CONCAT('echo:', ?, IF(SLEEP(0.03), '', ''))", [`n${i}`]),
      );
      const ident = Array.from({ length: 5 }, () => db.withConnection(async (c) => { ids.add(Number(((await c.query('SELECT CONNECTION_ID() id')) as any)[0][0].id)); await new Promise((r) => setTimeout(r, 30)); }));
      const httpErr = Array.from({ length: 5 }, () =>
        http().post('/withdrawals').set(auth()).send({ Tanggal: '2026-11-02', NoEmployee: 'E2EC_NONE', JenisSimpanan: SUKARELA, IDPengambilan: 0, IDTransaksiSimpanan: 0, Jumlah: 0 }),
      );
      const t0 = Date.now();
      const [echoRes, , errRes] = await Promise.all([Promise.all(echo), Promise.all(ident), Promise.all(httpErr)]);
      const ms = Date.now() - t0;
      echoRes.forEach((m, i) => expect(m).toBe(`echo:n${i}`));
      for (const r of errRes) {
        expect(r.status).toBe(201);
        expect(r.text).toBe("Error 1048 (23000): Column 'NoAnggota' cannot be null");
      }
      console.log(`[info] burst of 30 took ${ms}ms; pool size=${poolSize()}; distinct CONNECTION_IDs seen=${ids.size}`);
      expect(poolSize()).toBeLessThanOrEqual(POOL_LIMIT);
      expect(ids.size).toBeLessThanOrEqual(POOL_LIMIT);
    }, 60000);

    it('pool not exhausted afterwards: sequential requests are fast', async () => {
      for (let i = 0; i < 10; i++) {
        const t = Date.now();
        expect((await http().get('/savings-settings')).status).toBe(200);
        expect(Date.now() - t).toBeLessThan(1000);
      }
    });

    it('callWithMessage returns null when nothing sets @p_Message on a recycled connection', async () => {
      for (let i = 0; i < 6; i++) await db.callWithMessage("SET @p_Message = 'stale'", []);
      // CALL of a procedure with OUT param resets it to NULL; emulate with an explicit NULL assignment
      expect((await db.callWithMessage('SET @p_Message = NULL', [])) ?? null).toBeNull();
    });

    it('failing callbacks release the connection (withConnection / transaction / callWithMessage / failing SP via HTTP)', async () => {
      for (let i = 0; i < POOL_LIMIT * 4; i++) {
        await expect(db.withConnection(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
        await expect(db.transaction(async () => { throw new Error('boom-tx'); })).rejects.toThrow('boom-tx');
        await expect(db.callWithMessage('CALL sp_e2ec_does_not_exist(@p_Message)', [])).rejects.toThrow(/does not exist/);
      }
      for (let i = 0; i < POOL_LIMIT * 2; i++) expect((await http().get('/withdrawals/resignations/1')).status).toBe(500);
      const t = Date.now();
      const held = await Promise.all(
        Array.from({ length: POOL_LIMIT }, () => db.withConnection(async (c) => { await new Promise((r) => setTimeout(r, 100)); return ((await c.query('SELECT 1 x')) as any)[0][0].x; })),
      );
      expect(held.map(Number)).toEqual([1, 1, 1]);
      expect(Date.now() - t).toBeLessThan(1500);
      expect(poolSize()).toBeLessThanOrEqual(POOL_LIMIT);
    });

    it('transaction() rolls back on failure and commits on success (own anggota rows only)', async () => {
      const ins = "INSERT INTO T_Simpanan_Anggota (Tanggal, NoAnggota, JenisPosting, JenisTransaksi, JenisSimpanan, Jumlah, BulanAktif, CreatedUser, CreatedDate) VALUES ('2026-11-02', ?, 'MANUAL', 'SETORAN', 'E2EC_TX', ?, 0, ?, NOW())";
      await expect(
        db.transaction(async (c) => {
          await db.query(ins, [NO, 11, USER], c);
          throw new Error('fail after insert');
        }),
      ).rejects.toThrow('fail after insert');
      expect(await q("SELECT 1 FROM T_Simpanan_Anggota WHERE NoAnggota = ? AND JenisSimpanan = 'E2EC_TX'", [NO])).toHaveLength(0);
      await db.transaction(async (c) => { await db.query(ins, [NO, 22, USER], c); });
      expect(await q("SELECT 1 FROM T_Simpanan_Anggota WHERE NoAnggota = ? AND JenisSimpanan = 'E2EC_TX'", [NO])).toHaveLength(1);
    });

    it('INFO: SET time_zone leakage on recycled connections (read-only report)', async () => {
      const seen = await Promise.all(
        Array.from({ length: POOL_LIMIT }, () =>
          db.withConnection(async (c) => {
            await new Promise((r) => setTimeout(r, 100)); // force 3 distinct connections
            const [r] = (await c.query('SELECT @@session.time_zone tz, DATE_FORMAT(NOW(), \'%H:%i\') now_local, DATE_FORMAT(UTC_TIMESTAMP(), \'%H:%i\') now_utc')) as any;
            return r[0];
          }),
        ),
      );
      console.log('[info] session time_zone per pooled connection:', JSON.stringify(seen));
      const plain: string[] = [];
      for (let i = 0; i < 6; i++) plain.push((await q('SELECT @@session.time_zone tz'))[0].tz);
      console.log('[info] plain db.query() sequential time_zone values:', plain.join(','));

      // visible effect: Tunai_Submit CreatedDate (NOW() in session zone) vs UTC clock, own rows only
      const offs: number[] = [];
      for (let i = 0; i < 4; i++) {
        const r = await http().post('/cash-transactions').set(auth()).send({ IDTransaksi: '0', Tanggal: '2026-11-02', NoAnggota: NO, JenisSimpanan: 'E2EC_TZ', Jumlah: 1, JumlahBulan: 1 });
        expect(r.status).toBe(201);
        const row = (await q("SELECT TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), CreatedDate) d FROM T_Simpanan_Anggota WHERE NoAnggota = ? AND JenisSimpanan = 'E2EC_TZ' ORDER BY IDTransaksi DESC LIMIT 1", [NO]))[0];
        offs.push(Math.round(Number(row.d) / 60));
      }
      console.log('[info] Tunai_Submit CreatedDate offset vs UTC (hours), 4 sequential posts:', offs.join(','));
    });
  });
});
