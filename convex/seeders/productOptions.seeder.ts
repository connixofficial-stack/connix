import type { GenericMutationCtx } from 'convex/server';
import type { DataModel } from '../_generated/dataModel';

type PresetProductOption = {
  compareUnit?: string;
  displayType: 'dropdown' | 'buttons' | 'radio' | 'color_swatch' | 'image_swatch' | 'color_picker' | 'number_input' | 'text_input';
  inputType?: 'text' | 'number' | 'color';
  name: string;
  showPriceCompare?: boolean;
  slug: string;
  unit?: string;
};

export const PRESET_PRODUCT_OPTIONS: PresetProductOption[] = [
  { displayType: 'color_swatch', name: 'Màu sắc', slug: 'color' },
  { displayType: 'buttons', name: 'Kích thước', slug: 'size' },
  { displayType: 'dropdown', name: 'Chất liệu', slug: 'material' },
  { displayType: 'number_input', inputType: 'number', name: 'Khối lượng', slug: 'weight', unit: 'kg' },
  { displayType: 'number_input', inputType: 'number', name: 'Dung tích', slug: 'volume', unit: 'ml' },
  { displayType: 'buttons', name: 'Đóng gói', slug: 'packaging' },
  { displayType: 'buttons', name: 'Số lượng', slug: 'bundle' },
  { displayType: 'radio', name: 'Thời hạn', slug: 'duration', showPriceCompare: true, compareUnit: 'tháng' },
  { displayType: 'radio', name: 'Loại license', slug: 'license' },
  { displayType: 'number_input', inputType: 'number', name: 'Số người dùng', slug: 'users' },
];

export async function seedPresetProductOptions(ctx: GenericMutationCtx<DataModel>) {
  let nextOrder = 0;
  const lastOption = await ctx.db.query('productOptions').order('desc').first();
  if (lastOption) {
    nextOrder = lastOption.order + 1;
  }

  for (const preset of PRESET_PRODUCT_OPTIONS) {
    const existing = await ctx.db
      .query('productOptions')
      .withIndex('by_slug', (q) => q.eq('slug', preset.slug))
      .unique();
    if (existing) {
      continue;
    }

    const payload: Omit<DataModel['productOptions']['document'], '_id' | '_creationTime'> = {
      active: true,
      compareUnit: preset.compareUnit,
      displayType: preset.displayType,
      inputType: preset.inputType,
      isPreset: true,
      name: preset.name,
      order: nextOrder,
      showPriceCompare: preset.showPriceCompare,
      slug: preset.slug,
      unit: preset.unit,
    };

    await ctx.db.insert('productOptions', payload);
    nextOrder += 1;
  }
}
