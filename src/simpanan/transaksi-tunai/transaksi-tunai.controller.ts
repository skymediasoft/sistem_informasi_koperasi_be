import { Controller, Get, Post, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtPayloadDto } from '../../auth/dto/jwt-payload.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ViewTransaksiSimpananTunaiDto } from '../dto/view-transaksi-simpanan-tunai.dto';
import { SubmitTransaksiSimpananTunaiDto } from '../dto/submit-transaksi-simpanan-tunai.dto';
import { TransaksiTunaiService } from './transaksi-tunai.service';

@Controller('cash-transactions')
export class TransaksiTunaiController {
  constructor(private readonly transaksiTunaiService: TransaksiTunaiService) {}

  @Get()
  ViewTransaksiSimpananTunai(@Query() dto: ViewTransaksiSimpananTunaiDto) {
    return this.transaksiTunaiService.ViewTransaksiSimpananTunai(dto);
  }

  @Get(':transactionId')
  GetTransaksiSimpananTunai(@Param('transactionId') idTransaksi: string) {
    return this.transaksiTunaiService.GetTransaksiSimpananTunai(idTransaksi);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  SubmitTransaksiSimpananTunai(@Body() dto: SubmitTransaksiSimpananTunaiDto, @Request() req: { user: JwtPayloadDto }) {
    return this.transaksiTunaiService.SubmitTransaksiSimpananTunai(dto, req.user.username);
  }
}
