import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { MenuRepository } from './menu.repository';

describe('MenuService', () => {
  let service: MenuService;
  let repository: Record<
    'existsByName' | 'insert' | 'update' | 'deleteWithChildren' | 'findParents' | 'findChildren',
    ReturnType<typeof vi.fn>
  >;

  beforeEach(async () => {
    repository = {
      existsByName: vi.fn().mockResolvedValue(false),
      insert: vi.fn((menu) => Promise.resolve(menu)),
      update: vi.fn().mockResolvedValue(1),
      deleteWithChildren: vi.fn().mockResolvedValue(3),
      findParents: vi.fn(),
      findChildren: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MenuService, { provide: MenuRepository, useValue: repository }],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a child when menuParentId is provided', async () => {
    await service.create({ menuName: 'Child', menuRoute: '/child', menuSort: 1, menuParentId: 12, postBy: 'tester' });

    expect(repository.insert).toHaveBeenCalledWith(expect.objectContaining({ menuParentID: 12n }));
  });

  it('creates a parent with menuParentID 0 when menuParentId is omitted', async () => {
    await service.create({ menuName: 'Parent', menuRoute: '/parent', menuSort: 1, postBy: 'tester' });

    expect(repository.insert).toHaveBeenCalledWith(expect.objectContaining({ menuParentID: 0n }));
  });

  it('rejects a duplicate name on create', async () => {
    repository.existsByName.mockResolvedValue(true);
    await expect(
      service.create({ menuName: 'Dup', menuRoute: '/d', menuSort: 1, postBy: 'tester' }),
    ).rejects.toThrow(ConflictException);
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('update excludes itself from the name check and returns { affected }', async () => {
    expect(await service.update(5, { menuName: 'New' })).toEqual({ affected: 1 });
    expect(repository.existsByName).toHaveBeenCalledWith('New', 5);
    repository.existsByName.mockResolvedValue(true);
    await expect(service.update(5, { menuName: 'New' })).rejects.toThrow(ConflictException);
  });

  it('remove returns { affected }', async () => {
    expect(await service.remove(5)).toEqual({ affected: 3 });
    expect(repository.deleteWithChildren).toHaveBeenCalledWith(5);
  });
});
