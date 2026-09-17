import { Injectable } from '@nestjs/common';
import { CreateSimpananDto } from './dto/create-setting-simpanan.dto';
import { UpdateSimpananDto } from './dto/update-setting-simpanan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingSimpanan } from './entities/setting-simpanan.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';

@Injectable()
export class SimpananService {
  create(createSimpananDto: CreateSimpananDto) {
    return 'This action adds a new simpanan';
  }

  findAll() {
    return `This action returns all simpanan`;
  }

  findOne(id: number) {
    return `This action returns a #${id} simpanan`;
  }

  update(id: number, updateSimpananDto: UpdateSimpananDto) {
    return `This action updates a #${id} simpanan`;
  }

  remove(id: number) {
    return `This action removes a #${id} simpanan`;
  }
}
