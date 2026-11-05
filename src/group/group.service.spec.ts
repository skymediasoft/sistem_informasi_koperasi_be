import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupRepository } from './group.repository';
import { DatabaseService } from '../database/database.service';

describe('GroupService', () => {
  let service: GroupService;
  const repo = {
    findByNameOrId: vi.fn(),
    findById: vi.fn(),
    findAll: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    findAllMenuIds: vi.fn(),
    findAuthsByGroup: vi.fn(),
    deleteAuthsByGroup: vi.fn(),
    insertAuths: vi.fn(),
  };
  const conn = {};
  const db = { transaction: vi.fn((fn: any) => fn(conn)) };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupService,
        { provide: GroupRepository, useValue: repo },
        { provide: DatabaseService, useValue: db },
      ],
    }).compile();
    service = module.get(GroupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('create rejects an existing name/id', async () => {
    repo.findByNameOrId.mockResolvedValue({ groupId: 1 });
    await expect(service.create({ groupId: 1, groupName: 'a', groupNote: 'b' }, 'u')).rejects.toBeInstanceOf(ConflictException);
  });

  it('create inserts and returns the stored row', async () => {
    repo.findByNameOrId.mockResolvedValue(null);
    repo.findById.mockResolvedValue({ groupId: 5 });
    expect(await service.create({ groupId: 5, groupName: 'a', groupNote: 'b' }, 'u')).toEqual({ groupId: 5 });
    expect(repo.insert).toHaveBeenCalledWith({ groupId: 5, groupName: 'a', groupNote: 'b' }, 'u');
  });

  it('findGroupAuth maps all menus, defaulting access to 0', async () => {
    repo.findById.mockResolvedValue({ groupId: 1 });
    repo.findAllMenuIds.mockResolvedValue([{ menuID: 1 }, { menuID: 2 }]);
    repo.findAuthsByGroup.mockResolvedValue([{ menuId: 2, access: 1 }]);
    expect(await service.findGroupAuth(1)).toEqual([
      { groupId: 1, menuId: 1, access: 0 },
      { groupId: 1, menuId: 2, access: 1 },
    ]);
  });

  it('removeGroupAuth returns { affected }', async () => {
    repo.findById.mockResolvedValue({ groupId: 1 });
    repo.deleteAuthsByGroup.mockResolvedValue(3);
    expect(await service.removeGroupAuth(1)).toEqual({
      message: 'Group authorization removed successfully',
      removedGroupAuth: { affected: 3 },
    });
  });

  it('updateGroupAuth deletes then inserts on the transaction connection', async () => {
    repo.findById.mockResolvedValue({ groupId: 1 });
    await service.updateGroupAuth(1, [{ groupId: 1, menuId: 2, access: 1 }]);
    expect(repo.deleteAuthsByGroup).toHaveBeenCalledWith(1, conn);
    expect(repo.insertAuths).toHaveBeenCalledWith([{ groupId: 1, menuId: 2, access: 1 }], conn);
  });

  it('updateGroupAuth with empty body only deletes', async () => {
    repo.findById.mockResolvedValue({ groupId: 1 });
    await service.updateGroupAuth(1, []);
    expect(repo.deleteAuthsByGroup).toHaveBeenCalled();
    expect(repo.insertAuths).not.toHaveBeenCalled();
  });

  it('update/remove 404 on unknown group', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.update(9, { groupName: 'x' })).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.remove(9)).rejects.toBeInstanceOf(NotFoundException);
  });
});
