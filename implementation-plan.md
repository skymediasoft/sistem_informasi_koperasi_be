# Implementation Plan: Replace TypeORM with the MySQL2 connector

Status: **Proposed**. Nothing in `src/` has been changed yet.

> **Secrets note.** This plan names environment variables (for example `SQL_HOST`) but never their values.
> No `.env` file was read to produce it, and none exists in the repository. `.env` is already listed in `.gitignore`.
> Do not paste connection strings, hostnames, passwords, JWT secrets or the Swagger key into this file, into
> commits, or into test fixtures.

---

## 1. Goal and scope

**Goal.** Remove `typeorm` and `@nestjs/typeorm`. All database access goes through a `mysql2/promise` connection pool
wrapped in a small NestJS provider.

**Hard requirements**

- The HTTP API contract does not change: routes, request DTOs, and response JSON shapes and keys stay the same.
  Intentional exceptions are listed in section 9 and need sign-off.
- The database schema, views and stored procedures do not change. `synchronize` is already `false`, so the
  entities do not drive the schema today.
- Every query stays parameterised. No string concatenation of user input into SQL.

**Non-goals**

- No schema migrations, no new ORM or query builder (Kysely, Knex, Drizzle).
- No change to authentication, JWT or Swagger behaviour.
- No clean-up of unrelated bugs, except where this refactor would otherwise change them (see section 3).

## 2. Current state (inventory)

TypeORM is wired in through `TypeOrmModule.forRootAsync` in `src/app.module.ts` and `TypeOrmModule.forFeature`
in each feature module. Notably, **TypeORM already uses `mysql2` as its driver** (`driver: mysql`). Pool and type
semantics are therefore close to what we get with a direct `mysql2` pool, which lowers the risk.

| Module | Files touching TypeORM | Entities | How the DB is used |
|---|---|---|---|
| `app` | `app.module.ts` | `User` (registered globally) | `forRootAsync` using `SQL_HOST`, `SQL_PORT`, `SQL_USERNAME`, `SQL_PASSWORD`, `SQL_DATABASE` |
| `auth` | `auth.module.ts`, `auth.service.ts`, `anggota-auth.service.ts` | `User` (`M_Users`), `Anggota` (`M_Anggota`) | `findOne`, `create`, `save`, `update`, `delete`, `exists`, raw `query()` for views and stored procedures |
| `department` | module, service | `Department` (`M_Department`) | `findOne`, `find`, `create`, `save`, `update`, `delete` |
| `group` | module, service | `Group` (`M_User_Group`), `GroupAuthorization` (`M_Group_Authorization`), `Menu` | CRUD, bulk `insert`, `manager.transaction(...)` |
| `menu` | module, service | `Menu` (`M_Menu`) | CRUD, `Not()`, `exists`, `createQueryBuilder().delete()` |
| `simpanan` | module, 4 services | `SettingSimpanan`, `TransaksiSimpanan`, `TransaksiPenarikan`, `TransaksiPenarikanResign` | Almost entirely raw `query('CALL sp_...')`. Entities are only a vehicle for `.query()`, apart from `SettingSimpanan.find` and `update`. |
| tests | `auth.service.spec.ts`, `menu.service.spec.ts`, `menu.controller.spec.ts` | n/a | `getRepositoryToken(...)` mocks |

Entity files to retire: `src/auth/entities/{auth,anggota}.entity.ts`, `src/department/entities/department.entity.ts`,
`src/group/entities/{group,group-authorization}.entity.ts`, `src/menu/entities/menu.entity.ts`,
`src/simpanan/entities/*.entity.ts` (4 files).

## 3. Behaviours that TypeORM provides implicitly (the real risks)

These are the places where a naive "swap the call" refactor would silently change behaviour.

1. **OUT parameters and session variables across pooled connections.**
   `registerAnggota`, `SubmitTransaksiSimpananPosting`, `SubmitTransaksiSimpananPenarikan(Resign)` and `updateAnggota`
   call `CALL sp_...(..., @p_Message)` and then run a *separate* `SELECT @p_Message`. `updateApply` in
   `setting-simpanan.service.ts` does `SET @SimpananPokok = ...` and then a separate `CALL`. Each
   `repository.query()` may check out a different pooled connection, so these only work when the pool happens to
   hand back the same connection. With a plain `pool.query()` this stays a latent bug.
   **Fix:** run the pair on one dedicated connection (`getConnection()` ... `release()`), or for `updateApply`
   pass the values directly as `CALL sp_Update_Setting_Simpanan(?, ?, ?)`.
