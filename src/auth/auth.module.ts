import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt-strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/auth.entity';
import { Anggota } from './entities/anggota.entity';
import { AnggotaAuthController } from './anggota-auth.controller';
import { AnggotaAuthService } from './anggota-auth.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({}),
    TypeOrmModule.forFeature([User, Anggota]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController, UsersController, AnggotaAuthController],
  providers: [AuthService, JwtStrategy, AnggotaAuthService],
  exports: [AuthService, JwtModule, PassportModule, TypeOrmModule],
})
export class AuthModule { }