import { PartialType } from '@nestjs/mapped-types';
import { CreateSettingSimpananDto } from './create-setting-simpanan.dto';

export class UpdateSettingSimpananDto extends PartialType(CreateSettingSimpananDto) {}
