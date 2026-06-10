export const PERMISSION_ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

export type PermissionAction = typeof PERMISSION_ACTIONS[number];
export type PermissionActionList = readonly PermissionAction[];

export const ACTION_LABELS: Record<PermissionAction, string> = {
  create: 'Tạo',
  delete: 'Xóa',
  edit: 'Sửa',
  view: 'Xem',
};

const MODULE_ACTIONS: Partial<Record<string, PermissionActionList>> = {
  analytics: ['view'],
  cart: ['view', 'edit', 'delete'],
  subscriptions: ['view', 'create', 'edit', 'delete'],
  kanban: ['view', 'create', 'edit', 'delete'],
};

const EXCLUDED_MODULE_KEYS = new Set(['settings', 'homepage']);

export function getModuleActions(moduleKey: string): PermissionActionList {
  return MODULE_ACTIONS[moduleKey] ?? PERMISSION_ACTIONS;
}

export function isPermissionModule(moduleKey: string): boolean {
  return !EXCLUDED_MODULE_KEYS.has(moduleKey);
}
