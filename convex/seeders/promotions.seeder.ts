/**
 * Promotions Seeder
 *
 * Generates diverse promotions data with realistic schedules and types
 */

import { BaseSeeder, type SeedConfig, type SeedDependency } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import { createVietnameseFaker } from './fakerVi';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type PromotionData = Omit<Doc<'promotions'>, '_id' | '_creationTime'>;

const PROMOTION_TYPE_WEIGHTS = [
  { value: 'coupon' as const, weight: 4 },
  { value: 'campaign' as const, weight: 3 },
  { value: 'flash_sale' as const, weight: 2 },
  { value: 'bundle' as const, weight: 1 },
  { value: 'loyalty' as const, weight: 1 },
];

const DISCOUNT_TYPE_WEIGHTS = [
  { value: 'percent' as const, weight: 4 },
  { value: 'fixed' as const, weight: 3 },
  { value: 'buy_x_get_y' as const, weight: 1 },
  { value: 'buy_a_get_b' as const, weight: 1 },
  { value: 'tiered' as const, weight: 1 },
  { value: 'free_shipping' as const, weight: 1 },
  { value: 'gift' as const, weight: 1 },
];

const STATUS_WEIGHTS = [
  { value: 'Active' as const, weight: 6 },
  { value: 'Scheduled' as const, weight: 2 },
  { value: 'Inactive' as const, weight: 1 },
  { value: 'Expired' as const, weight: 1 },
];

const APPLICABLE_WEIGHTS = [
  { value: 'all' as const, weight: 6 },
  { value: 'products' as const, weight: 3 },
  { value: 'categories' as const, weight: 2 },
];

const CUSTOMER_TYPE_WEIGHTS = [
  { value: 'all' as const, weight: 7 },
  { value: 'new' as const, weight: 1 },
  { value: 'returning' as const, weight: 1 },
  { value: 'vip' as const, weight: 1 },
];

export class PromotionsSeeder extends BaseSeeder<PromotionData> {
  moduleName = 'promotions';
  tableName = 'promotions';
  dependencies: SeedDependency[] = [
    { module: 'products', required: false },
    { module: 'productCategories', required: false },
  ];

  private products: Doc<'products'>[] = [];
  private categories: Doc<'productCategories'>[] = [];
  private viFaker: ReturnType<typeof createVietnameseFaker>;
  private usedCodes = new Set<string>();
  private promotionCount = 0;

  constructor(ctx: GenericMutationCtx<DataModel>) {
    super(ctx);
    this.viFaker = createVietnameseFaker(this.faker);
  }

  async seed(config: SeedConfig) {
    await this.seedModuleConfig();
    [this.products, this.categories] = await Promise.all([
      this.ctx.db.query('products').collect(),
      this.ctx.db.query('productCategories').collect(),
    ]);

    return super.seed(config);
  }

  generateFake(): PromotionData {
    const promotionType = this.faker.helpers.weightedArrayElement(PROMOTION_TYPE_WEIGHTS);
    const discountType = this.faker.helpers.weightedArrayElement(DISCOUNT_TYPE_WEIGHTS);
    const status = this.faker.helpers.weightedArrayElement(STATUS_WEIGHTS);
    const customerType = this.faker.helpers.weightedArrayElement(CUSTOMER_TYPE_WEIGHTS);

    const now = Date.now();
    const scheduleType = this.resolveScheduleType(status);
    const { startDate, endDate, recurringDays, recurringHours } = this.resolveSchedule(status, scheduleType, now);

    const { applicableTo, applicableIds } = this.resolveApplicability();
    const { discountValue, discountConfig, maxDiscountAmount } = this.resolveDiscount(discountType);

    const usageLimit = this.randomBoolean(0.4) ? this.randomInt(20, 300) : undefined;
    const usedCount = this.resolveUsedCount(status, usageLimit);

    const budget = this.randomBoolean(0.2) ? this.randomInt(300_000, 5_000_000) : undefined;
    const budgetUsed = budget ? Math.min(budget, this.randomInt(0, budget)) : undefined;

    const minOrderAmount = this.randomBoolean(0.3) ? this.randomInt(100_000, 1_000_000) : undefined;
    const minOrderHistory = customerType !== 'all' && this.randomBoolean(0.3) ? this.randomInt(1, 5) : undefined;
    const minTotalSpent = customerType !== 'all' && this.randomBoolean(0.3) ? this.randomInt(1_000_000, 10_000_000) : undefined;

    const code = promotionType === 'coupon' ? this.generateCode() : undefined;
    const displayOnPage = status === 'Active'
      ? this.randomBoolean(0.8)
      : status === 'Scheduled'
        ? this.randomBoolean(0.6)
        : this.randomBoolean(0.2);

    return {
      applicableIds,
      applicableTo,
      budget,
      budgetUsed,
      code,
      customerType,
      description: this.buildDescription(promotionType, discountType),
      discountConfig,
      discountType,
      discountValue,
      displayOnPage,
      endDate,
      featured: this.randomBoolean(0.15),
      maxDiscountAmount,
      minOrderAmount,
      minOrderHistory,
      minTotalSpent,
      name: this.buildName(promotionType, discountType, discountValue),
      order: this.promotionCount++,
      promotionType,
      recurringDays,
      recurringHours,
      scheduleType,
      stackable: this.randomBoolean(0.3),
      startDate,
      status,
      usageLimit,
      usagePerCustomer: this.randomBoolean(0.3) ? this.randomInt(1, 3) : undefined,
      usedCount,
    };
  }

