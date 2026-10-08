import { Controller, Get, Post, Body, Patch, Param, Delete, Request, Req, UseGuards } from '@nestjs/common';
import { TransaksiSimpananService } from './transaksi-simpanan.service';
import { SubmitTransaksiSimpananPostingDto } from './dto/submit-transaksi-simpanan-posting.dto';
import { JwtPayloadDto } from '../auth/dto/jwt-payload.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('transaksi-simpanan')
export class TransaksiSimpananController {
  constructor(private readonly TransaksiSimpananService: TransaksiSimpananService) {}

  @Get()
  GetTransaksiSimpananPosting() {
    return this.TransaksiSimpananService.GetTransaksiSimpananPosting();
  } 

  @Get('history/:tahun')
  HistoryTransaksiSimpananPosting(@Param('tahun') tahun: number) {
    return this.TransaksiSimpananService.HistoryTransaksiSimpananPosting({ Tahun: tahun });
  }

  @Get('view-detail/:IDTransaksi')
  ViewDetailTransaksiSimpananPosting(@Param('IDTransaksi') IDTransaksi: string) {
    return this.TransaksiSimpananService.ViewDetailTransaksiSimpananPosting(IDTransaksi);
  }

  @Post('submit-posting')
  @UseGuards(JwtAuthGuard)
  SubmitTransaksiSimpananPosting(@Body() dto: SubmitTransaksiSimpananPostingDto, @Request() req: { user: JwtPayloadDto }) {
    return this.TransaksiSimpananService.SubmitTransaksiSimpananPosting(dto, req.user.username);
  }
}
