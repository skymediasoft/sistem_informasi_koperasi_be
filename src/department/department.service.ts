import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentRepository } from './department.repository';

@Injectable()
export class DepartmentService {
  constructor(private readonly departmentRepository: DepartmentRepository) {}

  async create(createDepartmentDto: CreateDepartmentDto & { departmentCreatedUser: string }) {
    const { departmentId, departmentName, departmentCreatedUser: user } = createDepartmentDto;

    if (await this.departmentRepository.findByName(departmentName)) {
      throw new ConflictException('Department name already exists');
    }

    const department = await this.departmentRepository.insert({ departmentId, departmentName, PostBy: user });
    return {
      message: 'Department created successfully',
      department,
    };
  }

  findAll() {
    return this.departmentRepository.findAll();
  }

  findOne(id: string) {
    return this.departmentRepository.findById(id);
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const affected = await this.departmentRepository.updateName(id, updateDepartmentDto.departmentName);

    if (!affected) {
      throw new NotFoundException('Department not found');
    }

    return {
      message: 'Department updated successfully',
    };
  }

  async remove(id: string) {
    const affected = await this.departmentRepository.delete(id);

    if (!affected) {
      throw new NotFoundException('Department not found');
    }

    return {
      message: 'Department deleted successfully',
    };
  }
}
