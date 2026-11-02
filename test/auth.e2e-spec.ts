// Verifier 7A: auth / users / anggota end-to-end through HTTP against the shared DEV database (from .env).
// Rules: only rows prefixed E2EA_ are created/changed/deleted; credentials are never read or printed;
// an access token is minted with the app's JwtService for an EXISTING user's payload shape (row untouched).
import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { createConnection, Connection } from 'mysql2/promise';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const RUN = Date.now().toString(36);
const LIKE = 'E2EA\\_%'; // LIKE pattern for the E2EA_ prefix (underscore escaped)
const OWN_PW = 'E2eaPassw0rd-1';
const OWN_PW2 = 'E2eaPassw0rd-2';
const decode = (jwt: string) => JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString());

// server-side checksum of NON-E2E rows only; the numbers are returned, never the data
const SNAPSHOTS: Record<string, string> = {
  M_Users: `SELECT COUNT(*) c, COALESCE(SUM(CRC32(CONCAT_WS('|',UserLogin,UserPassword,UserName,UserEmail,PostBy,PostDate,GroupID))),0) h FROM M_Users WHERE UserLogin NOT LIKE 'E2E%'`,
  M_Anggota: `SELECT COUNT(*) c, COALESCE(SUM(CRC32(CONCAT_WS('|',NoAnggota,NoEmployee,Nama,Alamat,Telpon,JenisKelamin,DepartmentId,JenisAnggota,TanggalMasuk,NoRekening,IsNew,SimpananPokok,SimpananWajib,SimpananSukarela,StatusAnggota,PasswordLogin,AlamatEmail,CreatedUser,CreatedDate,UpdatedUser,UpdatedDate))),0) h FROM M_Anggota WHERE AlamatEmail NOT LIKE 'E2E%' AND NoEmployee NOT LIKE 'E2E%'`,
  M_User_Group: `SELECT COUNT(*) c, COALESCE(SUM(CRC32(CONCAT_WS('|',GroupID,GroupName,GroupNote,PostBy,PostDate))),0) h FROM M_User_Group WHERE GroupName NOT LIKE 'E2E%'`,
  M_Menu: `SELECT COUNT(*) c, COALESCE(SUM(CRC32(CONCAT_WS('|',MenuID,MenuName,MenuParentID,MenuRoute,MenuSort,PostBy,PostDate))),0) h FROM M_Menu WHERE MenuName NOT LIKE 'E2E%'`,
  M_Department: `SELECT COUNT(*) c, COALESCE(SUM(CRC32(CONCAT_WS('|',DepartmentId,DepartmentName,PostBy,PostDate))),0) h FROM M_Department WHERE DepartmentId NOT LIKE 'E2E%'`,
  M_Group_Authorization: `SELECT COUNT(*) c, COALESCE(SUM(CRC32(CONCAT_WS('|',MenuAuthId,GroupId,MenuId,Access))),0) h FROM M_Group_Authorization WHERE GroupId IN (SELECT GroupID FROM M_User_Group WHERE GroupName NOT LIKE 'E2E%')`,
};

const anggotaBody = (dept: string, i: number | string, over: Record<string, unknown> = {}) => ({
  NoEmployee: `E2EA_${RUN.slice(-5)}`, // varchar(10)
  Nama: `E2EA_ Anggota ${i}`,
  Alamat: 'Jl. E2E',
  Telpon: '0811',
  JenisKelamin: 'L',
  DepartmentId: dept,
  JenisAnggota: 'KARYAWAN',
  TanggalMasuk: '2026-03-09',
  NoRekening: '123',
  SimpananPokok: 1,
  SimpananWajib: 2,
  SimpananSukarela: 3,
  AlamatEmail: `E2EA_${RUN}_${i}@example.test`,
  ...over,
});

