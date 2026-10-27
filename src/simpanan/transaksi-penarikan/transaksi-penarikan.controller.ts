import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtPayloadDto } from '../../auth/dto/jwt-payload.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CloseTransaksiPenarikanDto } from '../dto/close-transaksi-penarikan.dto';
import { SubmitTransaksiPenarikanDto } from '../dto/submit-transaksi-penarikan.dto';
import { SubmitTransaksiPenarikanResignDto } from '../dto/submit-transaksi-penarikan-resign.dto';
import { ViewTransaksiPenarikanDto } from '../dto/view-transaksi-penarikan.dto';
import { TransaksiPenarikanService } from './transaksi-penarikan.service';

@Controller('withdrawals')
export class TransaksiPenarikanController {
  constructor(private readonly transaksiPenarikanService: TransaksiPenarikanService) {}

  @Get()
  ViewTransaksiSimpananPenarikan(@Query() dto: ViewTransaksiPenarikanDto) {
    return this.transaksiPenarikanService.ViewTransaksiSimpananPenarikan(dto);
  }

  @Post()
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

  @Get('resignations')
  ViewTransaksiSimpananPenarikanResign(@Query() dto: ViewTransaksiPenarikanDto) {
    return this.transaksiPenarikanService.ViewTransaksiSimpananPenarikanResign(dto);
  }

  @Get('resignations/:withdrawalId')
  GetTransaksiSimpananPenarikanResign(
    @Param('withdrawalId') idPengambilan: string,
  ) {
    return this.transaksiPenarikanService.GetTransaksiSimpananPenarikanResign(
      idPengambilan,
    );
  }

  @Get(':withdrawalId')
  GetTransaksiSimpananPenarikan(@Param('withdrawalId') idPengambilan: string) {
    return this.transaksiPenarikanService.GetTransaksiSimpananPenarikan(idPengambilan);
  }

  @Post('resignations')
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

  @Post('resignations/close')
  @UseGuards(JwtAuthGuard)
  CloseTransaksiSimpananPenarikanResign(@Body() dto: CloseTransaksiPenarikanDto) {
    return this.transaksiPenarikanService.CloseTransaksiSimpananPenarikanResign(dto);
  }
}
