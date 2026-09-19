import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('T_Simpanan_Anggota')
export class TransaksiSimpanan {
    @PrimaryGeneratedColumn({ name: 'IDTransaksi', type: 'bigint' })
    IDTransaksi: string;

    @Column({ name: 'Tanggal', type: 'date', nullable: false })
    Tanggal: string;

    @Column({ name: 'NoAnggota', type: 'varchar', length: 15, nullable: false })
    NoAnggota: string;

    @Column({ name: 'JenisPosting', type: 'varchar', length: 10, nullable: true })
    JenisPosting: string;

    @Column({ name: 'JenisTransaksi', type: 'varchar', length: 10, nullable: true })
    JenisTransaksi: string;

    @Column({ name: 'JenisSimpanan', type: 'varchar', length: 20, nullable: true })
    JenisSimpanan: string;

    @Column({ name: 'Jumlah', type: 'double', nullable: true })
    Jumlah: number;

    @Column({ name: 'BulanAktif', type: 'int', nullable: true })
    BulanAktif: number;

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

// CREATE TABLE "T_Simpanan_Anggota" (
//   "IDTransaksi" bigint NOT NULL AUTO_INCREMENT,
//   "Tanggal" date NOT NULL,
//   "NoAnggota" varchar(15) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
//   "JenisPosting" varchar(10) DEFAULT NULL,
//   "JenisTransaksi" varchar(10) DEFAULT NULL,
//   "JenisSimpanan" varchar(20) DEFAULT NULL,
//   "Jumlah" double DEFAULT NULL,
//   "BulanAktif" int DEFAULT NULL,
//   "CreatedUser" varchar(50) DEFAULT NULL,
//   "CreatedDate" datetime DEFAULT NULL,
//   "TanggalTransfer" datetime DEFAULT NULL,
//   "NoRef" varchar(50) DEFAULT NULL,
//   "StatusTransaksi" varchar(5) DEFAULT NULL,
//   PRIMARY KEY ("IDTransaksi"),
//   KEY "T_Simpanan_Anggota_Tanggal_IDX" ("Tanggal","NoAnggota"),
//   KEY "T_Simpanan_Anggota_M_Anggota_FK" ("NoAnggota"),
//   CONSTRAINT "T_Simpanan_Anggota_M_Anggota_FK" FOREIGN KEY ("NoAnggota") REFERENCES "M_Anggota" ("NoAnggota") ON DELETE CASCADE ON UPDATE CASCADE
// );