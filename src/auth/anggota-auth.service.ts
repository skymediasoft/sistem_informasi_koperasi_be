import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Anggota } from './entities/anggota.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from './entities/auth.entity';
import { RegisterAnggotaDto } from './dto/register-anggota.dto';
import { UpdateAnggotaDto } from './dto/update-anggota.dto';
import { LoginDto } from './dto/login.dto';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

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
    this.anggotaRepository = anggotaRepository;
  }

  async getAnggota(noAnggota: string) {
    return await this.anggotaRepository.findOne({ where: { NoAnggota: noAnggota } });
  }

  async getAllAnggota() {
    return await this.anggotaRepository.query('SELECT * FROM vw_M_Anggota');
  }

  async registerAnggota(registerAnggotaDto: RegisterAnggotaDto, createdUser: string) {
    
    await this.anggotaRepository.query(
      'CALL sp_M_Anggota_Insert(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @p_Message)',
      [
        registerAnggotaDto.NoEmployee,
        registerAnggotaDto.Nama,
        registerAnggotaDto.Alamat,
        registerAnggotaDto.Telpon,
        registerAnggotaDto.JenisKelamin,
        registerAnggotaDto.DepartmentId,
        registerAnggotaDto.JenisAnggota,
        registerAnggotaDto.TanggalMasuk,
        registerAnggotaDto.NoRekening,
        registerAnggotaDto.SimpananPokok,
        registerAnggotaDto.SimpananWajib,
        registerAnggotaDto.SimpananSukarela,
        registerAnggotaDto.AlamatEmail,
        createdUser
      ],
    );

    const [out] = await this.anggotaRepository.query(
      'SELECT @p_Message AS p_Message',
    );

    return out?.p_Message as string;
  }

  async loginAnggota(loginDto: LoginDto) {
    const { userlogin, password } = loginDto;

    if (!userlogin || !password) {
          throw new BadRequestException('userlogin and password are required');
        }
    
        const user = await this.anggotaRepository.findOne({ where: { NoEmployee: userlogin } });

        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }
    
        const isPasswordValid = await bcrypt.compare(password, user.PasswordLogin);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }
    
        const { accessToken, refreshToken } = await this.generateTokens({
          userlogin: user.NoEmployee,
          noAnggota: user.NoAnggota,
          username: user.Nama,
          email: user.AlamatEmail || '',
          groupId: 0,
        });
    
        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          success: 1,
        };
  }

  async updateAnggota(updateAnggotaDto: UpdateAnggotaDto, updatedUser: string, noAnggota: string) {
    const result = await this.anggotaRepository.query(
      'CALL sp_M_Anggota_Update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @p_Message)',
      [
        noAnggota,                      
        updateAnggotaDto.NoEmployee,
        updateAnggotaDto.Nama,
        updateAnggotaDto.Alamat,
        updateAnggotaDto.Telpon,
        updateAnggotaDto.JenisKelamin,
        updateAnggotaDto.DepartmentId,
        updateAnggotaDto.JenisAnggota,
        updateAnggotaDto.TanggalMasuk,
        updateAnggotaDto.NoRekening,
        updateAnggotaDto.SimpananPokok,
        updateAnggotaDto.SimpananWajib,
        updateAnggotaDto.SimpananSukarela,
        updateAnggotaDto.StatusAnggota,
        updateAnggotaDto.AlamatEmail,
        updatedUser,
      ],
    );

    if (result.affectedRows === 0) {
      throw new BadRequestException('No data was updated.');
    }
    
    const [out] = await this.anggotaRepository.query(
      'SELECT @p_Message AS p_Message',
    );

    const message = out?.p_Message as string;

    return { message };
  }

  async deleteAnggota(noAnggota: string) {
    await this.anggotaRepository.delete({ NoAnggota: noAnggota });
  }
}

  

