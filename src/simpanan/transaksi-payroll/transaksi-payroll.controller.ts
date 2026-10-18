import { Controller, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { TransaksiPayrollService } from './transaksi-payroll.service';
import { SubmitTransaksiSimpananPostingDto } from '../dto/submit-transaksi-simpanan-posting.dto';
import { JwtPayloadDto } from '../../auth/dto/jwt-payload.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('payroll')
export class TransaksiPayrollController {
  constructor(private readonly transaksiPayrollService: TransaksiPayrollService) {}

  @Get()
  GetTransaksiSimpananPosting() {
    return this.transaksiPayrollService.GetTransaksiSimpananPosting();
  } 

  @Get('history/:tahun')
  HistoryTransaksiSimpananPosting(@Param('tahun') tahun: number) {
    return this.transaksiPayrollService.HistoryTransaksiSimpananPosting({ Tahun: tahun });
  }

  @Get('view-detail/:IDTransaksi')
  ViewDetailTransaksiSimpananPosting(@Param('IDTransaksi') IDTransaksi: string) {
    return this.transaksiPayrollService.ViewDetailTransaksiSimpananPosting(IDTransaksi);
  }

  @Post('submit-posting')
  @UseGuards(JwtAuthGuard)
  SubmitTransaksiSimpananPosting(@Body() dto: SubmitTransaksiSimpananPostingDto, @Request() req: { user: JwtPayloadDto }) {
    return this.transaksiPayrollService.SubmitTransaksiSimpananPosting(dto, req.user.username);
  }
}
