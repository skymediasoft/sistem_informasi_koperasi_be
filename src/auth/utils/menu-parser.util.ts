export type MenuNode = {
  menuId: number;
  menuName: string;
  route: string;
  accessValue?: number;
  accessStatus?: string;
  children?: MenuNode[];
};

export function mapAuthorizationToTree(rows: any[]): MenuNode[] {
  if (!rows || !Array.isArray(rows)) {
    return [];
  }

  const map = new Map<number, MenuNode>();
  const roots: MenuNode[] = [];

  for (const row of rows) {
    const menuId = Number(row.MenuID ?? row.menuId);
    const parentId = Number(row.MenuParentID ?? row.menuParentId ?? row.ParentID ?? row.parentId ?? 0);

    const node: MenuNode = {
      menuId,
      menuName: row.MenuName ?? row.menuName ?? '',
      route: row.MenuRoute ?? row.menuRoute ?? row.Route ?? row.route ?? '',
      children: [],
    };

    if (row.AccessValue !== undefined || row.accessValue !== undefined) {
      node.accessValue = Number(row.AccessValue ?? row.accessValue);
    }
    if (row.AccessStatus !== undefined || row.accessStatus !== undefined) {
      node.accessStatus = String(row.AccessStatus ?? row.accessStatus);
    }

    map.set(menuId, node);

    if (parentId === 0) {
      roots.push(node);
    } else {
      const parent = map.get(parentId);

      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(node);
      } else {
        // jika parent belum ada di hasil query, masukkan ke root
        roots.push(node);
      }
    }
  }

  return roots;
}