import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DepartmentModule } from './department/department.module';
import { MenuModule } from './menu/menu.module';
import { GroupModule } from './group/group.module';
import { SimpananModule } from './simpanan/simpanan.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    DepartmentModule,
    MenuModule,
    GroupModule,
    SimpananModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
