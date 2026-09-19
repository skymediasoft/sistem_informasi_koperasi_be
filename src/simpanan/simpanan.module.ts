import { Module } from '@nestjs/common';
import { SimpananService } from './simpanan.service';
import { SimpananController } from './simpanan.controller';
import { SettingSimpananService } from './setting-simpanan.service';
import { SettingSimpananController } from './setting-simpanan.controller';

@Module({
  controllers: [SimpananController, SettingSimpananController],
  providers: [SimpananService, SettingSimpananService],
})
export class SimpananModule {}
