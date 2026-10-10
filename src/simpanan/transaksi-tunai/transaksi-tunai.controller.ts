import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { JwtPayloadDto } from '../../auth/dto/jwt-payload.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ViewTransaksiSimpananTunaiDto } from '../dto/view-transaksi-simpanan-tunai.dto';
import { SubmitTransaksiSimpananTunaiDto } from '../dto/submit-transaksi-simpanan-tunai.dto';
import { TransaksiTunaiService } from './transaksi-tunai.service';

@Controller('tunai')
export class TransaksiTunaiController {
  constructor(private readonly transaksiTunaiService: TransaksiTunaiService) {}

  @Get()
  ViewTransaksiSimpananTunai(@Body() dto: ViewTransaksiSimpananTunaiDto) {
    return this.transaksiTunaiService.ViewTransaksiSimpananTunai(dto);
  }

  @Get(':idTransaksi')
  GetTransaksiSimpananTunai(@Param('idTransaksi') idTransaksi: string) {
    return this.transaksiTunaiService.GetTransaksiSimpananTunai(idTransaksi);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  SubmitTransaksiSimpananTunai(@Body() dto: SubmitTransaksiSimpananTunaiDto, @Request() req: { user: JwtPayloadDto }) {
    return this.transaksiTunaiService.SubmitTransaksiSimpananTunai(dto, req.user.username);
  }
}
