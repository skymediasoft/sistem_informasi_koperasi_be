import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SimpananService } from './simpanan.service';
import { CreateSimpananDto } from './dto/create-setting-simpanan.dto';
import { UpdateSimpananDto } from './dto/update-setting-simpanan.dto';

@Controller('simpanan')
export class SimpananController {
  constructor(private readonly simpananService: SimpananService) {}

  @Post()
  create(@Body() createSimpananDto: CreateSimpananDto) {
    return this.simpananService.create(createSimpananDto);
  }

  @Get()
  findAll() {
    return this.simpananService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.simpananService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSimpananDto: UpdateSimpananDto) {
    return this.simpananService.update(+id, updateSimpananDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simpananService.remove(+id);
  }
}
