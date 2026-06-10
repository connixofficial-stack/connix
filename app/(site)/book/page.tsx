'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useBrandColors } from '@/components/site/hooks';
import { useBookingConfig } from '@/lib/experiences';
import { MonthCalendar } from '@/components/shared/MonthCalendar';
import { normalizeBookingCustomerFieldConfigs } from '@/lib/bookings/customerFieldConfig';

type SlotInfo = {
  slotTime: string;
  count: number;
  names?: string[];
};

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getMonthRange = (month: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return { fromDate: formatDate(first), toDate: formatDate(last) };
};

const normalizeVietnamese = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .trim();

export default function BookingPage() {
  const brand = useBrandColors();
  const bookingConfig = useBookingConfig();
  const settings = useQuery(api.bookings.getBookingSettings, {});
  const services = useQuery(api.bookings.listBookableServices, {});

  const [serviceId, setServiceId] = useState('');
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [serviceQuery, setServiceQuery] = useState('');
  const serviceComboboxRef = useRef<HTMLDivElement>(null);
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [bookingDate, setBookingDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [customerFields, setCustomerFields] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBooking = useMutation(api.bookings.createPublicBooking);

  const minDate = useMemo(() => formatDate(new Date()), []);
  const maxDate = useMemo(() => {
    if (!settings) {return '';}
    const max = new Date();
    max.setDate(max.getDate() + settings.maxAdvanceDays);
    return formatDate(max);
  }, [settings]);

  const { fromDate, toDate } = useMemo(() => getMonthRange(month), [month]);

  const monthOverview = useQuery(
    api.bookings.getPublicMonthOverview,
    serviceId ? { serviceId: serviceId as Id<'services'>, fromDate, toDate } : 'skip'
  );

  const availability = useQuery(
    api.bookings.getPublicAvailability,
    serviceId && bookingDate
      ? { serviceId: serviceId as Id<'services'>, bookingDate }
      : 'skip'
  );

  const dayOverviewMap = useMemo(() => {
    const map = new Map<string, { activeCount: number; isFull: boolean }>();
    (monthOverview?.days ?? []).forEach((day: { bookingDate: string; activeCount: number; isFull: boolean }) => {
      map.set(day.bookingDate, { activeCount: day.activeCount, isFull: day.isFull });
    });
    return map;
  }, [monthOverview]);

  const visibilityMode = availability?.visibilityMode ?? monthOverview?.visibilityMode ?? settings?.visibilityMode ?? 'show_anonymous';
  const slots = availability?.slots ?? [];
  const capacityPerSlot = availability?.capacityPerSlot ?? monthOverview?.capacityPerSlot ?? 1;
  const serviceOptions = useMemo(() => services ?? [], [services]);
  const customerFieldConfigs = useMemo(
    () => normalizeBookingCustomerFieldConfigs(settings?.customerFieldConfigs),
    [settings?.customerFieldConfigs]
  );
  const activeCustomerFields = useMemo(
    () => customerFieldConfigs.filter((field) => field.enabled),
    [customerFieldConfigs]
  );

  const selectedService = useMemo(
    () => serviceOptions.find((service) => service._id === serviceId) ?? null,
    [serviceOptions, serviceId]
  );

  const filteredServices = useMemo(() => {
    const keyword = normalizeVietnamese(serviceQuery);
    if (!keyword) {
      return serviceOptions;
    }
    return serviceOptions.filter((service) => normalizeVietnamese(service.title).includes(keyword));
  }, [serviceOptions, serviceQuery]);

  useEffect(() => {
    if (!isServiceOpen) {
      return;
    }

    const handleMouseDown = (event: MouseEvent) => {
      if (!serviceComboboxRef.current?.contains(event.target as Node)) {
        setIsServiceOpen(false);
        setServiceQuery('');
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsServiceOpen(false);
        setServiceQuery('');
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isServiceOpen]);

  useEffect(() => {
    setCustomerFields((prev) => {
      const next: Record<string, string> = {};
      activeCustomerFields.forEach((field) => {
        next[field.key] = prev[field.key] ?? '';
      });
      return next;
    });
  }, [activeCustomerFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    if (!serviceId || !bookingDate || !slotTime) {
      setSubmitMessage('Vui lòng nhập đủ thông tin đặt lịch.');
      return;
    }

    for (const field of activeCustomerFields) {
      if (!field.required) {
        continue;
      }
      if (!customerFields[field.key]?.trim()) {
        setSubmitMessage(`Vui lòng nhập ${field.label.toLowerCase()}.`);
        return;
      }
    }

    const customerName = customerFields.full_name?.trim() || '';
    if (!customerName) {
      setSubmitMessage('Vui lòng nhập họ và tên.');
      return;
    }

    const bookingFields = activeCustomerFields.reduce<Record<string, string>>((acc, field) => {
      const value = customerFields[field.key]?.trim() ?? '';
      if (value) {
        acc[field.key] = value;
      }
      return acc;
    }, {});

    setIsSubmitting(true);
    try {
      await createBooking({
        serviceId: serviceId as Id<'services'>,
        bookingDate,
        slotTime,
        customerName,
        note: bookingFields.note || undefined,
        bookingFields,
      });
      setSubmitMessage('Đặt lịch thành công. Spa sẽ liên hệ sớm.');
      setSlotTime('');
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Đặt lịch thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (settings === undefined || services === undefined) {
    return (
      <div className="max-w-5xl mx-auto py-20 text-center text-slate-500">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Đặt lịch</h1>
        <p className="text-slate-500">Chọn dịch vụ, ngày phù hợp và khung giờ còn trống.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className={`${serviceId ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            {bookingConfig.showServiceSelect && (
              <div className="space-y-2" ref={serviceComboboxRef}>
                <label className="text-sm font-medium text-slate-700">Dịch vụ</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsServiceOpen((prev) => !prev)}
                    className="w-full h-11 rounded-md border border-slate-200 px-3 text-sm text-left flex items-center justify-between"
                  >
                    <span className={selectedService ? 'text-slate-700' : 'text-slate-400'}>
                      {selectedService?.title ?? 'Chọn dịch vụ'}
                    </span>
                    <span className="text-xs text-slate-400">▼</span>
                  </button>

                  {isServiceOpen && (
                    <div className="absolute left-0 right-0 z-20 mt-2 rounded-md border border-slate-200 bg-white p-2 shadow-md">
                      <input
                        value={serviceQuery}
                        onChange={(e) => setServiceQuery(e.target.value)}
                        placeholder="Tìm dịch vụ..."
                        className="w-full h-10 rounded-md border border-slate-200 px-3 text-sm"
                      />
                      <div className="mt-2 max-h-56 overflow-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setServiceId('');
                            setSlotTime('');
                            setBookingDate('');
                            setServiceQuery('');
                            setIsServiceOpen(false);
                          }}
                          className="w-full text-left px-2 py-2 rounded-md text-sm text-slate-600 hover:bg-slate-100"
                        >
                          Chọn dịch vụ
                        </button>
                        {filteredServices.length === 0 && (
                          <div className="px-2 py-2 text-xs text-slate-500">Không tìm thấy dịch vụ phù hợp.</div>
                        )}
                        {filteredServices.map((service) => (
                          <button
                            key={service._id}
                            type="button"
                            onClick={() => {
                              setServiceId(service._id);
                              setSlotTime('');
                              setBookingDate('');
                              setServiceQuery('');
                              setIsServiceOpen(false);
                            }}
                            className="w-full text-left px-2 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                          >
                            <span>{service.title}</span>
                            {serviceId === service._id && <span className="text-xs text-slate-400">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!serviceId ? (
              <p className="text-sm text-slate-500">Vui lòng chọn dịch vụ để tiếp tục đặt lịch.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Ngày đặt</label>
                  <MonthCalendar
                    month={month}
                    selectedDate={bookingDate}
                    minDate={minDate}
                    maxDate={maxDate}
                    onMonthChange={setMonth}
                    onSelectDate={(date) => {
                      setBookingDate(date);
                      setSlotTime('');
                    }}
                    isDayDisabled={(date) => {
                      if (!settings) {return false;}
                      const weekday = new Date(`${date}T00:00:00`).getDay();
                      return settings.openDays[weekday] === false;
                    }}
                    getDayTone={(date) => {
                      const day = dayOverviewMap.get(date);
                      const count = day?.activeCount ?? 0;
                      if (count === 0) {return 'default';}
                      if (day?.isFull) {return 'danger';}
                      return 'success';
                    }}
                    getDayBadge={(date) => {
                      const count = dayOverviewMap.get(date)?.activeCount ?? 0;
                      return count > 0 ? count : undefined;
                    }}
                  />
                </div>

                {activeCustomerFields.map((field) => {
                  const value = customerFields[field.key] ?? '';
                  const label = `${field.label}${field.required ? ' *' : ' (tuỳ chọn)'}`;
                  if (field.key === 'note') {
                    return (
                      <div key={field.key} className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">{label}</label>
                        <textarea
                          value={value}
                          onChange={(e) => {
                            const nextValue = e.target.value;
                            setCustomerFields((prev) => ({ ...prev, [field.key]: nextValue }));
                          }}
                          className="w-full min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm"
                          placeholder={field.label}
                        />
                      </div>
                    );
                  }

                  const inputType = field.key === 'phone' ? 'tel' : 'text';
                  return (
                    <div key={field.key} className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">{label}</label>
                      <input
                        type={inputType}
                        value={value}
                        onChange={(e) => {
                          const nextValue = e.target.value;
                          setCustomerFields((prev) => ({ ...prev, [field.key]: nextValue }));
                        }}
                        className="w-full h-11 rounded-md border border-slate-200 px-3 text-sm"
                        placeholder={field.label}
                      />
                    </div>
                  );
                })}

                {submitMessage && (
                  <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
                    {submitMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-md text-white font-medium"
                  style={{ background: brand.primary }}
                >
                  {isSubmitting ? 'Đang gửi...' : 'Đặt lịch'}
                </button>
              </>
            )}
          </div>
        </form>

        {serviceId && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="text-sm font-semibold text-slate-700">Khung giờ</div>
              {!bookingDate && (
                <div className="text-sm text-slate-500">Chọn ngày để hiển thị slot còn trống.</div>
              )}
              {bookingDate && availability?.allowed === false && (
                <div className="text-sm text-rose-500">{availability.message ?? 'Ngày đặt không khả dụng'}</div>
              )}
              {visibilityMode === 'hide_calendar' && (
                <div className="text-sm text-slate-500">Lịch đang được ẩn. Vui lòng gửi yêu cầu đặt lịch.</div>
              )}
              {visibilityMode !== 'hide_calendar' && bookingDate && (
                <>
                  {slots.length === 0 ? (
                    <div className="text-sm text-slate-500">Ngày này chưa có khung giờ khả dụng. Vui lòng chọn ngày khác.</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {slots.map((slot: SlotInfo) => {
                        const isFull = slot.count >= capacityPerSlot;
                        const isSelected = slotTime === slot.slotTime;
                        return (
                          <button
                            key={slot.slotTime}
                            type="button"
                            disabled={isFull}
                            onClick={() => { setSlotTime(slot.slotTime); }}
                            className={`h-10 rounded-md border text-sm ${isSelected ? 'border-transparent text-white' : isFull ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'} ${isFull ? 'cursor-not-allowed opacity-80' : ''}`}
                            style={isSelected ? { background: brand.primary } : undefined}
                          >
                            {slot.slotTime}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {bookingConfig.showLegend && visibilityMode !== 'hide_calendar' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Còn chỗ
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Đã đầy
                </div>
              </div>
            )}

            {bookingConfig.showCapacityHint && visibilityMode === 'show_anonymous' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 text-xs text-slate-500">
                Slot đầy khi đạt {capacityPerSlot} khách.
              </div>
            )}

            {visibilityMode === 'show_full' && slots.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-2 text-xs text-slate-500">
                <div className="font-semibold text-slate-700">Khách đã đặt</div>
                {slots.filter((slot) => slot.count > 0).slice(0, 4).map((slot) => (
                  <div key={slot.slotTime}>
                    {slot.slotTime}: {slot.names?.join(', ') || '—'}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
