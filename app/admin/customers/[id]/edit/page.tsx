'use client';

import React, { use, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronLeft, ChevronRight, Loader2, User as UserIcon, Search, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';

const MODULE_KEY = 'customers';
const ORDERS_PER_PAGE = 10;

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/.test(phone.replaceAll(/\s|-/g, ''));

// ─── Address Combobox ────────────────────────────────────────────────────────
interface ComboboxOption { code: string; name: string; }
interface AddressComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (code: string) => void;
  placeholder: string;
  disabled?: boolean;
  hasError?: boolean;
}

function AddressCombobox({ options, value, onChange, placeholder, disabled, hasError }: AddressComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.code === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    setHighlighted(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [disabled]);

  const handleSelect = useCallback((code: string) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  }, [onChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'Enter' || e.key === ' ') handleOpen(); return; }
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && filtered[highlighted]) { handleSelect(filtered[highlighted].code); }
  };

  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm transition-colors text-left bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-slate-400 dark:hover:border-slate-600",
          hasError && "border-red-500"
        )}
      >
        <span className="truncate">{selected ? selected.name : placeholder}</span>
        <ChevronDown size={15} className={cn("shrink-0 ml-1 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden min-w-[220px]">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-100 dark:border-slate-900">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Tìm kiếm..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
              className="flex-1 text-sm outline-none bg-transparent py-1 text-slate-800 dark:text-slate-200"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setHighlighted(0); inputRef.current?.focus(); }}
                className="text-xs text-slate-400 hover:text-slate-600 shrink-0"
              >
                ✕
              </button>
            )}
          </div>

          <ul ref={listRef} className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400 text-center">Không tìm thấy kết quả</li>
            ) : (
              filtered.map((opt, idx) => (
                <li
                  key={opt.code}
                  onMouseEnter={() => setHighlighted(idx)}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.code); }}
                  className={cn(
                    "px-3 py-1.5 text-sm cursor-pointer flex items-center justify-between transition-colors text-slate-800 dark:text-slate-200",
                    idx === highlighted ? "bg-slate-100 dark:bg-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                  )}
                >
                  <span>{opt.name}</span>
                  {opt.code === value && <Check size={13} className="text-emerald-500 shrink-0" />}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Interfaces ──────────────────────────────────────────────────────────────
interface AddressOption { code: string; name: string; parentCode?: string; }
interface TwoLevelProvince { code: number; name: string; wards: { code: number; name: string; }[]; }

interface FormData {
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  status: 'Active' | 'Inactive';
  addressFormat: 'text' | '2-level' | '3-level';
  addressDetail: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  wardCode: string;
  wardName: string;
}

export default function CustomerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Convex queries
  const customerData = useQuery(api.customers.getById, { id: id as Id<"customers"> });
  const ordersData = useQuery(api.orders.listAllByCustomer, { customerId: id as Id<"customers"> });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const ordersSettings = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'orders' });

  // Convex mutations
  const updateCustomer = useMutation(api.customers.update);

  // States
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState<FormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);

  // Address helper states
  const [twoLevelData, setTwoLevelData] = useState<TwoLevelProvince[]>([]);
  const [provinceList, setProvinceList] = useState<AddressOption[]>([]);
  const [districtList, setDistrictList] = useState<AddressOption[]>([]);
  const [wardList, setWardList] = useState<AddressOption[]>([]);

  const isLoading = customerData === undefined || ordersSettings === undefined;

  // Cấu hình settings
  const settingsMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    (ordersSettings ?? []).forEach((setting) => {
      map[setting.settingKey] = setting.value;
    });
    return map;
  }, [ordersSettings]);

  const rawAddressFormat = typeof settingsMap.addressFormat === 'string' ? settingsMap.addressFormat : 'text';
  const addressFormat = rawAddressFormat === '2-level' || rawAddressFormat === '3-level' ? rawAddressFormat : 'text';

  // Get enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const showNotes = enabledFeatures.enableNotes ?? true;
  const showAddresses = enabledFeatures.enableAddresses ?? true;
  const showAvatar = enabledFeatures.enableAvatar ?? true;

  // Sync form with customer data
  useEffect(() => {
    if (customerData && !formData && ordersSettings !== undefined) {
      setFormData({
        address: customerData.address ?? '',
        city: customerData.city ?? '',
        email: customerData.email,
        name: customerData.name,
        notes: customerData.notes ?? '',
        phone: customerData.phone,
        status: customerData.status,
        addressFormat: customerData.addressFormat ?? 'text',
        addressDetail: customerData.addressDetail ?? '',
        provinceCode: customerData.provinceCode ?? '',
        provinceName: customerData.provinceName ?? '',
        districtCode: customerData.districtCode ?? '',
        districtName: customerData.districtName ?? '',
        wardCode: customerData.wardCode ?? '',
        wardName: customerData.wardName ?? '',
      });
    }
  }, [customerData, formData, ordersSettings]);

  // Load JSON address data
  useEffect(() => {
    if (addressFormat === 'text') return;

    let cancelled = false;
    const loadAddressData = async () => {
      try {
        if (addressFormat === '2-level') {
          const response = await fetch('/data/address-2-level.json');
          const data = await response.json() as TwoLevelProvince[];
          if (cancelled) return;
          setTwoLevelData(data);
          setProvinceList(data.map((p) => ({ code: String(p.code), name: p.name })));
          setDistrictList([]);
          setWardList([]);
        } else {
          const [provincesRes, districtsRes, wardsRes] = await Promise.all([
            fetch('/data/address-provinces.json'),
            fetch('/data/address-districts.json'),
            fetch('/data/address-wards.json'),
          ]);

          const provinces = await provincesRes.json() as { id: string; name: string }[];
          const districtsRaw = await districtsRes.json() as Record<string, { code: string; name: string; parent_code: string }>;
          const wardsRaw = await wardsRes.json() as Record<string, { code: string; name: string; parent_code: string }>;

          if (cancelled) return;
          setProvinceList(provinces.map((p) => ({ code: p.id.padStart(2, '0'), name: p.name })));
          setDistrictList(Object.values(districtsRaw).map((d) => ({
            code: d.code,
            name: d.name,
            parentCode: d.parent_code,
          })));
          setWardList(Object.values(wardsRaw).map((w) => ({
            code: w.code,
            name: w.name,
            parentCode: w.parent_code,
          })));
          setTwoLevelData([]);
        }
      } catch (error) {
        console.error(error);
        toast.error('Không thể tải dữ liệu địa chỉ hành chính.');
      }
    };

    void loadAddressData();
    return () => {
      cancelled = true;
    };
  }, [addressFormat]);

  const handleChange = (field: keyof FormData, value: unknown) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleProvinceChange = (code: string) => {
    if (!formData) return;
    const name = provinceList.find((p) => p.code === code)?.name ?? '';
    
    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        provinceCode: code,
        provinceName: name,
        districtCode: '',
        districtName: '',
        wardCode: '',
        wardName: '',
      };
    });
  };

  const handleDistrictChange = (code: string) => {
    if (!formData) return;
    const name = districtList.find((d) => d.code === code)?.name ?? '';

    setFormData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        districtCode: code,
        districtName: name,
        wardCode: '',
        wardName: '',
      };
    });
  };

  const handleWardChange = (code: string) => {
    if (!formData) return;
    let name = '';
    if (addressFormat === '2-level') {
      const activeProv = twoLevelData.find((p) => String(p.code) === formData.provinceCode);
      name = activeProv?.wards.find((w) => String(w.code) === code)?.name ?? '';
    } else {
      name = wardList.find((w) => w.code === code)?.name ?? '';
    }

    handleChange('wardCode', code);
    handleChange('wardName', name);
  };

  // Computes lists
  const availableDistricts = useMemo(() => {
    if (!formData || addressFormat !== '3-level') return [];
    return districtList.filter((d) => d.parentCode === formData.provinceCode);
  }, [formData, districtList, addressFormat]);

  const availableWards = useMemo(() => {
    if (!formData) return [];
    if (addressFormat === '2-level') {
      const activeProv = twoLevelData.find((p) => String(p.code) === formData.provinceCode);
      return activeProv?.wards.map((w) => ({ code: String(w.code), name: w.name })) ?? [];
    }
    return wardList.filter((w) => w.parentCode === formData.districtCode);
  }, [formData, wardList, twoLevelData, addressFormat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    // Validation basic
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập họ tên');
      return;
    }
    if (!formData.email.trim() || !isValidEmail(formData.email.trim())) {
      toast.error('Email không hợp lệ');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Vui lòng nhập số điện thoại');
      return;
    }
    if (!isValidPhone(formData.phone.trim())) {
      toast.error('Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)');
      return;
    }

    // Địa chỉ validation & assembly
    let finalAddress = formData.address;
    let finalCity = formData.city;

    if (showAddresses) {
      if (addressFormat === 'text') {
        finalAddress = formData.address.trim();
        finalCity = formData.city.trim();
      } else {
        if (!formData.provinceCode) {
          toast.error('Vui lòng chọn Tỉnh/Thành phố');
          return;
        }
        if (addressFormat === '3-level' && !formData.districtCode) {
          toast.error('Vui lòng chọn Quận/Huyện');
          return;
        }
        if (!formData.wardCode) {
          toast.error('Vui lòng chọn Phường/Xã');
          return;
        }
        if (!formData.addressDetail.trim()) {
          toast.error('Vui lòng nhập chi tiết địa chỉ (Số nhà, tên đường)');
          return;
        }

        // Ghép thành chuỗi
        const parts = [
          formData.addressDetail.trim(),
          formData.wardName,
          addressFormat === '3-level' ? formData.districtName : null,
          formData.provinceName,
        ].filter(Boolean);
        
        finalAddress = parts.join(', ');
        finalCity = formData.provinceName;
      }
    }

    setIsSubmitting(true);
    try {
      await updateCustomer({
        address: finalAddress || undefined,
        city: finalCity || undefined,
        email: formData.email.toLowerCase().trim(),
        id: id as Id<"customers">,
        name: formData.name.trim(),
        notes: formData.notes.trim() || undefined,
        phone: formData.phone.trim(),
        status: formData.status,
        addressFormat: showAddresses ? addressFormat : undefined,
        addressDetail: showAddresses && addressFormat !== 'text' ? formData.addressDetail.trim() : undefined,
        provinceCode: showAddresses && addressFormat !== 'text' ? formData.provinceCode : undefined,
        provinceName: showAddresses && addressFormat !== 'text' ? formData.provinceName : undefined,
        districtCode: showAddresses && addressFormat === '3-level' ? formData.districtCode : undefined,
        districtName: showAddresses && addressFormat === '3-level' ? formData.districtName : undefined,
        wardCode: showAddresses && addressFormat !== 'text' ? formData.wardCode : undefined,
        wardName: showAddresses && addressFormat !== 'text' ? formData.wardName : undefined,
      });
      toast.success('Đã lưu thông tin khách hàng');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Có lỗi xảy ra';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 mb-4">Không tìm thấy khách hàng</p>
        <Link href="/admin/customers">
          <Button variant="outline">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thông tin khách hàng</h1>
          <Link href="/admin/customers" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Profile Card */}
        <div className="w-full md:w-1/3 space-y-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden">
                {showAvatar && customerData.avatar ? (
                  <Image src={customerData.avatar} width={96} height={96} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                    <UserIcon className="w-12 h-12 text-purple-400" />
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{customerData.name}</h3>
              <p className="text-slate-500 text-sm mb-2">{customerData.email}</p>
              <Badge variant={customerData.status === 'Active' ? 'success' : 'secondary'}>
                {customerData.status === 'Active' ? 'Hoạt động' : 'Đã khóa'}
              </Badge>

              <div className="grid grid-cols-2 gap-4 w-full border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{customerData.ordersCount}</div>
                  <div className="text-xs text-slate-500">Đơn hàng</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(customerData.totalSpent)}
                  </div>
                  <div className="text-xs text-slate-500">Chi tiêu</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {showNotes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Ghi chú nhanh</CardTitle></CardHeader>
              <CardContent>
                <textarea
                  className="w-full h-32 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData?.notes ?? ''}
                  onChange={(e) => { handleChange('notes', e.target.value); }}
                  placeholder="Ghi chú về khách hàng..."
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            <button
              onClick={() => { setActiveTab('profile'); }}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'profile' ? "border-purple-500 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Hồ sơ & Địa chỉ
            </button>
            <button
              onClick={() => { setActiveTab('orders'); }}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === 'orders' ? "border-purple-500 text-purple-600" : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              Lịch sử mua hàng ({ordersData?.length ?? 0})
            </button>
          </div>

          {activeTab === 'profile' && formData && (
            <Card>
              <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Họ và tên <span className="text-red-500">*</span></Label>
                      <CopyableInput
                        value={formData.name}
                        copyLabel="họ và tên"
                        onChange={(e) => { handleChange('name', e.target.value); }}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Số điện thoại <span className="text-red-500">*</span></Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => { handleChange('phone', e.target.value); }}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email <span className="text-red-500">*</span></Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => { handleChange('email', e.target.value); }}
                      required
                    />
                  </div>

                  {showAddresses && (
                    <>
                      {/* TEXT FORMAT */}
                      {addressFormat === 'text' && (
                        <>
                          <div className="space-y-2">
                            <Label>Địa chỉ</Label>
                            <Input
                              value={formData.address}
                              onChange={(e) => { handleChange('address', e.target.value); }}
                              placeholder="Số nhà, tên đường..."
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Thành phố / Tỉnh</Label>
                              <Input
                                value={formData.city}
                                onChange={(e) => { handleChange('city', e.target.value); }}
                                placeholder="Nhập thành phố..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Trạng thái</Label>
                              <select
                                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                value={formData.status}
                                onChange={(e) => { handleChange('status', e.target.value); }}
                              >
                                <option value="Active">Hoạt động</option>
                                <option value="Inactive">Bị khóa</option>
                              </select>
                            </div>
                          </div>
                        </>
                      )}

                      {/* STRUCTURED FORMAT: 2-LEVEL OR 3-LEVEL */}
                      {addressFormat !== 'text' && (
                        <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Địa chỉ hành chính ({addressFormat})</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Tỉnh / Thành phố <span className="text-red-500">*</span></Label>
                              <AddressCombobox
                                options={provinceList}
                                value={formData.provinceCode}
                                onChange={handleProvinceChange}
                                placeholder="Chọn Tỉnh/Thành phố..."
                              />
                            </div>

                            {addressFormat === '3-level' && (
                              <div className="space-y-2">
                                <Label>Quận / Huyện <span className="text-red-500">*</span></Label>
                                <AddressCombobox
                                  options={availableDistricts}
                                  value={formData.districtCode}
                                  onChange={handleDistrictChange}
                                  placeholder="Chọn Quận/Huyện..."
                                  disabled={!formData.provinceCode}
                                />
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Phường / Xã <span className="text-red-500">*</span></Label>
                              <AddressCombobox
                                options={availableWards}
                                value={formData.wardCode}
                                onChange={handleWardChange}
                                placeholder="Chọn Phường/Xã..."
                                disabled={addressFormat === '3-level' ? !formData.districtCode : !formData.provinceCode}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Số nhà, tên đường <span className="text-red-500">*</span></Label>
                              <Input
                                value={formData.addressDetail}
                                onChange={(e) => { handleChange('addressDetail', e.target.value); }}
                                placeholder="Nhập số nhà, số ngõ, tên đường..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Trạng thái</Label>
                              <select
                                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                                value={formData.status}
                                onChange={(e) => { handleChange('status', e.target.value); }}
                              >
                                <option value="Active">Hoạt động</option>
                                <option value="Inactive">Bị khóa</option>
                              </select>
                            </div>
                          </div>

                          {/* Preview computed address */}
                          {(formData.provinceCode || formData.addressDetail) && (
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg text-xs text-slate-500 leading-relaxed border border-slate-100 dark:border-slate-800/80">
                              <span className="font-semibold block text-slate-700 dark:text-slate-300">Xem trước địa chỉ ghép:</span>
                              {[
                                formData.addressDetail.trim(),
                                formData.wardName,
                                addressFormat === '3-level' ? formData.districtName : null,
                                formData.provinceName
                              ].filter(Boolean).join(', ') || 'Chưa có thông tin'}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {!showAddresses && (
                    <div className="space-y-2">
                      <Label>Trạng thái</Label>
                      <select
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                        value={formData.status}
                        onChange={(e) => { handleChange('status', e.target.value); }}
                      >
                        <option value="Active">Hoạt động</option>
                        <option value="Inactive">Bị khóa</option>
                      </select>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => { router.push('/admin/customers'); }}>
                      Hủy
                    </Button>
                    <Button type="submit" variant="accent" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                      Lưu thay đổi
                    </Button>
                  </div>
                </CardContent>
              </form>
            </Card>
          )}

          {activeTab === 'orders' && (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã đơn</TableHead>
                    <TableHead>Ngày đặt</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Thanh toán</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersData?.slice((ordersPage - 1) * ORDERS_PER_PAGE, ordersPage * ORDERS_PER_PAGE).map(order => (
                    <TableRow key={order._id}>
                      <TableCell>
                        <Link href={`/admin/orders/${order._id}/edit`} className="font-medium text-blue-600 hover:underline">
                          {order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(order._creationTime).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          order.paymentStatus === 'Paid' ? 'success' :
                          order.paymentStatus === 'Failed' ? 'destructive' :
                          order.paymentStatus === 'Refunded' ? 'secondary' : 'warning'
                        }>
                          {order.paymentStatus === 'Paid' ? 'Đã thanh toán' :
                           order.paymentStatus === 'Failed' ? 'Thất bại' :
                           order.paymentStatus === 'Refunded' ? 'Hoàn tiền' : 'Chờ thanh toán'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === 'Delivered' ? 'success' :
                          order.status === 'Cancelled' ? 'destructive' :
                          order.status === 'Shipped' ? 'default' : 'warning'
                        }>
                          {order.status === 'Pending' ? 'Chờ xử lý' :
                           order.status === 'Processing' ? 'Đang xử lý' :
                           order.status === 'Shipped' ? 'Đang giao' :
                           order.status === 'Delivered' ? 'Hoàn thành' : 'Đã hủy'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!ordersData || ordersData.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        Chưa có đơn hàng nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {ordersData && ordersData.length > ORDERS_PER_PAGE && (
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Hiển thị {(ordersPage - 1) * ORDERS_PER_PAGE + 1} - {Math.min(ordersPage * ORDERS_PER_PAGE, ordersData.length)} / {ordersData.length} đơn hàng
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ordersPage === 1}
                      onClick={() => { setOrdersPage(p => p - 1); }}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Trang {ordersPage} / {Math.ceil(ordersData.length / ORDERS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ordersPage >= Math.ceil(ordersData.length / ORDERS_PER_PAGE)}
                      onClick={() => { setOrdersPage(p => p + 1); }}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
