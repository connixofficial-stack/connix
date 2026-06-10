'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { CalendarCog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@/app/admin/components/ui';
import { ModuleGuard } from '@/app/admin/components/ModuleGuard';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import {
  BOOKING_CUSTOMER_FIELD_OPTIONS,
  DEFAULT_BOOKING_CUSTOMER_FIELDS,
  getBookingFieldLabel,
  normalizeBookingCustomerFieldConfigs,
  type BookingCustomerFieldConfig,
  type BookingCustomerFieldKey,
} from '@/lib/bookings/customerFieldConfig';
import {
  buildAutoSlotsFromWindow,
  normalizeSlotTemplate,
  normalizeSlotTemplateByWeekday,
  type BookingSlotTemplateByWeekday,
} from '@/lib/bookings/slotTemplate';
import { OperatingHoursDial } from './_components/OperatingHoursDial';
import { clampHour, formatHour, isOvernightWindow, resolveWindowDurationHours } from './_lib/timeWindow';

type VisibilityMode = 'show_full' | 'show_anonymous' | 'hide_calendar';

const WEEK_DAYS: Array<{ key: string; label: string }> = [
  { key: 'openMon', label: 'Thứ 2' },
  { key: 'openTue', label: 'Thứ 3' },
  { key: 'openWed', label: 'Thứ 4' },
  { key: 'openThu', label: 'Thứ 5' },
  { key: 'openFri', label: 'Thứ 6' },
  { key: 'openSat', label: 'Thứ 7' },
  { key: 'openSun', label: 'Chủ nhật' },
];

const MAX_ADVANCE_DAY_PRESETS = [1, 3, 5, 7, 14] as const;

type SlotTemplateScope = 'default' | '0' | '1' | '2' | '3' | '4' | '5' | '6';

const SLOT_TEMPLATE_SCOPE_OPTIONS: Array<{ value: SlotTemplateScope; label: string }> = [
  { value: 'default', label: 'Mặc định (mọi ngày)' },
  { value: '1', label: 'Thứ 2' },
  { value: '2', label: 'Thứ 3' },
  { value: '3', label: 'Thứ 4' },
  { value: '4', label: 'Thứ 5' },
  { value: '5', label: 'Thứ 6' },
  { value: '6', label: 'Thứ 7' },
  { value: '0', label: 'Chủ nhật' },
];

const createDefaultCustomerFieldConfig = (key: BookingCustomerFieldKey): BookingCustomerFieldConfig => {
  const defaultConfig = DEFAULT_BOOKING_CUSTOMER_FIELDS.find((field) => field.key === key);
  return {
    key,
    label: defaultConfig?.label ?? getBookingFieldLabel(key),
    required: key === 'full_name' ? true : (defaultConfig?.required ?? false),
    enabled: key === 'full_name' ? true : (defaultConfig?.enabled ?? true),
  };
};

const ensureRequiredCustomerFields = (fields: BookingCustomerFieldConfig[]) => {
  const usedKeys = new Set<BookingCustomerFieldKey>();
  const normalized: BookingCustomerFieldConfig[] = [];

  fields.forEach((field) => {
    if (usedKeys.has(field.key)) {
      return;
    }
    usedKeys.add(field.key);
    normalized.push({
      ...field,
      required: field.key === 'full_name' ? true : field.required,
      enabled: field.key === 'full_name' ? true : field.enabled,
    });
  });

  if (!usedKeys.has('full_name')) {
    normalized.unshift(createDefaultCustomerFieldConfig('full_name'));
  }

  return normalized;
};

const resolveTemplateByScope = (params: {
  scope: SlotTemplateScope;
  defaultSlots: string[];
  byWeekday: BookingSlotTemplateByWeekday;
}) => {
  if (params.scope === 'default') {
    return params.defaultSlots;
  }
  return params.byWeekday[Number(params.scope)] ?? [];
};

const setTemplateByScope = (params: {
  scope: SlotTemplateScope;
  nextSlots: string[];
  defaultSlots: string[];
  byWeekday: BookingSlotTemplateByWeekday;
}) => {
  if (params.scope === 'default') {
    return {
      defaultSlots: normalizeSlotTemplate(params.nextSlots),
      byWeekday: params.byWeekday,
    };
  }

  const day = Number(params.scope);
  return {
    defaultSlots: params.defaultSlots,
    byWeekday: {
      ...params.byWeekday,
      [day]: normalizeSlotTemplate(params.nextSlots),
    },
  };
};

