/*
CREATE TABLE M_Menu (
  MenuID       int         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  MenuName     varchar(50)  NULL,
  MenuParentID bigint       NULL,  -- 0 for roots
  MenuRoute    varchar(150) NULL,
  MenuSort     int          NULL,
  PostBy       varchar(50)  NULL,
  PostDate     datetime     NULL DEFAULT CURRENT_TIMESTAMP
);
*/
export interface Menu {
  menuID: number;
  menuName: string | null;
  /** bigint column, always serialised as a string ("0" for roots) */
  menuParentID: string | null;
  menuRoute: string | null;
  menuSort: number | null;
  postBy: string | null;
  postDate: Date | null;
}
