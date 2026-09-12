import { Entity, Column, PrimaryColumn, CreateDateColumn, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('M_Menu')
export class Menu {
  @PrimaryGeneratedColumn({name: 'MenuID'})
  menuID: number;

  @Column({ name: 'MenuName', length: 50, nullable: true })
  menuName: string;

  @Column({ name: 'MenuParentID', type: 'bigint', nullable: true })
  menuParentID: bigint;

  @Column({ name: 'MenuRoute', length: 150, nullable: true })
  menuRoute: string;

  @Column({ name: 'MenuSort', type: 'int', nullable: true })
  menuSort: number;

  @Column({ name: 'PostBy', length: 50, nullable: true })
  postBy: string;

  @CreateDateColumn({ name: 'PostDate', nullable: true })
  postDate: Date;

  toJSON() {
    return {
      ...this,
      menuParentID:
        this.menuParentID === null || this.menuParentID === undefined
          ? this.menuParentID
          : this.menuParentID.toString(),
    };
  }
}