export default function BookingSettingsPage() {
  return (
    <ModuleGuard moduleKey="bookings" requiredModules={['services']} requiredModulesType="all">
      <BookingSettingsContent />
    </ModuleGuard>
  );
}

function BookingSettingsContent() {
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'bookings' });
  const servicesData = useQuery(api.services.listAll, { limit: 200 });
  const setModuleSetting = useMutation(api.admin.modules.setModuleSetting);

  const currentValues = useMemo(() => {
    const readValue = (key: string) => settingsData?.find((setting) => setting.settingKey === key)?.value;
    const readNumber = (key: string, fallback: number) => {
      const value = readValue(key);
      return typeof value === 'number' ? value : fallback;
    };
    const readBoolean = (key: string, fallback: boolean) => {
      const value = readValue(key);
      return typeof value === 'boolean' ? value : fallback;
    };
    const visibilityRaw = readValue('visibilityMode');
    const visibilityMode: VisibilityMode = visibilityRaw === 'show_full' || visibilityRaw === 'show_anonymous' || visibilityRaw === 'hide_calendar'
      ? visibilityRaw
      : 'show_anonymous';
    const slotTemplateDefault = normalizeSlotTemplate(readValue('slotTemplateDefault'));
    const slotTemplateByWeekday = normalizeSlotTemplateByWeekday(readValue('slotTemplateByWeekday'));

    return {
      dayStartHour: readNumber('dayStartHour', 9),
      dayEndHour: readNumber('dayEndHour', 20),
      maxAdvanceDays: readNumber('maxAdvanceDays', 14),
      visibilityMode,
      openMon: readBoolean('openMon', true),
      openTue: readBoolean('openTue', true),
      openWed: readBoolean('openWed', true),
      openThu: readBoolean('openThu', true),
      openFri: readBoolean('openFri', true),
      openSat: readBoolean('openSat', true),
      openSun: readBoolean('openSun', true),
      customerFieldConfigs: normalizeBookingCustomerFieldConfigs(readValue('customerFieldConfigs')),
      slotTemplateDefault,
      slotTemplateByWeekday,
    };
  }, [settingsData]);

  const [form, setForm] = useState(currentValues);
  const [activeSlotTemplateScope, setActiveSlotTemplateScope] = useState<SlotTemplateScope>('default');
  const [slotTemplateServiceId, setSlotTemplateServiceId] = useState<string>('global');
  const [isSaving, setIsSaving] = useState(false);
  const [isFormHydrated, setIsFormHydrated] = useState(false);

  React.useEffect(() => {
    setForm(currentValues);
    setIsFormHydrated(true);
  }, [currentValues]);

  const hasChanges = isFormHydrated && JSON.stringify(form) !== JSON.stringify(currentValues);
  const isOvernight = isOvernightWindow(form.dayStartHour, form.dayEndHour);
  const durationHours = resolveWindowDurationHours(form.dayStartHour, form.dayEndHour);
  const isCustomMaxAdvanceDays = !MAX_ADVANCE_DAY_PRESETS.includes(form.maxAdvanceDays as (typeof MAX_ADVANCE_DAY_PRESETS)[number]);
  const selectedCustomerFieldKeys = new Set<BookingCustomerFieldKey>(form.customerFieldConfigs.map((field) => field.key));
  const availableCustomerFieldOptions = BOOKING_CUSTOMER_FIELD_OPTIONS.filter((option) => !selectedCustomerFieldKeys.has(option.key));
  const services = servicesData ?? [];
  const selectedTemplateService = services.find((service) => service._id === slotTemplateServiceId) ?? null;
  const slotIntervalMin = selectedTemplateService?.bookingSlotIntervalMin ?? 30;
  const durationMin = selectedTemplateService?.bookingDurationMin ?? 60;
  const suggestedSlots = useMemo(() => buildAutoSlotsFromWindow({
    startHour: form.dayStartHour,
    endHour: form.dayEndHour,
    slotIntervalMin,
    durationMin,
  }), [durationMin, form.dayEndHour, form.dayStartHour, slotIntervalMin]);
  const activeScopeSlots = useMemo(() => resolveTemplateByScope({
    scope: activeSlotTemplateScope,
    defaultSlots: form.slotTemplateDefault,
    byWeekday: form.slotTemplateByWeekday,
  }), [activeSlotTemplateScope, form.slotTemplateByWeekday, form.slotTemplateDefault]);
  const activeScopeSet = useMemo(() => new Set(activeScopeSlots), [activeScopeSlots]);

  const handleSave = async () => {
    if (form.dayStartHour < 0 || form.dayStartHour > 23 || form.dayEndHour < 0 || form.dayEndHour > 23) {
      toast.error('Giờ mở/đóng cửa phải trong khoảng 0-23');
      return;
    }

    if (form.dayStartHour === form.dayEndHour) {
      toast.error('Giờ mở và giờ đóng không được trùng nhau');
      return;
    }

    if (form.maxAdvanceDays < 1 || form.maxAdvanceDays > 365) {
      toast.error('Số ngày đặt trước tối đa phải từ 1 đến 365');
      return;
    }

    setIsSaving(true);
    try {
      const tasks: Promise<null>[] = [];
      const pushIfChanged = <T,>(settingKey: string, nextValue: T, currentValue: T) => {
        if (nextValue !== currentValue) {
          tasks.push(setModuleSetting({ moduleKey: 'bookings', settingKey, value: nextValue }));
        }
      };

      pushIfChanged('dayStartHour', form.dayStartHour, currentValues.dayStartHour);
      pushIfChanged('dayEndHour', form.dayEndHour, currentValues.dayEndHour);
      pushIfChanged('maxAdvanceDays', form.maxAdvanceDays, currentValues.maxAdvanceDays);
      pushIfChanged('visibilityMode', form.visibilityMode, currentValues.visibilityMode);

      WEEK_DAYS.forEach((day) => {
        const key = day.key as keyof typeof form;
        pushIfChanged(day.key, form[key], currentValues[key]);
      });

      const normalizedCustomerFields = ensureRequiredCustomerFields(form.customerFieldConfigs);
      const currentCustomerFields = ensureRequiredCustomerFields(currentValues.customerFieldConfigs);
      const normalizedCustomerFieldsJson = JSON.stringify(normalizedCustomerFields);
      const currentCustomerFieldsJson = JSON.stringify(currentCustomerFields);
      if (normalizedCustomerFieldsJson !== currentCustomerFieldsJson) {
        tasks.push(setModuleSetting({ moduleKey: 'bookings', settingKey: 'customerFieldConfigs', value: normalizedCustomerFields }));
      }

      const normalizedSlotTemplateDefault = normalizeSlotTemplate(form.slotTemplateDefault);
      const currentSlotTemplateDefault = normalizeSlotTemplate(currentValues.slotTemplateDefault);
      if (JSON.stringify(normalizedSlotTemplateDefault) !== JSON.stringify(currentSlotTemplateDefault)) {
        tasks.push(setModuleSetting({ moduleKey: 'bookings', settingKey: 'slotTemplateDefault', value: normalizedSlotTemplateDefault }));
      }

      const normalizedSlotTemplateByWeekday = normalizeSlotTemplateByWeekday(form.slotTemplateByWeekday);
      const currentSlotTemplateByWeekday = normalizeSlotTemplateByWeekday(currentValues.slotTemplateByWeekday);
      if (JSON.stringify(normalizedSlotTemplateByWeekday) !== JSON.stringify(currentSlotTemplateByWeekday)) {
        tasks.push(setModuleSetting({ moduleKey: 'bookings', settingKey: 'slotTemplateByWeekday', value: normalizedSlotTemplateByWeekday }));
      }

      await Promise.all(tasks);
      toast.success('Đã lưu cài đặt lịch');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu cài đặt lịch');
    } finally {
      setIsSaving(false);
    }
  };

  if (settingsData === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <CalendarCog className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Cài đặt lịch</h1>
          <p className="text-sm text-slate-500 mt-1">Thiết lập giờ hoạt động và hiển thị lịch đặt</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Khung giờ làm việc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="hidden md:block">
            <OperatingHoursDial
              startHour={form.dayStartHour}
              endHour={form.dayEndHour}
              onChange={({ startHour, endHour }) =>
                setForm((prev) => ({ ...prev, dayStartHour: clampHour(startHour), dayEndHour: clampHour(endHour) }))
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:hidden">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Giờ mở cửa</Label>
                <span className="text-xs text-slate-500">{formatHour(form.dayStartHour)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={23}
                step={1}
                value={form.dayStartHour}
                onChange={(e) => setForm((prev) => ({ ...prev, dayStartHour: clampHour(Number(e.target.value)) }))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Giờ đóng cửa</Label>
                <span className="text-xs text-slate-500">{formatHour(form.dayEndHour)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={23}
                step={1}
                value={form.dayEndHour}
                onChange={(e) => setForm((prev) => ({ ...prev, dayEndHour: clampHour(Number(e.target.value)) }))}
                className="w-full"
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/70 dark:bg-slate-800/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-slate-500">Mở cửa</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{formatHour(form.dayStartHour)}</p>
              </div>
              <div>
                <p className="text-slate-500">Đóng cửa</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{formatHour(form.dayEndHour)}</p>
                  {isOvernight ? <Badge variant="warning">Hôm sau</Badge> : null}
                </div>
              </div>
              <div>
                <p className="text-slate-500">Tổng thời gian mở</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{durationHours} giờ</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Số ngày đặt trước tối đa</Label>
            <select
              value={isCustomMaxAdvanceDays ? 'custom' : String(form.maxAdvanceDays)}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  return;
                }
                setForm((prev) => ({ ...prev, maxAdvanceDays: Number(e.target.value) }));
              }}
              className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            >
              {MAX_ADVANCE_DAY_PRESETS.map((value) => (
                <option key={value} value={value}>{value} ngày</option>
              ))}
              <option value="custom">Tùy chỉnh</option>
            </select>
            {isCustomMaxAdvanceDays && (
              <Input
                type="number"
                min={1}
                max={365}
                value={form.maxAdvanceDays}
                onChange={(e) => setForm((prev) => ({ ...prev, maxAdvanceDays: Number(e.target.value || 1) }))}
                placeholder="Nhập số ngày (1-365)"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ngày hoạt động trong tuần</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {WEEK_DAYS.map((day) => {
            const key = day.key as keyof typeof form;
            return (
              <label key={day.key} className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => setForm((prev) => ({ ...prev, [day.key]: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700 dark:text-slate-200">{day.label}</span>
              </label>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preset khung giờ (tick nhanh)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phạm vi ngày áp dụng</Label>
              <select
                value={activeSlotTemplateScope}
                onChange={(e) => setActiveSlotTemplateScope(e.target.value as SlotTemplateScope)}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                {SLOT_TEMPLATE_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Dịch vụ mẫu để gợi ý slot</Label>
              <select
                value={slotTemplateServiceId}
                onChange={(e) => setSlotTemplateServiceId(e.target.value)}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="global">Mặc định hệ thống (duration 60 / interval 30)</option>
                {services.map((service) => (
                  <option key={service._id} value={service._id}>{service.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Gợi ý theo dịch vụ mẫu: thời lượng {durationMin} phút, tạo slot mỗi {slotIntervalMin} phút.
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setForm((prev) => {
                  const next = setTemplateByScope({
                    scope: activeSlotTemplateScope,
                    nextSlots: suggestedSlots,
                    defaultSlots: prev.slotTemplateDefault,
                    byWeekday: prev.slotTemplateByWeekday,
                  });
                  return {
                    ...prev,
                    slotTemplateDefault: next.defaultSlots,
                    slotTemplateByWeekday: next.byWeekday,
                  };
                });
              }}
            >
              Chọn tất cả gợi ý
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setForm((prev) => {
                  const next = setTemplateByScope({
                    scope: activeSlotTemplateScope,
                    nextSlots: [],
                    defaultSlots: prev.slotTemplateDefault,
                    byWeekday: prev.slotTemplateByWeekday,
                  });
                  return {
                    ...prev,
                    slotTemplateDefault: next.defaultSlots,
                    slotTemplateByWeekday: next.byWeekday,
                  };
                });
              }}
            >
              Bỏ chọn tất cả
            </Button>
          </div>

          {suggestedSlots.length === 0 ? (
            <p className="text-sm text-amber-600">Không tạo được slot gợi ý. Hãy kiểm tra giờ mở/đóng hoặc interval dịch vụ.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {suggestedSlots.map((slot) => {
                const checked = activeScopeSet.has(slot);
                return (
                  <label key={slot} className="flex items-center gap-2 rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setForm((prev) => {
                          const current = resolveTemplateByScope({
                            scope: activeSlotTemplateScope,
                            defaultSlots: prev.slotTemplateDefault,
                            byWeekday: prev.slotTemplateByWeekday,
                          });
                          const nextSet = new Set(current);
                          if (e.target.checked) {
                            nextSet.add(slot);
                          } else {
                            nextSet.delete(slot);
                          }
                          const next = setTemplateByScope({
                            scope: activeSlotTemplateScope,
                            nextSlots: Array.from(nextSet),
                            defaultSlots: prev.slotTemplateDefault,
                            byWeekday: prev.slotTemplateByWeekday,
                          });
                          return {
                            ...prev,
                            slotTemplateDefault: next.defaultSlots,
                            slotTemplateByWeekday: next.byWeekday,
                          };
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{slot}</span>
                  </label>
                );
              })}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Tổng đã chọn trong phạm vi này: {activeScopeSlots.length} slot.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hiển thị lịch công khai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label>Chế độ hiển thị</Label>
          <select
            value={form.visibilityMode}
            onChange={(e) => setForm((prev) => ({ ...prev, visibilityMode: e.target.value as VisibilityMode }))}
            className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          >
            <option value="show_anonymous">Ẩn danh (chỉ hiện số lượng)</option>
            <option value="show_full">Hiện tên người đặt</option>
            <option value="hide_calendar">Ẩn bảng lịch</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin người đặt (preset)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.customerFieldConfigs.map((field, index) => {
            const keyOptions = [
              ...BOOKING_CUSTOMER_FIELD_OPTIONS.filter((option) => option.key === field.key),
              ...availableCustomerFieldOptions,
            ];
            const isFullName = field.key === 'full_name';
            return (
              <div key={`${field.key}-${index}`} className="rounded-md border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label>Trường preset</Label>
                    <select
                      value={field.key}
                      onChange={(e) => {
                        const nextKey = e.target.value as BookingCustomerFieldKey;
                        setForm((prev) => {
                          const nextFields = [...prev.customerFieldConfigs];
                          const hasDuplicate = nextFields.some((item, itemIndex) => itemIndex !== index && item.key === nextKey);
                          if (hasDuplicate) {
                            return prev;
                          }
                          const fallback = createDefaultCustomerFieldConfig(nextKey);
                          nextFields[index] = {
                            ...nextFields[index],
                            key: nextKey,
                            label: nextFields[index].label || fallback.label,
                            required: nextKey === 'full_name' ? true : nextFields[index].required,
                            enabled: nextKey === 'full_name' ? true : nextFields[index].enabled,
                          };
                          return { ...prev, customerFieldConfigs: ensureRequiredCustomerFields(nextFields) };
                        });
                      }}
                      className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    >
                      {keyOptions.map((option) => (
                        <option key={option.key} value={option.key}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label>Label hiển thị</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => {
                        const nextLabel = e.target.value;
                        setForm((prev) => {
                          const nextFields = [...prev.customerFieldConfigs];
                          nextFields[index] = { ...nextFields[index], label: nextLabel };
                          return { ...prev, customerFieldConfigs: nextFields };
                        });
                      }}
                      placeholder={getBookingFieldLabel(field.key)}
                    />
                  </div>

                  <div className="flex md:justify-end items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isFullName}
                      onClick={() => {
                        setForm((prev) => {
                          const nextFields = prev.customerFieldConfigs.filter((_, fieldIndex) => fieldIndex !== index);
                          return { ...prev, customerFieldConfigs: ensureRequiredCustomerFields(nextFields) };
                        });
                      }}
                    >
                      Xóa trường
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={isFullName}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => {
                          const nextFields = [...prev.customerFieldConfigs];
                          nextFields[index] = {
                            ...nextFields[index],
                            required: isFullName ? true : checked,
                          };
                          return { ...prev, customerFieldConfigs: nextFields };
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    Bắt buộc
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      disabled={isFullName}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((prev) => {
                          const nextFields = [...prev.customerFieldConfigs];
                          nextFields[index] = {
                            ...nextFields[index],
                            enabled: isFullName ? true : checked,
                          };
                          return { ...prev, customerFieldConfigs: ensureRequiredCustomerFields(nextFields) };
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    Hiển thị
                  </label>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Mặc định có 3 preset: Họ và tên, Số điện thoại, Ghi chú.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={availableCustomerFieldOptions.length === 0}
              onClick={() => {
                const nextOption = availableCustomerFieldOptions[0];
                if (!nextOption) {
                  return;
                }
                setForm((prev) => ({
                  ...prev,
                  customerFieldConfigs: ensureRequiredCustomerFields([
                    ...prev.customerFieldConfigs,
                    createDefaultCustomerFieldConfig(nextOption.key),
                  ]),
                }));
              }}
            >
              Thêm trường
            </Button>
          </div>
        </CardContent>
      </Card>

      <HomeComponentStickyFooter
        isSubmitting={isSaving}
        hasChanges={hasChanges}
        onClickSave={handleSave}
        submitLabel="Lưu cài đặt"
        submittingLabel="Đang lưu..."
        savedLabel="Đã lưu"
        disableSave={!hasChanges || isSaving}
        align="end"
      />
    </div>
  );
}
