import { Injectable } from '@nestjs/common';
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
    await this.groupRepository.update(id, updateGroupDto);

    return {
      message: 'Group updated successfully',
    }
  }

  async remove(id: number) {
    await this.groupRepository.delete(id);

    return {
      message: 'Group deleted successfully',
    }
  }

  async findGroupAuth(id: number) {
    return this.groupAuthorizationRepository.find({
      where: { groupId: id },
    });
  }

  async createGroupAuth(createGroupAuthDto: CreateGroupAuthDto[]) {
    const groupAuths = createGroupAuthDto.map(dto => this.groupAuthorizationRepository.create(dto));
    await this.groupAuthorizationRepository.save(groupAuths);

    return {
      message: 'Group authorization created successfully',
      groupAuths,
    }
  }

  async removeGroupAuth(id: number) {
    const removedGroupAuth = await this.groupAuthorizationRepository.delete({ groupId: id });    
  
    return {
      message: 'Group authorization removed successfully',
      removedGroupAuth,
    }
  }

  async updateGroupAuth(id: number, createGroupAuthDto: CreateGroupAuthDto[]) {
    await this.removeGroupAuth(id);
    await this.createGroupAuth(createGroupAuthDto);

    return {
      message: 'Group authorization updated successfully',
    }
  }
}
