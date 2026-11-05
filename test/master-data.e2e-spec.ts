/**
 * Verifier 7B: menu + department + group over HTTP against the dev database configured in .env.
 * Everything this file creates carries the prefix E2EB_ and is removed in afterAll.
 * Pre-existing rows are never modified; a checksum of them is compared before/after.
 * Auth: a JWT is minted with the app's JwtService for a synthetic user (JwtStrategy does no DB lookup).
 */
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { DatabaseService } from '../src/database/database.service';

const TAG = 'E2EB_';
const LIKE = 'E2EB\\_%'; // escaped underscore
const USER = 'E2EB_tester';
const run = Math.random().toString(36).slice(2, 8);
const name = (s: string) => `${TAG}${run}_${s}`;
const DEPT = `${TAG}${run}`; // varchar(20)
const DEPT2 = `${TAG}${run}2`;

let GID = 0; // chosen in beforeAll: a group id that does not exist yet
let app: INestApplication;
let db: DatabaseService;
let token = '';
const http = () => request(app.getHttpServer());
const auth = () => ({ Authorization: `Bearer ${token}` });
const sum = (v: unknown) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

async function checksumExisting() {
  const q = (sql: string, p: unknown[] = []) => db.query<any[]>(sql, p);
  return sum({
    menus: await q('SELECT * FROM M_Menu WHERE MenuName IS NULL OR MenuName NOT LIKE ? ORDER BY MenuID', [LIKE]),
    groups: await q('SELECT * FROM M_User_Group WHERE GroupID <> ? ORDER BY GroupID', [GID]),
    auths: await q('SELECT * FROM M_Group_Authorization WHERE GroupId <> ? ORDER BY MenuAuthId', [GID]),
    depts: await q('SELECT * FROM M_Department WHERE DepartmentId NOT LIKE ? ORDER BY DepartmentId', [LIKE]),
  });
}
let checksumBefore = '';
let existingParent: any;
let existingGroup: any;
let existingDeptId: string;
let existMenuA = 0;
let existMenuB = 0;

const authRows = () =>
  db.query<any[]>('SELECT MenuId AS menuId, Access AS access FROM M_Group_Authorization WHERE GroupId = ? ORDER BY MenuId', [GID]);

async function cleanup() {
  await db.query('DELETE FROM M_Group_Authorization WHERE GroupId = ?', [GID]);
  await db.query('DELETE FROM M_User_Group WHERE GroupID = ?', [GID]);
  await db.query('DELETE FROM M_Department WHERE DepartmentId LIKE ?', [LIKE]);
  await db.query('DELETE FROM M_Menu WHERE MenuName LIKE ?', [LIKE]);
}

beforeAll(async () => {
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
  db = app.get(DatabaseService);
  token = await app
    .get(JwtService)
    .signAsync({ sub: USER, name: 'E2EB tester', email: 'e2eb@example.test', groupId: 0 });

  // pick a free group id, and some existing rows to compare against (read-only)
  const [{ m }] = await db.query<any[]>('SELECT COALESCE(MAX(GroupID), 0) AS m FROM M_User_Group');
  GID = Number(m) + 1000 + Math.floor(Math.random() * 1000);
  expect(await db.query('SELECT 1 FROM M_User_Group WHERE GroupID = ?', [GID])).toEqual([]);
  [existingParent] = await db.query<any[]>(
    'SELECT MenuID AS menuID, MenuName AS menuName FROM M_Menu WHERE MenuParentID = 0 AND MenuName NOT LIKE ? LIMIT 1',
    [LIKE],
  );
  [existingGroup] = await db.query<any[]>('SELECT GroupID AS groupId, GroupName AS groupName FROM M_User_Group LIMIT 1');
  existingDeptId = (await db.query<any[]>('SELECT DepartmentId AS id FROM M_Department LIMIT 1'))[0]?.id;
  const two = await db.query<any[]>('SELECT MenuID FROM M_Menu WHERE MenuName NOT LIKE ? ORDER BY MenuID LIMIT 2', [LIKE]);
  existMenuA = two[0].MenuID;
  existMenuB = two[1].MenuID;
  checksumBefore = await checksumExisting();
});

