import { Controller, Post, Body, Get, Patch, UseGuards, Request, Delete, Param } from '@nestjs/common';  
import { AnggotaAuthService } from './anggota-auth.service';
import { UpdateAnggotaDto } from './dto/update-anggota.dto';
import { RegisterAnggotaDto } from './dto/register-anggota.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { LoginDto } from './dto/login.dto';

@Controller('anggota-auth')
export class AnggotaAuthController {
    constructor(private readonly anggotaAuthService: AnggotaAuthService) { }
    
    @UseGuards(JwtAuthGuard)
    @Post('register')
    async registerAnggota(@Body() registerAnggotaDto: RegisterAnggotaDto, @Request() req: { user: JwtPayloadDto }) {
    return this.anggotaAuthService.registerAnggota(registerAnggotaDto, req.user.username);
    }

    @Patch('update')
    async updateAnggota(@Body() updateAnggotaDto: UpdateAnggotaDto, @Request() req: { user: JwtPayloadDto }) {
        return this.anggotaAuthService.updateAnggota(updateAnggotaDto, req.user.username);
    }

    @Get('all')
    async getAllAnggota() {
        return this.anggotaAuthService.getAllAnggota();
    }

    @Delete(':id')
    async deleteAnggota(@Param('id') id: string) {
        return this.anggotaAuthService.deleteAnggota(id);
    }

    @Post('login')
    async loginAnggota(@Body() loginDto: LoginDto) {
        return this.anggotaAuthService.loginAnggota(loginDto);
    }
}