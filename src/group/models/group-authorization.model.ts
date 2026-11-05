export interface GroupAuthorization {
  menuAuthId: number;
  groupId: number;
  menuId: number;
  access: number;
}

export type GroupAuthRow = Pick<GroupAuthorization, 'groupId' | 'menuId' | 'access'>;
