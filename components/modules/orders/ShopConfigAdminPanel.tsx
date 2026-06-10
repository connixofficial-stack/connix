'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { CreditCard, ListChecks, MapPin, Truck, Eye, AlertTriangle } from 'lucide-react';
import type { ModuleConfigTabRenderProps } from '@/components/modules/ModuleConfigPage';
import { SettingsCard } from '@/components/modules/shared';
import { Input, cn } from '@/app/admin/components/ui';
import { AddressPreview } from './AddressPreview';
import { PaymentMethodsEditor, type PaymentMethodConfig } from './PaymentMethodsEditor';
import { ShippingMethodsEditor, type ShippingMethodConfig } from './ShippingMethodsEditor';
import { DEFAULT_ORDER_STATUS_PRESET, ORDER_STATUS_PRESETS, parseOrderStatuses, type OrderStatusConfig, type OrderStatusPreset } from '@/lib/orders/statuses';
import { VietQRPreview } from './VietQRPreview';
import { OrderStatusesEditor } from './OrderStatusesEditor';

type ConfigTabKey = 'overview' | 'shipping' | 'payment' | 'address' | 'statuses';

interface BankOption {
  code: string;
  shortName: string;
  name: string;
  logo: string;
}

const DEFAULT_SHIPPING_METHODS: ShippingMethodConfig[] = [
  { id: 'standard', label: 'Giao hàng tiêu chuẩn', description: '2-4 ngày', fee: 30000, estimate: '2-4 ngày' },
  { id: 'express', label: 'Giao hàng nhanh', description: 'Trong 24h', fee: 50000, estimate: 'Trong 24h' },
];

const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: 'cod', label: 'COD', description: 'Thanh toán khi nhận hàng', type: 'COD' },
  { id: 'bank', label: 'Chuyển khoản ngân hàng', description: 'Chuyển khoản trước khi giao', type: 'BankTransfer' },
  { id: 'vietqr', label: 'VietQR', description: 'Quét mã QR để thanh toán', type: 'VietQR' },
];

