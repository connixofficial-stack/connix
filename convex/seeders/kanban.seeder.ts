/**
 * Kanban Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { Doc, DataModel, Id } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type TaskData = Omit<Doc<'kanbanTasks'>, '_creationTime' | '_id'>;

export class KanbanSeeder extends BaseSeeder<TaskData> {
  moduleName = 'kanban';
  tableName = 'kanbanTasks';
  dependencies: SeedDependency[] = [
    { module: 'users', required: true, minRecords: 1 },
  ];

  private boardId: Id<'kanbanBoards'> | null = null;
  private columns: Doc<'kanbanColumns'>[] = [];
  private users: Doc<'users'>[] = [];
  private orderByColumn = new Map<Id<'kanbanColumns'>, number>();

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig) {
    await this.seedModuleConfig();
    this.users = await this.ctx.db.query('users').collect();
    if (this.users.length === 0) {
      throw new Error('No users found. Seed users first.');
    }
    await this.ensureBoard();
    return super.seed(config);
  }

  generateFake(): TaskData {
    if (!this.boardId) {
      throw new Error('Kanban board not initialized');
    }

    const column = this.randomElement(this.columns);
    const order = this.orderByColumn.get(column._id) ?? 0;
    this.orderByColumn.set(column._id, order + 1);

    const priority = this.faker.helpers.weightedArrayElement([
      { value: 'LOW' as const, weight: 3 },
      { value: 'MEDIUM' as const, weight: 5 },
      { value: 'HIGH' as const, weight: 2 },
    ]);

    const createdBy = this.randomElement(this.users);
    const shouldAssign = this.randomBoolean(0.6);
    const dueDate = this.randomBoolean(0.45)
      ? Date.now() + this.randomInt(2, 20) * 24 * 60 * 60 * 1000
      : undefined;

    return {
      assigneeId: shouldAssign ? this.randomElement(this.users)._id : undefined,
      boardId: this.boardId,
      columnId: column._id,
      createdBy: createdBy._id,
      description: this.randomBoolean(0.7) ? this.faker.lorem.sentences({ min: 1, max: 2 }) : undefined,
      dueDate,
      order,
      priority,
      title: this.faker.lorem.sentence({ max: 6, min: 2 }),
    };
  }

  validateRecord(record: TaskData): boolean {
    return !!record.title && !!record.boardId && !!record.columnId;
  }

  private async ensureBoard(): Promise<void> {
    const existingBoard = await this.ctx.db.query('kanbanBoards').first();
    if (!existingBoard) {
      this.boardId = await this.ctx.db.insert('kanbanBoards', {
        createdBy: this.users[0]._id,
        description: 'Bảng công việc nội bộ mặc định',
        name: 'Công việc nội bộ',
        order: 0,
      });
    } else {
      this.boardId = existingBoard._id;
    }

    if (!this.boardId) {
      throw new Error('Kanban board not initialized');
    }

    let columns = await this.ctx.db
      .query('kanbanColumns')
      .withIndex('by_board_order', q => q.eq('boardId', this.boardId!))
      .collect();

    if (columns.length === 0) {
      const defaults = [
        { color: 'slate', icon: 'CircleDashed', title: 'Chưa làm' },
        { color: 'blue', icon: 'Loader2', title: 'Đang làm' },
        { color: 'amber', icon: 'Eye', title: 'Review' },
        { color: 'emerald', icon: 'CheckCircle2', title: 'Xong' },
      ];

      await Promise.all(
        defaults.map((column, index) => this.ctx.db.insert('kanbanColumns', {
          boardId: this.boardId!,
          color: column.color,
          icon: column.icon,
          order: index,
          title: column.title,
        }))
      );

      columns = await this.ctx.db
        .query('kanbanColumns')
        .withIndex('by_board_order', q => q.eq('boardId', this.boardId!))
        .collect();
    }

    this.columns = columns.sort((a, b) => a.order - b.order);
    await this.loadTaskOrders();
  }

  private async loadTaskOrders(): Promise<void> {
    if (!this.boardId) {
      return;
    }

    const tasks = await this.ctx.db
      .query('kanbanTasks')
      .withIndex('by_board', q => q.eq('boardId', this.boardId!))
      .collect();

    const orderMap = new Map<Id<'kanbanColumns'>, number>();
    this.columns.forEach(column => orderMap.set(column._id, 0));
    tasks.forEach(task => {
      orderMap.set(task.columnId, (orderMap.get(task.columnId) ?? 0) + 1);
    });

    this.orderByColumn = orderMap;
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'kanban');
  }
}
