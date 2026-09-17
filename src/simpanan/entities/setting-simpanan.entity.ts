import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('M_Setting_Simpanan')
export class SettingSimpanan {
    @PrimaryColumn({ name: 'ID', type: 'int', nullable: false })
    ID: number;

    @Column({ name: 'SimpananPokok', type: 'int', nullable: true })
    SimpananPokok: number;

    @Column({ name: 'SimpananWajib', type: 'int', nullable: true })
    SimpananWajib: number;
    
    @Column({ name: 'SimpananSukarela', type: 'int', nullable: true })
    SimpananSukarela: number;
}

// CREATE TABLE "M_Setting_Simpanan" (
//   "ID" int NOT NULL AUTO_INCREMENT,
//   "SimpananPokok" int DEFAULT NULL,
//   "SimpananWajib" int DEFAULT NULL,
//   "SimpananSukarela" int DEFAULT NULL,
//   PRIMARY KEY ("ID")
// );