2. **Result shapes differ.**
   - TypeORM `query()` returns the raw driver result: rows for `SELECT`, `[resultSets..., ResultSetHeader]` for
     `CALL`, `ResultSetHeader` for DML.
   - `mysql2/promise` returns `[result, fields]`.
   - `repository.update/delete` return `{ affected, raw, generatedMaps }`; mysql2 gives `affectedRows`.
   - Existing code does `const [rows] = await query('CALL ...')` and `queryResult[0]`. If our wrapper returns the
     first tuple element, these call sites keep working unchanged.
3. **Entity hydration.**
   - Property-to-column mapping, for example `userLogin` -> `UserLogin`, `groupId` -> `GroupID`,
     `menuID` -> `MenuID`, `menuAuthId` -> `MenuAuthId`. Response JSON currently uses the *property* names.
   - `select: false` on `Anggota.PasswordLogin`. `findOne` never returns the password hash, and a raw
     `SELECT *` would leak it. All queries on `M_Anggota` must list columns explicitly.
   - `date` columns: TypeORM hydrates `type: 'date'` as a `YYYY-MM-DD` string (for example `Anggota.TanggalMasuk`).
     Raw mysql2 returns a JS `Date` (serialised as an ISO timestamp, with timezone-shift risk).
   - `bigint` columns (`Menu.menuParentID`, various `ID...`): TypeORM defaults to strings. Set
     `supportBigNumbers: true` and `bigNumberStrings: true` explicitly. `Menu.toJSON()` exists only to stringify
     the `BigInt`, so the mapper must do the same.
4. **Write-side magic.**
   - `@CreateDateColumn` (`User.postDate`, `Group.PostDate`, `Menu.postDate`): columns are omitted on insert and
     rely on a DB default. Inserts must either set `NOW()` explicitly or be checked against `SHOW CREATE TABLE`.
     `Department.PostDate` is `NOT NULL` with no decorator default, so verify the DB default.
   - `create()` + `save()` returns the saved entity, with generated PK and defaults. The API returns it
     directly (`menu.create`, `group.create`, `department.create`), so the new code must reproduce those
     keys, re-selecting by `insertId` where a generated value is needed.
   - `update(id, partialDto)` ignores `undefined` properties. A hand-written `UPDATE` must do the same.
5. **`undefined` parameters.** The text protocol (`pool.query`) turns `undefined` into `NULL`, which the stored
   procedure calls currently rely on (optional DTO fields). Prepared statements (`pool.execute`) *throw* on
   `undefined`. **Use `pool.query` as the default**, not `execute`, to keep parity.
6. **Raw TypeORM result objects leak into responses.** `menu.update`, `menu.remove`, `removeGroupAuth` (as
   `removedGroupAuth`) and `setting-simpanan.update` return TypeORM `UpdateResult` or `DeleteResult` straight to
   the client. Decide on the replacement shape (open decision D2).
7. **`AnggotaAuthService extends AuthService`** by casting the `Anggota` repository to `Repository<User>`.
   Inherited methods (`register`, `editUser`, `deleteUser`, ...) would run against the wrong table if ever
   called on it. Only `generateTokens` is actually used. The refactor should remove the cast, either by
   composition (inject `AuthService`) or by extracting token generation (open decision D3).
8. **Pre-existing bugs noticed (do not silently change; confirm first):**
   - `AuthService.register` passes the raw result of `SELECT GroupName ...` (an array) as `groupName` into the token
     payload. It should be the scalar `rows[0]?.GroupName`.
   - `AuthService.logout` loads a user and ignores it.
   - `TransaksiTunaiService.SubmitTransaksiSimpananTunai` returns nothing.
   - `AnggotaAuthService.updateAnggota` reads `result.affectedRows` from a `CALL` result, which is only an
     object with that property when the procedure returns no result set.

## 4. Target architecture

```
src/database/
  database.constants.ts        # export const MYSQL_POOL = Symbol('MYSQL_POOL')
  database.module.ts           # @Global(); provides pool + DatabaseService
  database.service.ts          # query(), withConnection(), transaction(), callWithMessage()
  sql.util.ts                  # buildUpdate(), buildBulkInsert(): column allow-lists, skips undefined
  database.service.spec.ts

src/<module>/
  <module>.repository.ts       # plain @Injectable class holding the SQL for that module
  models/*.model.ts            # plain TS interfaces (replaces entities/*.entity.ts)
```