const parseJsonSetting = <T,>(value: string | number | boolean | undefined, fallback: T): T => {
  if (typeof value !== 'string' || !value) {
    return fallback;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export function ShopConfigAdminPanel({
  config: _config,
  moduleData: _moduleData,
  isReadOnly,
  localFeatures: _localFeatures,
  localFields: _localFields,
  localSettings,
  localCategoryFields: _localCategoryFields,
  colorClasses: _colorClasses,
  onToggleFeature: _onToggleFeature,
  onToggleField: _onToggleField,
  onToggleCategoryField: _onToggleCategoryField,
  onSettingChange,
}: ModuleConfigTabRenderProps) {
  const [activeTab, setActiveTab] = useState<ConfigTabKey>('overview');
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankQuery, setBankQuery] = useState('');
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [useCustomBank, setUseCustomBank] = useState(false);
  const [bankFetchError, setBankFetchError] = useState<string | null>(null);
  const [bankLoading, setBankLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setBankLoading(true);
    setBankFetchError(null);
    fetch('/data/vietnam-banks.json')
      .then((res) => {
        if (!res.ok) throw new Error('Không tải được danh sách ngân hàng.');
        return res.json();
      })
      .then((data: BankOption[]) => {
        if (mounted) {
          setBanks(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (mounted) {
          setBankFetchError(err instanceof Error ? err.message : 'Lỗi tải danh sách ngân hàng.');
          setBanks([]);
        }
      })
      .finally(() => {
        if (mounted) setBankLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const shippingMethods = useMemo(
    () => parseJsonSetting(localSettings.shippingMethods, DEFAULT_SHIPPING_METHODS),
    [localSettings.shippingMethods]
  );
  const paymentMethods = useMemo(
    () => parseJsonSetting(localSettings.paymentMethods, DEFAULT_PAYMENT_METHODS),
    [localSettings.paymentMethods]
  );
  const orderStatusPreset = String(localSettings.orderStatusPreset ?? DEFAULT_ORDER_STATUS_PRESET) as OrderStatusPreset;
  const orderStatuses = useMemo(
    () => parseOrderStatuses(localSettings.orderStatuses, orderStatusPreset),
    [localSettings.orderStatuses, orderStatusPreset]
  );
  const presetOptions: { value: OrderStatusPreset; label: string }[] = [
    { value: 'simple', label: 'Simple (3 trạng thái)' },
    { value: 'standard', label: 'Standard (5 trạng thái)' },
    { value: 'advanced', label: 'Advanced (8 trạng thái)' },
  ];

  const bankCode = String(localSettings.bankCode ?? '');
  const bankName = String(localSettings.bankName ?? '');
  const bankAccountNumber = String(localSettings.bankAccountNumber ?? '');
  const bankAccountName = String(localSettings.bankAccountName ?? '');
  const vietQrTemplate = String(localSettings.vietQrTemplate ?? 'compact');
  const addressFormat = String(localSettings.addressFormat ?? 'text');

  const selectedBank = useMemo(() => banks.find((bank) => bank.code === bankCode), [banks, bankCode]);
  const derivedCustomBank = useMemo(
    () => !selectedBank && Boolean(bankCode || bankName),
    [selectedBank, bankCode, bankName]
  );
  const isCustomBank = useCustomBank || derivedCustomBank;
  const filteredBanks = useMemo(() => {
    const keyword = bankQuery.trim().toLowerCase();
    if (!keyword) return banks;
    return banks.filter((bank) =>
      bank.code.toLowerCase().includes(keyword) ||
      bank.shortName.toLowerCase().includes(keyword) ||
      bank.name.toLowerCase().includes(keyword)
    );
  }, [banks, bankQuery]);

  const handleShippingChange = (next: ShippingMethodConfig[]) => {
    onSettingChange('shippingMethods', JSON.stringify(next, null, 2));
  };

  const handlePaymentChange = (next: PaymentMethodConfig[]) => {
    onSettingChange('paymentMethods', JSON.stringify(next, null, 2));
  };

  const handleStatusesChange = (next: OrderStatusConfig[]) => {
    onSettingChange('orderStatuses', JSON.stringify(next, null, 2));
  };

  const handlePresetChange = (nextPreset: OrderStatusPreset) => {
    onSettingChange('orderStatusPreset', nextPreset);
    onSettingChange('orderStatuses', JSON.stringify(ORDER_STATUS_PRESETS[nextPreset], null, 2));
  };

  const handleBankSelect = (bank: BankOption) => {
    setUseCustomBank(false);
    onSettingChange('bankCode', bank.code);
    onSettingChange('bankName', bank.shortName || bank.name);
    setBankDropdownOpen(false);
  };

  const handleCustomBank = () => {
    setUseCustomBank(true);
    setBankDropdownOpen(false);
  };

  const tabs: { key: ConfigTabKey; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { key: 'overview', label: 'Tổng quan', icon: Eye },
    { key: 'shipping', label: 'Vận chuyển', icon: Truck },
    { key: 'payment', label: 'Thanh toán', icon: CreditCard },
    { key: 'address', label: 'Địa chỉ', icon: MapPin },
    { key: 'statuses', label: 'Trạng thái đơn', icon: ListChecks },
  ];

  return (
    <div className="space-y-6">
      <div className={cn("flex flex-wrap gap-2 border-b border-slate-200 pb-2", isReadOnly && "pointer-events-none opacity-60")}>
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition-colors',
              activeTab === key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className={cn("space-y-4", isReadOnly && "pointer-events-none opacity-60")}>
        
        {/* TAB 1: TỔNG QUAN */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Vận chuyển</span>
                <Truck size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{shippingMethods.length}</p>
              <p className="text-xs text-slate-500">Phương thức cấu hình</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Thanh toán</span>
                <CreditCard size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{paymentMethods.length}</p>
              <p className="text-xs text-slate-500">Phương thức cấu hình</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Trạng thái đơn</span>
                <ListChecks size={16} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{orderStatuses.length}</p>
              <p className="text-xs text-slate-500">Preset: <span className="font-semibold capitalize text-emerald-600">{orderStatusPreset}</span></p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Địa chỉ giao hàng</span>
                <MapPin size={16} className="text-emerald-500" />
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {addressFormat === '3-level' ? '3 Cấp (Tỉnh/Huyện/Xã)' : addressFormat === '2-level' ? '2 Cấp (Tỉnh/Xã)' : 'Nhập tự do'}
              </p>
              <p className="text-xs text-slate-500">Cấu hình ở Checkout</p>
            </div>

            <div className="md:col-span-2 lg:col-span-4 p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">Hướng dẫn Cấu hình Cửa hàng</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Khu vực này cho phép bạn quản lý các thiết lập vận hành của shop bao gồm Phí vận chuyển, Các cổng thanh toán (chuyển khoản VietQR, COD), Định dạng form nhập địa chỉ tại trang thanh toán và Vòng đời các trạng thái đơn hàng trong Admin. Hãy di chuyển qua các tab để tùy biến sâu hơn.
              </p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Checkout tự áp dụng theo loại hàng: sản phẩm vật lý mới cần vận chuyển/COD; khóa học, dịch vụ và sản phẩm số sẽ bỏ vận chuyển và không cho chọn COD.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: VẬN CHUYỂN */}
        {activeTab === 'shipping' && (
          <SettingsCard title="Cấu hình Vận chuyển">
            <div className="space-y-3">
              <div className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
                <Truck size={16} className="shrink-0 mt-0.5" />
                <span>Phí vận chuyển chỉ áp dụng khi đơn có sản phẩm vật lý. Khóa học, dịch vụ và sản phẩm số không yêu cầu địa chỉ/phương thức giao hàng.</span>
              </div>
              <ShippingMethodsEditor methods={shippingMethods} onChange={handleShippingChange} />
            </div>
          </SettingsCard>
        )}

        {/* TAB 3: THANH TOÁN */}
        {activeTab === 'payment' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <SettingsCard title="Phương thức thanh toán">
                <div className="space-y-3">
                  <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>COD chỉ hợp lệ cho đơn chỉ gồm sản phẩm vật lý cần giao hàng. Nếu giỏ có khóa học, dịch vụ hoặc sản phẩm số, Checkout sẽ tự ẩn COD và yêu cầu phương thức thanh toán khác.</span>
                  </div>
                  <PaymentMethodsEditor methods={paymentMethods} onChange={handlePaymentChange} />
                </div>
              </SettingsCard>
            </div>
            
            <div className="lg:col-span-2">
              <SettingsCard title="Thông tin tài khoản nhận chuyển khoản">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-semibold block">Ngân hàng thụ hưởng</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setBankDropdownOpen((prev) => !prev)}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                      >
                        <span className="flex items-center gap-2 truncate">
                          {selectedBank?.logo && !isCustomBank && (
                            <Image src={selectedBank.logo} alt={selectedBank.shortName} width={20} height={20} unoptimized />
                          )}
                          {isCustomBank
                            ? (bankName || 'Nhập ngân hàng khác')
                            : (selectedBank ? `${selectedBank.shortName} - ${selectedBank.name}` : 'Chọn ngân hàng')}
                        </span>
                        <span className="text-xs text-slate-400">▼</span>
                      </button>

                      {bankDropdownOpen && (
                        <div className="absolute z-15 mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-950">
                          <Input
                            value={bankQuery}
                            onChange={(event) => setBankQuery(event.target.value)}
                            placeholder="Tìm ngân hàng..."
                            className="mb-2"
                          />
                          <div className="max-h-64 overflow-auto">
                            {bankLoading && <div className="p-2 text-xs text-slate-500 animate-pulse">Đang tải...</div>}
                            {bankFetchError && <div className="p-2 text-xs text-red-500">{bankFetchError}</div>}
                            {filteredBanks.map((bank) => (
                              <button
                                key={bank.code}
                                type="button"
                                onClick={() => handleBankSelect(bank)}
                                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                              >
                                {bank.logo && (
                                  <Image src={bank.logo} alt={bank.shortName} width={20} height={20} unoptimized />
                                )}
                                <span className="truncate">{bank.shortName} - {bank.name}</span>
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={handleCustomBank}
                              className="mt-2 w-full rounded-md border border-dashed border-slate-200 px-2 py-2 text-xs text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400"
                            >
                              + Nhập ngân hàng khác
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isCustomBank && (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Mã ngân hàng (VietQR)</label>
                        <Input
                          placeholder="Mã ngân hàng (ví dụ: VCB, TCB...)"
                          value={bankCode}
                          onChange={(event) => onSettingChange('bankCode', event.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Tên ngân hàng</label>
                        <Input
                          placeholder="Tên ngân hàng đầy đủ"
                          value={bankName}
                          onChange={(event) => onSettingChange('bankName', event.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Số tài khoản</label>
                      <Input
                        placeholder="Số tài khoản ngân hàng"
                        value={bankAccountNumber}
                        onChange={(event) => onSettingChange('bankAccountNumber', event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Tên chủ tài khoản</label>
                      <Input
                        placeholder="Tên chủ tài khoản (viết hoa không dấu)"
                        value={bankAccountName}
                        onChange={(event) => onSettingChange('bankAccountName', event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-semibold block">Mẫu VietQR</label>
                    <select
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                      value={vietQrTemplate}
                      onChange={(event) => onSettingChange('vietQrTemplate', event.target.value)}
                    >
                      <option value="compact">Mẫu gọn có logo (Compact)</option>
                      <option value="compact2">Mẫu gọn tối giản (Compact 2)</option>
                      <option value="qr_only">Chỉ hiển thị QR (QR Only)</option>
                      <option value="print">Bản in ấn đầy đủ (Print)</option>
                    </select>
                  </div>
                </div>
              </SettingsCard>
            </div>
            
            <div className="lg:col-span-1">
              <VietQRPreview
                bankCode={bankCode}
                bankAccountNumber={bankAccountNumber}
                bankAccountName={bankAccountName}
                template={vietQrTemplate}
              />
            </div>
          </div>
        )}

        {/* TAB 4: ĐỊA CHỈ */}
        {activeTab === 'address' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <SettingsCard title="Định dạng Địa chỉ">
              <div className="space-y-3">
                <label className="text-xs text-slate-500 font-semibold block">Định dạng form nhập địa chỉ</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                  value={addressFormat}
                  onChange={(event) => onSettingChange('addressFormat', event.target.value)}
                >
                  <option value="text">Nhập tự do (1 ô text nhập liệu thủ công)</option>
                  <option value="2-level">2 Cấp (Tỉnh / Phường Xã)</option>
                  <option value="3-level">3 Cấp (Tỉnh / Quận Huyện / Phường Xã)</option>
                </select>
                <p className="text-xs text-slate-400">Định dạng được chọn sẽ quyết định cách khách hàng nhập địa chỉ giao hàng tại trang Checkout.</p>
              </div>
            </SettingsCard>

            <div className="lg:col-span-2">
              <SettingsCard title="Xem trước Giao diện ở Checkout">
                <AddressPreview format={addressFormat} />
              </SettingsCard>
            </div>
          </div>
        )}

        {/* TAB 5: TRẠNG THÁI ĐƠN */}
        {activeTab === 'statuses' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <SettingsCard title="Cấu hình nhanh Preset">
                <div className="space-y-3">
                  <label className="text-xs text-slate-500 font-semibold block">Chọn Preset Trạng thái</label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
                    value={orderStatusPreset}
                    onChange={(event) => handlePresetChange(event.target.value as OrderStatusPreset)}
                  >
                    {presetOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex gap-2 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                    <span>Thay đổi preset sẽ tự động reset danh sách chi tiết bên phải về mặc định của preset đó. Hãy cân nhắc trước khi đổi.</span>
                  </div>
                </div>
              </SettingsCard>
            </div>
            
            <div className="lg:col-span-2">
              <SettingsCard title="Quy trình Vòng đời Đơn hàng">
                <OrderStatusesEditor statuses={orderStatuses} onChange={handleStatusesChange} />
              </SettingsCard>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
