import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtPayloadDto } from '../../auth/dto/jwt-payload.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CloseTransaksiPenarikanDto } from '../dto/close-transaksi-penarikan.dto';
import { SubmitTransaksiPenarikanDto } from '../dto/submit-transaksi-penarikan.dto';
import { SubmitTransaksiPenarikanResignDto } from '../dto/submit-transaksi-penarikan-resign.dto';
import { ViewTransaksiPenarikanDto } from '../dto/view-transaksi-penarikan.dto';
import { TransaksiPenarikanService } from './transaksi-penarikan.service';

@Controller('transaksi-penarikan')
export class TransaksiPenarikanController {
  constructor(private readonly transaksiPenarikanService: TransaksiPenarikanService) {}

  @Get()
  ViewTransaksiSimpananPenarikan(@Body() dto: ViewTransaksiPenarikanDto) {
    return this.transaksiPenarikanService.ViewTransaksiSimpananPenarikan(dto);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  SubmitTransaksiSimpananPenarikan(
    @Body() dto: SubmitTransaksiPenarikanDto,
    @Request() req: { user: JwtPayloadDto },
  ) {
    return this.transaksiPenarikanService.SubmitTransaksiSimpananPenarikan(
      dto,
      req.user.username,
    );
  }

  @Post('close')
  @UseGuards(JwtAuthGuard)
  CloseTransaksiSimpananPenarikan(@Body() dto: CloseTransaksiPenarikanDto) {
    return this.transaksiPenarikanService.CloseTransaksiSimpananPenarikan(dto);
  }

  @Get('resign')
  ViewTransaksiSimpananPenarikanResign(@Body() dto: ViewTransaksiPenarikanDto) {
    return this.transaksiPenarikanService.ViewTransaksiSimpananPenarikanResign(dto);
  }

  @Get('resign/:idPengambilan')
  GetTransaksiSimpananPenarikanResign(
    @Param('idPengambilan') idPengambilan: string,
  ) {
    return this.transaksiPenarikanService.GetTransaksiSimpananPenarikanResign(
      idPengambilan,
    );
  }

  @Get(':idPengambilan')
  GetTransaksiSimpananPenarikan(@Param('idPengambilan') idPengambilan: string) {
    return this.transaksiPenarikanService.GetTransaksiSimpananPenarikan(idPengambilan);
  }

  @Post('resign/submit')
  @UseGuards(JwtAuthGuard)
  SubmitTransaksiSimpananPenarikanResign(
    @Body() dto: SubmitTransaksiPenarikanResignDto,
    @Request() req: { user: JwtPayloadDto },
  ) {
    return this.transaksiPenarikanService.SubmitTransaksiSimpananPenarikanResign(
      dto,
      req.user.username,
    );
  }

  @Post('resign/close')
  @UseGuards(JwtAuthGuard)
  CloseTransaksiSimpananPenarikanResign(@Body() dto: CloseTransaksiPenarikanDto) {
    return this.transaksiPenarikanService.CloseTransaksiSimpananPenarikanResign(dto);
  }
}
