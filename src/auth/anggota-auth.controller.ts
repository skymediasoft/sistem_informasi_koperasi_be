import { Controller, Post, Body, Get, Patch, UseGuards, Request, Delete, Param, HttpStatus, HttpCode } from '@nestjs/common';  
import { AnggotaAuthService } from './anggota-auth.service';
import { UpdateAnggotaDto } from './dto/update-anggota.dto';
import { RegisterAnggotaDto } from './dto/register-anggota.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AnggotaAuthController {
    constructor(private readonly anggotaAuthService: AnggotaAuthService) { }

    @Get('members')
    async getAllAnggota() {
        return this.anggotaAuthService.getAllAnggota();
    }
    
    @Get('members/:memberNo')
    async getAnggota(@Param('memberNo') memberNo: string) {
        return this.anggotaAuthService.getAnggota(memberNo);
    }

    @UseGuards(JwtAuthGuard)
    @Post('members')
    async registerAnggota(@Body() registerAnggotaDto: RegisterAnggotaDto, @Request() req: { user: JwtPayloadDto }) {
        return this.anggotaAuthService.registerAnggota(registerAnggotaDto, req.user.username);
    }

    @UseGuards(JwtAuthGuard)
    @Patch('members/:id')
    @HttpCode(HttpStatus.OK)
    async updateAnggota(@Body() updateAnggotaDto: UpdateAnggotaDto, @Request() req: { user: JwtPayloadDto }, @Param('id') id: string) {
        return this.anggotaAuthService.updateAnggota(updateAnggotaDto, req.user.username, id);
    }

    @Delete('members/:id')
    async deleteAnggota(@Param('id') id: string) {
        return this.anggotaAuthService.deleteAnggota(id);
    }

    @Post('auth/members/login')
    async loginAnggota(@Body() loginDto: LoginDto) {
        return this.anggotaAuthService.loginAnggota(loginDto);
    }
}