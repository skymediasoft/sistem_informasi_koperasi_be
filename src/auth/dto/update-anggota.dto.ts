import { PartialType } from '@nestjs/mapped-types';
import { RegisterAnggotaDto } from './register-anggota.dto';

export class UpdateAnggotaDto extends PartialType(RegisterAnggotaDto) {}