import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { In, Repository } from 'typeorm';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    const { departmentId, departmentName, departmentCreatedUser: user } = createDepartmentDto;

    const existingDepartment = await this.departmentRepository.findOne({ where: { departmentName } });

    if (existingDepartment) {
      throw new ConflictException('Department name already exists');
    }

    const newDepartment = this.departmentRepository.create({
      departmentId,
      departmentName, 
      PostBy: user,
    });

    await this.departmentRepository.save(newDepartment);
    return {
      message: 'Department created successfully',
      department: newDepartment
    }
  }

  findAll() {
    const departments = this.departmentRepository.find();
    return departments;
  }

  findOne(id: string) {
    return this.departmentRepository.findOne({ where: { departmentId: id } });
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const { departmentName } = updateDepartmentDto;

    const updatedDepartment = await this.departmentRepository.update(id, { departmentName });

    if (!updatedDepartment.affected) {
      throw new NotFoundException('Department not found');
    }

    return {
      message: 'Department updated successfully',
    }
  }

  async remove(id: string) {
    const deletedDepartment = await  this.departmentRepository.delete(id);

    if (!deletedDepartment.affected) {
      throw new NotFoundException('Department not found');
    }

    return {
      message: 'Department deleted successfully',
    }
  }
}
