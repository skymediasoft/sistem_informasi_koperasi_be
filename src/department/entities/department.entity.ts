import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('M_Department')
@Index('M_Department_M_Users_idx', ['departmentCreatedUser'])
export class Department {
    @PrimaryColumn({ name: 'DepartmentId', type: 'int', generated: true })
    departmentId: number;

    @Column({ name: 'DepartmentName', type: 'varchar', length: 255, nullable: false })       
    departmentName: string;

    @Column({ name: 'DepartmentCreateDate', type: 'datetime', nullable: false })
    departmentCreateDate: Date;

    @Column({ name: 'DepartmentCreatedUser', type: 'varchar', length: 50, nullable: false })
    departmentCreatedUser: string;
}
