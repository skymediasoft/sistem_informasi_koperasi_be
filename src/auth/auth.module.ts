import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { UsersController } from './users.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt-strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnggotaAuthController } from './anggota-auth.controller';
import { AnggotaAuthService } from './anggota-auth.service';
import { UserRepository } from './user.repository';
import { AnggotaRepository } from './anggota.repository';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({}),
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
  providers: [AuthService, JwtStrategy, AnggotaAuthService, UserRepository, AnggotaRepository],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule { }