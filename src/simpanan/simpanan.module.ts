import { Module } from '@nestjs/common';
import { SimpananService } from './simpanan.service';
import { SimpananController } from './simpanan.controller';
import { SettingSimpananService } from './setting-simpanan.service';
import { SettingSimpananController } from './setting-simpanan.controller';
import { SettingSimpanan } from './entities/setting-simpanan.entity';
import { TypeOrmModule } from '@nestjs/typeorm/dist/typeorm.module';

@Module({
  imports : [TypeOrmModule.forFeature([SettingSimpanan])],
  controllers: [SimpananController, SettingSimpananController],
  providers: [SimpananService, SettingSimpananService],
})
export class SimpananModule {}
