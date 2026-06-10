/**
 * Users Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type UserData = Omit<Doc<'users'>, '_creationTime' | '_id'>;

const DEFAULT_USERS: Array<{ email: string; name: string; status: UserData['status'] }> = [
  { email: 'admin@example.com', name: 'Admin User', status: 'Active' as const },
  { email: 'editor@example.com', name: 'Nguyễn Văn Editor', status: 'Active' as const },
  { email: 'mod@example.com', name: 'Trần Thị Moderator', status: 'Active' as const },
];

export class UsersSeeder extends BaseSeeder<UserData> {
  moduleName = 'users';
  tableName = 'users';
  dependencies: SeedDependency[] = [{ module: 'roles', minRecords: 1, required: true }];

  private roles: Doc<'roles'>[] = [];
  private userIndex = 0;

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig) {
    this.roles = await this.ctx.db.query('roles').collect();
    if (this.roles.length === 0) {
      throw new Error('No roles found. Seed roles first.');
    }

    await this.seedModuleConfig();
    return super.seed(config);
  }

  generateFake(): UserData {
    const role = this.pickRoleForIndex(this.userIndex);
    const status = this.faker.helpers.weightedArrayElement([
      { value: 'Active' as const, weight: 7 },
      { value: 'Inactive' as const, weight: 2 },
      { value: 'Banned' as const, weight: 1 },
    ]);

    let baseUser = DEFAULT_USERS[this.userIndex];
    this.userIndex += 1;

    if (!baseUser) {
      baseUser = {
        email: this.faker.internet.email().toLowerCase(),
        name: this.faker.person.fullName(),
        status,
      };
    }

    return {
      avatar: this.randomBoolean(0.6) ? `https://api.dicebear.com/7.x/avataaars/png?seed=${baseUser.email}` : undefined,
      email: baseUser.email,
      lastLogin: this.randomBoolean(0.7) ? Date.now() - this.randomInt(1, 15) * 60 * 60 * 1000 : undefined,
      name: baseUser.name,
      phone: this.randomBoolean(0.6) ? `09${this.faker.string.numeric(8)}` : undefined,
      roleId: role._id,
      status: baseUser.status,
    };
  }

  validateRecord(record: UserData): boolean {
    return !!record.email && !!record.name && !!record.roleId;
  }

  protected async afterSeed(count: number): Promise<void> {
    void count;
    const [existingUserStats, existingRoleStats] = await Promise.all([
      this.ctx.db.query('userStats').collect(),
      this.ctx.db.query('roleStats').collect(),
    ]);
    await Promise.all([
      ...existingUserStats.map(stat => this.ctx.db.delete(stat._id)),
      ...existingRoleStats.map(stat => this.ctx.db.delete(stat._id)),
    ]);

    const users = await this.ctx.db.query('users').collect();
    const statusCounts: Record<string, number> = { Active: 0, Banned: 0, Inactive: 0 };
    users.forEach(user => { statusCounts[user.status] = (statusCounts[user.status] || 0) + 1; });

    const roles = await this.ctx.db.query('roles').collect();
    const systemCount = roles.filter(role => role.isSystem).length;
    const superAdminCount = roles.filter(role => role.isSuperAdmin).length;

    await Promise.all([
      this.ctx.db.insert('userStats', { count: users.length, key: 'total' }),
      this.ctx.db.insert('userStats', { count: statusCounts.Active, key: 'Active' }),
      this.ctx.db.insert('userStats', { count: statusCounts.Inactive, key: 'Inactive' }),
      this.ctx.db.insert('userStats', { count: statusCounts.Banned, key: 'Banned' }),
      this.ctx.db.insert('roleStats', { count: roles.length, key: 'total' }),
      this.ctx.db.insert('roleStats', { count: systemCount, key: 'system' }),
      this.ctx.db.insert('roleStats', { count: superAdminCount, key: 'superAdmin' }),
    ]);
  }

  private pickRoleForIndex(index: number): Doc<'roles'> {
    const ordered = [...this.roles]
      .filter((role) => !role.isSuperAdmin)
      .sort((a, b) => a.name.localeCompare(b.name));
    if (ordered.length === 0) {
      throw new Error('No non-super-admin roles found. Seed roles first.');
    }
    return ordered[index % ordered.length];
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'users');
  }
}