  validateRecord(record: PromotionData): boolean {
    return !!record.name && !!record.discountType && !!record.promotionType && record.usedCount >= 0;
  }

  protected async afterSeed(count: number): Promise<void> {
    void count;
    await this.updateStats();
  }

  private resolveScheduleType(status: PromotionData['status']): PromotionData['scheduleType'] {
    if (status === 'Scheduled' || status === 'Expired') {
      return 'dateRange';
    }
    return this.faker.helpers.weightedArrayElement([
      { value: 'always' as const, weight: 5 },
      { value: 'dateRange' as const, weight: 3 },
      { value: 'recurring' as const, weight: 2 },
    ]);
  }

  private resolveSchedule(
    status: PromotionData['status'],
    scheduleType: PromotionData['scheduleType'],
    now: number
  ) {
    const dayMs = 24 * 60 * 60 * 1000;
    if (scheduleType === 'recurring') {
      const recurringDays = this.faker.helpers.arrayElements([0, 1, 2, 3, 4, 5, 6], this.randomInt(2, 4));
      const startHour = this.randomInt(8, 14);
      const endHour = this.randomInt(startHour + 3, 22);
      return {
        endDate: undefined,
        recurringDays,
        recurringHours: { from: startHour * 60, to: endHour * 60 },
        startDate: undefined,
      };
    }

    if (status === 'Scheduled') {
      const startDate = now + this.randomInt(7, 30) * dayMs;
      const endDate = startDate + this.randomInt(7, 60) * dayMs;
      return { endDate, recurringDays: undefined, recurringHours: undefined, startDate };
    }

    if (status === 'Expired') {
      const endDate = now - this.randomInt(1, 30) * dayMs;
      const startDate = endDate - this.randomInt(7, 60) * dayMs;
      return { endDate, recurringDays: undefined, recurringHours: undefined, startDate };
    }

    if (scheduleType === 'dateRange') {
      const startDate = now - this.randomInt(1, 30) * dayMs;
      const endDate = now + this.randomInt(7, 90) * dayMs;
      return { endDate, recurringDays: undefined, recurringHours: undefined, startDate };
    }

    return { endDate: undefined, recurringDays: undefined, recurringHours: undefined, startDate: undefined };
  }

  private resolveApplicability() {
    const applicableTo = this.faker.helpers.weightedArrayElement(APPLICABLE_WEIGHTS);
    if (applicableTo === 'products' && this.products.length > 0) {
      const ids = this.faker.helpers.arrayElements(this.products, this.randomInt(1, Math.min(3, this.products.length)));
      return { applicableIds: ids.map((item) => item._id.toString()), applicableTo };
    }

    if (applicableTo === 'categories' && this.categories.length > 0) {
      const ids = this.faker.helpers.arrayElements(this.categories, this.randomInt(1, Math.min(3, this.categories.length)));
      return { applicableIds: ids.map((item) => item._id.toString()), applicableTo };
    }

    return { applicableIds: undefined, applicableTo: 'all' as const };
  }

