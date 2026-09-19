import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Anggota } from './entities/anggota.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { User } from './entities/auth.entity';
import { RegisterAnggotaDto } from './dto/register-anggota.dto';
import { UpdateAnggotaDto } from './dto/update-anggota.dto';

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

  async getAllAnggota() {
    return await this.anggotaRepository.find();
  }

  async registerAnggota(registerAnggotaDto: RegisterAnggotaDto) {
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
        registerAnggotaDto.CreatedUser,
      ],
    );
    const rows: { p_Message?: string }[] = (await this.anggotaRepository.query(
      'SELECT @p_Message AS p_Message',
    )) as { p_Message?: string }[];
    return rows[0]?.p_Message;
  }

  async updateAnggota(updateAnggotaDto: UpdateAnggotaDto) {
    await this.anggotaRepository.query(
      'CALL sp_M_Anggota_Update(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @p_Message)',
      [
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
        updateAnggotaDto.AlamatEmail,
        updateAnggotaDto.CreatedUser,
      ],
    );
    const rows: { p_Message?: string }[] = (await this.anggotaRepository.query(
      'SELECT @p_Message AS p_Message',
    )) as { p_Message?: string }[];
    return rows[0]?.p_Message;
  }

  async deleteAnggota(noAnggota: string) {
    await this.anggotaRepository.delete({ NoAnggota: noAnggota });
  }

}

  

