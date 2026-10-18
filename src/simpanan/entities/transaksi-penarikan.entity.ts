import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('T_Simpanan_Penarikan')
@Index('IDX_T_Simpanan_Penarikan', [
    'IDTransaksiSimpanan',
    'Tanggal',
    'NoAnggota',
    'StatusTransaksi',
])
export class TransaksiPenarikan {
    @PrimaryGeneratedColumn({ name: 'IDPengambilan', type: 'bigint' })
    IDPengambilan: string;

    @Column({ name: 'IDTransaksiSimpanan', type: 'bigint', nullable: true })
    IDTransaksiSimpanan: string;

    @Column({ name: 'Tanggal', type: 'date', nullable: true })
    Tanggal: string;

    @Column({ name: 'NoAnggota', type: 'varchar', length: 15, nullable: true })
    NoAnggota: string;

    @Column({ name: 'JenisSimpanan', type: 'varchar', length: 20, nullable: true })
    JenisSimpanan: string;

    @Column({ name: 'Jumlah', type: 'double', nullable: true })
    Jumlah: number;

    @Column({ name: 'CreatedUser', type: 'varchar', length: 50, nullable: true })
    CreatedUser: string;

    @Column({ name: 'CreatedDate', type: 'datetime', nullable: true })
    CreatedDate: string;

    @Column({ name: 'TanggalTransfer', type: 'datetime', nullable: true })
    TanggalTransfer: string;

    @Column({ name: 'NoRef', type: 'varchar', length: 50, nullable: true })
    NoRef: string;

    @Column({
        name: 'StatusTransaksi',
        type: 'varchar',
        length: 5,
        nullable: true,
        default: 'OPEN',
    })
    StatusTransaksi: string;
}