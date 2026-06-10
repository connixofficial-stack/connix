'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Label } from '@/app/admin/components/ui';
import { getContactMapDataFromSettings } from '@/lib/contact/getContactMapData';
import { ToggleSwitch } from '@/components/modules/shared';
import { Contact, Mail, Share2, Type } from 'lucide-react';
import type { ContactConfigState, ContactDesktopColumns } from '../_types';
import { validateContactConfig } from '../_lib/validation';
import { FormFieldsSelector } from './FormFieldsSelector';
import { ContactInfoItemsManager } from './ContactInfoItemsManager';
import { SocialLinksManager } from './SocialLinksManager';
import { DynamicTextFields } from './DynamicTextFields';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { HomeComponentDisplaySettingsSection } from '../../_shared/components/HomeComponentDisplaySettingsSection';
import { cn } from '../../../components/ui';

interface ConfigEditorProps {
  value: ContactConfigState;
  onChange: (config: ContactConfigState) => void;
  title?: string;
  // Toggle states
  contactDataExpanded?: boolean;
  formExpanded?: boolean;
  socialExpanded?: boolean;
  labelsExpanded?: boolean;
  displayExpanded?: boolean;
  onContactDataExpandedChange?: (value: boolean) => void;
  onFormExpandedChange?: (value: boolean) => void;
  onSocialExpandedChange?: (value: boolean) => void;
  onLabelsExpandedChange?: (value: boolean) => void;
  onDisplayExpandedChange?: (value: boolean) => void;
}

interface ValidationErrors {
  mapEmbed?: string;
  contactItems?: Record<number, { href?: string }>;
  socialLinks?: Record<number, { url?: string }>;
}

