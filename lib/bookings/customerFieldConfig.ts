export type BookingCustomerFieldKey = 'full_name' | 'phone' | 'note';

export type BookingCustomerFieldConfig = {
  key: BookingCustomerFieldKey;
  label: string;
  required: boolean;
  enabled: boolean;
};

export const BOOKING_CUSTOMER_FIELD_OPTIONS: Array<{ key: BookingCustomerFieldKey; label: string }> = [
  { key: 'full_name', label: 'Họ và tên' },
  { key: 'phone', label: 'Số điện thoại' },
  { key: 'note', label: 'Ghi chú' },
];

export const DEFAULT_BOOKING_CUSTOMER_FIELDS: BookingCustomerFieldConfig[] = [
  { key: 'full_name', label: 'Họ và tên', required: true, enabled: true },
  { key: 'phone', label: 'Số điện thoại', required: true, enabled: true },
  { key: 'note', label: 'Ghi chú', required: false, enabled: true },
];

const BOOKING_FIELD_KEY_SET = new Set<BookingCustomerFieldKey>(BOOKING_CUSTOMER_FIELD_OPTIONS.map((item) => item.key));

const coerceText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const getDefaultConfigByKey = (key: BookingCustomerFieldKey) =>
  DEFAULT_BOOKING_CUSTOMER_FIELDS.find((field) => field.key === key)
  ?? { key, label: BOOKING_CUSTOMER_FIELD_OPTIONS.find((item) => item.key === key)?.label ?? key, required: false, enabled: true };

export const normalizeBookingCustomerFieldConfigs = (value: unknown): BookingCustomerFieldConfig[] => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_BOOKING_CUSTOMER_FIELDS];
  }

  const usedKeys = new Set<BookingCustomerFieldKey>();
  const normalized: BookingCustomerFieldConfig[] = [];

  value.forEach((item) => {
    if (!item || typeof item !== 'object') {
      return;
    }
    const keyRaw = (item as { key?: unknown }).key;
    if (typeof keyRaw !== 'string' || !BOOKING_FIELD_KEY_SET.has(keyRaw as BookingCustomerFieldKey)) {
      return;
    }

    const key = keyRaw as BookingCustomerFieldKey;
    if (usedKeys.has(key)) {
      return;
    }

    const defaultConfig = getDefaultConfigByKey(key);
    const label = coerceText((item as { label?: unknown }).label) || defaultConfig.label;
    const requiredInput = typeof (item as { required?: unknown }).required === 'boolean'
      ? ((item as { required?: boolean }).required as boolean)
      : defaultConfig.required;
    const enabledInput = typeof (item as { enabled?: unknown }).enabled === 'boolean'
      ? ((item as { enabled?: boolean }).enabled as boolean)
      : defaultConfig.enabled;

    const required = key === 'full_name' ? true : requiredInput;
    const enabled = key === 'full_name' ? true : enabledInput;

    normalized.push({ key, label, required, enabled });
    usedKeys.add(key);
  });

  if (normalized.length === 0) {
    return [...DEFAULT_BOOKING_CUSTOMER_FIELDS];
  }

  return normalized;
};

export const getBookingFieldLabel = (key: BookingCustomerFieldKey) =>
  BOOKING_CUSTOMER_FIELD_OPTIONS.find((item) => item.key === key)?.label ?? key;
