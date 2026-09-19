import { PartialType } from '@nestjs/mapped-types';
import { RegisterAnggotaDto } from './register-anggota.dto';
import { IsString } from 'class-validator';

export class UpdateAnggotaDto extends PartialType(RegisterAnggotaDto) {
    @IsString()
    StatusAnggota: string;
}