  private resolveDiscount(discountType: PromotionData['discountType']) {
    if (discountType === 'percent') {
      const discountValue = this.randomInt(5, 40);
      const maxDiscountAmount = this.randomBoolean(0.4) ? this.randomInt(50_000, 500_000) : undefined;
      return { discountConfig: undefined, discountValue, maxDiscountAmount };
    }

    if (discountType === 'fixed') {
      return { discountConfig: undefined, discountValue: this.randomInt(10_000, 200_000), maxDiscountAmount: undefined };
    }

    if (discountType === 'free_shipping') {
      return { discountConfig: { maxDiscount: this.randomInt(20_000, 50_000) }, discountValue: undefined, maxDiscountAmount: undefined };
    }

    if (discountType === 'buy_x_get_y') {
      return {
        discountConfig: { buyQuantity: this.randomInt(2, 4), getQuantity: 1 },
        discountValue: undefined,
        maxDiscountAmount: undefined,
      };
    }

    if (discountType === 'buy_a_get_b') {
      return {
        discountConfig: { buyQuantity: 1, getQuantity: 1 },
        discountValue: undefined,
        maxDiscountAmount: undefined,
      };
    }

    if (discountType === 'tiered') {
      return {
        discountConfig: {
          tiers: [
            { min: 2, percent: 5 },
            { min: 4, percent: 10 },
          ],
        },
        discountValue: undefined,
        maxDiscountAmount: undefined,
      };
    }

    return {
      discountConfig: { gift: 'Quà tặng kèm' },
      discountValue: undefined,
      maxDiscountAmount: undefined,
    };
  }

  private resolveUsedCount(status: PromotionData['status'], usageLimit?: number): number {
    if (!usageLimit) {
      return this.randomInt(0, 50);
    }
    if (status === 'Expired') {
      return this.randomInt(usageLimit, usageLimit + 5);
    }
    if (status === 'Active') {
      return this.randomInt(0, Math.max(0, usageLimit - 1));
    }
    return this.randomInt(0, usageLimit);
  }

  private buildName(promotionType: PromotionData['promotionType'], discountType: PromotionData['discountType'], discountValue?: number): string {
    const base = this.viFaker.productName();
    if (discountType === 'percent' && discountValue) {
      return `${promotionType.toUpperCase()} ${discountValue}% - ${base}`;
    }
    if (discountType === 'fixed' && discountValue) {
      return `${promotionType.toUpperCase()} ${discountValue.toLocaleString()}đ - ${base}`;
    }
    if (discountType === 'free_shipping') {
      return `FREESHIP - ${base}`;
    }
    if (discountType === 'gift') {
      return `Tặng quà - ${base}`;
    }
    return `${promotionType.toUpperCase()} - ${base}`;
  }

  private buildDescription(promotionType: PromotionData['promotionType'], discountType: PromotionData['discountType']): string {
    const templates = [
      `Ưu đãi ${promotionType} hấp dẫn dành cho khách hàng thân thiết.`,
      `Chương trình ${promotionType} với mức giảm ${discountType} cực sốc.`,
      `Áp dụng ngay ${promotionType} để tiết kiệm đơn hàng hôm nay.`,
    ];
    return this.faker.helpers.arrayElement(templates);
  }

  private generateCode(): string {
    let code = '';
    let attempts = 0;
    do {
      code = this.faker.string.alphanumeric({ casing: 'upper', length: { max: 8, min: 6 } });
      attempts++;
    } while (this.usedCodes.has(code) && attempts < 10);
    this.usedCodes.add(code);
    return code;
  }

  private async updateStats(): Promise<void> {
    const existingStats = await this.ctx.db.query('promotionStats').collect();
    await Promise.all(existingStats.map((s) => this.ctx.db.delete(s._id)));

    const promotions = await this.ctx.db.query('promotions').collect();
    const counts: Record<string, number> = {
      Active: 0,
      Inactive: 0,
      Expired: 0,
      Scheduled: 0,
      total: promotions.length,
      totalUsed: 0,
      percent: 0,
      fixed: 0,
      buy_x_get_y: 0,
      buy_a_get_b: 0,
      tiered: 0,
      free_shipping: 0,
      gift: 0,
      coupon: 0,
      campaign: 0,
      flash_sale: 0,
      bundle: 0,
      loyalty: 0,
    };

    for (const promo of promotions) {
      counts[promo.status] = (counts[promo.status] || 0) + 1;
      counts[promo.discountType] = (counts[promo.discountType] || 0) + 1;
      counts[promo.promotionType] = (counts[promo.promotionType] || 0) + 1;
      counts.totalUsed += promo.usedCount ?? 0;
    }

    await Promise.all(
      Object.entries(counts).map(([key, count]) => this.ctx.db.insert('promotionStats', { count, key }))
    );
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'promotions');
  }
}
