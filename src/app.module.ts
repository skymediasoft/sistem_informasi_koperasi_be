import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './auth/entities/auth.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2';
import { DepartmentModule } from './department/department.module';
import { MenuModule } from './menu/menu.module';
import { GroupModule } from './group/group.module';
import { SimpananModule } from './simpanan/simpanan.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('SQL_HOST'),
        port: configService.get<number>('SQL_PORT'),
        username: configService.get<string>('SQL_USERNAME'),
        password: configService.get<string>('SQL_PASSWORD'),
        database: configService.get<string>('SQL_DATABASE'),
        driver: mysql,
        entities: [User],
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    DepartmentModule,
    MenuModule,
    GroupModule,
    SimpananModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