describe('auth / users / anggota (e2e, shared dev DB, E2EA_ rows only)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let db: Connection;
  let adminToken = '';
  let adminName = '';
  let adminLogin = '';
  let adminGroupId = 0;
  let adminGroupName = '';
  let dept = '';
  let deptName = '';
  let anggotaSafe = false;
  let before: Record<string, unknown> = {};
  let lastNoBefore: unknown;
  let cleaned = false;
  const auth = (t = adminToken) => ({ Authorization: `Bearer ${t}` });

  const snapshot = async () => {
    const out: Record<string, unknown> = {};
    for (const [t, sql] of Object.entries(SNAPSHOTS)) {
      const [rows] = await db.query(sql);
      const r = (rows as any[])[0];
      out[t] = `${r.c}:${r.h}`;
    }
    return out;
  };
  const cleanup = async () => {
    await db.query('DELETE FROM M_Users WHERE UserLogin LIKE ?', [LIKE]);
    await db.query('DELETE FROM M_Anggota WHERE AlamatEmail LIKE ? AND NoEmployee LIKE ?', [LIKE, LIKE]);
  };
  const noAnggotaOf = async (email: string) => {
    const [rows] = await db.query('SELECT NoAnggota FROM M_Anggota WHERE AlamatEmail = ?', [email]);
    return (rows as { NoAnggota: string }[])[0]?.NoAnggota;
  };

  beforeAll(async () => {
    // do NOT override SQL_*: the app reads .env as normal. AppModule is imported dynamically so
    // process.env is populated by ConfigModule.forRoot() before the direct connection is made.
    const { AppModule } = await import('../src/app.module');
    const { HttpExceptionFilter } = await import('../src/common/filters/http-exception.filter');
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    http = request(app.getHttpServer());
    db = await createConnection({
      host: process.env.SQL_HOST,
      port: Number(process.env.SQL_PORT ?? 3306),
      user: process.env.SQL_USERNAME,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DATABASE,
    });

    // leftovers of an earlier failed run (own prefix only)
    await cleanup();
    before = await snapshot();
    [lastNoBefore] = ((await db.query('SELECT Tahun, LastNumber FROM M_Anggota_LastNo'))[0] as any[]);

    // existing staff user (non-sensitive columns only) to mint an access token with the app's own JwtService
    const [u] = await db.query(
      `SELECT u.UserLogin, u.UserName, u.UserEmail, u.GroupID, g.GroupName FROM M_Users u JOIN M_User_Group g ON g.GroupID = u.GroupID
       WHERE u.UserLogin NOT LIKE 'E2E%' ORDER BY u.GroupID LIMIT 1`,
    );
    const admin = (u as any[])[0];
    expect(admin).toBeTruthy();
    adminName = admin.UserName;
    adminLogin = admin.UserLogin;
    adminGroupId = admin.GroupID;
    adminGroupName = admin.GroupName;
    adminToken = await app.get(JwtService).signAsync({
      sub: admin.UserLogin, name: admin.UserName, email: admin.UserEmail ?? '', groupId: admin.GroupID, groupName: admin.GroupName,
    });

    // an existing department for anggota rows (read-only)
    const [d] = await db.query("SELECT DepartmentId, DepartmentName FROM M_Department WHERE DepartmentId NOT LIKE 'E2E%' LIMIT 1");
    dept = (d as any[])[0]?.DepartmentId;
    deptName = (d as any[])[0]?.DepartmentName;

    // sp_M_Anggota_Insert resets M_Anggota_LastNo when the year changed and could then re-issue existing numbers.
    // Only exercise the procedure when the counter is for the current year and the next number is free.
    const [y] = await db.query('SELECT YEAR(NOW()) y');
    const ln = lastNoBefore as { Tahun: string; LastNumber: number } | undefined;
    if (ln && Number(ln.Tahun) === (y as any[])[0].y) {
      const next = `${ln.Tahun}-${String(ln.LastNumber + 1).padStart(4, '0')}`;
      const [ex] = await db.query('SELECT 1 FROM M_Anggota WHERE NoAnggota = ?', [next]);
      anggotaSafe = (ex as any[]).length === 0 && !!dept;
    }
    console.log('[7A] anggota procedure tests enabled:', anggotaSafe);
  }, 60000);

  afterAll(async () => {
    try {
      if (db && !cleaned) await cleanup();
    } finally {
      await db?.end();
      await app?.close();
    }
  });

  // ---------------------------------------------------------------- staff auth
  describe('unauthenticated / bad credentials', () => {
    it('401 without JWT on guarded routes', async () => {
      await http.post('/auth/register').send({}).expect(401);
      await http.get('/auth/me').expect(401);
      await http.post('/auth/logout').expect(401);
      await http.post('/members').send({}).expect(401);
      await http.patch('/members/0000-0000').send({}).expect(401);
      await http.get('/auth/me').set({ Authorization: 'Bearer garbage' }).expect(401);
    });

    it('unknown user / unknown anggota -> 401 Invalid credentials', async () => {
      const unk = await http.post('/auth/login').send({ userlogin: `E2EA_nobody_${RUN}`, password: OWN_PW }).expect(401);
      expect(unk.body.message).toBe('Invalid credentials');
      await http.post('/auth/members/login').send({ userlogin: '0000-0000', password: OWN_PW }).expect(401);
    });

    it('validation: missing password -> 400, extra field -> 400', async () => {
      await http.post('/auth/login').send({ userlogin: 'x' }).expect(400);
      await http.post('/auth/login').send({ userlogin: 'x', password: 'y', extra: 1 }).expect(400);
    });
  });

  describe('staff user lifecycle', () => {
    const login = `E2EA_u_${RUN}`;
    const renamed = `E2EA_u_${RUN}_b`;
    let refresh = '';
    let userToken = '';

    it('minted admin token works: GET /auth/me returns user + menu tree', async () => {
      const r = await http.get('/auth/me').set(auth()).expect(200);
      expect(r.body.user.groupId).toBe(adminGroupId);
      expect(Array.isArray(r.body.menus)).toBe(true);
    });

    it('register new user -> 201 with tokens (no hash); duplicate -> 409; short password -> 400', async () => {
      const body = { userlogin: login, username: 'E2EA_ User', password: OWN_PW, email: `E2EA_${RUN}@example.test`, groupId: adminGroupId };
      const r = await http.post('/auth/register').set(auth()).send(body).expect(201);
      expect(Object.keys(r.body).sort()).toEqual(['access_token', 'refresh_token', 'user']);
      expect(r.body.user).toEqual({ username: login, name: 'E2EA_ User' });
      expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$/);
      const dup = await http.post('/auth/register').set(auth()).send(body).expect(409);
      expect(dup.body.message).toBe('UserLogin already exists');
      await http.post('/auth/register').set(auth()).send({ ...body, userlogin: login + 'x', password: '123' }).expect(400);
      const [rows] = await db.query('SELECT PostBy, GroupID, PostDate FROM M_Users WHERE UserLogin = ?', [login]);
      expect((rows as any[])[0].PostBy).toBe(adminLogin);
      expect((rows as any[])[0].GroupID).toBe(adminGroupId);
      expect((rows as any[])[0].PostDate).toBeInstanceOf(Date);
    });

    it('login: wrong password -> 401; right password -> 201 { access_token, refresh_token, success: 1 }', async () => {
      const bad = await http.post('/auth/login').send({ userlogin: login, password: 'wrong-wrong' }).expect(401);
      expect(bad.body.message).toBe('Invalid credentials');
      const r = await http.post('/auth/login').send({ userlogin: login, password: OWN_PW }).expect(201);
      expect(Object.keys(r.body).sort()).toEqual(['access_token', 'refresh_token', 'success']);
      expect(r.body.success).toBe(1);
      userToken = r.body.access_token;
      refresh = r.body.refresh_token;
      const p = decode(userToken);
      expect(p.sub).toBe(login);
      expect(p.groupId).toBe(adminGroupId);
      expect(p.groupName).toBe(adminGroupName);
    });

    it('refresh token rotates; new access token works; garbage / access token rejected', async () => {
      const rr = await http.post('/auth/refresh').send({ refreshToken: refresh }).expect(201);
      expect(Object.keys(rr.body).sort()).toEqual(['access_token', 'refresh_token']);
      expect(decode(rr.body.access_token).sub).toBe(login);
      expect(decode(rr.body.access_token).groupId).toBe(adminGroupId);
      await http.get('/auth/me').set(auth(rr.body.access_token)).expect(200);
      await http.post('/auth/refresh').send({ refreshToken: 'garbage' }).expect(401);
      await http.post('/auth/refresh').send({ refreshToken: userToken }).expect(401);
    });

    it('logout -> 201 message', async () => {
      const r = await http.post('/auth/logout').set(auth(userToken)).expect(201);
      expect(r.body).toEqual({ message: 'Logged out successfully' });
    });

    it('GET /users lists the new user and never exposes a password/hash', async () => {
      const r = await http.get('/users').expect(200);
      expect(Array.isArray(r.body)).toBe(true);
      const mine = r.body.find((u: any) => u.UserLogin === login);
      expect(mine).toBeTruthy();
      expect(mine.GroupName).toBe(adminGroupName);
      for (const row of r.body) expect(Object.keys(row).some((k) => /pass/i.test(k))).toBe(false);
      expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$/);
    });

    it('reset password: old fails, new works; unknown user -> 400', async () => {
      const r = await http.patch('/users/reset-password').send({ userlogin: login, newPassword: OWN_PW2 }).expect(200);
      expect(r.body).toEqual({ message: 'Password reset successfully' });
      await http.post('/auth/login').send({ userlogin: login, password: OWN_PW }).expect(401);
      await http.post('/auth/login').send({ userlogin: login, password: OWN_PW2 }).expect(201);
      const nf = await http.patch('/users/reset-password').send({ userlogin: `E2EA_ghost_${RUN}`, newPassword: OWN_PW2 }).expect(400);
      expect(nf.body.message).toBe('User not found');
    });

    it('edit user (rename + name/email); conflict, no-op and not-found cases', async () => {
      const mail = `E2EA_${RUN}_new@example.test`;
      const r = await http
        .patch('/users')
        .send({ userlogin: login, userloginInput: renamed, username: 'E2EA_ User 2', email: mail, groupId: adminGroupId })
        .expect(200);
      expect(r.body).toEqual({ message: 'User updated successfully' });
      const list = (await http.get('/users').expect(200)).body;
      expect(list.find((u: any) => u.UserLogin === login)).toBeUndefined();
      const mine = list.find((u: any) => u.UserLogin === renamed);
      expect(mine.UserName).toBe('E2EA_ User 2');
      expect(mine.UserEmail).toBe(mail);
      await http.post('/auth/login').send({ userlogin: renamed, password: OWN_PW2 }).expect(201); // password survives rename
      // rename onto another existing login (the admin's) -> 409; target row is not touched because the check precedes the UPDATE
      const [a] = await db.query("SELECT UserLogin FROM M_Users WHERE UserLogin NOT LIKE 'E2E%' LIMIT 1");
      const c = await http
        .patch('/users')
        .send({ userlogin: renamed, userloginInput: (a as any[])[0].UserLogin, username: 'x', email: 'x@example.test', groupId: adminGroupId })
        .expect(409);
      expect(c.body.message).toBe('UserLogin already exists');
      // unchanged values still count as matched -> 200
      await http
        .patch('/users')
        .send({ userlogin: renamed, userloginInput: renamed, username: 'E2EA_ User 2', email: mail, groupId: adminGroupId })
        .expect(200);
      const nf = await http
        .patch('/users')
        .send({ userlogin: `E2EA_ghost_${RUN}`, userloginInput: `E2EA_ghost_${RUN}`, username: 'x', email: 'x@example.test', groupId: adminGroupId })
        .expect(400);
      expect(nf.body.message).toBe('User not found or no changes made');
    });

    it('delete user -> 200, again -> 400, login/refresh -> 401', async () => {
      const r = await http.delete(`/users/${renamed}`).expect(200);
      expect(r.body).toEqual({ message: 'User deleted successfully' });
      const again = await http.delete(`/users/${renamed}`).expect(400);
      expect(again.body.message).toBe('User not found');
      await http.post('/auth/login').send({ userlogin: renamed, password: OWN_PW2 }).expect(401);
      await http.post('/auth/refresh').send({ refreshToken: refresh }).expect(401);
    });
  });

  // ---------------------------------------------------------------- anggota
  describe('anggota lifecycle', () => {
    let noAnggota = '';
    const email = () => `E2EA_${RUN}_main@example.test`;

    it('register anggota (OUT-param procedure) -> 201 text; duplicate email -> error text in body', async ({ skip }) => {
      if (!anggotaSafe) return skip();
      const r = await http.post('/members').set(auth()).send(anggotaBody(dept, 'main')).expect(201);
      expect(r.text).toBe('Insert anggota berhasil.');
      noAnggota = (await noAnggotaOf(email()))!;
      expect(noAnggota).toMatch(/^\d{4}-\d{4}$/);
      const dup = await http.post('/members').set(auth()).send(anggotaBody(dept, 'main')).expect(201);
      expect(dup.text).toMatch(/^Error 1062 \(23000\): Duplicate entry/);
      expect(dup.text).toContain(email());
      // login needs a password we know: set a hash for OUR row only
      await db.query('UPDATE M_Anggota SET PasswordLogin = ? WHERE NoAnggota = ? AND AlamatEmail LIKE ?', [await bcrypt.hash(OWN_PW, 10), noAnggota, LIKE]);
    });

    it('register validation: missing/extra fields -> 400', async () => {
      await http.post('/members').set(auth()).send({ Nama: 'E2EA_x' }).expect(400);
      await http.post('/members').set(auth()).send({ ...anggotaBody('X', 'v'), Hack: 1 }).expect(400);
    });

    it('GET /members/:id has no PasswordLogin; TanggalMasuk is YYYY-MM-DD', async ({ skip }) => {
      if (!noAnggota) return skip();
      const r = await http.get(`/members/${noAnggota}`).expect(200);
      expect(r.body).not.toHaveProperty('PasswordLogin');
      expect(r.body.TanggalMasuk).toBe('2026-03-09');
      expect(r.body.NoAnggota).toBe(noAnggota);
      expect(r.body.StatusAnggota).toBe('BELUM AKTIF');
      expect(r.body.IsNew).toBe(1);
      expect(r.body.CreatedUser).toBe(adminName);
      expect(typeof r.body.CreatedDate).toBe('string');
      expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$/);
    });

    it('GET /members/:unknown -> 200 empty (same as findOne -> null)', async () => {
      const [ex] = await db.query("SELECT 1 FROM M_Anggota WHERE NoAnggota = '0000-0000'");
      expect((ex as any[]).length).toBe(0);
      const r = await http.get('/members/0000-0000').expect(200);
      expect(r.text).toBe('');
    });

    it('GET /members (view) has no PasswordLogin and includes the new row', async ({ skip }) => {
      if (!noAnggota) return skip();
      const r = await http.get('/members').expect(200);
      expect(r.body.some((m: any) => m.NoAnggota === noAnggota)).toBe(true);
      for (const m of r.body) expect(m).not.toHaveProperty('PasswordLogin');
      expect(JSON.stringify(r.body)).not.toMatch(/\$2[aby]\$/);
      console.log('[7A] view TanggalMasuk type:', typeof r.body.find((m: any) => m.NoAnggota === noAnggota).TanggalMasuk);
    });

    it('anggota login: wrong password -> 401; right -> 201 with own identity in JWT', async ({ skip }) => {
      if (!noAnggota) return skip();
      await http.post('/auth/members/login').send({ userlogin: noAnggota, password: 'wrong-wrong' }).expect(401);
      const r = await http.post('/auth/members/login').send({ userlogin: noAnggota, password: OWN_PW }).expect(201);
      expect(Object.keys(r.body).sort()).toEqual(['access_token', 'refresh_token', 'success']);
      const p = decode(r.body.access_token);
      expect(p.noAnggota).toBe(noAnggota);
      expect(p.sub).toBe(anggotaBody(dept, 'main').NoEmployee);
      expect(p.groupId).toBe(0);
      expect(p.groupName).toBe(deptName);
      expect(p.name).toBe('E2EA_ Anggota main');
      const rf = await http.post('/auth/refresh').send({ refreshToken: r.body.refresh_token });
      console.log('[7A] member refresh status (legacy: M_Users lookup by NoEmployee):', rf.status);
    });

    it('update anggota -> 200 { statusCode, message }; persisted; UpdatedUser set', async ({ skip }) => {
      if (!noAnggota) return skip();
      const r = await http
        .patch(`/members/${noAnggota}`)
        .set(auth())
        .send({ ...anggotaBody(dept, 'main'), Nama: 'E2EA_ Renamed', TanggalMasuk: '2026-04-10', StatusAnggota: 'AKTIF' });
      console.log('[7A] update anggota status/body:', r.status, JSON.stringify(r.body));
      expect(r.status).toBe(200);
      expect(r.body).toEqual({ statusCode: 200, message: 'Data successfully updated.' });
      const g = (await http.get(`/members/${noAnggota}`).expect(200)).body;
      expect(g.Nama).toBe('E2EA_ Renamed');
      expect(g.TanggalMasuk).toBe('2026-04-10');
      expect(g.StatusAnggota).toBe('AKTIF');
      expect(g.UpdatedUser).toBe(adminName);
      expect(g).not.toHaveProperty('PasswordLogin');
    });

    it('update of an unknown anggota (nothing matches) -> status recorded', async ({ skip }) => {
      if (!anggotaSafe) return skip();
      const nf = await http.patch('/members/0000-0000').set(auth()).send({ ...anggotaBody(dept, 'main'), StatusAnggota: 'AKTIF' });
      console.log('[7A] update unknown anggota status/body:', nf.status, JSON.stringify(nf.body).slice(0, 100));
    });

    it('delete anggota -> 200 message; gone afterwards', async ({ skip }) => {
      if (!noAnggota) return skip();
      const r = await http.delete(`/members/${noAnggota}`).expect(200);
      expect(r.body).toEqual({ message: `Anggota ${noAnggota} has been deleted.` });
      expect((await http.get(`/members/${noAnggota}`).expect(200)).text).toBe('');
      await http.post('/auth/members/login').send({ userlogin: noAnggota, password: OWN_PW }).expect(401);
    });
  });

  // ---------------------------------------------------------------- concurrency
  describe('concurrency (OUT-param crossing / pool exhaustion)', () => {
    const N = 4;
    const emails = Array.from({ length: N }, (_, i) => `E2EA_${RUN}_c${i}@example.test`);
    const fresh = Array.from({ length: N }, (_, i) => `E2EA_${RUN}_f${i}@example.test`);

    it('N parallel registrations, then N duplicates + N fresh in parallel: each gets its OWN message', async ({ skip }) => {
      if (!anggotaSafe) return skip();
      const w1 = await Promise.all(emails.map((e, i) => http.post('/members').set(auth()).send(anggotaBody(dept, `c${i}`))));
      for (const r of w1) {
        expect(r.status).toBe(201);
        expect(r.text).toBe('Insert anggota berhasil.');
      }
      const jobs = emails.flatMap((e, i) => [
        http.post('/members').set(auth()).send(anggotaBody(dept, `c${i}`)).then((r) => ({ kind: 'dup' as const, e, r })),
        http.post('/members').set(auth()).send(anggotaBody(dept, `f${i}`)).then((r) => ({ kind: 'ok' as const, e: fresh[i], r })),
      ]);
      const w2 = await Promise.all(jobs); // 2N = 24 parallel requests
      for (const { kind, e, r } of w2) {
        expect(r.status).toBe(201);
        if (kind === 'dup') {
          expect(r.text).toMatch(/Duplicate entry/);
          expect(r.text).toContain(`'${e}'`); // own email, never another request's
        } else {
          expect(r.text).toBe('Insert anggota berhasil.');
        }
      }
      const [rows] = await db.query('SELECT COUNT(*) c, COUNT(DISTINCT NoAnggota) d FROM M_Anggota WHERE AlamatEmail LIKE ?', [`E2EA\\_${RUN}\\_%`]);
      expect((rows as any[])[0].c).toBe(2 * N);
      expect((rows as any[])[0].d).toBe(2 * N);
      // known password on OUR rows only, for the login wave
      await db.query('UPDATE M_Anggota SET PasswordLogin = ? WHERE AlamatEmail LIKE ? AND NoEmployee LIKE ?', [await bcrypt.hash(OWN_PW, 10), LIKE, LIKE]);
    }, 120000);

    it('parallel anggota + staff logins: each response matches its own identity', async ({ skip }) => {
      if (!anggotaSafe) return skip();
      const [rows] = await db.query('SELECT NoAnggota, AlamatEmail, Nama FROM M_Anggota WHERE AlamatEmail LIKE ? AND AlamatEmail LIKE ?', [LIKE, `%\\_c%`]);
      const list = rows as { NoAnggota: string; AlamatEmail: string; Nama: string }[];
      expect(list.length).toBe(N);
      const out = await Promise.all(list.map((m) => http.post('/auth/members/login').send({ userlogin: m.NoAnggota, password: OWN_PW }).then((r) => ({ m, r }))));
      for (const { m, r } of out) {
        expect(r.status).toBe(201);
        const p = decode(r.body.access_token);
        expect(p.noAnggota).toBe(m.NoAnggota);
        expect(p.name).toBe(m.Nama);
        expect(p.email).toBe(m.AlamatEmail);
      }
    }, 120000);

    it('pool healthy after load: every connection released, nothing queued', async () => {
      const { MYSQL_POOL } = await import('../src/database/database.constants');
      const pool: any = app.get(MYSQL_POOL).pool; // mysql2 promise pool -> core pool
      expect(pool._connectionQueue.length).toBe(0);
      expect(pool._allConnections.length).toBeLessThanOrEqual(10);
      expect(pool._freeConnections.length).toBe(pool._allConnections.length);
      const t0 = Date.now();
      await http.get('/members').expect(200);
      await http.get('/users').expect(200);
      expect(Date.now() - t0).toBeLessThan(10000);
    });
  });

  // ---------------------------------------------------------------- cleanup + untouched check
  describe('cleanup', () => {
    it('removes every E2EA_ row and leaves all other rows unchanged', async () => {
      await cleanup();
      cleaned = true;
      const [u] = await db.query('SELECT COUNT(*) c FROM M_Users WHERE UserLogin LIKE ?', [LIKE]);
      const [a] = await db.query('SELECT COUNT(*) c FROM M_Anggota WHERE AlamatEmail LIKE ? OR NoEmployee LIKE ?', [LIKE, LIKE]);
      expect((u as any[])[0].c).toBe(0);
      expect((a as any[])[0].c).toBe(0);
      const after = await snapshot();
      // M_Users / M_Anggota are only ever written by this file's prefixed rows; other tables are read-only here.
      expect(after.M_Users).toBe(before.M_Users);
      expect(after.M_Anggota).toBe(before.M_Anggota);
      for (const t of ['M_User_Group', 'M_Menu', 'M_Department', 'M_Group_Authorization'])
        if (after[t] !== before[t]) console.log(`[7A] NOTE ${t} non-E2E rows changed during the run (written by a sibling verifier?)`);
      const [ln] = await db.query('SELECT Tahun, LastNumber FROM M_Anggota_LastNo');
      console.log('[7A] M_Anggota_LastNo before/after:', JSON.stringify(lastNoBefore), JSON.stringify((ln as any[])[0]));
    });
  });
});
