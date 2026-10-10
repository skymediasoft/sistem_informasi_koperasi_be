import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreateSettingSimpananDto } from '../dto/create-setting-simpanan.dto';
import { UpdateSettingSimpananDto } from '../dto/update-setting-simpanan.dto';
import { SettingSimpananService } from './setting-simpanan.service';

@Controller('setting-simpanan')
export class SettingSimpananController {
  constructor(private readonly simpananService: SettingSimpananService) {}
  
  @Get()
  findAll() {
    return this.simpananService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSettingSimpananDto: UpdateSettingSimpananDto) {
    return this.simpananService.update(+id, updateSettingSimpananDto);
  }

  @Post('update-apply')
  updateApply(@Body() createSettingSimpananDto: CreateSettingSimpananDto) {
    return this.simpananService.updateApply(createSettingSimpananDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.simpananService.remove(+id);
  }
}
