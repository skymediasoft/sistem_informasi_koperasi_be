import { PartialType } from '@nestjs/mapped-types';
import { CreateSimpananDto } from './create-setting-simpanan.dto';

export class UpdateSimpananDto extends PartialType(CreateSimpananDto) {}
