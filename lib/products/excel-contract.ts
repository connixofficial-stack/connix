export type ProductExcelStatus = 'Active' | 'Draft' | 'Archived';

export type ProductExcelColumnKey =
  | 'name'
  | 'slug'
  | 'sku'
  | 'categorySlug'
  | 'price'
  | 'salePrice'
  | 'stock'
  | 'status'
  | 'image'
  | 'description';

export interface ProductExcelColumn {
  key: ProductExcelColumnKey;
  label: string;
  required?: boolean;
  fieldKey?: string;
  width?: number;
  numberFormat?: string;
}

export const PRODUCT_STATUS_LABELS: Record<ProductExcelStatus, string> = {
  Active: 'Đang bán',
  Archived: 'Lưu trữ',
  Draft: 'Bản nháp',
};

export const PRODUCT_EXCEL_BASE_COLUMNS: ProductExcelColumn[] = [
  { key: 'name', label: 'Tên sản phẩm', required: true, width: 32 },
  { key: 'slug', label: 'Slug', required: true, width: 26 },
  { key: 'sku', label: 'SKU', required: true, width: 18 },
  { key: 'categorySlug', label: 'Slug danh mục', required: true, width: 22 },
  { key: 'price', label: 'Giá bán', required: true, width: 14, numberFormat: '#,##0' },
  { key: 'status', label: 'Trạng thái', required: true, width: 16 },
];

export const PRODUCT_EXCEL_OPTIONAL_COLUMNS: ProductExcelColumn[] = [
  { key: 'salePrice', label: 'Giá khuyến mãi', fieldKey: 'salePrice', width: 16, numberFormat: '#,##0' },
  { key: 'stock', label: 'Tồn kho', fieldKey: 'stock', width: 12, numberFormat: '#,##0' },
  { key: 'image', label: 'Ảnh đại diện (URL)', fieldKey: 'image', width: 32 },
  { key: 'description', label: 'Mô tả', fieldKey: 'description', width: 48 },
];

const STATUS_NORMALIZED_MAP = Object.entries(PRODUCT_STATUS_LABELS).reduce(
  (acc, [key, label]) => {
    acc[normalizeExcelText(key).toLowerCase()] = key as ProductExcelStatus;
    acc[normalizeExcelText(label).toLowerCase()] = key as ProductExcelStatus;
    return acc;
  },
  {} as Record<string, ProductExcelStatus>
);

export function getProductExcelColumns(enabledFields: Set<string>): ProductExcelColumn[] {
  const optional = PRODUCT_EXCEL_OPTIONAL_COLUMNS.filter((column) =>
    column.fieldKey ? enabledFields.has(column.fieldKey) : true
  );
  return [...PRODUCT_EXCEL_BASE_COLUMNS, ...optional];
}

export function normalizeExcelText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const record = value as { text?: string; richText?: { text: string }[] };
    if (record.text) {
      return String(record.text).trim();
    }
    if (record.richText) {
      return record.richText.map((item) => item.text).join('').trim();
    }
  }

  return '';
}

export function parseExcelNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = normalizeExcelText(value);
  if (!normalized) {
    return null;
  }
  const parsed = Number.parseFloat(normalized.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseExcelStatus(value: unknown): ProductExcelStatus | null {
  const normalized = normalizeExcelText(value).toLowerCase();
  if (!normalized) {
    return null;
  }
  return STATUS_NORMALIZED_MAP[normalized] ?? null;
}

export function parseExcelImageUrls(value: unknown): string[] {
  const normalized = normalizeExcelText(value);
  if (!normalized) {
    return [];
  }
  return normalized
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildHeaderMap(headers: string[]): Map<ProductExcelColumnKey, number> {
  const map = new Map<ProductExcelColumnKey, number>();
  const columns = [...PRODUCT_EXCEL_BASE_COLUMNS, ...PRODUCT_EXCEL_OPTIONAL_COLUMNS];
  const normalizedHeaders = headers.map((header) => normalizeExcelText(header).toLowerCase());

  columns.forEach((column) => {
    const keyIndex = normalizedHeaders.findIndex((header) => header === column.key.toLowerCase());
    if (keyIndex >= 0) {
      map.set(column.key, keyIndex);
      return;
    }
    const labelIndex = normalizedHeaders.findIndex((header) => header === column.label.toLowerCase());
    if (labelIndex >= 0) {
      map.set(column.key, labelIndex);
    }
  });

  return map;
}

export function isRowEmpty(values: string[]): boolean {
  return values.every((value) => !value.trim());
}
