export const ORDER_STATUS_PRESET_VALUES = ['simple', 'standard', 'advanced'] as const;

export type OrderStatusPreset = (typeof ORDER_STATUS_PRESET_VALUES)[number];

export type OrderStatusConfig = {
  key: string;
  label: string;
  color: string;
  step: number;
  isFinal: boolean;
  allowCancel: boolean;
};

export const ORDER_STATUS_PRESETS: Record<OrderStatusPreset, OrderStatusConfig[]> = {
  simple: [
    { key: 'Processing', label: 'Đang xử lý', color: '#f59e0b', step: 2, isFinal: false, allowCancel: false },
    { key: 'Delivered', label: 'Hoàn thành', color: '#22c55e', step: 4, isFinal: true, allowCancel: false },
    { key: 'Cancelled', label: 'Đã hủy', color: '#ef4444', step: 1, isFinal: true, allowCancel: false },
  ],
  standard: [
    { key: 'Pending', label: 'Chờ xử lý', color: '#64748b', step: 1, isFinal: false, allowCancel: true },
    { key: 'Processing', label: 'Đang xử lý', color: '#f59e0b', step: 2, isFinal: false, allowCancel: false },
    { key: 'Shipped', label: 'Đang giao', color: '#3b82f6', step: 3, isFinal: false, allowCancel: false },
    { key: 'Delivered', label: 'Đã giao', color: '#22c55e', step: 4, isFinal: true, allowCancel: false },
    { key: 'Cancelled', label: 'Đã hủy', color: '#ef4444', step: 1, isFinal: true, allowCancel: false },
  ],
  advanced: [
    { key: 'PendingPayment', label: 'Chờ thanh toán', color: '#94a3b8', step: 1, isFinal: false, allowCancel: true },
    { key: 'Pending', label: 'Chờ xử lý', color: '#64748b', step: 1, isFinal: false, allowCancel: true },
    { key: 'Processing', label: 'Đang xử lý', color: '#f59e0b', step: 2, isFinal: false, allowCancel: false },
    { key: 'Shipped', label: 'Đang giao', color: '#3b82f6', step: 3, isFinal: false, allowCancel: false },
    { key: 'PartiallyShipped', label: 'Giao một phần', color: '#8b5cf6', step: 3, isFinal: false, allowCancel: false },
    { key: 'Delivered', label: 'Đã giao', color: '#22c55e', step: 4, isFinal: true, allowCancel: false },
    { key: 'Cancelled', label: 'Đã hủy', color: '#ef4444', step: 1, isFinal: true, allowCancel: false },
    { key: 'Refunded', label: 'Hoàn tiền', color: '#ec4899', step: 4, isFinal: true, allowCancel: false },
  ],
};

export const DEFAULT_ORDER_STATUS_PRESET: OrderStatusPreset = 'advanced';
export const DEFAULT_ORDER_STATUSES = ORDER_STATUS_PRESETS[DEFAULT_ORDER_STATUS_PRESET];

export const normalizeOrderStatusPreset = (value: unknown): OrderStatusPreset =>
  ORDER_STATUS_PRESET_VALUES.includes(value as OrderStatusPreset)
    ? (value as OrderStatusPreset)
    : DEFAULT_ORDER_STATUS_PRESET;

export const parseOrderStatuses = (
  value: unknown,
  preset: OrderStatusPreset = DEFAULT_ORDER_STATUS_PRESET
): OrderStatusConfig[] => {
  const fallback = ORDER_STATUS_PRESETS[preset] ?? DEFAULT_ORDER_STATUSES;
  const raw = typeof value === 'string'
    ? (() => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return undefined;
        }
      })()
    : value;

  if (!Array.isArray(raw)) {
    return fallback;
  }

  const normalized = new Map<string, OrderStatusConfig>();
  raw.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }
    const record = item as Partial<OrderStatusConfig> & { key?: unknown };
    const key = String(record.key ?? '').trim();
    if (!key) {
      return;
    }
    const stepValue = Number(record.step ?? 1);
    const step = Number.isFinite(stepValue) ? Math.min(Math.max(stepValue, 1), 4) : 1;
    normalized.set(key, {
      key,
      label: String(record.label ?? key),
      color: String(record.color ?? '#64748b'),
      step,
      isFinal: Boolean(record.isFinal),
      allowCancel: Boolean(record.allowCancel),
    });
  });

  return normalized.size > 0 ? Array.from(normalized.values()) : fallback;
};
