import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('M_Group_Authorization')
export class GroupAuthorization {
    @PrimaryGeneratedColumn({ name: 'MenuAuthId', type: 'int' })
    menuAuthId: number;

    @Column({ name: 'GroupId', type: 'int' })
    groupId: number;

    @Column({ name: 'MenuId', type: 'int' })
    menuId: number;

    @Column({ type: 'tinyint', name: 'Access', default: 0 })
    access: number;
}