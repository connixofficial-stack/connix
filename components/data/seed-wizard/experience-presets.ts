import type { ExperienceKey } from '@/lib/experiences';
import type { WebsiteType } from './types';

export type ExperiencePreset = {
  key: string;
  label: string;
  description: string;
  helper: string;
  settings: Partial<Record<ExperienceKey, Record<string, unknown>>>;
  summary: string;
};

const DEFAULT_PRESET: ExperiencePreset = {
  key: 'default',
  label: 'Mặc định',
  description: 'Dùng layout mặc định của hệ thống.',
  helper: 'Bạn có thể chỉnh chi tiết sau tại /system/experiences.',
  settings: {},
  summary: 'Dùng mặc định hệ thống',
};

const EXPERIENCE_PRESETS: Record<WebsiteType, ExperiencePreset[]> = {
  landing: [DEFAULT_PRESET],
  blog: [
    {
      key: 'magazine',
      label: 'Magazine',
      description: 'Hero + editorial grid, phù hợp nội dung nổi bật.',
      helper: 'Tập trung vào bài viết nổi bật và category tabs.',
      settings: {
        posts_list_ui: { layoutStyle: 'magazine' },
        posts_detail_ui: { layoutStyle: 'modern' },
      },
      summary: 'Posts list magazine + detail modern',
    },
    {
      key: 'clean',
      label: 'Clean',
      description: 'Tối giản, full width, ít distraction.',
      helper: 'Ưu tiên đọc nội dung dài, ít sidebar.',
      settings: {
        posts_list_ui: { layoutStyle: 'fullwidth' },
        posts_detail_ui: { layoutStyle: 'minimal' },
      },
      summary: 'Posts list fullwidth + detail minimal',
    },
  ],
  catalog: [
    {
      key: 'classic',
      label: 'Classic',
      description: 'Grid + sidebar filter, dễ làm quen.',
      helper: 'Phù hợp shop truyền thống, dễ điều hướng.',
      settings: {
        product_detail_ui: { layoutStyle: 'classic' },
        products_list_ui: { layoutStyle: 'sidebar' },
        wishlist_ui: { layoutStyle: 'grid' },
      },
      summary: 'Product detail classic + list sidebar',
    },
    {
      key: 'modern',
      label: 'Modern',
      description: 'Full width, hình lớn, tối ưu landing.',
      helper: 'Ưu tiên hình ảnh, CTA rõ ràng.',
      settings: {
        product_detail_ui: { layoutStyle: 'modern' },
        products_list_ui: { layoutStyle: 'grid' },
        wishlist_ui: { layoutStyle: 'table' },
      },
      summary: 'Product detail modern + list grid',
    },
    {
      key: 'minimal',
      label: 'Minimal',
      description: 'Tối giản, clean layout, ít chi tiết.',
      helper: 'Tập trung vào nội dung sản phẩm.',
      settings: {
        product_detail_ui: { layoutStyle: 'minimal' },
        products_list_ui: { layoutStyle: 'list' },
        wishlist_ui: { layoutStyle: 'list' },
      },
      summary: 'Product detail minimal + list list',
    },
  ],
  ecommerce: [
    {
      key: 'classic',
      label: 'Classic',
      description: 'Drawer cart + multi-step checkout.',
      helper: 'Luồng quen thuộc, dễ follow.',
      settings: {
        product_detail_ui: { layoutStyle: 'classic' },
        products_list_ui: { layoutStyle: 'sidebar' },
        cart_ui: { layoutStyle: 'drawer' },
        checkout_ui: { flowStyle: 'multi-step' },
        wishlist_ui: { layoutStyle: 'grid' },
      },
      summary: 'Cart drawer + checkout multi-step',
    },
    {
      key: 'modern',
      label: 'Modern',
      description: 'Page cart + single page checkout.',
      helper: 'Tối ưu tốc độ mua, ít bước.',
      settings: {
        product_detail_ui: { layoutStyle: 'modern' },
        products_list_ui: { layoutStyle: 'grid' },
        cart_ui: { layoutStyle: 'page' },
        checkout_ui: { flowStyle: 'single-page' },
        wishlist_ui: { layoutStyle: 'table' },
      },
      summary: 'Cart page + checkout single page',
    },
    {
      key: 'minimal',
      label: 'Minimal',
      description: 'Wizard accordion + UI tối giản.',
      helper: 'Phù hợp shop ít sản phẩm, trải nghiệm nhanh.',
      settings: {
        product_detail_ui: { layoutStyle: 'minimal' },
        products_list_ui: { layoutStyle: 'list' },
        cart_ui: { layoutStyle: 'drawer' },
        checkout_ui: { flowStyle: 'wizard-accordion' },
        wishlist_ui: { layoutStyle: 'list' },
      },
      summary: 'Checkout wizard + list tối giản',
    },
  ],
  services: [
    {
      key: 'professional',
      label: 'Professional',
      description: 'Card grid + CTA rõ ràng.',
      helper: 'Phù hợp agency/dịch vụ chuyên nghiệp.',
      settings: {
        services_list_ui: { layoutStyle: 'grid' },
        services_detail_ui: { layoutStyle: 'modern' },
      },
      summary: 'Services grid + detail modern',
    },
    {
      key: 'simple',
      label: 'Simple',
      description: 'Danh sách đơn giản, focus nội dung.',
      helper: 'Ít trang trí, dễ đọc.',
      settings: {
        services_list_ui: { layoutStyle: 'list' },
        services_detail_ui: { layoutStyle: 'minimal' },
      },
      summary: 'Services list + detail minimal',
    },
  ],
};

export const getExperiencePresets = (websiteType: WebsiteType): ExperiencePreset[] =>
  EXPERIENCE_PRESETS[websiteType] ?? [DEFAULT_PRESET];

export const getDefaultExperiencePresetKey = (websiteType: WebsiteType): string =>
  (getExperiencePresets(websiteType)[0] ?? DEFAULT_PRESET).key;

export const getExperiencePreset = (
  websiteType: WebsiteType,
  presetKey: string
): ExperiencePreset =>
  getExperiencePresets(websiteType).find((preset) => preset.key === presetKey) ?? DEFAULT_PRESET;
