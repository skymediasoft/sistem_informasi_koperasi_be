import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('M_Department')
@Index('M_Department_M_Users_idx', ['PostBy'], {})
export class Department {
    @PrimaryColumn({ name: 'DepartmentId', type: 'varchar', nullable: false})
    departmentId: string;

    @Column({ name: 'DepartmentName', type: 'varchar', length: 255, nullable: false })       
    departmentName: string;

    @Column({ name: 'PostBy', type: 'varchar', length: 100, nullable: false })
    PostBy: string;

    @Column({ name: 'PostDate', type: 'datetime', nullable: false })
    PostDate: Date;
}
