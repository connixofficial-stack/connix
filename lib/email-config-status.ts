export const EMAIL_CONFIG_SETTING_KEYS = [
  'mail_driver',
  'mail_host',
  'mail_port',
  'mail_username',
  'mail_password',
  'mail_from_email',
  'resend_accounts',
] as const;

type EmailConfigSettings = Record<string, unknown>;

type ResendAccountLike = {
  apiKey?: unknown;
  enabled?: unknown;
  fromEmail?: unknown;
};

export type EmailConfigurationStatus = {
  configured: boolean;
  driver: 'smtp' | 'resend' | 'unknown';
  label: string;
  reason: string;
};

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const parseResendAccounts = (value: unknown): ResendAccountLike[] => {
  if (Array.isArray(value)) {
    return value as ResendAccountLike[];
  }
  if (typeof value !== 'string' || !value.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as ResendAccountLike[] : [];
  } catch {
    return [];
  }
};

export function getEmailConfigurationStatus(settings: EmailConfigSettings): EmailConfigurationStatus {
  const rawDriver = toTrimmedString(settings.mail_driver).toLowerCase();
  const driver = rawDriver === 'smtp' || rawDriver === 'resend' ? rawDriver : 'unknown';
  const fromEmail = toTrimmedString(settings.mail_from_email);

  if (driver === 'smtp') {
    const portValue = Number(toTrimmedString(settings.mail_port));
    const missing: string[] = [];
    if (!toTrimmedString(settings.mail_host)) missing.push('SMTP host');
    if (!Number.isFinite(portValue) || portValue <= 0) missing.push('SMTP port hợp lệ');
    if (!toTrimmedString(settings.mail_username)) missing.push('SMTP username');
    if (!toTrimmedString(settings.mail_password)) missing.push('SMTP password');
    if (!fromEmail) missing.push('email gửi đi');

    return {
      configured: missing.length === 0,
      driver,
      label: 'SMTP',
      reason: missing.length === 0
        ? 'SMTP đã có đủ cấu hình gửi mail.'
        : `Thiếu ${missing.join(', ')} trong /system/integrations.`,
    };
  }

  if (driver === 'resend') {
    const accounts = parseResendAccounts(settings.resend_accounts);
    const activeAccounts = accounts.filter((account) =>
      account.enabled !== false &&
      Boolean(toTrimmedString(account.apiKey)) &&
      Boolean(toTrimmedString(account.fromEmail) || fromEmail)
    );

    return {
      configured: activeAccounts.length > 0,
      driver,
      label: 'Resend',
      reason: activeAccounts.length > 0
        ? `Resend đã có ${activeAccounts.length} tài khoản hoạt động.`
        : 'Chưa có tài khoản Resend đang bật kèm API key và email gửi đi trong /system/integrations.',
    };
  }

  return {
    configured: false,
    driver: 'unknown',
    label: 'Chưa chọn',
    reason: 'Chưa chọn SMTP hoặc Resend trong /system/integrations.',
  };
}
