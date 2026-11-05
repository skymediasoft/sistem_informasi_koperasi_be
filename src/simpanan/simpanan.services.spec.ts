import { BadRequestException } from '@nestjs/common';
import { SettingSimpananService } from './setting-simpanan/setting-simpanan.service';
import { TransaksiPayrollService } from './transaksi-payroll/transaksi-payroll.service';
import { TransaksiPenarikanService } from './transaksi-penarikan/transaksi-penarikan.service';
import { TransaksiTunaiService } from './transaksi-tunai/transaksi-tunai.service';

const mockDb = () => ({ query: vi.fn(), callWithMessage: vi.fn() });

describe('SettingSimpananService', () => {
  it('updateApply is one CALL with bound params', async () => {
    const db = mockDb();
    db.query.mockResolvedValue({ affectedRows: 1 });
    const svc = new SettingSimpananService(db as any);
    await svc.updateApply({ SimpananPokok: 1, SimpananWajib: 2, SimpananSukarela: 3 });
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith('CALL sp_Update_Setting_Simpanan(?, ?, ?)', [1, 2, 3]);
  });

  it('update returns { affected } and rejects empty body', async () => {
    const db = mockDb();
    db.query.mockResolvedValue({ affectedRows: 1 });
    const svc = new SettingSimpananService(db as any);
    expect(await svc.update(1, { SimpananWajib: 5 })).toEqual({ affected: 1 });
    expect(db.query).toHaveBeenCalledWith('UPDATE M_Setting_Simpanan SET SimpananWajib = ? WHERE ID = ?', [5, 1]);
    await expect(svc.update(1, {})).rejects.toThrow(BadRequestException);
  });

  it('findAll returns first row', async () => {
    const db = mockDb();
    db.query.mockResolvedValue([{ ID: 1 }]);
    expect(await new SettingSimpananService(db as any).findAll()).toEqual({ ID: 1 });
  });
});

describe('message-returning submits use callWithMessage', () => {
  it('payroll', async () => {
    const db = mockDb();
    db.callWithMessage.mockResolvedValue('ok');
    const d = new Date();
    expect(await new TransaksiPayrollService(db as any).SubmitTransaksiSimpananPosting({ Tanggal: d } as any, 'u')).toBe('ok');
    expect(db.callWithMessage).toHaveBeenCalledWith(expect.stringContaining('@p_Message'), [d, 'u']);
  });

  it('penarikan: insufficient balance throws before the CALL', async () => {
    const db = mockDb();
    db.query.mockResolvedValue([[{ Saldo: 5 }]]);
    const svc = new TransaksiPenarikanService(db as any);
    await expect(svc.SubmitTransaksiSimpananPenarikan({ Jumlah: 10 } as any, 'u')).rejects.toThrow('Saldo tidak mencukupi.');
    expect(db.callWithMessage).not.toHaveBeenCalled();
  });

  it('penarikan + resign return the message', async () => {
    const db = mockDb();
    db.query.mockResolvedValue([[{ Saldo: 50 }]]);
    db.callWithMessage.mockResolvedValue('success');
    const svc = new TransaksiPenarikanService(db as any);
    expect(await svc.SubmitTransaksiSimpananPenarikan({ Jumlah: 10 } as any, 'u')).toBe('success');
    expect(await svc.SubmitTransaksiSimpananPenarikanResign({} as any, 'u')).toBe('success');
    expect(db.callWithMessage).toHaveBeenCalledTimes(2);
  });

  it('tunai submit still returns nothing', async () => {
    const db = mockDb();
    expect(await new TransaksiTunaiService(db as any).SubmitTransaksiSimpananTunai({} as any, 'u')).toBeUndefined();
  });
});
