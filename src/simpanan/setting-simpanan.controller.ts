import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateSimpananDto } from './dto/create-setting-simpanan.dto';
import { UpdateSimpananDto } from './dto/update-setting-simpanan.dto';
import { SettingSimpananService } from './setting-simpanan.service';

@Controller('setting-simpanan')
export class SettingSimpananController {
  constructor(private readonly simpananService: SettingSimpananService) {}
  
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

  @Post('update-apply')
  updateApply(@Body() createSimpananDto: CreateSimpananDto) {
    return this.simpananService.updateApply(createSimpananDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simpananService.remove(+id);
  }
}
