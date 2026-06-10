/**
 * Roles Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type RoleData = Omit<Doc<'roles'>, '_creationTime' | '_id'>;

const DEFAULT_ROLES: RoleData[] = [
  {
    color: '#ef4444',
    description: 'Toàn quyền hệ thống',
    isSuperAdmin: true,
    isSystem: true,
    name: 'Super Admin',
    permissions: { '*': ['*'] },
  },
  {
    color: '#3b82f6',
    description: 'Quản trị viên hệ thống',
    isSuperAdmin: false,
    isSystem: true,
    name: 'Admin',
    permissions: {
      customers: ['view', 'create', 'edit'],
      kanban: ['view', 'create', 'edit', 'delete'],
      media: ['view', 'create', 'delete'],
      orders: ['view', 'create', 'edit'],
      posts: ['view', 'create', 'edit', 'delete'],
      products: ['view', 'create', 'edit', 'delete'],
      roles: ['view'],
      settings: ['view', 'edit'],
      users: ['view'],
    },
  },
  {
    color: '#10b981',
    description: 'Biên tập viên nội dung',
    isSuperAdmin: false,
    isSystem: false,
    name: 'Editor',
    permissions: {
      comments: ['view', 'edit'],
      media: ['view', 'create'],
      posts: ['view', 'create', 'edit'],
      products: ['view', 'edit'],
    },
  },
  {
    color: '#f59e0b',
    description: 'Nhân viên bán hàng',
    isSuperAdmin: false,
    isSystem: false,
    name: 'Sales',
    permissions: {
      customers: ['view', 'create', 'edit'],
      orders: ['view', 'create', 'edit'],
      products: ['view'],
    },
  },
  {
    color: '#6b7280',
    description: 'Chỉ xem dữ liệu',
    isSuperAdmin: false,
    isSystem: false,
    name: 'Viewer',
    permissions: {
      customers: ['view'],
      orders: ['view'],
      posts: ['view'],
      products: ['view'],
    },
  },
];

export class RolesSeeder extends BaseSeeder<RoleData> {
  moduleName = 'roles';
  tableName = 'roles';
  dependencies: SeedDependency[] = [];

  private roleIndex = 0;
  private enabledModuleKeys: Set<string> | null = null;
  private filteredDefaultRoles: RoleData[] = DEFAULT_ROLES;

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig) {
    this.roleIndex = 0;
    await this.loadEnabledModules();
    await this.seedModuleConfig();
    return super.seed(config);
  }

  generateFake(): RoleData {
    if (this.roleIndex < this.filteredDefaultRoles.length) {
      return this.filteredDefaultRoles[this.roleIndex++];
    }

    const name = `Role ${this.roleIndex + 1}`;
    this.roleIndex += 1;

    return {
      color: this.faker.internet.color(),
      description: this.faker.lorem.sentence(),
      isSuperAdmin: false,
      isSystem: false,
      name,
      permissions: this.filterPermissions({ custom: ['view'] }),
    };
  }

  validateRecord(record: RoleData): boolean {
    return !!record.name && !!record.permissions;
  }

  protected async afterSeed(count: number): Promise<void> {
    void count;
    const existingStats = await this.ctx.db.query('roleStats').collect();
    await Promise.all(existingStats.map(stat => this.ctx.db.delete(stat._id)));

    const roles = await this.ctx.db.query('roles').collect();
    const systemCount = roles.filter(role => role.isSystem).length;
    const superAdminCount = roles.filter(role => role.isSuperAdmin).length;

    await Promise.all([
      this.ctx.db.insert('roleStats', { count: roles.length, key: 'total' }),
      this.ctx.db.insert('roleStats', { count: systemCount, key: 'system' }),
      this.ctx.db.insert('roleStats', { count: superAdminCount, key: 'superAdmin' }),
    ]);
  }

  private async loadEnabledModules(): Promise<void> {
    const enabledModules = await this.ctx.db
      .query('adminModules')
      .withIndex('by_enabled_order', q => q.eq('enabled', true))
      .collect();

    if (enabledModules.length === 0) {
      this.enabledModuleKeys = null;
      this.filteredDefaultRoles = DEFAULT_ROLES;
      return;
    }

    this.enabledModuleKeys = new Set(enabledModules.map(module => module.key));
    this.filteredDefaultRoles = DEFAULT_ROLES.map(role => this.filterRole(role));
  }

  private filterRole(role: RoleData): RoleData {
    if (!this.enabledModuleKeys || role.permissions['*']) {
      return role;
    }

    return {
      ...role,
      permissions: this.filterPermissions(role.permissions),
    };
  }

  private filterPermissions(permissions: Record<string, string[]>): Record<string, string[]> {
    if (!this.enabledModuleKeys || permissions['*']) {
      return permissions;
    }

    return Object.fromEntries(
      Object.entries(permissions).filter(([moduleKey]) => this.enabledModuleKeys?.has(moduleKey))
    );
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'roles');
  }
}
