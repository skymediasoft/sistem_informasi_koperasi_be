import { Controller, Post, Body, Get, Patch, UseGuards, Request, Delete, Param, HttpStatus, HttpCode } from '@nestjs/common';  
import { AnggotaAuthService } from './anggota-auth.service';
import { UpdateAnggotaDto } from './dto/update-anggota.dto';
import { RegisterAnggotaDto } from './dto/register-anggota.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { LoginDto } from './dto/login.dto';

@Controller('anggota-auth')
export class AnggotaAuthController {
    constructor(private readonly anggotaAuthService: AnggotaAuthService) { }

    @Get('all')
    async getAllAnggota() {
        return this.anggotaAuthService.getAllAnggota();
    }
    
    @Get(':noAnggota')
    async getAnggota(@Param('noAnggota') noAnggota: string) {
        return this.anggotaAuthService.getAnggota(noAnggota);
    }

    @UseGuards(JwtAuthGuard)
    @Post('register')
    async registerAnggota(@Body() registerAnggotaDto: RegisterAnggotaDto, @Request() req: { user: JwtPayloadDto }) {
        return this.anggotaAuthService.registerAnggota(registerAnggotaDto, req.user.username);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('update/:id')
    @HttpCode(HttpStatus.OK)
    async updateAnggota(@Body() updateAnggotaDto: UpdateAnggotaDto, @Request() req: { user: JwtPayloadDto }, @Param('id') id: string) {
        return this.anggotaAuthService.updateAnggota(updateAnggotaDto, req.user.username, id);
    }

    @Delete('delete/:id')
    async deleteAnggota(@Param('id') id: string) {
        return this.anggotaAuthService.deleteAnggota(id);
    }

    @Post('login')
    async loginAnggota(@Body() loginDto: LoginDto) {
        return this.anggotaAuthService.loginAnggota(loginDto);
    }
}