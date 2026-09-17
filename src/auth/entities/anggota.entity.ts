import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('M_Anggota')
export class Anggota {
    @PrimaryColumn({ name: 'NoAnggota', type: 'varchar', length: 15, nullable: false })
    NoAnggota: string;

    @Column({ name: 'NoEmployee', type: 'varchar', length: 10, nullable: false })
    NoEmployee: string;

    @Column({ name: 'Nama', type: 'varchar', length: 50, nullable: false })
    Nama: string;   

    @Column({ name: 'Alamat', type: 'varchar', length: 200, nullable: true })
    Alamat: string;

    @Column({ name: 'Telpon', type: 'varchar', length: 100, nullable: true })
    Telpon: string;

    @Column({ name: 'JenisKelamin', type: 'varchar', length: 50, nullable: true })
    JenisKelamin: string;

    @Column({ name: 'DepartmentId', type: 'varchar', length: 20, nullable: true })
    DepartmentId: string;

    @Column({ name: 'JenisAnggota', type: 'varchar', length: 20, nullable: true })
    JenisAnggota: string;

    @Column({ name: 'TanggalMasuk', type: 'date', nullable: true })
    TanggalMasuk: Date;

    @Column({ name: 'NoRekening', type: 'varchar', length: 50, nullable: true })
    NoRekening: string;

    @Column({ name: 'IsNew', type: 'tinyint', nullable: true })
    IsNew: number;

    @Column({ name: 'SimpananPokok', type: 'int', nullable: true })
    SimpananPokok: number;

    @Column({ name: 'SimpananWajib', type: 'int', nullable: true })
    SimpananWajib: number;

    @Column({ name: 'SimpananSukarela', type: 'int', nullable: true })
    SimpananSukarela: number;

    @Column({ name: 'StatusAnggota', type: 'varchar', length: 20, nullable: true })
    StatusAnggota: string;

    @Column({ name: 'PasswordLogin', type: 'varchar', length: 1000, nullable: true })
    PasswordLogin: string;

    @Column({ name: 'AlamatEmail', type: 'varchar', length: 200, nullable: true })
    AlamatEmail: string;

    @Column({ name: 'CreatedUser', type: 'varchar', length: 50, nullable: true })
    CreatedUser: string;

    @CreateDateColumn({ name: 'CreatedDate', type: 'datetime', nullable: true })
    CreatedDate: Date;

    @Column({ name: 'UpdatedUser', type: 'varchar', length: 50, nullable: true })
    UpdatedUser: string;    

    @UpdateDateColumn({ name: 'UpdatedDate', type: 'datetime', nullable: true })
    UpdatedDate: Date;
}


// CREATE TABLE "M_Anggota" (
//   "NoAnggota" varchar(15) NOT NULL,
//   "NoEmployee" varchar(10) NOT NULL,
//   "Nama" varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
//   "Alamat" varchar(200) DEFAULT NULL,
//   "Telpon" varchar(100) DEFAULT NULL,
//   "JenisKelamin" varchar(50) DEFAULT NULL,
//   "DepartmentId" varchar(20) DEFAULT NULL,
//   "JenisAnggota" varchar(20) DEFAULT NULL,
//   "TanggalMasuk" date DEFAULT NULL,
//   "NoRekening" varchar(50) DEFAULT NULL,
//   "IsNew" tinyint(1) DEFAULT NULL,
//   "SimpananPokok" int DEFAULT NULL,
//   "SimpananWajib" int DEFAULT NULL,
//   "SimpananSukarela" int DEFAULT NULL,
//   "StatusAnggota" varchar(20) DEFAULT NULL,
//   "PasswordLogin" varchar(1000) DEFAULT NULL,
//   "AlamatEmail" varchar(200) DEFAULT NULL,
//   "CreatedUser" varchar(50) DEFAULT NULL,
//   "CreatedDate" datetime DEFAULT NULL,
//   "UpdatedUser" varchar(50) DEFAULT NULL,
//   "UpdatedDate" datetime DEFAULT NULL,
//   PRIMARY KEY ("NoAnggota"),
//   UNIQUE KEY "M_Anggota_AlamatEmail_Unique" ("AlamatEmail"),
//   KEY "M_Anggota_idx" ("NoEmployee","Nama","DepartmentId","JenisAnggota","StatusAnggota"),
//   KEY "M_Anggota_M_Department_FK" ("DepartmentId"),
//   CONSTRAINT "M_Anggota_M_Department_FK" FOREIGN KEY ("DepartmentId") REFERENCES "M_Department" ("DepartmentId") ON DELETE SET NULL ON UPDATE CASCADE
// );
