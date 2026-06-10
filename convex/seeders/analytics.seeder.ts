/**
 * Analytics Seeder
 *
 * Seeds pageViews data for analytics dashboards
 */

import { BaseSeeder, type SeedDependency } from './base';
import type { Doc } from '../_generated/dataModel';
import { clearAllPageViewAggregates } from '../lib/aggregates/pageViews';

type PageViewData = Omit<Doc<'pageViews'>, '_creationTime' | '_id'>;

const PATHS = ['/', '/products', '/posts', '/about', '/contact', '/services', '/cart', '/checkout'];
const DEVICES = ['mobile', 'desktop', 'tablet'] as const;
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const COUNTRIES = ['VN', 'US', 'SG', 'JP', 'KR'];

export class AnalyticsSeeder extends BaseSeeder<PageViewData> {
  moduleName = 'analytics';
  tableName = 'pageViews';
  dependencies: SeedDependency[] = [];

  generateFake(): PageViewData {
    const sessionId = this.faker.string.uuid();

    return {
      browser: this.randomElement(BROWSERS),
      country: this.randomElement(COUNTRIES),
      device: this.randomElement([...DEVICES]),
      os: this.faker.helpers.arrayElement(['iOS', 'Android', 'Windows', 'macOS', 'Linux']),
      path: this.randomElement(PATHS),
      referrer: this.randomBoolean(0.4) ? this.faker.internet.url() : undefined,
      sessionId,
      userAgent: this.faker.internet.userAgent(),
    };
  }

  validateRecord(record: PageViewData): boolean {
    return !!record.path && !!record.sessionId;
  }

  protected async clear(): Promise<void> {
    // 1. Dọn dẹp sạch các aggregate của page views
    await clearAllPageViewAggregates(this.ctx as any);

    // 2. Xóa các pageViews trong database theo lô (batch size 500)
    let hasMoreViews = true;
    while (hasMoreViews) {
      const views = await this.ctx.db.query('pageViews').take(500);
      if (views.length === 0) {
        hasMoreViews = false;
      } else {
        await Promise.all(views.map((v) => this.ctx.db.delete(v._id)));
      }
    }

    // 3. Xóa các pageViewSessionBuckets theo lô (batch size 500)
    let hasMoreBuckets = true;
    while (hasMoreBuckets) {
      const buckets = await this.ctx.db.query('pageViewSessionBuckets').take(500);
      if (buckets.length === 0) {
        hasMoreBuckets = false;
      } else {
        await Promise.all(buckets.map((b) => this.ctx.db.delete(b._id)));
      }
    }

    // 4. Xoá cờ settings
    const readySetting = await this.ctx.db.query('settings').withIndex('by_key', q => q.eq('key', 'pageViewsAggregatesReady')).unique();
    if (readySetting) await this.ctx.db.delete(readySetting._id);
    
    const backfillSetting = await this.ctx.db.query('settings').withIndex('by_key', q => q.eq('key', 'pageViewsAggregatesBackfilledAt')).unique();
    if (backfillSetting) await this.ctx.db.delete(backfillSetting._id);
  }
}