afterAll(async () => {
  if (!db) return;
  try {
    await cleanup();
    const left = {
      menus: (await db.query<any[]>('SELECT 1 FROM M_Menu WHERE MenuName LIKE ?', [LIKE])).length,
      groups: (await db.query<any[]>('SELECT 1 FROM M_User_Group WHERE GroupID = ?', [GID])).length,
      auths: (await db.query<any[]>('SELECT 1 FROM M_Group_Authorization WHERE GroupId = ?', [GID])).length,
      depts: (await db.query<any[]>('SELECT 1 FROM M_Department WHERE DepartmentId LIKE ?', [LIKE])).length,
    };
    // eslint-disable-next-line no-console
    console.log('CLEANUP RESIDUE (E2EB_ rows left):', JSON.stringify(left));
  } finally {
    await app?.close();
  }
});

describe('Menu', () => {
  const m: Record<string, any> = {};
  const MENU_KEYS = ['menuID', 'menuName', 'menuParentID', 'menuRoute', 'menuSort', 'postBy', 'postDate'];

  it('create requires JWT', async () => {
    await http().post('/menus').send({ menuName: name('x'), menuRoute: '/x', menuSort: 1, postBy: 'a' }).expect(401);
  });

  it('create parent: old Menu.toJSON shape, parentID "0" string, postBy from token', async () => {
    const res = await http()
      .post('/menus')
      .set(auth())
      .send({ menuName: name('parent'), menuRoute: '/e2eb', menuSort: 90, postBy: 'ignored-body-value' });
    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual([...MENU_KEYS].sort());
    expect(res.body.menuParentID).toBe('0');
    expect(typeof res.body.menuID).toBe('number');
    expect(res.body.postBy).toBe(USER);
    expect(res.body.menuSort).toBe(90);
    expect(new Date(res.body.postDate).getTime()).not.toBeNaN();
    m.parent = res.body;
  });

  it('create two children and a grandchild; parentID is a string', async () => {
    for (const k of ['c1', 'c2']) {
      const res = await http()
        .post('/menus')
        .set(auth())
        .send({ menuName: name(k), menuRoute: `/e2eb/${k}`, menuSort: 1, menuParentId: m.parent.menuID, postBy: 'x' });
      expect(res.status).toBe(201);
      expect(res.body.menuParentID).toBe(String(m.parent.menuID));
      m[k] = res.body;
    }
    const gc = await http()
      .post('/menus')
      .set(auth())
      .send({ menuName: name('gc'), menuRoute: '/e2eb/gc', menuSort: 1, menuParentId: m.c1.menuID, postBy: 'x' });
    expect(gc.status).toBe(201);
    m.gc = gc.body;
  });

  it('create validation: missing field and unknown field are 400', async () => {
    await http().post('/menus').set(auth()).send({ menuName: name('v'), menuSort: 1, postBy: 'x' }).expect(400);
    await http()
      .post('/menus')
      .set(auth())
      .send({ menuName: name('v'), menuRoute: '/v', menuSort: 1, postBy: 'x', bogus: 1 })
      .expect(400);
  });

  it('duplicate name -> 409 (own menu and a pre-existing menu)', async () => {
    for (const dup of [m.parent.menuName, existingParent.menuName]) {
      const res = await http().post('/menus').set(auth()).send({ menuName: dup, menuRoute: '/d', menuSort: 1, postBy: 'x' });
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Menu already exists');
      expect(res.body.success).toBe(false);
    }
  });

  it('list parents: every row string parentID "0", full key set, includes new + a pre-existing parent', async () => {
    const res = await http().get('/menus/parents').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const row of res.body) {
      expect(Object.keys(row).sort()).toEqual([...MENU_KEYS].sort());
      expect(row.menuParentID).toBe('0');
    }
    const ids = res.body.map((r: any) => r.menuID);
    expect(ids).toContain(m.parent.menuID);
    expect(ids).toContain(existingParent.menuID);
    expect(ids).not.toContain(m.c1.menuID);
    const found = res.body.find((r: any) => r.menuID === m.parent.menuID);
    expect(found.menuName).toBe(m.parent.menuName);
    expect(typeof found.postDate).toBe('string');
  });

  it('children endpoint: direct children only, [] for unknown, 500 for non-numeric id', async () => {
    const res = await http().get(`/menus/${m.parent.menuID}/children`).expect(200);
    expect(res.body.map((r: any) => r.menuID).sort()).toEqual([m.c1.menuID, m.c2.menuID].sort());
    for (const row of res.body) {
      expect(row.menuParentID).toBe(String(m.parent.menuID));
      expect(Object.keys(row).sort()).toEqual([...MENU_KEYS].sort());
    }
    const none = await http().get('/menus/987654321/children').expect(200);
    expect(none.body).toEqual([]);
    const bad = await http().get('/menus/abc/children');
    expect(bad.status).toBe(500); // BigInt('abc') SyntaxError, same as before the migration
  });

  it('update partial -> {affected}; stored value changed, others untouched', async () => {
    const res = await http().patch(`/menus/${m.c2.menuID}`).set(auth()).send({ menuSort: 77 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ affected: 1 });
    const [row] = await db.query<any[]>('SELECT MenuName, MenuRoute, MenuSort, PostBy FROM M_Menu WHERE MenuID = ?', [m.c2.menuID]);
    expect(row).toMatchObject({ MenuName: m.c2.menuName, MenuRoute: m.c2.menuRoute, MenuSort: 77, PostBy: USER });
  });

  it('update with its own name is allowed (exclude self); matched-rows semantics when value unchanged', async () => {
    const res = await http().patch(`/menus/${m.c2.menuID}`).set(auth()).send({ menuName: m.c2.menuName, menuSort: 77 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ affected: 1 });
  });

  it('update to a duplicate name (own other menu / pre-existing menu) -> 409', async () => {
    for (const dup of [m.c1.menuName, existingParent.menuName]) {
      const res = await http().patch(`/menus/${m.c2.menuID}`).set(auth()).send({ menuName: dup });
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Cannot change menu name to one that already exists');
    }
  });

  it('update unknown id -> 200 {affected:0}; rename works', async () => {
    const miss = await http().patch('/menus/987654321').set(auth()).send({ menuSort: 1 });
    expect(miss.status).toBe(200);
    expect(miss.body).toEqual({ affected: 0 });
    const ok = await http().patch(`/menus/${m.c2.menuID}`).set(auth()).send({ menuName: name('c2-renamed') });
    expect(ok.body).toEqual({ affected: 1 });
  });

  it('update with empty body (old: UpdateValuesMissingError 500; now: 400 No fields to update)', async () => {
    const res = await http().patch(`/menus/${m.c2.menuID}`).set(auth()).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('No fields to update');
  });

  it('update / delete require JWT', async () => {
    await http().patch(`/menus/${m.c2.menuID}`).send({ menuSort: 1 }).expect(401);
    await http().delete(`/menus/${m.c2.menuID}`).expect(401);
  });

  it('delete OWN parent removes parent + direct children only; shape {affected}', async () => {
    const res = await http().delete(`/menus/${m.parent.menuID}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ affected: 3 });
    const gone = await db.query<any[]>('SELECT MenuID FROM M_Menu WHERE MenuID IN (?, ?, ?)', [m.parent.menuID, m.c1.menuID, m.c2.menuID]);
    expect(gone).toEqual([]);
    // grandchild is NOT deleted (only direct children, same as before)
    expect(await db.query<any[]>('SELECT MenuID FROM M_Menu WHERE MenuID = ?', [m.gc.menuID])).toHaveLength(1);
    const res2 = await http().delete(`/menus/${m.gc.menuID}`).set(auth()).expect(200);
    expect(res2.body).toEqual({ affected: 1 });
  });

  it('delete non-existent -> 200 {affected:0} (no 404 existed before either)', async () => {
    const res = await http().delete('/menus/987654321').set(auth());
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ affected: 0 });
  });
});

describe('Department', () => {
  const DNAME = `${TAG}${run} Dept`;

  it('create requires JWT', async () => {
    await http().post('/departments').send({ departmentId: DEPT, departmentName: DNAME, departmentCreatedUser: 'x' }).expect(401);
  });

  it('create with client-supplied id: {message, department:{departmentId, departmentName, PostBy}} (no PostDate)', async () => {
    const res = await http()
      .post('/departments')
      .set(auth())
      .send({ departmentId: DEPT, departmentName: DNAME, departmentCreatedUser: 'ignored' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      message: 'Department created successfully',
      department: { departmentId: DEPT, departmentName: DNAME, PostBy: USER },
    });
  });

  it('duplicate name -> 409; duplicate id with new name -> 500 driver error', async () => {
    const dupName = await http()
      .post('/departments')
      .set(auth())
      .send({ departmentId: DEPT2, departmentName: DNAME, departmentCreatedUser: 'x' });
    expect(dupName.status).toBe(409);
    expect(dupName.body.message).toBe('Department name already exists');

    const dupId = await http()
      .post('/departments')
      .set(auth())
      .send({ departmentId: DEPT, departmentName: `${DNAME} other`, departmentCreatedUser: 'x' });
    expect(dupId.status).toBe(500);
    expect(dupId.body.message).toMatch(/Duplicate entry/);
    expect(dupId.body.error).toBe('Error'); // old: 'QueryFailedError'
  });

  it('list and get: entity shape with PostDate', async () => {
    const list = await http().get('/departments').expect(200);
    expect(list.body.find((d: any) => d.departmentId === DEPT)).toBeTruthy();
    if (existingDeptId) expect(list.body.map((d: any) => d.departmentId)).toContain(existingDeptId);
    const one = await http().get(`/departments/${DEPT}`).expect(200);
    expect(Object.keys(one.body).sort()).toEqual(['PostBy', 'PostDate', 'departmentId', 'departmentName']);
    expect(one.body.PostBy).toBe(USER);
    expect(new Date(one.body.PostDate).getTime()).not.toBeNaN();
    const miss = await http().get(`/departments/${TAG}NOPE`);
    expect(miss.status).toBe(200);
    expect(miss.text).toBe(''); // null -> empty body, same as before
  });

  it('update: message; unknown -> 404; empty body (old 500 -> now 400)', async () => {
    const res = await http().patch(`/departments/${DEPT}`).send({ departmentName: `${DNAME} v2` });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Department updated successfully' });
    const one = await http().get(`/departments/${DEPT}`).expect(200);
    expect(one.body.departmentName).toBe(`${DNAME} v2`);

    const miss = await http().patch(`/departments/${TAG}NOPE`).send({ departmentName: 'zzz' });
    expect(miss.status).toBe(404);
    expect(miss.body.message).toBe('Department not found');

    const empty = await http().patch(`/departments/${DEPT}`).send({});
    expect(empty.status).toBe(400);
  });

  it('delete: message; second delete / unknown -> 404', async () => {
    const res = await http().delete(`/departments/${DEPT}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Department deleted successfully' });
    const again = await http().delete(`/departments/${DEPT}`);
    expect(again.status).toBe(404);
    expect(again.body.message).toBe('Department not found');
  });
});

