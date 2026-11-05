/*
CREATE TABLE M_Department (
  DepartmentId   varchar(20)  NOT NULL PRIMARY KEY,  -- client supplied, no auto-increment
  DepartmentName varchar(255) NOT NULL,
  PostBy         varchar(100) NULL,
  PostDate       datetime     NULL DEFAULT CURRENT_TIMESTAMP
);
*/
export interface Department {
  departmentId: string;
  departmentName: string;
  PostBy: string | null;
  PostDate: Date | null;
}
