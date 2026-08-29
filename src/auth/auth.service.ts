import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ConfigService } from '@nestjs/config';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { User } from './entities/auth.entity';
import { randomUUID } from 'crypto';
import { encryptPassword } from './utils/encryption.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) { }

  private async generateTokens(username: string) {
    const payload = { sub: username, username };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshPayload = { ...payload, jti: randomUUID() };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async register(registerDto: RegisterDto) {
    const { username, password, name, email, groupId } = registerDto;
    const existing = await this.userRepository.findOne({ where: { userLogin: username } });
    if (existing) {
      throw new ConflictException('Username already exists');
    }
    const encryptedPassword = encryptPassword(password, this.config.get<string>('ENCRYPTION_KEY'));
    const newUser = this.userRepository.create({
      userLogin: username,
      userName: name,
      userPassword: encryptedPassword,
      userEmail: email,
      groupId: groupId,
      postBy: 'SYSTEM',
    });
    const user = await this.userRepository.save(newUser);
    const { accessToken, refreshToken } = await this.generateTokens(user.userLogin);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { username: user.userLogin, "Name": user.userName },
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    const encryptedPassword = encryptPassword(password, this.config.get<string>('ENCRYPTION_KEY'));

    const [rows] = await this.userRepository.query(
      `CALL GetUserLogin(?, ?)`,
      [username, encryptedPassword]
    );

    const user = rows?.[0];
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user.UserLogin);

    const { UserPassword, ...userPayload } = user;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: userPayload,
    };
  }


  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    let payload: JwtPayloadDto;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayloadDto>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.userRepository.findOne({ where: { userLogin: payload.username } });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const { accessToken, refreshToken: rotatedRefreshToken } = await this.generateTokens(user.userLogin);
    return {
      access_token: accessToken,
      refresh_token: rotatedRefreshToken,
    };
  }

  async logout(username: string) {
    const user = await this.userRepository.findOne({ where: { userLogin: username } });
    return { message: 'Logged out successfully' };
  }
}