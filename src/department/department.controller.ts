import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { DepartmentService } from './department.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { JwtPayloadDto } from "../auth/dto/jwt-payload.dto";
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('department')
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}
  
  @Post('create')
  @UseGuards(JwtAuthGuard)
  create(@Body() createDepartmentDto: CreateDepartmentDto, @Request() req: { user: JwtPayloadDto }) {
    return this.departmentService.create({ ...createDepartmentDto, departmentCreatedUser: req.user.userlogin });
  }

  @Get()
  findAll() {
    return this.departmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departmentService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDepartmentDto: UpdateDepartmentDto) {
    return this.departmentService.update(id, updateDepartmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.departmentService.remove(id);
  }
}
