/**
 * Settings Seeder
 */

import { BaseSeeder, type SeedConfig, type SeedDependency, type SeedResult } from './base';
import { syncModuleRuntimeConfig } from '../lib/moduleConfigSync';
import type { Doc, DataModel } from '../_generated/dataModel';
import type { GenericMutationCtx } from 'convex/server';

type SettingData = Omit<Doc<'settings'>, '_creationTime' | '_id'>;

export class SettingsSeeder extends BaseSeeder<SettingData> {
  moduleName = 'settings';
  tableName = 'settings';
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

    const created = await this.seedSettingsData();
    await this.seedModuleConfig();

    return {
      created,
      dependencies: [],
      duration: Date.now() - startTime,
      module: this.moduleName,
      skipped: 0,
    };
  }

  generateFake(): SettingData {
    return { group: 'site', key: 'site_name', value: 'Website' };
  }

  validateRecord(record: SettingData): boolean {
    return !!record.group && !!record.key;
  }

  protected async clear(): Promise<void> {
    const settings = await this.ctx.db.query('settings').collect();
    await Promise.all(settings.map(setting => this.ctx.db.delete(setting._id)));
  }

  private async seedSettingsData(): Promise<number> {
    const existingSettings = await this.ctx.db.query('settings').first();
    if (existingSettings) {
      return 0;
    }

    const settingsData: SettingData[] = [
      { group: 'site', key: 'site_name', value: 'Website' },
      { group: 'site', key: 'site_tagline', value: '' },
      { group: 'site', key: 'site_url', value: '' },
      { group: 'site', key: 'site_logo', value: '' },
      { group: 'site', key: 'site_favicon', value: '' },
      { group: 'site', key: 'site_timezone', value: 'Asia/Ho_Chi_Minh' },
      { group: 'site', key: 'site_language', value: 'vi' },
      { group: 'site', key: 'site_brand_mode', value: 'dual' },
      { group: 'site', key: 'site_brand_primary', value: '#3b82f6' },
      { group: 'site', key: 'site_brand_secondary', value: '' },
      { group: 'contact', key: 'contact_email', value: '' },
      { group: 'contact', key: 'contact_phone', value: '' },
      { group: 'contact', key: 'contact_address', value: '' },
      { group: 'contact', key: 'contact_tax_id', value: '' },
      { group: 'contact', key: 'contact_zalo', value: '' },
      { group: 'contact', key: 'contact_messenger', value: '' },
      { group: 'contact', key: 'contact_map_provider', value: 'openstreetmap' },
      { group: 'contact', key: 'contact_google_map_embed_iframe', value: '' },
      { group: 'seo', key: 'seo_title', value: '' },
      { group: 'seo', key: 'seo_description', value: '' },
      { group: 'seo', key: 'seo_keywords', value: '' },
      { group: 'seo', key: 'seo_og_image', value: '' },
      { group: 'seo', key: 'seo_google_verification', value: '' },
      { group: 'seo', key: 'seo_bing_verification', value: '' },
      { group: 'advanced', key: 'product_image_placeholder', value: '' },
      { group: 'social', key: 'social_facebook', value: '' },
      { group: 'social', key: 'social_instagram', value: '' },
      { group: 'social', key: 'social_youtube', value: '' },
      { group: 'social', key: 'social_tiktok', value: '' },
      { group: 'social', key: 'social_pinterest', value: '' },
      { group: 'social', key: 'social_twitter', value: '' },
      { group: 'mail', key: 'mail_from_name', value: 'Website' },
      { group: 'mail', key: 'mail_from_email', value: '' },
      { group: 'mail', key: 'mail_driver', value: 'smtp' },
      { group: 'mail', key: 'mail_host', value: '' },
      { group: 'mail', key: 'mail_username', value: '' },
      { group: 'mail', key: 'mail_password', value: '' },
      { group: 'mail', key: 'mail_port', value: 587 },
      { group: 'mail', key: 'mail_encryption', value: 'tls' },
      {
        group: 'experience',
        key: 'product_detail_ui',
        value: {
          layoutStyle: 'classic',
          showAddToCart: true,
          showClassicHighlights: true,
          showRating: true,
          showWishlist: true,
          showBuyNow: true,
          enableImageLightbox: false,
        },
      },
      {
        group: 'experience',
        key: 'wishlist_ui',
        value: {
          layoutStyle: 'grid',
          showNote: true,
          showNotification: true,
          showWishlistButton: true,
        },
      },
      {
        group: 'experience',
        key: 'cart_ui',
        value: {
          layoutStyle: 'drawer',
          showExpiry: false,
          showNote: false,
        },
      },
      {
        group: 'experience',
        key: 'checkout_ui',
        value: {
          flowStyle: 'multi-step',
          showBuyNow: true,
          layouts: {
            'single-page': {
              orderSummaryPosition: 'right',
              showPaymentMethods: true,
              showShippingOptions: true,
            },
            'multi-step': {
              orderSummaryPosition: 'right',
              showPaymentMethods: true,
              showShippingOptions: true,
            },
          },
        },
      },
      {
        group: 'experience',
        key: 'comments_rating_ui',
        value: {
          commentsSortOrder: 'newest',
          ratingDisplayStyle: 'both',
          showLikes: true,
          showModeration: true,
          showReplies: true,
        },
      },
    ];

    await Promise.all(settingsData.map(setting => this.ctx.db.insert('settings', setting)));
    return settingsData.length;
  }

  private async seedModuleConfig(): Promise<void> {
    await syncModuleRuntimeConfig(this.ctx, 'settings');
  }
}
