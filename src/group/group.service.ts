import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupAuthDto } from './dto/create-group-auth.dto';
import { DatabaseService } from '../database/database.service';
import { GroupRepository } from './group.repository';

@Injectable()
export class GroupService {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly db: DatabaseService,
  ) {}

  async create(createGroupDto: CreateGroupDto, postBy: string) {
    const existingGroup = await this.groupRepository.findByNameOrId(
      createGroupDto.groupName,
      createGroupDto.groupId,
    );

    if (existingGroup) {
      throw new ConflictException('Group name or id already exists');
    }

    await this.groupRepository.insert(createGroupDto, postBy);
    // re-select so the response carries the DB-filled PostDate
    return this.groupRepository.findById(createGroupDto.groupId);
  }

  async findAllGroups() {
    const groups = await this.groupRepository.findAll();
    return {
      groups: groups.map(group => ({
        groupId: group.groupId,
        groupName: group.groupName,
      })),
    }
  }

  async update(id: number, updateGroupDto: UpdateGroupDto) {
    const group = await this.groupRepository.findById(id);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.groupRepository.update(id, updateGroupDto);

    return {
      message: 'Group updated successfully',
    }
  }

  async remove(id: number) {
    const group = await this.groupRepository.findById(id);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.groupRepository.delete(id);

    return {
      message: 'Group deleted successfully',
    }
  }

  async findGroupAuth(id: number) {
    const group = await this.groupRepository.findById(id);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const menus = await this.groupRepository.findAllMenuIds();
    const groupAuths = await this.groupRepository.findAuthsByGroup(id);

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
    const group = await this.groupRepository.findById(groupId);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const groupAuths = this.toAuthRows(groupId, createGroupAuthDto);
    await this.groupRepository.insertAuths(groupAuths);

    return {
      message: 'Group authorization created successfully',
      groupAuths,
    }
  }

  async removeGroupAuth(id: number) {
    const group = await this.groupRepository.findById(id);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const affected = await this.groupRepository.deleteAuthsByGroup(id);

    return {
      message: 'Group authorization removed successfully',
      removedGroupAuth: { affected },
    }
  }

  async updateGroupAuth(id: number, createGroupAuthDto: CreateGroupAuthDto[]) {
    const group = await this.groupRepository.findById(id);

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const rows = this.toAuthRows(id, createGroupAuthDto);

    // delete + insert in one transaction, so a failed insert cannot leave the group without permissions
    await this.db.transaction(async (conn) => {
      await this.groupRepository.deleteAuthsByGroup(id, conn);
      if (rows.length > 0) {
        await this.groupRepository.insertAuths(rows, conn);
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