describe('Group + group authorization', () => {
  let authMenuId: number;
  let authMenu2Id: number;
  let GNAME = '';

  beforeAll(async () => {
    GNAME = `${TAG}${run} Group`;
    const a = await http().post('/menus').set(auth()).send({ menuName: name('am1'), menuRoute: '/e2eb/a1', menuSort: 1, postBy: 'x' });
    const b = await http().post('/menus').set(auth()).send({ menuName: name('am2'), menuRoute: '/e2eb/a2', menuSort: 2, postBy: 'x' });
    authMenuId = a.body.menuID;
    authMenu2Id = b.body.menuID;
  });

  afterAll(async () => {
    await http().delete(`/menus/${authMenuId}`).set(auth());
    await http().delete(`/menus/${authMenu2Id}`).set(auth());
  });

  it('create group (JWT; PostBy from token; DB-filled PostDate)', async () => {
    await http().post('/groups').send({ groupId: GID, groupName: GNAME, groupNote: 'n' }).expect(401);
    const res = await http().post('/groups').set(auth()).send({ groupId: GID, groupName: GNAME, groupNote: 'note' });
    expect(res.status).toBe(201);
    expect(Object.keys(res.body).sort()).toEqual(['PostBy', 'PostDate', 'groupId', 'groupName', 'groupNote']);
    expect(res.body).toMatchObject({ groupId: GID, groupName: GNAME, groupNote: 'note', PostBy: USER });
    expect(new Date(res.body.PostDate).getTime()).not.toBeNaN();
  });

  it('duplicate group name or id -> 409 (own and pre-existing)', async () => {
    for (const body of [
      { groupId: GID + 1, groupName: GNAME, groupNote: 'n' },
      { groupId: GID, groupName: `${GNAME} other`, groupNote: 'n' },
    ]) {
      const res = await http().post('/groups').set(auth()).send(body);
      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Group name or id already exists');
    }
    if (existingGroup) {
      const res = await http()
        .post('/groups')
        .set(auth())
        .send({ groupId: GID + 1, groupName: existingGroup.groupName, groupNote: 'n' });
      expect(res.status).toBe(409);
    }
  });

  it('list groups: {groups:[{groupId, groupName}]}', async () => {
    const res = await http().get('/groups').expect(200);
    expect(Object.keys(res.body)).toEqual(['groups']);
    for (const g of res.body.groups) expect(Object.keys(g).sort()).toEqual(['groupId', 'groupName']);
    expect(res.body.groups).toContainEqual({ groupId: GID, groupName: GNAME });
    if (existingGroup) expect(res.body.groups).toContainEqual(existingGroup);
  });

  it('update: message, persisted, partial leaves other column; 404 unknown; empty body (old 500 -> now 400)', async () => {
    const res = await http().patch(`/groups/${GID}`).send({ groupNote: 'note2' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Group updated successfully' });
    const [row] = await db.query<any[]>('SELECT GroupName, GroupNote FROM M_User_Group WHERE GroupID = ?', [GID]);
    expect(row).toEqual({ GroupName: GNAME, GroupNote: 'note2' });
    const miss = await http().patch(`/groups/${GID + 500000}`).send({ groupNote: 'x' });
    expect(miss.status).toBe(404);
    expect(miss.body.message).toBe('Group not found');
    const empty = await http().patch(`/groups/${GID}`).send({});
    expect(empty.status).toBe(400);
  });

  it('create auths: bulk insert; validation 400s; unknown group 404; empty array', async () => {
    const ok = await http()
      .post('/groups/permissions')
      .send([
        { groupId: GID, menuId: authMenuId, access: 1 },
        { groupId: GID, menuId: authMenu2Id, access: 0 },
      ]);
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({
      message: 'Group authorization created successfully',
      groupAuths: [
        { groupId: GID, menuId: authMenuId, access: 1 },
        { groupId: GID, menuId: authMenu2Id, access: 0 },
      ],
    });
    expect(await authRows()).toEqual([
      { menuId: authMenuId, access: 1 },
      { menuId: authMenu2Id, access: 0 },
    ]);

    const empty = await http().post('/groups/permissions').send([]);
    expect(empty.status).toBe(201);
    expect(empty.body).toEqual({ message: 'No group authorizations provided', groupAuths: [] });

    const mixed = await http()
      .post('/groups/permissions')
      .send([
        { groupId: GID, menuId: existMenuA, access: 1 },
        { groupId: GID + 5, menuId: existMenuB, access: 1 },
      ]);
    expect(mixed.status).toBe(400);
    expect(mixed.body.message).toBe(`Every item must have groupId ${GID}`);

    const dup = await http()
      .post('/groups/permissions')
      .send([
        { groupId: GID, menuId: existMenuA, access: 1 },
        { groupId: GID, menuId: existMenuA, access: 0 },
      ]);
    expect(dup.status).toBe(400);
    expect(dup.body.message).toBe('Duplicate menuId in request');

    const badAccess = await http().post('/groups/permissions').send([{ groupId: GID, menuId: existMenuA, access: 2 }]);
    expect(badAccess.status).toBe(400);

    // unknown group: use an id that does not exist (GID + 500000 > anything chosen), nothing is inserted
    const unknown = await http().post('/groups/permissions').send([{ groupId: GID + 500000, menuId: existMenuA, access: 1 }]);
    expect(unknown.status).toBe(404);
    expect(await authRows()).toHaveLength(2);
    expect(await db.query<any[]>('SELECT 1 FROM M_Group_Authorization WHERE GroupId = ?', [GID + 500000])).toEqual([]);
  });

  it('get group auth: merged over ALL menus, access 0 default, keys + groupId numeric', async () => {
    const res = await http().get(`/groups/${GID}/permissions`).expect(200);
    const menus = await db.query<any[]>('SELECT MenuID FROM M_Menu ORDER BY MenuID');
    expect(res.body.map((r: any) => r.menuId).sort((a: number, b: number) => a - b)).toEqual(menus.map((r) => r.MenuID));
    for (const r of res.body) {
      expect(Object.keys(r).sort()).toEqual(['access', 'groupId', 'menuId']);
      expect(r.groupId).toBe(GID);
    }
    const by = Object.fromEntries(res.body.map((r: any) => [r.menuId, r.access]));
    expect(by[authMenuId]).toBe(1);
    expect(by[authMenu2Id]).toBe(0);
    expect(by[existMenuA]).toBe(0); // my group has no row there -> default 0
    // a pre-existing group: GET result equals what the table says (read-only comparison)
    if (existingGroup) {
      const g = await http().get(`/groups/${existingGroup.groupId}/permissions`).expect(200);
      const rows = await db.query<any[]>('SELECT MenuId, Access FROM M_Group_Authorization WHERE GroupId = ?', [existingGroup.groupId]);
      const expected = new Map<number, number>(rows.map((r) => [r.MenuId, r.Access]));
      for (const r of g.body) expect(r.access).toBe(expected.get(r.menuId) ?? 0);
    }
    await http().get(`/groups/${GID + 500000}/permissions`).expect(404);
  });

  it('set auths (PUT): delete+insert in one transaction', async () => {
    const res = await http()
      .put(`/groups/${GID}/permissions`)
      .send([
        { groupId: GID, menuId: authMenuId, access: 0 },
        { groupId: GID, menuId: existMenuA, access: 1 },
        { groupId: GID, menuId: existMenuB, access: 1 },
      ]);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Group authorization updated successfully' });
    const rows = await authRows();
    expect(rows).toHaveLength(3);
    expect(rows).toContainEqual({ menuId: authMenuId, access: 0 });
    expect(rows).toContainEqual({ menuId: existMenuA, access: 1 });
    expect(rows).toContainEqual({ menuId: existMenuB, access: 1 });
  });

  it('PUT failing mid-way (out-of-range menuId in 2nd row) rolls back: previous auths intact, pool still healthy', async () => {
    const before = await authRows();
    expect(before).toHaveLength(3);
    const res = await http()
      .put(`/groups/${GID}/permissions`)
      .send([
        { groupId: GID, menuId: authMenu2Id, access: 1 },
        { groupId: GID, menuId: 99999999999, access: 1 },
      ]);
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/out of range/i);
    expect(await authRows()).toEqual(before);
    // repeat: connections must be released (pool limit would otherwise starve)
    for (let i = 0; i < 12; i++) {
      await http().put(`/groups/${GID}/permissions`).send([{ groupId: GID, menuId: 99999999999, access: 1 }]).expect(500);
    }
    expect(await authRows()).toEqual(before);
    await http().get(`/groups/${GID}/permissions`).expect(200);
  }, 120000);

  it('PUT validation (before any DB change): mixed groupId / dup menuId -> 400 and rows intact; unknown group 404', async () => {
    const before = await authRows();
    await http().put(`/groups/${GID}/permissions`).send([{ groupId: GID + 1, menuId: existMenuA, access: 1 }]).expect(400);
    await http()
      .put(`/groups/${GID}/permissions`)
      .send([
        { groupId: GID, menuId: existMenuA, access: 1 },
        { groupId: GID, menuId: existMenuA, access: 1 },
      ])
      .expect(400);
    await http()
      .put(`/groups/${GID + 500000}/permissions`)
      .send([{ groupId: GID + 500000, menuId: existMenuA, access: 1 }])
      .expect(404);
    expect(await authRows()).toEqual(before);
  });

  it('PUT empty array deletes all permissions of THIS group only', async () => {
    const othersBefore = sum(
      await db.query<any[]>('SELECT * FROM M_Group_Authorization WHERE GroupId <> ? ORDER BY MenuAuthId', [GID]),
    );
    const res = await http().put(`/groups/${GID}/permissions`).send([]);
    expect(res.status).toBe(200);
    expect(await authRows()).toEqual([]);
    const othersAfter = sum(
      await db.query<any[]>('SELECT * FROM M_Group_Authorization WHERE GroupId <> ? ORDER BY MenuAuthId', [GID]),
    );
    expect(othersAfter).toBe(othersBefore);
  });

  it('remove group auth: removedGroupAuth.affected (old: {raw:[], affected})', async () => {
    await http()
      .post('/groups/permissions')
      .send([
        { groupId: GID, menuId: authMenuId, access: 1 },
        { groupId: GID, menuId: authMenu2Id, access: 1 },
      ])
      .expect(201);
    const res = await http().delete(`/groups/${GID}/permissions`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      message: 'Group authorization removed successfully',
      removedGroupAuth: { affected: 2 },
    });
    expect(await authRows()).toEqual([]);
    const again = await http().delete(`/groups/${GID}/permissions`).expect(200);
    expect(again.body.removedGroupAuth).toEqual({ affected: 0 });
    await http().delete(`/groups/${GID + 500000}/permissions`).expect(404);
  });

  it('delete group: message; again -> 404', async () => {
    const res = await http().delete(`/groups/${GID}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Group deleted successfully' });
    const again = await http().delete(`/groups/${GID}`);
    expect(again.status).toBe(404);
    expect(again.body.message).toBe('Group not found');
    const list = await http().get('/groups').expect(200);
    expect(list.body.groups.map((g: any) => g.groupId)).not.toContain(GID);
  });
});

describe('Pre-existing data untouched', () => {
  it('checksum of all non-E2EB_ rows in M_Menu / M_User_Group / M_Group_Authorization / M_Department is unchanged', async () => {
    // own auth menus (group describe afterAll) are deleted before this describe runs
    expect(await checksumExisting()).toBe(checksumBefore);
  });
});
