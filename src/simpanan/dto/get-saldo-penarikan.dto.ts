import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class GetSaldoPenarikanDto {
    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    NoEmployee: string;

    @Transform(trim)
    @IsString()
    @IsNotEmpty()
    @MaxLength(20)
    JenisSimpanan: string;
}
