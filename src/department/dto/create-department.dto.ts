import { IsNotEmpty, IsString, IsDate } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty()
  departmentId: string;

  @IsNotEmpty()
  @IsString()
  departmentName: string;

  @IsNotEmpty()
  @IsString()
  departmentCreatedUser: string;
}
