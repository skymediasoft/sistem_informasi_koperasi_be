import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { Menu } from '../menu/entities/menu.entity';
import { GroupAuthorization } from './entities/group-authorization.entity';
import { CreateGroupAuthDto } from './dto/create-group-auth.dto';


@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(GroupAuthorization)
    private readonly groupAuthorizationRepository: Repository<GroupAuthorization>,
  ) {}
  
  async create(createGroupDto: CreateGroupDto, postBy: string) {
    const existingGroup = await this.groupRepository.findOne({
      where: [{ groupName: createGroupDto.groupName }, { groupId: createGroupDto.groupId }],
    });

    if (existingGroup) {
      throw new ConflictException('Group name or id already exists');
    }

    return await this.groupRepository.save({ ...createGroupDto, PostBy: postBy });
  }

  async findAllGroups() {
    const groups = await this.groupRepository.find();
    return {
      groups: groups.map(group => ({
        groupId: group.groupId,
        groupName: group.groupName,
      })),
    }
  }

  async update(id: number, updateGroupDto: UpdateGroupDto) {
    const group = await this.groupRepository.findOne({ where: { groupId: id } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.groupRepository.update(id, updateGroupDto);

    return {
      message: 'Group updated successfully',
    }
  }

  async remove(id: number) {
    const group = await this.groupRepository.findOne({ where: { groupId: id } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.groupRepository.delete(id);

    return {
      message: 'Group deleted successfully',
    }
  }

  async findGroupAuth(id: number) {
    const group = await this.groupRepository.findOne({ where: { groupId: id } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const menus = await this.menuRepository.find();
    const groupAuths = await this.groupAuthorizationRepository.find({
      where: { groupId: id },
    });
    
    const authMap = new Map<number, number>();
    for (const auth of groupAuths) {
      authMap.set(auth.menuId, auth.access);
    }

    const result = menus.map((menu) => {
      const access = authMap.get(menu.menuID);

      return {
        groupId: id,
        menuId: menu.menuID,
        access: access !== undefined ? access : 0,
      };
    });

    return result;
  }

  async createGroupAuth(createGroupAuthDto: CreateGroupAuthDto[]) {
    if (createGroupAuthDto.length === 0) {
      return {
        message: 'No group authorizations provided',
        groupAuths: [],
      };
    }

    const groupId = createGroupAuthDto[0].groupId;
    const group = await this.groupRepository.findOne({ where: { groupId } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupAuths = this.toAuthRows(groupId, createGroupAuthDto);
    await this.groupAuthorizationRepository.insert(groupAuths);

    return {
      message: 'Group authorization created successfully',
      groupAuths,
    }
  }

async removeGroupAuth(id: number) {
    const group = await this.groupRepository.findOne({ where: { groupId: id } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const removedGroupAuth = await this.groupAuthorizationRepository.delete({ groupId: id });    
   
    return {
      message: 'Group authorization removed successfully',
      removedGroupAuth,
    }
  }

  async updateGroupAuth(id: number, createGroupAuthDto: CreateGroupAuthDto[]) {
    const group = await this.groupRepository.findOne({ where: { groupId: id } });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const rows = this.toAuthRows(id, createGroupAuthDto);

    // delete + insert in one transaction, so a failed insert cannot leave the group without permissions
    await this.groupAuthorizationRepository.manager.transaction(async (manager) => {
      await manager.delete(GroupAuthorization, { groupId: id });
      if (rows.length > 0) {
        await manager.insert(GroupAuthorization, rows);
      }
    });

    return {
      message: 'Group authorization updated successfully',
    }
  }

  private toAuthRows(groupId: number, dtos: CreateGroupAuthDto[]) {
    if (dtos.some((dto) => dto.groupId !== groupId)) {
      throw new BadRequestException(`Every item must have groupId ${groupId}`);
    }

    if (new Set(dtos.map((dto) => dto.menuId)).size !== dtos.length) {
      throw new BadRequestException('Duplicate menuId in request');
    }

    return dtos.map(({ menuId, access }) => ({ groupId, menuId, access }));
  }
}
