// Table M_Users (no password hash in this shape on purpose).
// CREATE TABLE "M_Users" (
//   "UserLogin" varchar(50) NOT NULL, "UserPassword" varchar(250) NOT NULL,
//   "UserName" varchar(100) NOT NULL, "UserEmail" varchar(100) DEFAULT NULL,
//   "PostBy" varchar(100) NOT NULL, "PostDate" datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   "GroupID" int DEFAULT NULL, PRIMARY KEY ("UserLogin"),
//   FK GroupID -> M_User_Group ON DELETE SET NULL ON UPDATE CASCADE );
export interface User {
  userLogin: string;
  userName: string;
  userEmail: string | null;
  postBy: string;
  postDate: Date;
  groupId: number | null;
}
