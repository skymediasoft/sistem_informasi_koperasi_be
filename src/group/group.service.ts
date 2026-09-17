import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
  
  async create(createGroupDto: CreateGroupDto) {
    const existingGroup = await this.groupRepository.findOne({
      where: { groupName: createGroupDto.groupName },
    });

    if (existingGroup) {
      throw new ConflictException('Group name already exists');
    }

    return await this.groupRepository.save(createGroupDto);
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

    const groupAuths = createGroupAuthDto.map(dto => this.groupAuthorizationRepository.create(dto));
    await this.groupAuthorizationRepository.save(groupAuths);

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

    await this.removeGroupAuth(id);
    await this.createGroupAuth(createGroupAuthDto);

    return {
      message: 'Group authorization updated successfully',
    }
  }
}
