import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MenuService } from './menu.service';
import { Menu } from './entities/menu.entity';

describe('MenuService', () => {
  let service: MenuService;
  let repository: {
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    repository = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((menu) => menu),
      save: vi.fn((menu) => Promise.resolve(menu)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: getRepositoryToken(Menu),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a child when menuParentId is provided', async () => {
    await service.create({
      menuName: 'Child',
      menuRoute: '/child',
      menuSort: 1,
      menuParentId: 12,
      postBy: 'tester',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ menuParentID: 12n }),
    );
  });

  it('creates a parent with menuParentID 0 when menuParentId is omitted', async () => {
    await service.create({
      menuName: 'Parent',
      menuRoute: '/parent',
      menuSort: 1,
      postBy: 'tester',
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ menuParentID: 0n }),
    );
  });
});
