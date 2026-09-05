import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('M_Department')
@Index('M_Department_M_Users_idx', ['deparmentCreatedUser'])
export class Department {
    @PrimaryColumn({ name: 'DepartmentId', type: 'int', generated: true })
    departmentId: number;

    @Column({ name: 'DepartmentName', type: 'varchar', length: 255, nullable: true })       
    departmentName: string;

    @Column({ name: 'DepartmentCreateDate', type: 'datetime', nullable: true })
    departmentCreateDate: Date;

    @Column({ name: 'DeparmentCreatedUser', type: 'varchar', length: 50 })
    deparmentCreatedUser: string;
}


// CREATE TABLE "M_Department" (
//   "DepartmentId" int NOT NULL AUTO_INCREMENT,
//   "DepartmentName" varchar(255) DEFAULT NULL,
//   "DepartmentCreateDate" datetime DEFAULT NULL,
//   "DeparmentCreatedUser" varchar(50) NOT NULL,
//   PRIMARY KEY ("DepartmentId"),
//   KEY "_idx" ("DeparmentCreatedUser"),
//   CONSTRAINT "FK_CreatedUser_Department" FOREIGN KEY ("DeparmentCreatedUser") REFERENCES "M_Users" ("UserLogin")
// );