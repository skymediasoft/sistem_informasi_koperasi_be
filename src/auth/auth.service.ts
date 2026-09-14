import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Inject } from '@nestjs/common';
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
import { mapAuthorizationToTree } from './utils/menu-parser.util';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) { }

  private async generateTokens(jwtPayloadDto: JwtPayloadDto) {
    const payload = {
      sub: jwtPayloadDto.userlogin,
      name: jwtPayloadDto.username,
      email: jwtPayloadDto.email,
      groupId: jwtPayloadDto.groupId,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshPayload = { ...payload, jti: randomUUID() };
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  async getAllUsers() {
    return await this.userRepository.find({
      select: {
        userLogin: true,
        userName: true,
        userEmail: true,
        postBy: true,
        postDate: true,
        groupId: true,
      }
    }); 
  }

  async register(registerDto: RegisterDto) {
    const userlogin = registerDto.userlogin;
    const username = registerDto.username;
    const { password, email, groupId } = registerDto;

    if (!userlogin) {
      throw new BadRequestException('userlogin is required');
    }
    if (!password) {
      throw new BadRequestException('password is required');
    }

    const existing = await this.userRepository.findOne({ where: { userLogin: userlogin } });
    if (existing) {
      throw new ConflictException('UserLogin already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({
      userLogin: userlogin,
      userName: username,
      userPassword: hashedPassword,
      userEmail: email,
      groupId: groupId,
      postBy: 'SYSTEM',
    });
    const user = await this.userRepository.save(newUser);
    const { accessToken, refreshToken } = await this.generateTokens({
      userlogin: user.userLogin,
      username: user.userName,
      email: user.userEmail || '',
      groupId: user.groupId,
    });
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { username: user.userLogin, "name": user.userName },
    };
  }

  async login(loginDto: LoginDto) {
    const userlogin = loginDto.userlogin;
    const { password } = loginDto;

    if (!userlogin || !password) {
      throw new BadRequestException('userlogin and password are required');
    }

    const user = await this.userRepository.findOne({ where: { userLogin: userlogin } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.userPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens({
      userlogin: user.userLogin,
      username: user.userName,
      email: user.userEmail || '',
      groupId: user.groupId,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      success: 1,
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    if (!refreshToken) {
      throw new BadRequestException('refreshToken is required');
    }

    let payload: { sub?: string; userlogin?: string; name?: string; username?: string; email?: string; groupId?: number };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userLogin = payload.sub || payload.userlogin || payload.username;
    if (!userLogin) {
      throw new UnauthorizedException('Invalid refresh token payload');
    }

    const user = await this.userRepository.findOne({ where: { userLogin } });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const { accessToken, refreshToken: rotatedRefreshToken } = await this.generateTokens({
      userlogin: user.userLogin,
      username: user.userName,
      email: user.userEmail || '',
      groupId: user.groupId,
    });
    return {
      access_token: accessToken,
      refresh_token: rotatedRefreshToken,
    };
  }

  async logout(userLogin: string) {
    if (!userLogin) {
      throw new BadRequestException('userLogin is required');
    }
    const user = await this.userRepository.findOne({ where: { userLogin } });
    return { message: 'Logged out successfully' };
  }

  async getMenuAuthorization(groupId?: number) {
    if (groupId === undefined || groupId === null) {
      throw new BadRequestException('User group ID is missing from token');
    }

    const [rows] = await this.userRepository.query(
      `CALL sp_get_group_authorization(?)`,
      [groupId]
    );

    return mapAuthorizationToTree(rows || []);
  }
}