import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('M_Users')
@Index('M_User_M_User_Group_idx', ['groupId'])
export class User {
  @PrimaryColumn({ name: 'UserLogin', type: 'varchar', length: 50 })
  userLogin: string;

  @Column({ name: 'UserPassword', type: 'varchar', length: 250 })
  userPassword: string;

  @Column({ name: 'UserName', type: 'varchar', length: 100 })
  userName: string;

  @Column({ name: 'UserEmail', type: 'varchar', length: 100, nullable: true })
  userEmail?: string;

  @Column({ name: 'PostBy', type: 'varchar', length: 100 })
  postBy: string;

  @CreateDateColumn({ name: 'PostDate', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  postDate: Date;

  @Column({ name: 'GroupID', type: 'int', nullable: true })
  groupId?: number;
}
