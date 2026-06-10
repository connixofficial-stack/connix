export const MENU_MAX_LEVEL = 5;
export const MENU_MIN_LEVEL = 1;
export const MENU_MAX_DEPTH = MENU_MAX_LEVEL - 1;

export type MenuTreeNode<T> = T & {
  children: MenuTreeNode<T>[];
  level: number;
};

export const clampMenuLevel = (level: number): number => {
  if (!Number.isFinite(level)) {
    return MENU_MIN_LEVEL;
  }
  return Math.max(MENU_MIN_LEVEL, Math.min(MENU_MAX_LEVEL, Math.round(level)));
};

export const clampMenuDepth = (depth: number): number => {
  if (!Number.isFinite(depth)) {
    return 0;
  }
  return Math.max(0, Math.min(MENU_MAX_DEPTH, Math.round(depth)));
};

export const resolveMenuMaxDepthLevel = (raw: unknown): number => {
  if (typeof raw === 'number') {
    return clampMenuLevel(raw);
  }
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    return clampMenuLevel(Number.isNaN(parsed) ? MENU_MAX_LEVEL : parsed);
  }
  return 3;
};

export const buildMenuTree = <T extends { depth: number; order: number }>(items: T[]): Array<MenuTreeNode<T>> => {
  const sortedItems = [...items]
    .map((item) => ({ ...item, depth: clampMenuDepth(item.depth) }))
    .sort((a, b) => a.order - b.order);

  const roots: Array<MenuTreeNode<T>> = [];
  const stack: Array<{ depth: number; node: MenuTreeNode<T> }> = [];

  sortedItems.forEach((item) => {
    const depth = item.depth;
    const node = {
      ...item,
      children: [],
      level: depth + 1,
    } as MenuTreeNode<T>;

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].node.children.push(node);
    }

    stack.push({ depth, node });
  });

  return roots;
};
