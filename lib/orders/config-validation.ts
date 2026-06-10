export interface ShippingMethodConfig {
  id: string;
  label: string;
  description?: string;
  fee: number;
  estimate?: string;
}

export interface PaymentMethodConfig {
  id: string;
  label: string;
  description?: string;
  type: string;
}

export interface OrderStatusConfig {
  key: string;
  label: string;
  color: string;
  step: number;
  isFinal: boolean;
  allowCancel: boolean;
}

// Regex validate hex color code (#ffffff hoặc #fff)
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export function validateShippingMethods(methods: unknown): { success: boolean; data?: ShippingMethodConfig[]; error?: string } {
  if (typeof methods === 'string') {
    try {
      methods = JSON.parse(methods);
    } catch {
      return { success: false, error: 'Dữ liệu không phải là định dạng JSON hợp lệ.' };
    }
  }

  if (!Array.isArray(methods)) {
    return { success: false, error: 'Danh sách phương thức vận chuyển phải là một mảng.' };
  }

  const ids = new Set<string>();
  const validated: ShippingMethodConfig[] = [];

  for (let i = 0; i < methods.length; i++) {
    const item = methods[i];
    if (!item || typeof item !== 'object') {
      return { success: false, error: `Phương thức vận chuyển ở dòng ${i + 1} không hợp lệ.` };
    }

    const record = item as Partial<ShippingMethodConfig>;
    const id = String(record.id ?? '').trim();
    const label = String(record.label ?? '').trim();
    const fee = Number(record.fee);

    if (!id) {
      return { success: false, error: `Phương thức vận chuyển số ${i + 1} có Mã (ID) bị trống.` };
    }
    if (ids.has(id)) {
      return { success: false, error: `Mã (ID) "${id}" bị trùng lặp trong danh sách vận chuyển.` };
    }
    if (!label) {
      return { success: false, error: `Phương thức vận chuyển "${id}" có Tên hiển thị bị trống.` };
    }
    if (!Number.isFinite(fee) || fee < 0) {
      return { success: false, error: `Phí vận chuyển của "${id}" phải là số lớn hơn hoặc bằng 0.` };
    }

    ids.add(id);
    validated.push({
      id,
      label,
      description: record.description ? String(record.description).trim() : undefined,
      fee,
      estimate: record.estimate ? String(record.estimate).trim() : undefined,
    });
  }

  return { success: true, data: validated };
}

const VALID_PAYMENT_TYPES = new Set(['COD', 'BankTransfer', 'VietQR', 'CreditCard', 'EWallet']);

export function validatePaymentMethods(methods: unknown): { success: boolean; data?: PaymentMethodConfig[]; error?: string } {
  if (typeof methods === 'string') {
    try {
      methods = JSON.parse(methods);
    } catch {
      return { success: false, error: 'Dữ liệu không phải là định dạng JSON hợp lệ.' };
    }
  }

  if (!Array.isArray(methods)) {
    return { success: false, error: 'Danh sách phương thức thanh toán phải là một mảng.' };
  }

  const ids = new Set<string>();
  const validated: PaymentMethodConfig[] = [];

  for (let i = 0; i < methods.length; i++) {
    const item = methods[i];
    if (!item || typeof item !== 'object') {
      return { success: false, error: `Phương thức thanh toán ở dòng ${i + 1} không hợp lệ.` };
    }

    const record = item as Partial<PaymentMethodConfig>;
    const id = String(record.id ?? '').trim();
    const label = String(record.label ?? '').trim();
    const type = String(record.type ?? '').trim();

    if (!id) {
      return { success: false, error: `Phương thức thanh toán số ${i + 1} có Mã (ID) bị trống.` };
    }
    if (ids.has(id)) {
      return { success: false, error: `Mã (ID) "${id}" bị trùng lặp trong danh sách thanh toán.` };
    }
    if (!label) {
      return { success: false, error: `Phương thức thanh toán "${id}" có Tên hiển thị bị trống.` };
    }
    if (!VALID_PAYMENT_TYPES.has(type)) {
      return { success: false, error: `Phương thức thanh toán "${id}" có Loại "${type}" không hợp lệ.` };
    }

    ids.add(id);
    validated.push({
      id,
      label,
      description: record.description ? String(record.description).trim() : undefined,
      type,
    });
  }

  return { success: true, data: validated };
}

