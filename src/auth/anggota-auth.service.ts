import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AnggotaRepository } from './anggota.repository';
import { RegisterAnggotaDto } from './dto/register-anggota.dto';
import { UpdateAnggotaDto } from './dto/update-anggota.dto';
import { LoginDto } from './dto/login.dto';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AnggotaAuthService {
  constructor(
    private readonly anggotaRepository: AnggotaRepository,
    private readonly authService: AuthService,
  ) {}

  async getAnggota(noAnggota: string) {
    return await this.anggotaRepository.findByNoAnggota(noAnggota);
  }

  async getAllAnggota() {
    return await this.anggotaRepository.listView();
  }

  async registerAnggota(registerAnggotaDto: RegisterAnggotaDto, createdUser: string) {
    
    return await this.anggotaRepository.insertViaProcedure([
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
      createdUser,
    ]);
  }

  async loginAnggota(loginDto: LoginDto) {
    const { userlogin, password } = loginDto;

    if (!userlogin || !password) {
          throw new BadRequestException('userlogin and password are required');
        }
    
        const user = await this.anggotaRepository.getLoginRow(userlogin);

        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }
    
        const isPasswordValid = await bcrypt.compare(password, user.PasswordLogin);
        if (!isPasswordValid) {
          throw new UnauthorizedException('Invalid credentials');
        }
    
        const { accessToken, refreshToken } = await this.authService.generateTokens({
          userlogin: user.NoEmployee,
          noAnggota: user.NoAnggota,
          username: user.Nama,
          email: user.AlamatEmail || '',
          groupId: 0,
          groupName: user.DepartmentName,
        });
    
        return {
          access_token: accessToken,
          refresh_token: refreshToken,
          success: 1,
        };
  }

  async updateAnggota(updateAnggotaDto: UpdateAnggotaDto, updatedUser: string, noAnggota: string) {
    const result = await this.anggotaRepository.updateViaProcedure([
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
    ]);

    if (result.affectedRows === 0) {
      throw new BadRequestException('No data was updated.');
    }

    return {
      statusCode: 200,
      message: 'Data successfully updated.',
    }
  }

  async deleteAnggota(noAnggota: string) {
    try {
      await this.anggotaRepository.delete(noAnggota);
      return { message: `Anggota ${noAnggota} has been deleted.` };
    }
    catch (error) {
      throw new BadRequestException('Failed to delete anggota. Error: ' + error);
    }
  }
}

  

