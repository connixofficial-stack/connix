/**
 * Notifications Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency, type SeedResult } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type NotificationData = Omit<Doc<'notifications'>, '_creationTime' | '_id'>;

export class NotificationsSeeder extends BaseSeeder<NotificationData> {
  moduleName = 'notifications';
  tableName = 'notifications';
  dependencies: SeedDependency[] = [];

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
  }

  async seed(config: SeedConfig): Promise<SeedResult> {
    const startTime = Date.now();
    this.config = { batchSize: 50, dependencies: true, force: false, ...config };

    if (config.force) {
      await this.clear();
    }

    const created = await this.seedNotifications();
    await this.seedModuleConfig();
    await this.seedStats();

    return {
      created,
      dependencies: [],
      duration: Date.now() - startTime,
      module: this.moduleName,
      skipped: 0,
    };
  }

  generateFake(): NotificationData {
    return {
      content: this.faker.lorem.paragraph(),
      order: 0,
      readCount: 0,
      status: 'Draft',
      targetType: 'all',
      title: this.faker.lorem.sentence(),
      type: 'info',
    };
  }

  validateRecord(record: NotificationData): boolean {
    return !!record.title && !!record.content;
  }

  protected async clear(): Promise<void> {
    const [notifications, stats] = await Promise.all([
      this.ctx.db.query('notifications').collect(),
      this.ctx.db.query('notificationStats').collect(),
    ]);
    await Promise.all([
      ...notifications.map(n => this.ctx.db.delete(n._id)),
      ...stats.map(stat => this.ctx.db.delete(stat._id)),
    ]);
  }

  private async seedNotifications(): Promise<number> {
    const existing = await this.ctx.db.query('notifications').first();
    if (existing) {
      return 0;
    }

    const notifications: NotificationData[] = [
      { content: 'Cảm ơn bạn đã sử dụng hệ thống quản trị VietAdmin. Chúc bạn có trải nghiệm tuyệt vời!', order: 0, readCount: 125, sendEmail: false, sentAt: Date.now() - 86_400_000 * 7, status: 'Sent', targetType: 'all', title: 'Chào mừng đến với VietAdmin', type: 'success' },
      { content: 'Hệ thống đã được cập nhật lên phiên bản 2.0 với nhiều tính năng mới. Xem chi tiết tại trang cập nhật.', order: 1, readCount: 42, sendEmail: true, sentAt: Date.now() - 86_400_000 * 3, status: 'Sent', targetType: 'users', title: 'Cập nhật hệ thống v2.0', type: 'info' },
      { content: 'Hệ thống sẽ bảo trì vào 2:00 AM - 4:00 AM ngày mai. Vui lòng lưu công việc trước thời gian này.', order: 2, readCount: 0, scheduledAt: Date.now() + 86_400_000, sendEmail: true, status: 'Scheduled', targetType: 'all', title: 'Bảo trì hệ thống', type: 'warning' },
      { content: 'Giảm giá 30% toàn bộ sản phẩm từ ngày 01/01 đến 15/01. Đừng bỏ lỡ cơ hội này!', order: 3, readCount: 856, sendEmail: true, sentAt: Date.now() - 86_400_000 * 2, status: 'Sent', targetType: 'customers', title: 'Khuyến mãi đặc biệt tháng 1', type: 'info' },
      { content: 'Đã phát hiện lỗi trong quá trình thanh toán. Đội ngũ kỹ thuật đang khắc phục.', order: 4, readCount: 18, sendEmail: false, sentAt: Date.now() - 86_400_000, status: 'Sent', targetType: 'users', title: 'Lỗi thanh toán', type: 'error' },
      { content: 'Đây là thông báo đang soạn, chưa gửi.', order: 5, readCount: 0, status: 'Draft', targetType: 'all', title: 'Thông báo nháp', type: 'info' },
    ];

    await Promise.all(notifications.map(notification => this.ctx.db.insert('notifications', notification)));
    return notifications.length;
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'notifications');
  }

  private async seedStats(): Promise<void> {
    const existingStats = await this.ctx.db.query('notificationStats').first();
    if (existingStats) {
      return;
    }

    const notifications = await this.ctx.db.query('notifications').collect();
    const counts: Record<string, number> = { Cancelled: 0, Draft: 0, Scheduled: 0, Sent: 0, total: 0 };
    for (const notification of notifications) {
      counts.total += 1;
      counts[notification.status] = (counts[notification.status] || 0) + 1;
      counts[notification.type] = (counts[notification.type] || 0) + 1;
    }

    await Promise.all(
      Object.entries(counts).map(([key, count]) => this.ctx.db.insert('notificationStats', { count, key }))
    );
  }
}
