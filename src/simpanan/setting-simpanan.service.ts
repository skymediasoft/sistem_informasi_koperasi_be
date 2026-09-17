import { Injectable } from '@nestjs/common';
import { CreateSimpananDto } from './dto/create-setting-simpanan.dto';
import { UpdateSimpananDto } from './dto/update-setting-simpanan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingSimpanan } from './entities/setting-simpanan.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';

@Injectable()
export class SettingSimpananService {
  constructor(
    @InjectRepository(SettingSimpanan)
    private readonly settingSimpananRepository: Repository<SettingSimpanan>
  ) {}
  create(createSimpananDto: CreateSimpananDto) {
    return 'This action adds a new simpanan';
  }

  async findAll() {
    return await this.settingSimpananRepository.find();
  }

  async findOne(id: number) {
    return await this.settingSimpananRepository.findOneBy({ ID: id });
  }

  async update(id: number, updateSimpananDto: UpdateSimpananDto) {
    return await this.settingSimpananRepository.update(id, updateSimpananDto);
  }

  async updateApply(createSimpananDto: CreateSimpananDto) {
    return await this.settingSimpananRepository.query(
      'EXEC sp_update_Setting_Simpanan @p_SimpananPokok = @0, @p_SimpananWajib = @1, @p_SimpananSukarela = @2',
      [createSimpananDto.SimpananPokok, createSimpananDto.SimpananWajib, createSimpananDto.SimpananSukarela],
    );
  }

  remove(id: number) {
    return `This action removes a #${id} simpanan`;
  }
}
