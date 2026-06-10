'use client';

import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Mail, Save, Send, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getEmailConfigurationStatus } from '@/lib/email-config-status';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SYSTEM_TOKEN_KEY = 'system_auth_token';

const SETTINGS_KEYS = [
  'mail_driver',
  'mail_host',
  'mail_port',
  'mail_username',
  'mail_password',
  'mail_encryption',
  'mail_from_email',
  'mail_from_name',
  'resend_accounts',
  'order_notification_emails',
] as const;

type SettingsKey = (typeof SETTINGS_KEYS)[number];
type IntegrationTab = 'email' | 'ai';

const toSafeString = (value: unknown) => (typeof value === 'string' ? value : '');

const SMTP_PRESETS = [
  { id: 'gmail', label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: '587', encryption: 'tls' },
  { id: 'outlook', label: 'Outlook / Microsoft 365', host: 'smtp.office365.com', port: '587', encryption: 'tls' },
  { id: 'zoho', label: 'Zoho Mail', host: 'smtp.zoho.com', port: '587', encryption: 'tls' },
  { id: 'custom', label: 'Tùy chỉnh', host: '', port: '587', encryption: 'tls' },
] as const;

type SmtpPresetId = (typeof SMTP_PRESETS)[number]['id'];

const DEFAULT_FORM: Record<SettingsKey, string> = {
  mail_driver: 'smtp',
  mail_host: '',
  mail_port: '587',
  mail_username: '',
  mail_password: '',
  mail_encryption: 'tls',
  mail_from_email: '',
  mail_from_name: '',
  resend_accounts: '[]',
  order_notification_emails: '',
};

interface AiForm {
  apiKey: string;
  enabled: boolean;
  model: string;
  systemPrompt: string;
  temperature: string;
  widgetGreeting: string;
  widgetTitle: string;
}

const DEFAULT_AI_FORM: AiForm = {
  apiKey: '',
  enabled: false,
  model: 'gemini-2.5-flash-lite',
  systemPrompt: 'Bạn là trợ lý AI của website. Trả lời bằng tiếng Việt, ngắn gọn, lịch sự, ưu tiên dựa trên dữ liệu site được cung cấp và gợi ý link phù hợp khi có.',
  temperature: '0.4',
  widgetGreeting: 'Xin chào, tôi có thể hỗ trợ gì cho bạn?',
  widgetTitle: 'Trợ lý AI',
};

interface ResendAccount {
  id: string;
  label: string;
  apiKey: string;
  fromEmail?: string;
  fromName?: string;
  enabled: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  testMode: boolean;
}

