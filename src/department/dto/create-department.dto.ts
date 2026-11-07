import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsNotEmpty()
  departmentId: string;

  @IsNotEmpty()
  @IsString()
  departmentName: string;
}
