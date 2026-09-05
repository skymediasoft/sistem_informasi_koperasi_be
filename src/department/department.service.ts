import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
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

  async create(createDepartmentDto: CreateDepartmentDto,) {
    const { departmentName, departmentCreatedUser } = createDepartmentDto;

    const existingDepartment = await this.departmentRepository.findOne({ where: { departmentName } });

    if (existingDepartment) {
      throw new ConflictException('Department name already exists');
    }

    const newDepartment = await this.departmentRepository.create({
      departmentName,
      departmentCreatedUser,
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

  findOne(id: number) {
    return `This action returns a #${id} department`;
  }

  update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    return `This action updates a #${id} department`;
  }

  remove(id: number) {
    return `This action removes a #${id} department`;
  }
}