export default function IntegrationsPage() {
  const settings = useQuery(api.settings.getMultiple, { keys: [...SETTINGS_KEYS, 'site_name'] });
  const setMultiple = useMutation(api.settings.setMultiple);
  const [systemToken, setSystemToken] = useState('');
  const aiConfig = useQuery(api.systemIntegrations.getAiConfig, systemToken ? { token: systemToken } : 'skip');
  const saveAiConfig = useMutation(api.systemIntegrations.saveAiConfig);

  const brandName = typeof settings?.site_name === 'string' ? settings.site_name.trim() : 'YourBrand';

  const [activeTab, setActiveTab] = useState<IntegrationTab>('email');
  const [form, setForm] = useState<Record<SettingsKey, string>>(DEFAULT_FORM);

  const [initialForm, setInitialForm] = useState<Record<SettingsKey, string>>(form);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [smtpPreset, setSmtpPreset] = useState<SmtpPresetId>('custom');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  // States for Resend accounts UI
  const [accounts, setAccounts] = useState<ResendAccount[]>([]);
  const [newAccLabel, setNewAccLabel] = useState('');
  const [newAccApiKey, setNewAccApiKey] = useState('');
  const [newAccFromEmail, setNewAccFromEmail] = useState('');
  const [newAccFromName, setNewAccFromName] = useState('');
  const [newAccDailyLimit, setNewAccDailyLimit] = useState(100);
  const [newAccMonthlyLimit, setNewAccMonthlyLimit] = useState(3000);
  const [newAccTestMode, setNewAccTestMode] = useState(false);
  const [aiForm, setAiForm] = useState<AiForm>(DEFAULT_AI_FORM);
  const [initialAiForm, setInitialAiForm] = useState<AiForm>(DEFAULT_AI_FORM);
  const [showAiKey, setShowAiKey] = useState(false);
  const [clearAiKey, setClearAiKey] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestMessage, setAiTestMessage] = useState('Tư vấn giúp tôi nội dung nổi bật trên website.');
  const [aiTestResponse, setAiTestResponse] = useState('');

  React.useEffect(() => {
    setSystemToken(window.localStorage.getItem(SYSTEM_TOKEN_KEY) ?? '');
  }, []);

  React.useEffect(() => {
    if (!settings) return;
    const nextForm = { ...DEFAULT_FORM };
    SETTINGS_KEYS.forEach((key) => {
      const value = settings[key];
      nextForm[key] = toSafeString(value);
    });
    if (!nextForm.mail_driver) nextForm.mail_driver = 'smtp';
    if (!nextForm.mail_encryption) nextForm.mail_encryption = 'tls';
    if (!nextForm.resend_accounts) nextForm.resend_accounts = '[]';
    
    setForm(nextForm);
    setInitialForm(nextForm);
    const matchedPreset = SMTP_PRESETS.find((preset) =>
      preset.id !== 'custom' &&
      preset.host === nextForm.mail_host &&
      preset.port === nextForm.mail_port &&
      preset.encryption === nextForm.mail_encryption
    );
    setSmtpPreset(matchedPreset?.id ?? 'custom');

    try {
      const parsed = JSON.parse(nextForm.resend_accounts);
      if (Array.isArray(parsed)) {
        setAccounts(parsed);
      }
    } catch {
      setAccounts([]);
    }
  }, [settings]);

  React.useEffect(() => {
    if (!aiConfig) return;
    const nextForm: AiForm = {
      apiKey: '',
      enabled: aiConfig.enabled,
      model: aiConfig.model,
      systemPrompt: aiConfig.systemPrompt,
      temperature: String(aiConfig.temperature),
      widgetGreeting: aiConfig.widgetGreeting,
      widgetTitle: aiConfig.widgetTitle,
    };
    setAiForm(nextForm);
    setInitialAiForm(nextForm);
    setClearAiKey(false);
  }, [aiConfig]);

  // Sync accounts state to form value
  const updateAccountsInForm = (updatedAccounts: ResendAccount[]) => {
    setAccounts(updatedAccounts);
    setForm((prev) => ({
      ...prev,
      resend_accounts: JSON.stringify(updatedAccounts),
    }));
  };

  const hasChanges = useMemo(() => {
    return SETTINGS_KEYS.some((key) => form[key] !== initialForm[key]);
  }, [form, initialForm]);

  const hasAiChanges = useMemo(() => {
    return clearAiKey || (Object.keys(aiForm) as Array<keyof AiForm>).some((key) => aiForm[key] !== initialAiForm[key]);
  }, [aiForm, clearAiKey, initialAiForm]);

  const emailStatus = useMemo(() => getEmailConfigurationStatus(form), [form]);
  const savedEmailStatus = useMemo(() => getEmailConfigurationStatus(initialForm), [initialForm]);

  const updateField = (key: SettingsKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAiField = <K extends keyof AiForm>(key: K, value: AiForm[K]) => {
    setAiForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectSmtpPreset = (presetId: SmtpPresetId) => {
    const preset = SMTP_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setSmtpPreset(presetId);
    setForm((prev) => ({
      ...prev,
      mail_host: preset.id === 'custom' ? prev.mail_host : preset.host,
      mail_port: preset.port,
      mail_encryption: preset.encryption,
    }));
  };

  const validatePort = () => {
    if (form.mail_driver === 'resend') return true;
    if (!form.mail_port) return true;
    const port = Number(form.mail_port);
    return Number.isFinite(port) && port > 0;
  };

  const handleSave = async () => {
    if (!validatePort()) {
      toast.error('Cổng kết nối SMTP không hợp lệ.');
      return;
    }

    setIsSaving(true);
    try {
      const settingsToSave = SETTINGS_KEYS.map((key) => ({
        group: 'mail',
        key,
        value: form[key].trim(),
      }));
      await setMultiple({ settings: settingsToSave });
      setInitialForm({ ...form });
      toast.success('Đã lưu cấu hình email thành công!');
    } catch {
      toast.error('Lỗi khi lưu cấu hình.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAi = async () => {
    if (!systemToken) {
      toast.error('Phiên system chưa sẵn sàng. Vui lòng đăng nhập lại.');
      return;
    }
    const willHaveApiKey = !clearAiKey && (aiConfig?.hasApiKey || Boolean(aiForm.apiKey.trim()));
    if (aiForm.enabled && !willHaveApiKey) {
      toast.error('Vui lòng nhập Gemini API key trước khi bật chatbot.');
      return;
    }

    setIsSavingAi(true);
    try {
      const temperature = Number(aiForm.temperature);
      await saveAiConfig({
        apiKey: aiForm.apiKey.trim() || undefined,
        clearApiKey: clearAiKey,
        enabled: aiForm.enabled,
        model: aiForm.model.trim(),
        provider: 'gemini',
        systemPrompt: aiForm.systemPrompt.trim(),
        temperature: Number.isFinite(temperature) ? temperature : 0.4,
        token: systemToken,
        widgetGreeting: aiForm.widgetGreeting.trim(),
        widgetTitle: aiForm.widgetTitle.trim(),
      });
      const nextForm = { ...aiForm, apiKey: '' };
      setAiForm(nextForm);
      setInitialAiForm(nextForm);
      setClearAiKey(false);
      toast.success('Đã lưu cấu hình AI.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Lỗi khi lưu cấu hình AI.');
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleTestAi = async () => {
    if (hasAiChanges) {
      toast.error('Vui lòng lưu cấu hình AI trước khi gửi thử.');
      return;
    }
    if (!aiForm.enabled || !aiConfig?.hasApiKey) {
      toast.error('Chatbot cần được bật và có API key trước khi gửi thử.');
      return;
    }
    if (!aiTestMessage.trim()) {
      toast.error('Vui lòng nhập câu hỏi test.');
      return;
    }

    setIsTestingAi(true);
    setAiTestResponse('');
    try {
      const response = await fetch('/api/ai-chat', {
        body: JSON.stringify({
          message: aiTestMessage.trim(),
          sessionId: 'system-integrations-test',
          sourcePath: '/system/integrations',
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(typeof data?.message === 'string' ? data.message : 'Gửi thử AI thất bại.');
      }
      setAiTestResponse(String(data.message ?? 'AI đã phản hồi nhưng không có nội dung.'));
      toast.success('AI phản hồi thành công.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gửi thử AI thất bại.');
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccApiKey.trim() || !newAccApiKey.startsWith('re_')) {
      toast.error('API Key Resend không hợp lệ (phải bắt đầu bằng re_).');
      return;
    }

    const fallbackFromName = newAccFromName.trim() || form.mail_from_name.trim() || brandName;
    const fallbackFromEmail = newAccFromEmail.trim() || form.mail_from_email.trim() || 'onboarding@resend.dev';
    const newAcc: ResendAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      label: newAccLabel.trim() || `Resend ${accounts.length + 1}`,
      apiKey: newAccApiKey.trim(),
      fromEmail: fallbackFromEmail,
      fromName: fallbackFromName,
      enabled: true,
      dailyLimit: newAccDailyLimit,
      monthlyLimit: newAccMonthlyLimit,
      testMode: newAccTestMode,
    };

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    setForm((prev) => ({
      ...prev,
      mail_from_email: prev.mail_from_email.trim() || fallbackFromEmail,
      mail_from_name: prev.mail_from_name.trim() || fallbackFromName,
      resend_accounts: JSON.stringify(updated),
    }));

    // Reset inputs
    setNewAccLabel('');
    setNewAccApiKey('');
    setNewAccFromEmail('');
    setNewAccFromName('');
    setNewAccDailyLimit(100);
    setNewAccMonthlyLimit(3000);
    setNewAccTestMode(false);
    toast.success('Đã thêm API key Resend. Nhớ nhấn "Lưu thay đổi"!');
  };

  const handleRemoveAccount = (id: string) => {
    const updated = accounts.filter((acc) => acc.id !== id);
    updateAccountsInForm(updated);
    toast.success('Đã gỡ tài khoản Resend. Nhớ nhấn "Lưu thay đổi"!');
  };

  const handleToggleAccount = (id: string) => {
    const updated = accounts.map((acc) =>
      acc.id === id ? { ...acc, enabled: !acc.enabled } : acc
    );
    updateAccountsInForm(updated);
  };

  const handleSendTest = async () => {
    if (!EMAIL_REGEX.test(testEmail.trim())) {
      toast.error('Email nhận không hợp lệ.');
      return;
    }
    if (hasChanges) {
      toast.error('Vui lòng lưu cấu hình email trước khi gửi thử.');
      return;
    }
    if (!savedEmailStatus.configured) {
      toast.error(savedEmailStatus.reason);
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/system/integrations/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail.trim(),
          subject: `Email test từ ${brandName}`,
          html: `<p>Đây là email test từ hệ thống ${brandName}.</p>`,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.message || 'Gửi test email thất bại.');
      }
      toast.success('Đã gửi email test thành công! Vui lòng kiểm tra hộp thư.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gửi test email thất bại.';
      toast.error(message);
    } finally {
      setIsSending(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Tích hợp hệ thống</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Quản lý các key và kênh tích hợp server-side cho email và AI.
        </p>
      </div>

      <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setActiveTab('email')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'email'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Mail size={16} />
          Email
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
            activeTab === 'ai'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Bot size={16} />
          AI Chatbot
        </button>
      </div>

      {activeTab === 'email' && (
        <>
      <div className={`rounded-3xl border p-4 shadow-sm ${
        emailStatus.configured
          ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100'
          : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100'
      }`}>
        <div className="flex items-start gap-3">
          {emailStatus.configured ? (
            <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-bold">
              {emailStatus.configured
                ? hasChanges
                  ? `Cấu hình email có vẻ đủ, cần lưu (${emailStatus.label})`
                  : `Email hệ thống đã cấu hình (${emailStatus.label})`
                : 'Email hệ thống chưa gửi được'}
            </p>
            <p className="text-xs opacity-80">{emailStatus.reason}</p>
            {hasChanges && (
              <p className="text-xs opacity-80">
                Thay đổi chưa lưu sẽ chưa được dùng khi đặt hàng hoặc gửi mail test.
              </p>
            )}
            {!emailStatus.configured && (
              <p className="text-xs opacity-80">
                Khi chưa cấu hình, đơn hàng vẫn được tạo và theo dõi trên web; hệ thống sẽ không hứa gửi email cho khách/shop.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">1. Chọn phương thức gửi</h3>
          <p className="text-xs text-slate-500 mt-1">Dùng SMTP nếu có mail server riêng, hoặc Resend nếu gửi qua API.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => updateField('mail_driver', 'smtp')}
            className={`min-h-24 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
              form.mail_driver === 'smtp'
                ? 'border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
            }`}
          >
            <span className="block text-base font-bold">SMTP</span>
            <span className="mt-1 block text-xs">Gmail, Outlook hoặc mail server riêng.</span>
          </button>
          <button
            type="button"
            onClick={() => updateField('mail_driver', 'resend')}
            className={`min-h-24 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
              form.mail_driver === 'resend'
                ? 'border-indigo-600 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950'
            }`}
          >
            <span className="block text-base font-bold">Resend</span>
            <span className="mt-1 block text-xs">Gửi qua API key Resend.</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
            2. {form.mail_driver === 'smtp' ? 'Nhập cấu hình SMTP' : 'Nhập cấu hình Resend'}
          </h3>
          <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${
            form.mail_driver === 'smtp'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
          }`}>
            {form.mail_driver}
          </span>
        </div>

        {/* ─── SMTP CONFIG FIELDS ────────────────────────────────────────────── */}
        {form.mail_driver === 'smtp' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500">Chọn nhà cung cấp SMTP</label>
              <select
                value={smtpPreset}
                onChange={(e) => handleSelectSmtpPreset(e.target.value as SmtpPresetId)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                {SMTP_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400">Chọn preset để tự điền host, port và mã hóa theo cấu hình phổ biến.</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Tên người gửi</label>
              <input
                value={form.mail_from_name}
                onChange={(e) => updateField('mail_from_name', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder={`${brandName} Store`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Email gửi đi</label>
              <input
                value={form.mail_from_email}
                onChange={(e) => updateField('mail_from_email', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="noreply@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Host</label>
              <input
                value={form.mail_host}
                onChange={(e) => updateField('mail_host', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="smtp.gmail.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Port</label>
              <input
                value={form.mail_port}
                onChange={(e) => updateField('mail_port', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Tài khoản</label>
              <input
                value={form.mail_username}
                onChange={(e) => updateField('mail_username', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Mật khẩu</label>
              <div className="relative">
                <input
                  value={form.mail_password}
                  onChange={(e) => updateField('mail_password', e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Mã hóa</label>
              <select
                value={form.mail_encryption}
                onChange={(e) => updateField('mail_encryption', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="tls">TLS</option>
                <option value="ssl">SSL</option>
                <option value="">None</option>
              </select>
            </div>
          </div>
        )}

        {/* ─── RESEND CONFIG FIELDS ──────────────────────────────────────────── */}
        {form.mail_driver === 'resend' && (
          <div className="space-y-6">
            <form onSubmit={handleAddAccount} className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Dán API key Resend</h4>
                <p className="text-xs text-slate-500 mt-1">Chỉ cần dán API key bắt đầu bằng <code>re_</code>. Các giá trị còn lại đã được điền theo mặc định an toàn.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="password"
                  required
                  value={newAccApiKey}
                  onChange={(e) => setNewAccApiKey(e.target.value)}
                  placeholder="re_..."
                  className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900"
                />
                <button
                  type="submit"
                  className="min-h-12 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-indigo-700 cursor-pointer"
                >
                  Thêm API key
                </button>
              </div>

              <details className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <summary className="cursor-pointer text-xs font-bold text-slate-600 dark:text-slate-300">Tùy chỉnh nâng cao</summary>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Tên nhãn</label>
                    <input
                      type="text"
                      value={newAccLabel}
                      onChange={(e) => setNewAccLabel(e.target.value)}
                      placeholder="Resend chính"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Tên người gửi</label>
                    <input
                      type="text"
                      value={newAccFromName}
                      onChange={(e) => setNewAccFromName(e.target.value)}
                      placeholder={form.mail_from_name || brandName}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Email gửi đi</label>
                    <input
                      type="email"
                      value={newAccFromEmail}
                      onChange={(e) => setNewAccFromEmail(e.target.value)}
                      placeholder={form.mail_from_email || 'onboarding@resend.dev'}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Giới hạn/ngày</label>
                    <input
                      type="number"
                      required
                      value={newAccDailyLimit}
                      onChange={(e) => setNewAccDailyLimit(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Giới hạn/tháng</label>
                    <input
                      type="number"
                      required
                      value={newAccMonthlyLimit}
                      onChange={(e) => setNewAccMonthlyLimit(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                  <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 text-xs dark:border-slate-800 sm:col-span-2">
                    <span>
                      <span className="block font-bold text-slate-700 dark:text-slate-300">Test mode</span>
                      <span className="text-slate-400">Bật nếu chỉ muốn gửi thử tới email đã verify trên Resend.</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={newAccTestMode}
                      onChange={(e) => setNewAccTestMode(e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </label>
                </div>
              </details>
            </form>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách tài khoản</h4>
              </div>

              {accounts.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  Chưa có API key Resend. Dán key ở ô phía trên rồi bấm thêm.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/30"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{acc.label}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">re_***{acc.apiKey.substring(acc.apiKey.length - 6)}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            Từ: {acc.fromName || 'Mặc định'} &lt;{acc.fromEmail || 'Mặc định'}&gt;
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(acc.id)}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <div className="flex flex-col gap-0.5">
                          <div>Daily limit: <span className="font-semibold text-slate-700 dark:text-slate-300">{acc.dailyLimit}</span></div>
                          <div>Monthly limit: <span className="font-semibold text-slate-700 dark:text-slate-300">{acc.monthlyLimit}</span></div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={acc.enabled}
                              onChange={() => handleToggleAccount(acc.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span>Bật</span>
                          </label>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            acc.testMode 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            {acc.testMode ? 'TEST MODE' : 'PROD MODE'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ─── COMMON FIELDS ────────────────────────────────────────────────── */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Email thông báo cho chủ cửa hàng (Order Notification Emails)</label>
            <input
              value={form.order_notification_emails}
              onChange={(e) => updateField('order_notification_emails', e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="admin@example.com, manager@example.com (Phân tách bởi dấu phẩy)"
            />
            <p className="text-[10px] text-slate-400 mt-1">Khi có đơn hàng mới hoặc đơn hàng bị hủy, các email này sẽ nhận được thông báo chi tiết đơn.</p>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {hasChanges && (
            <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Có thay đổi chưa lưu</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800 text-white text-sm font-semibold rounded-2xl border border-indigo-600 hover:border-indigo-700 disabled:border-transparent transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">3. Gửi thử</h3>
          <p className="text-xs text-slate-500 mt-1">Nhập email nhận để kiểm tra cấu hình vừa lưu.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="min-h-12 flex-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="email-nhan@example.com"
          />
          <button
            onClick={handleSendTest}
            disabled={isSending || hasChanges || !savedEmailStatus.configured}
            className="min-h-12 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-2xl transition-colors disabled:opacity-50 cursor-pointer shadow-md"
          >
            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {isSending ? 'Đang gửi...' : 'Gửi mail test'}
          </button>
        </div>
        {(hasChanges || !savedEmailStatus.configured) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            {hasChanges ? 'Bạn cần lưu thay đổi trước khi gửi thử.' : savedEmailStatus.reason}
          </p>
        )}
      </div>
        </>
      )}

      {activeTab === 'ai' && (
        aiConfig === undefined ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          </div>
        ) : (
          <>
            <div className={`rounded-3xl border p-4 shadow-sm ${
              aiForm.enabled && aiConfig.hasApiKey
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100'
                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100'
            }`}>
              <div className="flex items-start gap-3">
                {aiForm.enabled && aiConfig.hasApiKey ? (
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-bold">
                    {aiForm.enabled && aiConfig.hasApiKey ? 'Chatbot AI đã sẵn sàng' : 'Chatbot AI chưa sẵn sàng'}
                  </p>
                  <p className="text-xs opacity-80">
                    Cần bật chatbot và lưu Gemini API key. Key được lưu trong bảng secret riêng, không render ra site public.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">1. Cấu hình Gemini AI</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Dùng free key từ Google AI Studio. Chatbot sẽ gọi AI qua server, không gọi trực tiếp từ client.
                  </p>
                </div>
                <label className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={aiForm.enabled}
                    onChange={(e) => updateAiField('enabled', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  Bật chatbot
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Provider</label>
                  <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                    <Sparkles size={16} className="text-cyan-500" />
                    Gemini Free
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Model</label>
                  <select
                    value={aiForm.model}
                    onChange={(e) => updateAiField('model', e.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                    <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                  </select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Gemini API key</label>
                  <div className="relative">
                    <input
                      value={aiForm.apiKey}
                      onChange={(e) => {
                        updateAiField('apiKey', e.target.value);
                        setClearAiKey(false);
                      }}
                      type={showAiKey ? 'text' : 'password'}
                      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950"
                      placeholder={aiConfig.hasApiKey ? `Đã lưu ${'maskedApiKey' in aiConfig ? aiConfig.maskedApiKey : 'API key'} - nhập key mới nếu muốn thay` : 'AIza...'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAiKey((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      title={showAiKey ? 'Hide' : 'Show'}
                    >
                      {showAiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
                    <span>Key lấy tại aistudio.google.com/apikey, chỉ lưu phía server.</span>
                    {aiConfig.hasApiKey && (
                      <button
                        type="button"
                        onClick={() => {
                          setClearAiKey(true);
                          updateAiField('apiKey', '');
                        }}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-bold ${
                          clearAiKey
                            ? 'border-rose-300 bg-rose-50 text-rose-600'
                            : 'border-slate-200 text-slate-500 hover:text-rose-600'
                        }`}
                      >
                        <KeyRound size={11} />
                        {clearAiKey ? 'Sẽ xóa key khi lưu' : 'Xóa key đã lưu'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Tên widget</label>
                  <input
                    value={aiForm.widgetTitle}
                    onChange={(e) => updateAiField('widgetTitle', e.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Nhiệt độ trả lời</label>
                  <input
                    value={aiForm.temperature}
                    onChange={(e) => updateAiField('temperature', e.target.value)}
                    inputMode="decimal"
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950"
                  />
                  <p className="text-[10px] text-slate-400">Khuyến nghị 0.2–0.6 để tư vấn ổn định.</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">Lời chào widget</label>
                  <input
                    value={aiForm.widgetGreeting}
                    onChange={(e) => updateAiField('widgetGreeting', e.target.value)}
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-500">System prompt</label>
                  <textarea
                    value={aiForm.systemPrompt}
                    onChange={(e) => updateAiField('systemPrompt', e.target.value)}
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {hasAiChanges && (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Có thay đổi chưa lưu</span>
                )}
                <button
                  onClick={handleSaveAi}
                  disabled={isSavingAi || !hasAiChanges}
                  className="flex items-center gap-2 rounded-2xl border border-cyan-600 bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:border-cyan-700 hover:bg-cyan-700 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-slate-200 disabled:text-slate-400 disabled:opacity-50 dark:disabled:bg-slate-800"
                >
                  {isSavingAi ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSavingAi ? 'Đang lưu...' : 'Lưu cấu hình AI'}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-sm">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">2. Gửi thử chatbot</h3>
                <p className="text-xs text-slate-500 mt-1">Test phản hồi qua cùng API mà widget SpeedDial sử dụng trên site.</p>
              </div>
              <textarea
                value={aiTestMessage}
                onChange={(e) => setAiTestMessage(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-800 dark:bg-slate-950"
              />
              <button
                onClick={handleTestAi}
                disabled={isTestingAi || hasAiChanges || !aiForm.enabled || !aiConfig.hasApiKey}
                className="min-h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isTestingAi ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {isTestingAi ? 'Đang hỏi...' : 'Gửi thử AI'}
              </button>
              {aiTestResponse && (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4 text-sm leading-relaxed text-slate-700 dark:border-cyan-900/40 dark:bg-cyan-950/20 dark:text-slate-200">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-cyan-600">Phản hồi</p>
                  <p className="whitespace-pre-wrap">{aiTestResponse}</p>
                </div>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