export function validateOrderStatuses(statuses: unknown): { success: boolean; data?: OrderStatusConfig[]; error?: string } {
  if (typeof statuses === 'string') {
    try {
      statuses = JSON.parse(statuses);
    } catch {
      return { success: false, error: 'Dữ liệu không phải là định dạng JSON hợp lệ.' };
    }
  }

  if (!Array.isArray(statuses)) {
    return { success: false, error: 'Danh sách trạng thái đơn hàng phải là một mảng.' };
  }

  const keys = new Set<string>();
  const validated: OrderStatusConfig[] = [];
  let hasNonFinal = false;

  for (let i = 0; i < statuses.length; i++) {
    const item = statuses[i];
    if (!item || typeof item !== 'object') {
      return { success: false, error: `Trạng thái ở dòng ${i + 1} không hợp lệ.` };
    }

    const record = item as Partial<OrderStatusConfig>;
    const key = String(record.key ?? '').trim();
    const label = String(record.label ?? '').trim();
    const color = String(record.color ?? '').trim();
    const step = Number(record.step);

    if (!key) {
      return { success: false, error: `Trạng thái số ${i + 1} có Mã trạng thái bị trống.` };
    }
    if (keys.has(key)) {
      return { success: false, error: `Mã trạng thái "${key}" bị trùng lặp.` };
    }
    if (!label) {
      return { success: false, error: `Trạng thái "${key}" có Tên hiển thị bị trống.` };
    }
    if (!color || !HEX_COLOR_REGEX.test(color)) {
      return { success: false, error: `Trạng thái "${key}" có mã màu "${color}" không hợp lệ (format chuẩn hex, ví dụ: #ef4444).` };
    }
    if (!Number.isInteger(step) || step < 1 || step > 4) {
      return { success: false, error: `Trạng thái "${key}" có Bước tiến trình (step) "${step}" không nằm trong khoảng từ 1 đến 4.` };
    }

    const isFinal = Boolean(record.isFinal);
    if (!isFinal) {
      hasNonFinal = true;
    }

    keys.add(key);
    validated.push({
      key,
      label,
      color,
      step,
      isFinal,
      allowCancel: Boolean(record.allowCancel),
    });
  }

  if (statuses.length > 0 && !hasNonFinal) {
    return { success: false, error: 'Danh sách trạng thái phải chứa tối thiểu một trạng thái chưa hoàn thành (isFinal = false).' };
  }

  return { success: true, data: validated };
}

export function validateBankConfig(
  bankCode: string,
  bankName: string,
  bankAccountNumber: string,
  bankAccountName: string
): { success: boolean; error?: string } {
  const code = String(bankCode || '').trim();
  const name = String(bankName || '').trim();
  const accNum = String(bankAccountNumber || '').trim();
  const accName = String(bankAccountName || '').trim();

  if (code || name || accNum || accName) {
    if (!code) {
      return { success: false, error: 'Mã ngân hàng không được để trống khi thiết lập thông tin chuyển khoản.' };
    }
    if (!name) {
      return { success: false, error: 'Tên ngân hàng không được để trống khi thiết lập thông tin chuyển khoản.' };
    }
    if (!accNum) {
      return { success: false, error: 'Số tài khoản không được để trống khi thiết lập thông tin chuyển khoản.' };
    }
    if (!accName) {
      return { success: false, error: 'Tên chủ tài khoản không được để trống khi thiết lập thông tin chuyển khoản.' };
    }
  }

  return { success: true };
}
