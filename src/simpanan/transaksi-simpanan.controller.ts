import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TransaksiSimpananService } from './transaksi-simpanan.service';

@Controller('transaksi-simpanan')
export class TransaksiSimpananController {
  constructor(private readonly simpananService: TransaksiSimpananService) {}

  @Get()
  findAll() {
    return this.simpananService.findAll();
  } 
}
