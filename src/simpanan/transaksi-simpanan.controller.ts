import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Req } from '@nestjs/common';
import { TransaksiSimpananService } from './transaksi-simpanan.service';
import { SubmitTransaksiSimpananPostingDto } from './dto/submit-transaksi-simpanan-posting.dto';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';

@Controller('transaksi-simpanan')
export class TransaksiSimpananController {
  constructor(private readonly simpananService: TransaksiSimpananService) {}

  @Get()
  findAll() {
    return this.simpananService.findAll();
  } 

  @Post('submit-posting')
  SubmitTransaksiSimpananPosting(@Body() dto: SubmitTransaksiSimpananPostingDto, @Request() req: { user: JwtPayloadDto }) {
    return this.simpananService.SubmitTransaksiSimpananPosting(dto, req.user.username);
  }
}
