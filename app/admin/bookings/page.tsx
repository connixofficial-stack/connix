'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { CalendarDays, Check, Loader2, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, CardContent, Input } from '../components/ui';
import { ModuleGuard } from '../components/ModuleGuard';
import { usePersistedPageSize } from '../components/usePersistedPageSize';
import { MonthCalendar } from '@/components/shared/MonthCalendar';

type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled';

type BookingDoc = {
  _id: Id<'bookings'>;
  serviceId: Id<'services'>;
  customerName: string;
  bookingDate: string;
  slotTime: string;
  timezone: string;
  status: BookingStatus;
  note?: string;
  bookingFields?: Record<string, string>;
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

const getStatusBadgeVariant = (status: BookingStatus): 'secondary' | 'success' | 'destructive' => {
  if (status === 'Confirmed') {return 'success';}
  if (status === 'Cancelled') {return 'destructive';}
  return 'secondary';
};

const getStatusLabel = (status: BookingStatus) => {
  if (status === 'Confirmed') {return 'Đã xác nhận';}
  if (status === 'Cancelled') {return 'Đã hủy';}
  return 'Chờ xác nhận';
};

export default function BookingsListPage() {
  return (
    <ModuleGuard moduleKey="bookings" requiredModules={['services']} requiredModulesType="all">
      <BookingsContent />
    </ModuleGuard>
  );
}

function BookingsContent() {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | BookingStatus>('');
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'bookings' });
  const servicesData = useQuery(api.bookings.listBookableServices, {});

  const bookingsPerPageSetting = useMemo(() => {
    const value = settingsData?.find((setting) => setting.settingKey === 'bookingsPerPage')?.value;
    return typeof value === 'number' ? value : 20;
  }, [settingsData]);

  const [resolvedPageSize, setPageSizeOverride] = usePersistedPageSize('admin_bookings_page_size', bookingsPerPageSetting);
  const offset = (currentPage - 1) * resolvedPageSize;

  const { fromDate, toDate } = useMemo(() => getMonthRange(month), [month]);

  const monthBookings = useQuery(api.bookings.listAdminWithOffset, {
    limit: 2000,
    offset: 0,
    fromDate,
    toDate,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    serviceId: serviceFilter ? (serviceFilter as Id<'services'>) : undefined,
    enabledServiceOnly: true,
  });

  const selectedDateBookings = useQuery(api.bookings.listAdminWithOffset, {
    limit: resolvedPageSize,
    offset,
    bookingDate: selectedDate,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    serviceId: serviceFilter ? (serviceFilter as Id<'services'>) : undefined,
    enabledServiceOnly: true,
  });

  const selectedDateCount = useQuery(api.bookings.countAdmin, {
    bookingDate: selectedDate,
    search: debouncedSearch || undefined,
    status: statusFilter || undefined,
    serviceId: serviceFilter ? (serviceFilter as Id<'services'>) : undefined,
    enabledServiceOnly: true,
  });

  const updateStatus = useMutation(api.bookings.updateStatus);

  const hasAllData = monthBookings !== undefined
    && selectedDateBookings !== undefined
    && selectedDateCount !== undefined
    && servicesData !== undefined
    && settingsData !== undefined;
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    if (hasAllData && !hasLoadedOnce) {
      setHasLoadedOnce(true);
    }
  }, [hasAllData, hasLoadedOnce]);

  const isInitialLoading = !hasLoadedOnce && !hasAllData;
  const isSelectedDateLoading = selectedDateBookings === undefined || selectedDateCount === undefined;
  const [lastSelectedDateBookings, setLastSelectedDateBookings] = useState<BookingDoc[]>([]);
  const [lastSelectedDateCount, setLastSelectedDateCount] = useState(0);

  useEffect(() => {
    if (selectedDateBookings !== undefined) {
      setLastSelectedDateBookings(selectedDateBookings as BookingDoc[]);
    }
  }, [selectedDateBookings]);

  useEffect(() => {
    if (selectedDateCount !== undefined) {
      setLastSelectedDateCount(selectedDateCount.count);
    }
  }, [selectedDateCount]);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, BookingDoc[]>();
    (monthBookings ?? []).forEach((booking) => {
      const current = map.get(booking.bookingDate) ?? [];
      current.push(booking as BookingDoc);
      map.set(booking.bookingDate, current);
    });
    return map;
  }, [monthBookings]);

  const serviceMap = useMemo(() => {
    return new Map((servicesData ?? []).map((service) => [service._id, service.title]));
  }, [servicesData]);

  const totalCount = isSelectedDateLoading ? lastSelectedDateCount : (selectedDateCount?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / resolvedPageSize));
  const displayedBookings = isSelectedDateLoading ? lastSelectedDateBookings : ((selectedDateBookings ?? []) as BookingDoc[]);

  const handleStatusUpdate = async (id: Id<'bookings'>, status: BookingStatus) => {
    try {
      await updateStatus({ id, status });
      toast.success('Đã cập nhật trạng thái');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái');
    }
  };

  const getDayTone = (date: string) => {
    const items = bookingsByDate.get(date) ?? [];
    const activeCount = items.filter((booking) => booking.status !== 'Cancelled').length;
    if (activeCount === 0) {return 'default' as const;}
    if (activeCount >= 8) {return 'danger' as const;}
    if (activeCount >= 4) {return 'warning' as const;}
    return 'success' as const;
  };

  const getDayBadge = (date: string) => {
    const items = bookingsByDate.get(date) ?? [];
    const activeCount = items.filter((booking) => booking.status !== 'Cancelled').length;
    return activeCount > 0 ? activeCount : undefined;
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <CalendarDays className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Đặt lịch</h1>
          <p className="text-sm text-slate-500 mt-1">Lịch tháng và danh sách lịch hẹn theo ngày</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm theo tên khách..."
              className="pl-9"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as '' | BookingStatus); setCurrentPage(1); }}
            className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Pending">Chờ xác nhận</option>
            <option value="Confirmed">Đã xác nhận</option>
            <option value="Cancelled">Đã hủy</option>
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => { setServiceFilter(e.target.value); setCurrentPage(1); }}
            className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm"
          >
            <option value="">Tất cả dịch vụ</option>
            {servicesData?.map((service) => (
              <option key={service._id} value={service._id}>{service.title}</option>
            ))}
          </select>

          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              const next = new Date(`${e.target.value}T00:00:00`);
              if (!Number.isNaN(next.getTime())) {
                setMonth(new Date(next.getFullYear(), next.getMonth(), 1));
              }
              setCurrentPage(1);
            }}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-3">
          <CardContent className="p-4">
            <MonthCalendar
              month={month}
              selectedDate={selectedDate}
              onMonthChange={(nextMonth) => {
                setMonth(nextMonth);
                const nextSelected = formatDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1));
                setSelectedDate(nextSelected);
                setCurrentPage(1);
              }}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setCurrentPage(1);
              }}
              getDayTone={getDayTone}
              getDayBadge={getDayBadge}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedDate}</div>
                <div className="text-xs text-slate-500">Tổng {totalCount} lịch hẹn</div>
              </div>
              <div className="flex items-center gap-2">
                {isSelectedDateLoading && <Loader2 size={14} className="animate-spin text-slate-400" />}
                <Badge variant="info">{displayedBookings.length} / trang</Badge>
              </div>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {displayedBookings.map((booking) => (
                <div key={booking._id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{booking.customerName}</div>
                      <div className="text-xs text-slate-500">{serviceMap.get(booking.serviceId) ?? '—'} • {booking.slotTime}</div>
                      {booking.bookingFields?.phone && (
                        <div className="text-xs text-slate-500">SĐT: {booking.bookingFields.phone}</div>
                      )}
                    </div>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>{getStatusLabel(booking.status)}</Badge>
                  </div>

                  {booking.note && (
                    <div className="text-xs text-slate-500 line-clamp-2">{booking.note}</div>
                  )}

                  <div className="flex gap-2">
                    {booking.status !== 'Confirmed' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(booking._id, 'Confirmed')}>
                        <Check size={14} className="mr-1" /> Xác nhận
                      </Button>
                    )}
                    {booking.status !== 'Cancelled' && (
                      <Button size="sm" variant="outline" onClick={() => handleStatusUpdate(booking._id, 'Cancelled')}>
                        <X size={14} className="mr-1" /> Hủy
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {displayedBookings.length === 0 && !isSelectedDateLoading && (
                <div className="text-sm text-slate-500 text-center py-10">Chưa có lịch hẹn trong ngày này</div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <span>Hiển thị:</span>
                <select
                  value={resolvedPageSize}
                  onChange={(e) => { setPageSizeOverride(Number(e.target.value || 20)); setCurrentPage(1); }}
                  className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs"
                >
                  {[10, 20, 30, 50].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => { setCurrentPage((prev) => Math.max(1, prev - 1)); }}
                >
                  Trước
                </Button>
                <span>{currentPage}/{totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => { setCurrentPage((prev) => Math.min(totalPages, prev + 1)); }}
                >
                  Sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
