import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { MenuRepository } from './menu.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MenuController],
  providers: [MenuService, MenuRepository],
  exports: [MenuRepository],
})
export class MenuModule {}
