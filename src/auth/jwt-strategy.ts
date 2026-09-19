import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { ConfigService } from '@nestjs/config';
 
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any): Promise<JwtPayloadDto> {
    return {
      userlogin: payload.sub,
      username: payload.name,
      email: payload.email,
      groupId: payload.groupId,
      noAnggota: payload.noAnggota,
    };
  }
}