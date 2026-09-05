import { IsNotEmpty, IsString, IsDate } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty()
  @IsString()
  departmentName: string;

  @IsNotEmpty()
  @IsString()
  departmentCreatedUser: string;
}