**Why per-module repository classes rather than SQL inline in services:** services keep their business logic
and exceptions, SQL is reviewable in one place per module, and unit tests mock the repository (same ergonomics as
today's `getRepositoryToken` mocks). Inline SQL in services is acceptable only for the pure stored-procedure
modules (`simpanan/*`), where there is no table logic, just `CALL`s (see section 6.6).

### 4.1 Pool provider

Keep the existing variable names (`SQL_HOST`, `SQL_PORT`, `SQL_USERNAME`, `SQL_PASSWORD`, `SQL_DATABASE`).
Nothing new is required. Optionally add `SQL_POOL_LIMIT`, defaulting to 10.

```ts
// src/database/database.module.ts (sketch)
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPool } from 'mysql2/promise';
import { MYSQL_POOL } from './database.constants';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: MYSQL_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createPool({
          host: config.getOrThrow<string>('SQL_HOST'),
          port: Number(config.get('SQL_PORT') ?? 3306), // env values are strings
          user: config.getOrThrow<string>('SQL_USERNAME'), // mysql2 uses `user`, not `username`
          password: config.getOrThrow<string>('SQL_PASSWORD'),
          database: config.getOrThrow<string>('SQL_DATABASE'),
          waitForConnections: true,
          connectionLimit: Number(config.get('SQL_POOL_LIMIT') ?? 10),
          queueLimit: 0,
          enableKeepAlive: true,
          supportBigNumbers: true, // same as TypeORM defaults, made explicit
          bigNumberStrings: true,
          multipleStatements: false, // keep off: limits blast radius of any injection
        }),
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

`getOrThrow` means a missing variable fails at startup. Today `get` silently yields `undefined`.

### 4.2 `DatabaseService` API

```ts
// src/database/database.service.ts (sketch)
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(@Inject(MYSQL_POOL) private readonly pool: Pool) {}

  /** Same return value as TypeORM's repository.query(): rows / [resultSets, header] / ResultSetHeader. */
  async query<T = any>(sql: string, params: unknown[] = [], conn: Pool | PoolConnection = this.pool): Promise<T> {
    const [result] = await conn.query(sql, params);
    return result as T;
  }

  async withConnection<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
    const conn = await this.pool.getConnection();
    try { return await fn(conn); } finally { conn.release(); }
  }

  async transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
    return this.withConnection(async (conn) => {
      await conn.beginTransaction();
      try { const out = await fn(conn); await conn.commit(); return out; }
      catch (e) { await conn.rollback(); throw e; }
    });
  }

  /** CALL sp(..., @p_Message) then SELECT @p_Message on the SAME connection. Returns the message. */
  async callWithMessage(callSql: string, params: unknown[]): Promise<string | undefined> {
    return this.withConnection(async (conn) => {
      await this.query(callSql, params, conn);
      const rows = await this.query<{ p_Message: string }[]>('SELECT @p_Message AS p_Message', [], conn);
      return rows[0]?.p_Message;
    });
  }

  async onModuleDestroy() { await this.pool.end(); }
}
```

Rules for all repositories:

- Default to `pool.query` with `?` placeholders. Use `??` only for identifiers that come from constants, never
  from request data.
- Dynamic `UPDATE ... SET` is built by `sql.util.ts` from a per-table **allow-list map** (`dtoKey -> columnName`).
  Unknown keys are dropped, `undefined` values are skipped, and an empty update is rejected before it hits the DB.
- Convert `BigInt` to `string` before binding.
- Select explicit column lists with aliases that match the existing JSON keys, for example
  `SELECT GroupID AS groupId, GroupName AS groupName ...`. This replaces entity hydration. Never use
  `SELECT *` on `M_Anggota` or `M_Users` (password hashes).

## 5. Phased plan

Each phase is one reviewable commit or PR, and the app builds and passes tests at the end of each.
TypeORM and the new pool can coexist during phases 1 to 4. Keep `SQL_POOL_LIMIT` small while both pools are open.

### Phase 0: Safety net (before touching code)

1. Export the current schema (tables, views, stored procedures) with `mysqldump --no-data --routines` into
   `db/schema.sql`, and strip `DEFINER=` clauses. The schema and procedures are currently not in the repo, and
   integration tests need them. Dump **no data** and keep credentials out of the command history and files.
2. Run `SHOW CREATE TABLE` for `M_Users`, `M_User_Group`, `M_Menu`, `M_Department`, `M_Group_Authorization`,
   `M_Setting_Simpanan` to confirm `PostDate` and `CreatedDate` defaults and auto-increment keys (risk 4).
3. Capture **golden responses** from the current build using the existing Bruno collection
   (`bruno/Koperasi Batam/`) against a local or test database, with tokens and hashes redacted. Use them to diff
   after each phase.
4. Add characterisation tests for the riskiest flows against a throwaway MySQL (Docker `mysql:8` or
   Testcontainers), loading `db/schema.sql`. Cover group-authorization replace, menu delete-with-children,
   anggota register/update, and penarikan submit.

### Phase 1: Database layer (additive; no feature code changes)

- Add `src/database/*` as in section 4, plus unit tests that mock `Pool`: `query` returns the first tuple
  element, `transaction` commits and rolls back correctly, `callWithMessage` uses one connection and always
  releases it, `buildUpdate` skips `undefined`, rejects unknown keys and rejects an empty set.
- Import `DatabaseModule` in `AppModule`. Leave `TypeOrmModule` in place for now.

### Phase 2: Migrate the stored-procedure-only code (`simpanan`): lowest risk

- `transaksi-payroll`, `transaksi-tunai`, `transaksi-penarikan`: replace
  `@InjectRepository(...)` + `repo.query(...)` with `DatabaseService.query(...)`. SQL and parameters are
  unchanged. Replace the `CALL ...@p_Message` + `SELECT @p_Message` pairs with `db.callWithMessage(...)`.
- `setting-simpanan`: `findAll` -> `SELECT ID, SimpananPokok, SimpananWajib, SimpananSukarela FROM M_Setting_Simpanan ORDER BY ID LIMIT 1`;
  `update` -> `buildUpdate`; `updateApply` -> a single `CALL sp_Update_Setting_Simpanan(?, ?, ?)` (fixes risk 1).
- Remove the four `simpanan` entities (they are only used for `.query()`) and update `simpanan.module.ts`.

### Phase 3: `department` and `menu`

- `department.repository.ts`: `findByName`, `findById`, `findAll`, `insert`, `updateName`, `delete`.
  Alias columns to the existing JSON keys (`departmentId`, `departmentName`, `PostBy`, `PostDate`).
  `create` returns `{ departmentId, departmentName, PostBy }` as it does now. `update` and `remove` check
  `affectedRows` where the service currently checks `affected`.
- `menu.repository.ts`: parents `WHERE MenuParentID = 0`, children `WHERE MenuParentID = ?` (string param),
  `existsByName(name, excludeId?)`, `insert` (re-select by `insertId`, set `PostDate = NOW()`),
  `update` (allow-list), and `deleteWithChildren` -> `DELETE FROM M_Menu WHERE MenuID = ? OR MenuParentID = ?`.
  The mapper stringifies `menuParentID`, which replaces `Menu.toJSON()`.
- Update `menu.service.spec.ts` and `menu.controller.spec.ts`: provide a mock `MenuRepository` instead of
  `getRepositoryToken(Menu)`.

### Phase 4: `group`

- `group.repository.ts`: `findByNameOrId` (`WHERE GroupName = ? OR GroupID = ?`), `findById`, `findAll`,
  `insert`, `update` (allow-list `groupName`, `groupNote`), `delete`, `findAuthsByGroup`, `deleteAuthsByGroup`,
  and `insertAuths` as a bulk insert `INSERT INTO M_Group_Authorization (GroupId, MenuId, Access) VALUES ?`
  (nested-array form works with `query`, not `execute`).
- `updateGroupAuth`: `db.transaction(async (conn) => { delete; if (rows.length) insert; })`. This keeps the
  atomic delete+insert guarantee currently provided by `manager.transaction`.
- `findGroupAuth` may stay as two queries plus the in-memory map (behaviour-identical), or become one
  `LEFT JOIN`. Prefer the first for the refactor and treat the JOIN as an optional follow-up.
- Menus are read through `MenuRepository` (export it from `MenuModule`) or a small `findAllMenuIds()` query. Do
  not import the `Menu` entity.

### Phase 5: `auth` (highest sensitivity)

- `user.repository.ts` (`M_Users`) and `anggota.repository.ts` (`M_Anggota`):
  - Users: `findByLogin`, `existsByLogin`, `insert` (`PostDate = NOW()`), `update`, `delete`,
    `updatePassword`, plus calls to `vw_M_User_Login` and `sp_Get_Users_Login`.
  - Anggota: `findByNoAnggota` with **explicit columns, excluding `PasswordLogin`** and returning
    `TanggalMasuk` as `YYYY-MM-DD`; `delete`; calls to the existing procedures and views.
- Resolve the inheritance hack (decision D3). Recommended: `AnggotaAuthService` gets `AuthService` injected for
  `generateTokens`, and no longer extends it.
- `registerAnggota` / `updateAnggota` use `db.callWithMessage(...)`.
- Update `auth.service.spec.ts` to provide a mock `UserRepository`.
- Make the `AuthModule` exports `[AuthService, JwtModule, PassportModule]`. It currently exports `TypeOrmModule`,
  which the other modules do not need once `DatabaseModule` is global.

### Phase 6: Remove TypeORM

1. Delete all `entities/*.entity.ts` files, or convert them to `models/*.model.ts` interfaces, keeping the
   `CREATE TABLE` comments as documentation.
2. Remove `TypeOrmModule` from `app.module.ts` and every feature module, and remove all `typeorm` and
   `@nestjs/typeorm` imports.
3. Run `pnpm remove typeorm @nestjs/typeorm`. `mysql2` is already a dependency; keep it. The project declares
   `pnpm` as its package manager, so update `pnpm-lock.yaml`. `package-lock.json` is also committed and will go
   stale: delete it, or regenerate it (decision D4).
4. `grep -rn "typeorm" src test package.json` returns nothing.

### Phase 7: Verification and rollout

- `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`.
- Replay the Bruno collection against the new build and diff against the golden responses (phase 0).
- Load/pool smoke test: concurrent requests to a stored-procedure endpoint to confirm connections are released
  (no pool exhaustion) and OUT-parameter results are not crossed between requests.
- Deploy to a staging environment first. Rollback is `git revert` of the final PR, because no schema changed.

## 6. Conversion cookbook

### 6.1 Repository calls -> SQL

| TypeORM | mysql2 equivalent |
|---|---|
| `repo.findOne({ where: { col: v } })` | `SELECT <cols with aliases> FROM T WHERE Col = ? LIMIT 1` -> `rows[0] ?? null` |
| `repo.find()` | `SELECT <cols with aliases> FROM T` |
| `repo.exists({ where })` | `SELECT 1 FROM T WHERE ... LIMIT 1` -> `rows.length > 0` |
| `repo.create(x)` + `repo.save(e)` | `INSERT INTO T (cols) VALUES (?)` -> use `insertId` and re-select when a generated value is returned |
| `repo.update(where, partial)` | `buildUpdate(...)` -> `UPDATE T SET ... WHERE ...` -> `result.affectedRows` |
| `repo.delete(where)` | `DELETE FROM T WHERE ...` -> `result.affectedRows` |
| `repo.insert(rows)` | `INSERT INTO T (cols) VALUES ?` with a nested array |
| `Not(id)` | `AND MenuID <> ?` |
| `manager.transaction(cb)` | `db.transaction(cb)` |
| `repo.query(sql, params)` | `db.query(sql, params)` |
| `.affected` | `.affectedRows` (default flags keep "matched rows" semantics, same as TypeORM on this driver) |

### 6.2 Entity -> table mapping (aliases to preserve JSON keys)

| Table | Alias mapping (column AS property) |
|---|---|
| `M_Users` | `UserLogin AS userLogin`, `UserPassword AS userPassword`, `UserName AS userName`, `UserEmail AS userEmail`, `PostBy AS postBy`, `PostDate AS postDate`, `GroupID AS groupId` |
| `M_User_Group` | `GroupID AS groupId`, `GroupName AS groupName`, `GroupNote AS groupNote`, `PostBy`, `PostDate` (PascalCase kept, as in the entity) |
| `M_Group_Authorization` | `MenuAuthId AS menuAuthId`, `GroupId AS groupId`, `MenuId AS menuId`, `Access AS access` |
| `M_Menu` | `MenuID AS menuID`, `MenuName AS menuName`, `MenuParentID AS menuParentID` (stringified), `MenuRoute AS menuRoute`, `MenuSort AS menuSort`, `PostBy AS postBy`, `PostDate AS postDate` |
| `M_Department` | `DepartmentId AS departmentId`, `DepartmentName AS departmentName`, `PostBy`, `PostDate` |
| `M_Anggota` | PascalCase kept (matches the entity). **Exclude `PasswordLogin`.** |
| `M_Setting_Simpanan` | PascalCase kept (matches the entity) |

Keep table and column names in the exact original casing, because MySQL on Linux is case-sensitive for table names.

## 7. Testing strategy

- **Unit:** mock repositories in service specs, mock `Pool` in `DatabaseService` specs. The current specs that use
  `getRepositoryToken` (`auth.service.spec.ts`, `menu.service.spec.ts`, `menu.controller.spec.ts`) are rewritten.
  `department` and `group` specs currently provide no repository at all, so they need providers added.
- **Integration (new):** repository tests against a disposable MySQL 8 loaded from `db/schema.sql`. At minimum
  cover the transaction rollback path, `callWithMessage` on a single connection, `bigint` strings, `date` strings,
  and that `PasswordLogin` is never returned by `findByNoAnggota`.
- **Contract:** Bruno replay diffed against golden responses.
- **Pool hygiene:** a test that fails the callback inside `transaction` / `withConnection` and asserts
  `release` was still called.

## 8. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| OUT-param / `SET @var` calls hit different pooled connections | Wrong or empty message, silent data bugs | `callWithMessage` on one connection; pass values directly to `CALL` |
| Password hash exposed by `SELECT *` on `M_Anggota` / `M_Users` | Credential leak | Explicit column lists; an integration test asserts the hash is absent from responses |
| `date` / `bigint` serialisation changes | Frontend breakage, timezone shifts | Explicit pool options; mapper for `TanggalMasuk`; golden-response diff |
| Missing `CreatedDate`/`PostDate` defaults | Insert errors or NULL dates | Verify with `SHOW CREATE TABLE`; set `NOW()` explicitly |
| Dynamic `UPDATE` building | SQL injection | Column allow-lists from constants; values always bound |
| Pool leak (connection not released) | Hung requests | `try/finally` only inside `withConnection` / `transaction`; leak test |
| Two pools open during migration | Hits `max_connections` | Small `SQL_POOL_LIMIT`; short coexistence window |
| Lost `UpdateResult`/`DeleteResult` fields in responses | Client breakage | Decision D2; verify against the Bruno collection |

## 9. Open decisions (need your input before or during implementation)

| # | Question | Recommendation |
|---|---|---|
| D1 | Per-module repository classes, or inline SQL in services? | Repository classes; inline only for `simpanan/*` stored-procedure code |
| D2 | What should endpoints that currently return TypeORM `UpdateResult`/`DeleteResult` return (`menu.update`, `menu.remove`, `removeGroupAuth`, `setting-simpanan.update`)? | `{ affected: n }`: drop `raw`/`generatedMaps`. Confirm no client reads them. |
| D3 | `AnggotaAuthService extends AuthService` | Composition: inject `AuthService` and use it for `generateTokens` |
| D4 | Two lockfiles are committed (`pnpm-lock.yaml`, `package-lock.json`) | Keep `pnpm-lock.yaml` (declared `packageManager`); delete the stale `package-lock.json` |
| D5 | Fix the pre-existing bugs in section 3 (item 8) in this refactor? | Fix the `groupName` token payload in a separate, clearly labelled commit. Leave the rest. |
| D6 | Commit `db/schema.sql` (no data, no `DEFINER`)? | Yes, so integration tests and onboarding do not depend on a shared DB |

## 10. Checklist

- [ ] Phase 0: schema export, `SHOW CREATE TABLE` checks, golden responses, characterisation tests
- [ ] Phase 1: `DatabaseModule`, `DatabaseService`, `sql.util.ts` with tests
- [ ] Phase 2: `simpanan` migrated, `updateApply` fixed
- [ ] Phase 3: `department`, `menu` migrated; specs updated
- [ ] Phase 4: `group` migrated, including transaction
- [ ] Phase 5: `auth` and `anggota` migrated, inheritance hack removed
- [ ] Phase 6: TypeORM removed; deps and lockfiles updated
- [ ] Phase 7: build, lint, unit, e2e and Bruno-diff all pass; staged rollout
- [ ] Final check: `grep -rniE "typeorm" src test package.json` returns nothing, and no secrets are present in any
      committed file