export function ConfigEditor({ 
  value, 
  onChange, 
  title,
  contactDataExpanded = true,
  formExpanded = true,
  socialExpanded = true,
  labelsExpanded = true,
  displayExpanded = true,
  onContactDataExpandedChange,
  onFormExpandedChange,
  onSocialExpandedChange,
  onLabelsExpandedChange,
  onDisplayExpandedChange = () => {},
}: ConfigEditorProps) {
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const contactSettings = useQuery(api.settings.listByGroup, { group: 'contact' });
  const socialSettings = useQuery(api.settings.listByGroup, { group: 'social' });
  const mapData = useMemo(() => getContactMapDataFromSettings(contactSettings ?? []), [contactSettings]);
  const isSettingsLoading = contactSettings === undefined;
  const isSocialSettingsLoading = socialSettings === undefined;

  // Validate config và track errors
  useEffect(() => {
    const result = validateContactConfig(value);
    setValidationErrors(result.errors);
  }, [value]);

  // Helper để update config không mutate
  const updateConfig = (updates: Partial<ContactConfigState>) => {
    onChange({ ...value, ...updates });
  };

  // Helper để update nested texts
  const updateTexts = (texts: Record<string, string>) => {
    onChange({ ...value, texts });
  };

  const updateContactItems = (contactItems: typeof value.contactItems) => {
    onChange({ ...value, contactItems });
  };

  // Helper để update socialLinks
  const updateSocialLinks = (socialLinks: typeof value.socialLinks) => {
    onChange({ ...value, socialLinks });
  };

  // Helper để update formFields
  const updateFormFields = (formFields: string[]) => {
    onChange({ ...value, formFields });
  };

  return (
    <div className="space-y-3">
      {title && (
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
      )}

      <HomeComponentDisplaySettingsSection
        open={displayExpanded}
        onOpenChange={onDisplayExpandedChange}
        cornerRadius={value.cornerRadius ?? 'lg'}
        onCornerRadiusChange={(cornerRadius) => updateConfig({ cornerRadius })}
        spacing={value.spacing ?? 'normal'}
        onSpacingChange={(spacing) => updateConfig({ spacing })}
      >
            <div className="space-y-2">
              <Label>Số cột desktop cho item grid</Label>
              <div className="grid grid-cols-2 gap-2">
                {[3, 4].map((option) => {
                  const selected = (value.desktopColumns ?? 4) === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => updateConfig({ desktopColumns: option as ContactDesktopColumns })}
                      className={cn(
                        'h-10 rounded-md border text-xs transition-colors',
                        selected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                          : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                      )}
                    >
                      {option} cột
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">Chỉ áp dụng cho các card thông tin dạng grid.</p>
            </div>
      </HomeComponentDisplaySettingsSection>

      <SubSection
        icon={Contact}
        title="Dữ liệu liên hệ"
        open={contactDataExpanded}
        onOpenChange={onContactDataExpandedChange}
      >
        <p className="text-xs text-slate-500">Giá trị hiển thị trên preview/site.</p>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Hiển thị bản đồ
            </label>
            <ToggleSwitch
              enabled={!!value.showMap}
              onChange={() => updateConfig({ showMap: !value.showMap })}
              color="bg-blue-500"
            />
          </div>

            {value.showMap && (
              <div className="space-y-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  {isSettingsLoading ? (
                    <p>Đang tải cấu hình bản đồ...</p>
                  ) : (
                    <ul className="space-y-1">
                      <li>Provider: <strong className="text-slate-800">{mapData.mapProvider === 'google_embed' ? 'Google Maps nhúng' : 'OpenStreetMap'}</strong></li>
                      <li>Địa chỉ: <strong className="text-slate-800">{mapData.address || 'Chưa có địa chỉ'}</strong></li>
                      {mapData.mapProvider === 'google_embed' && (
                        <li>Iframe: <strong className="text-slate-800">{mapData.googleMapEmbedIframe ? 'Đã có' : 'Chưa có'}</strong></li>
                      )}
                      {mapData.mapProvider === 'openstreetmap' && (
                        <li>Toạ độ: <strong className="text-slate-800">{mapData.lat.toFixed(6)}, {mapData.lng.toFixed(6)}</strong></li>
                      )}
                    </ul>
                  )}
                </div>
                <Link href="/admin/settings" className="text-xs font-medium text-blue-600 hover:underline">
                  Mở Settings để cập nhật →
                </Link>
              </div>
            )}

          <ContactInfoItemsManager
            items={value.contactItems}
            onChange={updateContactItems}
            settings={contactSettings ?? []}
            isLoadingSettings={isSettingsLoading}
            validationErrors={validationErrors.contactItems}
          />
        </div>
      </SubSection>

      <SubSection
        icon={Mail}
        title="Form liên hệ"
        open={formExpanded}
        onOpenChange={onFormExpandedChange}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Bật form liên hệ
            </label>
            <ToggleSwitch
              enabled={!!value.showForm}
              onChange={() => updateConfig({ showForm: !value.showForm })}
              color="bg-blue-500"
            />
          </div>

            {value.showForm ? (
              <>
                <FormFieldsSelector
                  selected={value.formFields}
                  onChange={updateFormFields}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="formTitle"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Tiêu đề form
                    </label>
                    <input
                      id="formTitle"
                      type="text"
                      value={value.formTitle || ''}
                      onChange={(e) => updateConfig({ formTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="submitButtonText"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                    >
                      Text nút gửi
                    </label>
                    <input
                      id="submitButtonText"
                      type="text"
                      value={value.submitButtonText || ''}
                      onChange={(e) => updateConfig({ submitButtonText: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="responseTimeText"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Thời gian phản hồi
                  </label>
                  <input
                    id="responseTimeText"
                    type="text"
                    value={value.responseTimeText || ''}
                    onChange={(e) => updateConfig({ responseTimeText: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Bật form để chỉnh tiêu đề, mô tả, nút gửi và trường nhập.
              </p>
            )}
        </div>
      </SubSection>

      <SubSection
        icon={Share2}
        title="Mạng xã hội"
        open={socialExpanded}
        onOpenChange={onSocialExpandedChange}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={value.useOriginalSocialIconColors !== false}
              onChange={(event) => { updateConfig({ useOriginalSocialIconColors: event.target.checked }); }}
              className="w-4 h-4 rounded"
            />
            <Label>Dùng màu icon gốc</Label>
          </div>
          <SocialLinksManager
            links={value.socialLinks}
            onChange={updateSocialLinks}
            contactSettings={contactSettings ?? []}
            socialSettings={socialSettings ?? []}
            isLoadingSettings={isSettingsLoading || isSocialSettingsLoading}
            validationErrors={validationErrors.socialLinks}
          />
        </div>
      </SubSection>

      <SubSection
        icon={Type}
        title="Nhãn hiển thị"
        open={labelsExpanded}
        onOpenChange={onLabelsExpandedChange}
      >
        <p className="text-xs text-slate-500">Text tuỳ biến cho tiêu đề, nút và các ghi chú.</p>
          <DynamicTextFields
            style={value.style}
            texts={value.texts || {}}
            onChange={updateTexts}
          />
      </SubSection>
    </div>
  );
}
