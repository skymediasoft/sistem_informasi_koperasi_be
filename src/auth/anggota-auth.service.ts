import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Anggota } from './entities/anggota.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from './entities/auth.entity';
import { RegisterAnggotaDto } from './dto/register-anggota.dto';

@Injectable()
export class AnggotaAuthService extends AuthService {
  private readonly anggotaRepository: Repository<Anggota>;
  constructor(
    @InjectRepository(Anggota)
    anggotaRepository: Repository<Anggota>,
    jwtService: JwtService,
    config: ConfigService,
  ) {
    super(
      anggotaRepository as unknown as Repository<User>,
      jwtService,
      config,
    );
  }

  async registerAnggota(registerAnggotaDto: RegisterAnggotaDto) {
    await this.anggotaRepository.save(registerAnggotaDto);
  }

}