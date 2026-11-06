import { CanActivate, ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { TransaksiPenarikanController } from './transaksi-penarikan.controller';
import { TransaksiPenarikanService } from './transaksi-penarikan.service';

// Guard stub: lets the request through only when an Authorization header is present.
const headerGuard: CanActivate = {
  canActivate: (ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.headers.authorization) return false;
    req.user = { username: 'tester' };
    return true;
  },
};

describe('TransaksiPenarikanController GET /withdrawals/balance', () => {
  let app: INestApplication;
  const service = {
    GetSaldoSimpananPenarikan: vi.fn(),
    GetTransaksiSimpananPenarikan: vi.fn(),
  };
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TransaksiPenarikanController],
      providers: [{ provide: TransaksiPenarikanService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(headerGuard)
      .compile();

    app = module.createNestApplication();
    // same options as src/main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => vi.clearAllMocks());

  it('is guarded (stub returns false -> 403; the real JwtAuthGuard answers 401, see e2e)', async () => {
    await http().get('/withdrawals/balance').query({ NoEmployee: 'E1', JenisSimpanan: 'SIMPANAN POKOK' }).expect(403);
    expect(service.GetSaldoSimpananPenarikan).not.toHaveBeenCalled();
  });

  it('routes to the balance handler, not to :withdrawalId', async () => {
    service.GetSaldoSimpananPenarikan.mockResolvedValue({ Saldo: 5 });
    const res = await http()
      .get('/withdrawals/balance')
      .set('Authorization', 'Bearer x')
      .query({ NoEmployee: 'E1', JenisSimpanan: 'SIMPANAN POKOK' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ Saldo: 5 });
    expect(service.GetSaldoSimpananPenarikan).toHaveBeenCalledWith({ NoEmployee: 'E1', JenisSimpanan: 'SIMPANAN POKOK' });
    expect(service.GetTransaksiSimpananPenarikan).not.toHaveBeenCalled();
  });

  it('trims values before they reach the service', async () => {
    service.GetSaldoSimpananPenarikan.mockResolvedValue({});
    await http()
      .get('/withdrawals/balance')
      .set('Authorization', 'Bearer x')
      .query({ NoEmployee: '  E1  ', JenisSimpanan: ' SIMPANAN POKOK ' })
      .expect(200);
    expect(service.GetSaldoSimpananPenarikan).toHaveBeenCalledWith({ NoEmployee: 'E1', JenisSimpanan: 'SIMPANAN POKOK' });
  });

  it.each([
    ['empty NoEmployee', { NoEmployee: '', JenisSimpanan: 'SIMPANAN POKOK' }],
    ['spaces-only NoEmployee', { NoEmployee: '   ', JenisSimpanan: 'SIMPANAN POKOK' }],
    ['missing NoEmployee', { JenisSimpanan: 'SIMPANAN POKOK' }],
    ['empty JenisSimpanan', { NoEmployee: 'E1', JenisSimpanan: '' }],
    ['NoEmployee longer than 10', { NoEmployee: 'X'.repeat(11), JenisSimpanan: 'SIMPANAN POKOK' }],
    ['JenisSimpanan longer than 20', { NoEmployee: 'E1', JenisSimpanan: 'X'.repeat(21) }],
  ])('400 for %s', async (_name, query) => {
    await http().get('/withdrawals/balance').set('Authorization', 'Bearer x').query(query).expect(400);
    expect(service.GetSaldoSimpananPenarikan).not.toHaveBeenCalled();
  });
});
