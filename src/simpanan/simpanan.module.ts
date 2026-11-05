import { Module } from '@nestjs/common';
import { TransaksiPayrollService } from './transaksi-payroll/transaksi-payroll.service';
import { TransaksiPayrollController } from './transaksi-payroll/transaksi-payroll.controller';
import { TransaksiTunaiService } from './transaksi-tunai/transaksi-tunai.service';
import { TransaksiTunaiController } from './transaksi-tunai/transaksi-tunai.controller';
import { SettingSimpananService } from './setting-simpanan/setting-simpanan.service';
import { SettingSimpananController } from './setting-simpanan/setting-simpanan.controller';
import { AuthModule } from '../auth/auth.module';
import { TransaksiPenarikanService } from './transaksi-penarikan/transaksi-penarikan.service';
import { TransaksiPenarikanController } from './transaksi-penarikan/transaksi-penarikan.controller';

@Module({
  imports: [AuthModule],
  controllers: [TransaksiPayrollController, TransaksiTunaiController, SettingSimpananController, TransaksiPenarikanController],
  providers: [TransaksiPayrollService, TransaksiTunaiService, SettingSimpananService, TransaksiPenarikanService],
})
export class SimpananModule {}
