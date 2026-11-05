import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentService } from './department.service';
import { DepartmentRepository } from './department.repository';

describe('DepartmentService', () => {
  let service: DepartmentService;
  let repository: Record<
    'findByName' | 'findById' | 'findAll' | 'insert' | 'updateName' | 'delete',
    ReturnType<typeof vi.fn>
  >;

  beforeEach(async () => {
    repository = {
      findByName: vi.fn().mockResolvedValue(null),
      findById: vi.fn(),
      findAll: vi.fn(),
      insert: vi.fn((d) => Promise.resolve(d)),
      updateName: vi.fn().mockResolvedValue(1),
      delete: vi.fn().mockResolvedValue(1),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [DepartmentService, { provide: DepartmentRepository, useValue: repository }],
    }).compile();

    service = module.get<DepartmentService>(DepartmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates and returns { departmentId, departmentName, PostBy }', async () => {
    const res = await service.create({ departmentId: 'D1', departmentName: 'IT', departmentCreatedUser: 'u' });
    expect(res).toEqual({
      message: 'Department created successfully',
      department: { departmentId: 'D1', departmentName: 'IT', PostBy: 'u' },
    });
  });

  it('rejects a duplicate name', async () => {
    repository.findByName.mockResolvedValue({ departmentId: 'D0' });
    await expect(
      service.create({ departmentId: 'D1', departmentName: 'IT', departmentCreatedUser: 'u' }),
    ).rejects.toThrow(ConflictException);
  });

  it('update/remove throw NotFound when nothing is affected', async () => {
    repository.updateName.mockResolvedValue(0);
    repository.delete.mockResolvedValue(0);
    await expect(service.update('X', { departmentName: 'n' })).rejects.toThrow(NotFoundException);
    await expect(service.remove('X')).rejects.toThrow(NotFoundException);
  });
});
