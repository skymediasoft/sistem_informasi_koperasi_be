import { Module } from '@nestjs/common';
import { TransaksiSimpananService } from './transaksi-simpanan.service';
import { TransaksiSimpananController } from './transaksi-simpanan.controller';
import { SettingSimpananService } from './setting-simpanan.service';
import { SettingSimpananController } from './setting-simpanan.controller';
import { SettingSimpanan } from './entities/setting-simpanan.entity';
import { TransaksiSimpanan } from './entities/transaksi-simpanan.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports : [TypeOrmModule.forFeature([SettingSimpanan, TransaksiSimpanan])],
  controllers: [TransaksiSimpananController, SettingSimpananController],
  providers: [TransaksiSimpananService, SettingSimpananService],
})
export class SimpananModule {}
