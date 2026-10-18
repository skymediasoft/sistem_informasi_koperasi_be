import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('T_Simpanan_Penarikan_Resign')
@Index('IDX_Tanggal_NoAnggota', [
    'Tanggal',
    'NoAnggota',
    'StatusTransaksi',
])
export class TransaksiPenarikanResign {
    @PrimaryGeneratedColumn({ name: 'IDPengambilan', type: 'bigint' })
    IDPengambilan: string;

    @Column({ name: 'Tanggal', type: 'date', nullable: true })
    Tanggal: string;

    @Column({ name: 'NoAnggota', type: 'varchar', length: 15, nullable: true })
    NoAnggota: string;

    @Column({ name: 'SimpananPokok', type: 'int', nullable: true })
    SimpananPokok: number;

    @Column({ name: 'SimpananWajib', type: 'int', nullable: true })
    SimpananWajib: number;

    @Column({ name: 'SimpananSukarela', type: 'int', nullable: true })
    SimpananSukarela: number;

    @Column({ name: 'CreatedUser', type: 'varchar', length: 50, nullable: true })
    CreatedUser: string;

    @Column({ name: 'CreatedDate', type: 'datetime', nullable: true })
    CreatedDate: string;

    @Column({ name: 'TanggalTransfer', type: 'datetime', nullable: true })
    TanggalTransfer: string;

    @Column({ name: 'NoRef', type: 'varchar', length: 50, nullable: true })
    NoRef: string;

    @Column({ name: 'StatusTransaksi', type: 'varchar', length: 5, nullable: true })
    StatusTransaksi: string;
}