import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('M_User_Group')
export class Group {
  @PrimaryColumn({ name: 'GroupID', type: 'int' })
  groupId: number;

  @Column({ name: 'GroupName', type: 'varchar', length: 50, nullable: true })
  groupName: string;

  @Column({ name: 'GroupNote', type: 'varchar', length: 50, nullable: true })
  groupNote: string;

  @Column({ name: 'PostBy', type: 'varchar', length: 50, nullable: true })
  PostBy: string;

  @CreateDateColumn({ name: 'PostDate', type: 'datetime', nullable: true })
  PostDate: Date;
}


