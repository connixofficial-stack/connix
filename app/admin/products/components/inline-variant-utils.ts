import type { Id } from '@/convex/_generated/dataModel';
import type { VariantOptionSelection, VariantRow } from './inline-matrix-builder';

export type NormalizedVariantOptionSelection = {
  optionId: Id<'productOptions'>;
  valueIds: Id<'productOptionValues'>[];
};

export type NormalizedVariantRow = {
  id?: Id<'productVariants'>;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  optionValues: Array<{
    optionId: Id<'productOptions'>;
    valueId: Id<'productOptionValues'>;
  }>;
};

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toOptionalPositiveNumber = (value: unknown) => {
  const parsed = toFiniteNumber(value, 0);
  return parsed > 0 ? parsed : undefined;
};

export const normalizeVariantSelections = (selections: VariantOptionSelection[]): NormalizedVariantOptionSelection[] =>
  selections
    .map((selection) => ({
      optionId: selection.optionId,
      valueIds: Array.from(new Set(selection.valueIds)).filter(Boolean),
    }))
    .filter((selection) => selection.valueIds.length > 0);

export const normalizeVariantRows = (rows: VariantRow[]): NormalizedVariantRow[] =>
  rows
    .map((row) => ({
      id: row.id,
      sku: row.sku.trim(),
      price: toFiniteNumber(row.price, 0),
      salePrice: toOptionalPositiveNumber(row.salePrice),
      stock: Math.max(0, Math.trunc(toFiniteNumber(row.stock, 0))),
      optionValues: row.optionValues.filter((item) => Boolean(item.optionId && item.valueId)),
    }))
    .filter((row) => row.optionValues.length > 0);

export const validateVariantPayload = (
  selections: NormalizedVariantOptionSelection[],
  variants: NormalizedVariantRow[],
  requireVariantPrice: boolean
) => {
  if (selections.length === 0) {
    return 'Vui lòng chọn ít nhất một thuộc tính có sẵn';
  }
  if (selections.some((selection) => selection.valueIds.length === 0)) {
    return 'Mỗi thuộc tính cần chọn ít nhất một giá trị có sẵn';
  }
  if (variants.length === 0) {
    return 'Vui lòng tạo ít nhất một dòng phiên bản';
  }
  if (variants.some((variant) => variant.optionValues.length !== selections.length)) {
    return 'Dữ liệu phiên bản chưa khớp với thuộc tính đã chọn';
  }
  if (variants.some((variant) => !variant.sku)) {
    return 'Vui lòng nhập SKU cho tất cả phiên bản hoặc bấm “Tự sinh SKU”';
  }
  const seenSkus = new Set<string>();
  for (const variant of variants) {
    const normalizedSku = variant.sku.toLowerCase();
    if (seenSkus.has(normalizedSku)) {
      return `SKU phiên bản bị trùng: ${variant.sku}`;
    }
    seenSkus.add(normalizedSku);
  }
  if (requireVariantPrice && variants.some((variant) => variant.price <= 0)) {
    return 'Giá bán của từng phiên bản phải lớn hơn 0';
  }
  return null;
};
