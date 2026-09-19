import { Controller, Post, Body, Get, Put, Patch } from '@nestjs/common';  
import { AnggotaAuthService } from './anggota-auth.service';
import { UpdateAnggotaDto } from './dto/update-anggota.dto';
import { RegisterAnggotaDto } from './dto/register-anggota.dto';

@Controller('anggota-auth')
export class AnggotaAuthController {
    constructor(private readonly anggotaAuthService: AnggotaAuthService) { }
    
    @Post('register')
    async registerAnggota(@Body() registerAnggotaDto: RegisterAnggotaDto) {
        return this.anggotaAuthService.registerAnggota(registerAnggotaDto);
    }

    @Patch('update')
    async updateAnggota(@Body() updateAnggotaDto: UpdateAnggotaDto) {
        return this.anggotaAuthService.updateAnggota(updateAnggotaDto);
    }

    @Get('all')
    async getAllAnggota() {
        return this.anggotaAuthService.getAllAnggota();
    }
}
