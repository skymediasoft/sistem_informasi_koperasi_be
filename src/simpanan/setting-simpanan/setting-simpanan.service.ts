import { Injectable } from '@nestjs/common';
import { CreateSettingSimpananDto } from '../dto/create-setting-simpanan.dto';
import { UpdateSettingSimpananDto } from '../dto/update-setting-simpanan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingSimpanan } from '../entities/setting-simpanan.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';

@Injectable()
export class SettingSimpananService {
  constructor(
    @InjectRepository(SettingSimpanan)
    private readonly settingSimpananRepository: Repository<SettingSimpanan>
  ) {}

  async findAll() {
    const settings = await this.settingSimpananRepository.find();
    return settings[0];
  }

  async update(id: number, updateSettingSimpananDto: UpdateSettingSimpananDto) {
    return await this.settingSimpananRepository.update(id, updateSettingSimpananDto);
  }

  async updateApply(createSettingSimpananDto: CreateSettingSimpananDto) {
    await this.settingSimpananRepository.query('SET @SimpananPokok = ?, @SimpananWajib = ?, @SimpananSukarela = ?', 
      [createSettingSimpananDto.SimpananPokok, createSettingSimpananDto.SimpananWajib, createSettingSimpananDto.SimpananSukarela]);
    return await this.settingSimpananRepository.query(
      'CALL sp_Update_Setting_Simpanan (@SimpananPokok, @SimpananWajib, @SimpananSukarela);'
    );
  }

  remove(id: number) {
    return `This action removes a #${id} simpanan`;
  }
}
