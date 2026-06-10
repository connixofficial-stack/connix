'use client';

import React, { useMemo } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import type { ContactColorTokens } from '@/app/admin/home-components/contact/_lib/colors';
import { useContactInquiryForm } from './useContactInquiryForm';
import { useSiteSettings } from '@/components/site/hooks';

type ContactInquiryFormProps = {
  brandColor: string;
  secondaryColor: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  responseTimeText?: string;
  fields?: string[];
  tokens?: ContactColorTokens;
  sourcePath?: string;
  subjectFallback?: string;
  isPreview?: boolean;
  withContainer?: boolean;
};

const DEFAULT_FIELDS = ['name', 'email', 'phone', 'subject', 'message'];

export function ContactInquiryForm({
  brandColor,
  secondaryColor,
  title = 'Gửi tin nhắn cho chúng tôi',
  description,
  submitLabel = 'Gửi tin nhắn',
  responseTimeText,
  fields,
  tokens,
  sourcePath,
  subjectFallback,
  isPreview = false,
  withContainer = true,
}: ContactInquiryFormProps) {
  const { siteDarkMode } = useSiteSettings();
  const isDark = siteDarkMode === 'dark' || (siteDarkMode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const {
    values,
    updateValue,
    handleSubmit,
    isSubmitting,
    submitMessage,
    isFormEnabled,
    isModuleLoading,
    requireEmail,
    requirePhone,
    subjectFallback: resolvedSubjectFallback,
  } = useContactInquiryForm({ sourcePath, subjectFallback });

  const resolvedFields = useMemo(() => {
    const base = new Set(fields && fields.length > 0 ? fields : DEFAULT_FIELDS);
    base.add('name');
    base.add('message');
    if (requireEmail) {base.add('email');}
    if (requirePhone) {base.add('phone');}
    return base;
  }, [fields, requireEmail, requirePhone]);

  const isDisabled = !isFormEnabled || isModuleLoading || isPreview;
  const showSubject = resolvedFields.has('subject');
  const showEmail = resolvedFields.has('email');
  const showPhone = resolvedFields.has('phone');

  const formTokens: ContactColorTokens | null = tokens ?? null;
  const fieldBackground = isDisabled && formTokens ? formTokens.formFieldDisabledBackground : formTokens?.formFieldBackground;
  const fieldTextColor = isDisabled && formTokens ? formTokens.formFieldDisabledText : formTokens?.formFieldText;

  const sharedInputStyle = formTokens ? {
    backgroundColor: fieldBackground,
    borderColor: formTokens.formFieldBorder,
    color: fieldTextColor,
    '--placeholder-color': formTokens.formFieldPlaceholder,
    '--focus-ring': formTokens.formFieldFocus,
  } as React.CSSProperties : isDark ? {
    backgroundColor: '#1c1c1e',
    borderColor: '#27272a',
    color: '#f5f5f7',
    '--placeholder-color': '#86868b',
    '--focus-ring': brandColor,
  } as React.CSSProperties : {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    color: '#0f172a',
    '--placeholder-color': '#94a3b8',
    '--focus-ring': secondaryColor || brandColor,
  } as React.CSSProperties;

  const buttonStyle = formTokens ? {
    backgroundColor: formTokens.formButtonBackground,
    color: formTokens.formButtonText,
    borderColor: formTokens.formButtonBorder,
  } : { backgroundColor: brandColor, color: '#ffffff', borderColor: brandColor };

  if (isPreview) {
    return (
      <div
        role="form"
        className={withContainer ? 'space-y-4 rounded-xl border p-5 bg-white dark:bg-[#161617] border-slate-200 dark:border-zinc-800' : 'space-y-4'}
        style={formTokens && withContainer ? { backgroundColor: formTokens.formBackground, borderColor: formTokens.formBorder } : undefined}
      >
      <div className="flex items-center gap-2">
        <MessageSquare size={20} style={{ color: formTokens?.formAccent ?? (isDark ? brandColor : secondaryColor) }} />
        <div>
          <h3 className="font-semibold text-base text-slate-900 dark:text-[#f5f5f7]" style={!formTokens ? undefined : { color: formTokens.formTitle }}>{title}</h3>
          {description && (
            <p className="text-xs mt-1 text-slate-500 dark:text-[#86868b]" style={!formTokens ? undefined : { color: formTokens.formDescription }}>{description}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            placeholder="Họ tên"
            value={values.name}
            onChange={(event) => updateValue('name', event.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)] transition-all"
            required
            disabled={isDisabled}
            style={sharedInputStyle}
          />
          {showEmail && (
            <input
              type="email"
              placeholder="Email"
              value={values.email}
              onChange={(event) => updateValue('email', event.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)] transition-all"
              required={requireEmail}
              disabled={isDisabled}
              style={sharedInputStyle}
            />
          )}
          {showPhone && (
            <input
              type="text"
              placeholder="Số điện thoại"
              value={values.phone}
              onChange={(event) => updateValue('phone', event.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)] transition-all"
              required={requirePhone}
              disabled={isDisabled}
              style={sharedInputStyle}
            />
          )}
          {showSubject && (
            <input
              type="text"
              placeholder="Chủ đề"
              value={values.subject}
              onChange={(event) => updateValue('subject', event.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)] transition-all"
              required
              disabled={isDisabled}
              style={sharedInputStyle}
            />
          )}
        </div>

        <textarea
          placeholder="Nội dung tin nhắn..."
          value={values.message}
          onChange={(event) => updateValue('message', event.target.value)}
          className="w-full px-3 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)] transition-all"
          rows={4}
          required
          disabled={isDisabled}
          style={sharedInputStyle}
        />

        {submitMessage && (
          <div className="text-xs" style={{ color: formTokens?.formHelperText ?? '#64748b' }}>{submitMessage}</div>
        )}
        {isDisabled && !isPreview && (
          <div className="text-xs" style={{ color: formTokens?.formWarningText ?? '#b45309' }}>
            Biểu mẫu tạm tắt. Vui lòng liên hệ qua các kênh khác.
          </div>
        )}
        {!showSubject && (
          <input type="hidden" value={resolvedSubjectFallback} readOnly />
        )}
        {responseTimeText && (
          <div className="text-xs" style={{ color: formTokens?.formHelperText ?? '#64748b' }}>{responseTimeText}</div>
        )}

        <button
          type="button"
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 border transition-all duration-200"
          style={buttonStyle}
          disabled={isDisabled || isSubmitting}
        >
          <Send size={16} />
          {isSubmitting ? 'Đang gửi...' : submitLabel}
        </button>
      </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={withContainer ? 'space-y-4 rounded-xl border p-5 bg-white dark:bg-[#161617] border-slate-200 dark:border-zinc-800' : 'space-y-4'}
      style={formTokens && withContainer ? { backgroundColor: formTokens.formBackground, borderColor: formTokens.formBorder } : undefined}
    >
      <div className="flex items-center gap-2">
        <MessageSquare size={20} style={{ color: formTokens?.formAccent ?? (isDark ? brandColor : secondaryColor) }} />
        <div>
          <h3 className="font-semibold text-base text-slate-900 dark:text-[#f5f5f7]" style={!formTokens ? undefined : { color: formTokens.formTitle }}>{title}</h3>
          {description && (
            <p className="text-xs mt-1 text-slate-500 dark:text-[#86868b]" style={!formTokens ? undefined : { color: formTokens.formDescription }}>{description}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <input
            type="text"
            placeholder="Họ tên"
            value={values.name}
            onChange={(event) => updateValue('name', event.target.value)}
            className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)]"
            required
            disabled={isDisabled}
            style={sharedInputStyle}
          />
          {showEmail && (
            <input
              type="email"
              placeholder="Email"
              value={values.email}
              onChange={(event) => updateValue('email', event.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)]"
              required={requireEmail}
              disabled={isDisabled}
              style={sharedInputStyle}
            />
          )}
          {showPhone && (
            <input
              type="text"
              placeholder="Số điện thoại"
              value={values.phone}
              onChange={(event) => updateValue('phone', event.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)]"
              required={requirePhone}
              disabled={isDisabled}
              style={sharedInputStyle}
            />
          )}
          {showSubject && (
            <input
              type="text"
              placeholder="Chủ đề"
              value={values.subject}
              onChange={(event) => updateValue('subject', event.target.value)}
              className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)]"
              required
              disabled={isDisabled}
              style={sharedInputStyle}
            />
          )}
        </div>

        <textarea
          placeholder="Nội dung tin nhắn..."
          value={values.message}
          onChange={(event) => updateValue('message', event.target.value)}
          className="w-full px-3 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring)] placeholder:text-[color:var(--placeholder-color)]"
          rows={4}
          required
          disabled={isDisabled}
          style={sharedInputStyle}
        />

        {submitMessage && (
          <div className="text-xs" style={{ color: formTokens?.formHelperText ?? '#64748b' }}>{submitMessage}</div>
        )}
        {isDisabled && !isPreview && (
          <div className="text-xs" style={{ color: formTokens?.formWarningText ?? '#b45309' }}>
            Biểu mẫu tạm tắt. Vui lòng liên hệ qua các kênh khác.
          </div>
        )}
        {!showSubject && (
          <input type="hidden" value={resolvedSubjectFallback} readOnly />
        )}
        {responseTimeText && (
          <div className="text-xs" style={{ color: formTokens?.formHelperText ?? '#64748b' }}>{responseTimeText}</div>
        )}

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70 border"
          style={buttonStyle}
          disabled={isDisabled || isSubmitting}
        >
          <Send size={16} />
          {isSubmitting ? 'Đang gửi...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
