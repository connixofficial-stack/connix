'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { Check, ChevronDown, CreditCard, MapPin, Package, Search, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { useBrandColors, useSiteSettings } from '@/components/site/hooks';
import { getCheckoutColors } from '@/components/site/checkout/colors';
import { useCheckoutConfig } from '@/lib/experiences';
import { useCustomerAuth } from '@/app/(site)/auth/context';
import type { Id } from '@/convex/_generated/dataModel';
import { useCart } from '@/lib/cart';

const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(value);
const itemTypeLabel = (itemType?: 'product' | 'service' | 'course' | 'resource') => {
  if (itemType === 'service') return 'Dịch vụ';
  if (itemType === 'course') return 'Khóa học';
  if (itemType === 'resource') return 'Tài nguyên';
  return 'Sản phẩm';
};

// ─── Combobox search cho Tỉnh/Quận/Phường ────────────────────────────────────
interface ComboboxOption { code: string; name: string; }
interface AddressComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (code: string) => void;
  placeholder: string;
  disabled?: boolean;
  hasError?: boolean;
  inputBg: string;
  inputBorder: string;
  inputText: string;
}

function AddressCombobox({ options, value, onChange, placeholder, disabled, hasError, inputBg, inputBorder, inputText }: AddressComboboxProps) {
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

  // Close on click outside
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

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'Enter' || e.key === ' ') handleOpen(); return; }
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && filtered[highlighted]) { handleSelect(filtered[highlighted].code); }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm transition-colors text-left ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-400'}`}
        style={{
          backgroundColor: inputBg,
          borderColor: hasError ? '#ef4444' : inputBorder,
          color: selected ? inputText : '#9ca3af',
        }}
      >
        <span className="truncate">{selected ? selected.name : placeholder}</span>
        <ChevronDown size={15} className={`shrink-0 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: '#9ca3af' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden"
          style={{ backgroundColor: inputBg, minWidth: '220px' }}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <Search size={13} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Tìm kiếm..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
              className="flex-1 text-sm outline-none bg-transparent"
              style={{ color: inputText }}
            />
            {query && (
              <button type="button" onClick={() => { setQuery(''); setHighlighted(0); inputRef.current?.focus(); }}
                className="text-xs text-slate-400 hover:text-slate-600 shrink-0">✕</button>
            )}
          </div>

          {/* Option list */}
          <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400 text-center">Không tìm thấy kết quả</li>
            ) : (
              filtered.map((opt, idx) => (
                <li
                  key={opt.code}
                  role="option"
                  aria-selected={opt.code === value}
                  onMouseEnter={() => setHighlighted(idx)}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(opt.code); }}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors ${
                    idx === highlighted ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  style={{ color: inputText }}
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
// ─────────────────────────────────────────────────────────────────────────────

type ShippingMethodConfig = {
  id: string;
  label: string;
  description?: string;
  fee: number;
  estimate?: string;
  /** Ngưỡng tổng đơn tối thiểu (đ) để miễn phí ship. 0 = không áp dụng */
  freeShipThreshold?: number;
};

type PaymentMethodConfig = {
  id: string;
  label: string;
  description?: string;
  type: 'COD' | 'BankTransfer' | 'VietQR' | 'CreditCard' | 'EWallet';
};

type CheckoutItemPolicy = {
  canUseCod: boolean;
  hasCourseItems: boolean;
  hasDigitalProductItems: boolean;
  hasResourceItems: boolean;
  hasServiceItems: boolean;
  hasShippableItems: boolean;
  isPending: boolean;
};

type AddressOption = {
  code: string;
  name: string;
  parentCode?: string;
};

type TwoLevelProvince = {
  code: number;
  name: string;
  wards: TwoLevelWard[];
};

type TwoLevelWard = {
  code: number;
  name: string;
};

type VariantOptionValue = {
  optionId: Id<'productOptions'>;
  valueId: Id<'productOptionValues'>;
  customValue?: string;
};

const DEFAULT_SHIPPING_METHODS: ShippingMethodConfig[] = [
  { id: 'standard', label: 'Giao hàng tiêu chuẩn', description: '2-4 ngày', fee: 30000, estimate: '2-4 ngày' },
  { id: 'express', label: 'Giao hàng nhanh', description: 'Trong 24h', fee: 50000, estimate: 'Trong 24h' },
];

const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  { id: 'cod', label: 'COD', description: 'Thanh toán khi nhận hàng', type: 'COD' },
  { id: 'bank', label: 'Chuyển khoản ngân hàng', description: 'Chuyển khoản trước khi giao', type: 'BankTransfer' },
  { id: 'vietqr', label: 'VietQR', description: 'Quét mã QR để thanh toán', type: 'VietQR' },
];

const buildCheckoutPolicy = (params: {
  directProductType?: string | null;
  fromCart: boolean;
  cartItems: Array<{
    itemType?: 'product' | 'service' | 'course' | 'resource';
    productId?: Id<'products'>;
  }>;
  cartProductTypeMap: Map<Id<'products'>, string>;
  cartProductsPending: boolean;
}): CheckoutItemPolicy => {
  if (!params.fromCart) {
    if (!params.directProductType) {
      return {
        canUseCod: false,
        hasCourseItems: false,
        hasDigitalProductItems: false,
        hasResourceItems: false,
        hasServiceItems: false,
        hasShippableItems: true,
        isPending: true,
      };
    }
    const isDigital = params.directProductType === 'digital';
    return {
      canUseCod: !isDigital,
      hasCourseItems: false,
      hasDigitalProductItems: isDigital,
      hasResourceItems: false,
      hasServiceItems: false,
      hasShippableItems: !isDigital,
      isPending: false,
    };
  }

  const productItems = params.cartItems.filter((item) => (item.itemType ?? 'product') === 'product' && item.productId);
  const hasCourseItems = params.cartItems.some((item) => item.itemType === 'course');
  const hasResourceItems = params.cartItems.some((item) => item.itemType === 'resource');
  const hasServiceItems = params.cartItems.some((item) => item.itemType === 'service');
  const hasDigitalProductItems = productItems.some((item) => params.cartProductTypeMap.get(item.productId!) === 'digital');
  const hasPhysicalProductItems = productItems.some((item) => (params.cartProductTypeMap.get(item.productId!) ?? 'physical') !== 'digital');
  const hasShippableItems = params.cartProductsPending || hasPhysicalProductItems;

  return {
    canUseCod: !params.cartProductsPending && hasShippableItems && !hasCourseItems && !hasResourceItems && !hasServiceItems && !hasDigitalProductItems,
    hasCourseItems,
    hasDigitalProductItems,
    hasResourceItems,
    hasServiceItems,
    hasShippableItems,
    isPending: params.cartProductsPending,
  };
};

const parseJsonSetting = <T,>(value: unknown, fallback: T): T => {
  if (!value) {
    return fallback;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof value === 'object') {
    return value as T;
  }
  return fallback;
};

const getStringSetting = (value: unknown, fallback: string) => {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return fallback;
};

const buildVariantLabel = (
  optionValues: VariantOptionValue[],
  optionMap: Map<Id<'productOptions'>, { name: string }>,
  valueMap: Map<Id<'productOptionValues'>, { label?: string; value?: string }>
): string | null => {
  const parts = optionValues
    .map((optionValue) => {
      const optionName = optionMap.get(optionValue.optionId)?.name;
      const value = valueMap.get(optionValue.valueId);
      const valueLabel = optionValue.customValue ?? value?.label ?? value?.value;
      if (!valueLabel) {
        return null;
      }
      return optionName ? `${optionName}: ${valueLabel}` : valueLabel;
    })
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(' • ') : null;
};

function CheckoutSkeleton() {
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const tokens = useMemo(
    () => getCheckoutColors(brandColors.primary, brandColors.secondary, brandColors.mode, isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );
  return (
    <div className="max-w-5xl mx-auto px-4 py-16 text-center">
      <div className="h-6 w-48 rounded-lg animate-pulse mx-auto" style={{ backgroundColor: tokens.surfaceSoft }} />
      <div className="h-4 w-64 rounded-lg animate-pulse mt-3 mx-auto" style={{ backgroundColor: tokens.surfaceSoft }} />
    </div>
  );
}

function CheckoutContent() {
  const brandColors = useBrandColors();
  const { isDark } = useSiteSettings();
  const tokens = useMemo(
    () => getCheckoutColors(brandColors.primary, brandColors.secondary, brandColors.mode, isDark),
    [brandColors.primary, brandColors.secondary, brandColors.mode, isDark]
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customer } = useCustomerAuth();
  const checkoutConfig = useCheckoutConfig();
  const ordersModule = useQuery(api.admin.modules.getModuleByKey, { key: 'orders' });
  const promotionsModule = useQuery(api.admin.modules.getModuleByKey, { key: 'promotions' });
  const ordersSettings = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'orders' });
  const paymentFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enablePayment', moduleKey: 'orders' });
  const shippingFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableShipping', moduleKey: 'orders' });
  const placeOrderMutation = useMutation(api.orders.placeOrder);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [shippingMethodId, setShippingMethodId] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [activeWizardStep, setActiveWizardStep] = useState(0);
  const [errors, setErrors] = useState<{
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    shippingAddress?: string;
    provinceCode?: string;
    districtCode?: string;
    wardCode?: string;
    addressDetail?: string;
  }>({});
  const [twoLevelData, setTwoLevelData] = useState<TwoLevelProvince[]>([]);
  const [provinceList, setProvinceList] = useState<AddressOption[]>([]);
  const [districtList, setDistrictList] = useState<AddressOption[]>([]);
  const [wardList, setWardList] = useState<AddressOption[]>([]);

  const fromCart = searchParams.get('fromCart') === 'true';

  const { productId, quantity, variantId } = useMemo(() => {
    const rawId = searchParams.get('productId');
    const rawQuantity = Number(searchParams.get('quantity'));
    const rawVariantId = searchParams.get('variantId');
    return {
      productId: rawId as Id<'products'> | null,
      quantity: Number.isFinite(rawQuantity) && rawQuantity > 0 ? Math.min(rawQuantity, 99) : 1,
      variantId: rawVariantId as Id<'productVariants'> | null,
    };
  }, [searchParams]);

  const settingsMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    (ordersSettings ?? []).forEach((setting) => {
      map[setting.settingKey] = setting.value;
    });
    return map;
  }, [ordersSettings]);

  const rawAddressFormat = typeof settingsMap.addressFormat === 'string' ? settingsMap.addressFormat : 'text';
  const addressFormat = rawAddressFormat === '2-level' || rawAddressFormat === '3-level' ? rawAddressFormat : 'text';
  const shippingMethods = useMemo(() => {
    const parsed = parseJsonSetting<ShippingMethodConfig[]>(settingsMap.shippingMethods, DEFAULT_SHIPPING_METHODS);
    return Array.isArray(parsed) ? parsed : DEFAULT_SHIPPING_METHODS;
  }, [settingsMap.shippingMethods]);
  const paymentMethods = useMemo(() => {
    const parsed = parseJsonSetting<PaymentMethodConfig[]>(settingsMap.paymentMethods, DEFAULT_PAYMENT_METHODS);
    return Array.isArray(parsed) ? parsed : DEFAULT_PAYMENT_METHODS;
  }, [settingsMap.paymentMethods]);
  const _bankInfo = useMemo(() => ({
    bankName: getStringSetting(settingsMap.bankName, 'Vietcombank'),
    bankCode: getStringSetting(settingsMap.bankCode, 'VCB'),
    accountName: getStringSetting(settingsMap.bankAccountName, 'CÔNG TY VIETADMIN'),
    accountNumber: getStringSetting(settingsMap.bankAccountNumber, '0123456789'),
    vietQrTemplate: getStringSetting(settingsMap.vietQrTemplate, 'compact'),
  }), [settingsMap.bankAccountName, settingsMap.bankAccountNumber, settingsMap.bankCode, settingsMap.bankName, settingsMap.vietQrTemplate]);

  const isShippingEnabled = checkoutConfig.showShippingOptions && (shippingFeature?.enabled ?? true);
  const isPaymentEnabled = checkoutConfig.showPaymentMethods && (paymentFeature?.enabled ?? true);
  const isPromotionEnabled = promotionsModule?.enabled ?? true;

  useEffect(() => {
    setProvinceCode('');
    setDistrictCode('');
    setWardCode('');
    setAddressDetail('');
  }, [addressFormat]);

  useEffect(() => {
    if (addressFormat === 'text') {
      return;
    }

    let cancelled = false;
    const loadAddressData = async () => {
      try {
        if (addressFormat === '2-level') {
          const response = await fetch('/data/address-2-level.json');
          const data = await response.json() as TwoLevelProvince[];
          if (cancelled) return;
          setTwoLevelData(data);
          setProvinceList(data.map((province) => ({ code: String(province.code), name: province.name })));
          setDistrictList([]);
          setWardList([]);
        } else {
          const [provincesRes, districtsRes, wardsRes] = await Promise.all([
            fetch('/data/address-provinces.json'),
            fetch('/data/address-districts.json'),
            fetch('/data/address-wards.json'),
          ]);

          const provinces = await provincesRes.json() as { id: string; name: string }[];
          const districtsRaw = await districtsRes.json() as Record<string, { code: string; name_with_type?: string; name: string; parent_code: string }>;
          const wardsRaw = await wardsRes.json() as Record<string, { code: string; name_with_type?: string; name: string; parent_code: string }>;

          if (cancelled) return;
          setProvinceList(provinces.map((province) => ({ code: province.id.padStart(2, '0'), name: province.name })));
          setDistrictList(Object.values(districtsRaw).map((district) => ({
            code: district.code,
            name: district.name_with_type ?? district.name,
            parentCode: district.parent_code,
          })));
          setWardList(Object.values(wardsRaw).map((ward) => ({
            code: ward.code,
            name: ward.name_with_type ?? ward.name,
            parentCode: ward.parent_code,
          })));
          setTwoLevelData([]);
        }
      } catch (error) {
        console.error(error);
        toast.error('Không thể tải dữ liệu địa chỉ.');
      }
    };

    void loadAddressData();
    return () => {
      cancelled = true;
    };
  }, [addressFormat]);

  const product = useQuery(api.products.getById, productId ? { id: productId } : 'skip');
  const variants = useQuery(
    api.productVariants.listByIds,
    variantId ? { ids: [variantId] } : 'skip'
  );
  const { cart: currentCart, items: currentCartItems, isLoading: isCartCtxLoading } = useCart();
  const cart = fromCart ? currentCart : null;
  const cartItems = fromCart ? currentCartItems : null;
  const cartProductIds = useMemo(() => {
    if (!fromCart || !cartItems) {
      return [] as Id<'products'>[];
    }
    return Array.from(new Set(cartItems.map((item) => item.productId).filter((id): id is Id<'products'> => Boolean(id))));
  }, [cartItems, fromCart]);
  const cartProducts = useQuery(
    api.products.listByIds,
    cartProductIds.length > 0 ? { ids: cartProductIds } : 'skip'
  );

  const cartProductTypeMap = useMemo(() => {
    return new Map(cartProducts?.map((product) => [product._id, product.productType ?? 'physical']) ?? []);
  }, [cartProducts]);

  const cartProductsPending = fromCart && cartProductIds.length > 0 && cartProducts === undefined;
  const checkoutItemPolicy = useMemo(() => buildCheckoutPolicy({
    cartItems: cartItems ?? [],
    cartProductsPending,
    cartProductTypeMap,
    directProductType: product?.productType ?? (product ? 'physical' : null),
    fromCart,
  }), [cartItems, cartProductTypeMap, cartProductsPending, fromCart, product]);
  const availablePaymentMethods = useMemo(() => (
    checkoutItemPolicy.canUseCod
      ? paymentMethods
      : paymentMethods.filter((method) => method.type !== 'COD')
  ), [checkoutItemPolicy.canUseCod, paymentMethods]);
  const hiddenCodByPolicy = paymentMethods.some((method) => method.type === 'COD') && !checkoutItemPolicy.canUseCod;

  const shouldCollectShipping = isShippingEnabled && checkoutItemPolicy.hasShippableItems;

  useEffect(() => {
    if (!isPaymentEnabled) {
      setPaymentMethodId('');
      return;
    }
    if (!availablePaymentMethods.find((method) => method.id === paymentMethodId)) {
      setPaymentMethodId(availablePaymentMethods[0]?.id ?? '');
    }
  }, [availablePaymentMethods, isPaymentEnabled, paymentMethodId]);

  // Tính effectiveFee cho từng phương thức vận chuyển (sau áp dụng freeShipThreshold)
  // Dùng totalAmount được khai báo phía dưới nhưng đây chỉ là hàm pure âm thầm ref
  const getEffectiveFee = (method: { fee: number; freeShipThreshold?: number }, amount: number) => {
    const threshold = method.freeShipThreshold ?? 0;
    return threshold > 0 && amount >= threshold ? 0 : method.fee;
  };

  useEffect(() => {
    if (!shouldCollectShipping) {
      setShippingMethodId('');
      return;
    }
    // Lấy totalAmount tại đây dựa trên cart hoặc product đƣn lẻ
    const currentTotal = fromCart ? (cart?.totalAmount ?? 0) : ((variants?.[0]?.price ?? product?.price ?? 0) * quantity);
    if (shippingMethods.length === 0) return;

    // Tìm method có effectiveFee thấp nhất
    const best = shippingMethods.reduce((prev, curr) => {
      const prevFee = getEffectiveFee(prev, currentTotal);
      const currFee = getEffectiveFee(curr, currentTotal);
      return currFee < prevFee ? curr : prev;
    });

    // Nếu method hiện tại không tồn tại hoặc không phải best nữa → auto switch
    const current = shippingMethods.find((m) => m.id === shippingMethodId);
    const currentFee = current ? getEffectiveFee(current, currentTotal) : Infinity;
    const bestFee = getEffectiveFee(best, currentTotal);
    if (!current || bestFee < currentFee) {
      setShippingMethodId(best.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingMethods, shouldCollectShipping, cart?.totalAmount, quantity, product?.price]);

  const selectedVariant = variants?.[0] ?? null;
  const optionIds = useMemo(() => {
    if (!selectedVariant) {
      return [] as Id<'productOptions'>[];
    }
    return Array.from(new Set(selectedVariant.optionValues.map((optionValue) => optionValue.optionId)));
  }, [selectedVariant]);

  const valueIds = useMemo(() => {
    if (!selectedVariant) {
      return [] as Id<'productOptionValues'>[];
    }
    return Array.from(new Set(selectedVariant.optionValues.map((optionValue) => optionValue.valueId)));
  }, [selectedVariant]);

  const variantOptions = useQuery(
    api.productOptions.listByIds,
    optionIds.length > 0 ? { ids: optionIds } : 'skip'
  );

  const variantValues = useQuery(
    api.productOptionValues.listByIds,
    valueIds.length > 0 ? { ids: valueIds } : 'skip'
  );

  const variantTitle = useMemo(() => {
    if (!selectedVariant) {
      return null;
    }
    const optionMap = new Map(variantOptions?.map((option) => [option._id, option]) ?? []);
    const valueMap = new Map(variantValues?.map((value) => [value._id, value]) ?? []);
    return buildVariantLabel(selectedVariant.optionValues, optionMap, valueMap);
  }, [selectedVariant, variantOptions, variantValues]);

  const cartVariantIds = useMemo(() => {
    if (!cartItems) {
      return [] as Id<'productVariants'>[];
    }
    const ids = cartItems.map((item) => item.variantId).filter((id): id is Id<'productVariants'> => Boolean(id));
    return Array.from(new Set(ids));
  }, [cartItems]);

  const cartVariants = useQuery(
    api.productVariants.listByIds,
    cartVariantIds.length > 0 ? { ids: cartVariantIds } : 'skip'
  );

  const cartOptionIds = useMemo(() => {
    if (!cartVariants) {
      return [] as Id<'productOptions'>[];
    }
    return Array.from(new Set(cartVariants.flatMap((variant) => variant.optionValues.map((optionValue) => optionValue.optionId))));
  }, [cartVariants]);

  const cartValueIds = useMemo(() => {
    if (!cartVariants) {
      return [] as Id<'productOptionValues'>[];
    }
    return Array.from(new Set(cartVariants.flatMap((variant) => variant.optionValues.map((optionValue) => optionValue.valueId))));
  }, [cartVariants]);

  const cartOptions = useQuery(
    api.productOptions.listByIds,
    cartOptionIds.length > 0 ? { ids: cartOptionIds } : 'skip'
  );

  const cartValues = useQuery(
    api.productOptionValues.listByIds,
    cartValueIds.length > 0 ? { ids: cartValueIds } : 'skip'
  );

  const cartVariantTitleMap = useMemo(() => {
    if (!cartVariants) {
      return new Map<Id<'productVariants'>, string>();
    }
    const optionMap = new Map(cartOptions?.map((option) => [option._id, option]) ?? []);
    const valueMap = new Map(cartValues?.map((value) => [value._id, value]) ?? []);
    return new Map(cartVariants.map((variant) => [
      variant._id,
      buildVariantLabel(variant.optionValues, optionMap, valueMap) ?? '',
    ]));
  }, [cartOptions, cartValues, cartVariants]);

  const basePrice = selectedVariant?.price ?? product?.price ?? 0;
  const unitPrice = basePrice;
  const subtotal = unitPrice * quantity;
  const selectedShipping = shippingMethods.find((method) => method.id === shippingMethodId);
  const selectedPayment = availablePaymentMethods.find((method) => method.id === paymentMethodId);
  const totalAmount = fromCart ? (cart?.totalAmount ?? 0) : subtotal;
  const shippingFee = shouldCollectShipping ? getEffectiveFee(selectedShipping ?? { fee: 0 }, totalAmount) : 0;
  const promotionResult = useQuery(
    api.promotions.validateCode,
    appliedCode && isPromotionEnabled ? { code: appliedCode, orderAmount: totalAmount } : 'skip'
  );
  const isCartLoading = fromCart && isCartCtxLoading;

  const appliedPromotion = promotionResult?.valid ? promotionResult : null;
  const discountAmount = appliedPromotion?.discountAmount ?? 0;
  const totalAfterDiscount = Math.max(0, totalAmount - discountAmount);
  const finalTotal = totalAfterDiscount + shippingFee;

  const orderItems = useMemo(() => {
    if (fromCart) {
      return (cartItems ?? []).map((item) => ({
        itemType: item.itemType ?? 'product',
        productId: item.productId,
        serviceId: item.serviceId,
        courseId: item.courseId,
        resourceId: item.resourceId,
        productName: item.productName,
        price: item.price,
        quantity: item.itemType === 'course' || item.itemType === 'resource' ? 1 : item.quantity,
        variantId: item.variantId,
        variantTitle: item.variantId ? cartVariantTitleMap.get(item.variantId) || undefined : undefined,
      }));
    }

    if (!product) {
      return [];
    }

    return [{
      itemType: 'product' as const,
      productId: product._id,
      productName: product.name,
      price: unitPrice,
      quantity,
      variantId: variantId ?? undefined,
      variantTitle: variantTitle ?? undefined,
    }];
  }, [cartItems, cartVariantTitleMap, fromCart, product, quantity, unitPrice, variantId, variantTitle]);

  const summaryItems = useMemo(() => {
    if (fromCart) {
      return (cartItems ?? []).map((item) => ({
        id: item._id,
        type: itemTypeLabel(item.itemType),
        name: item.productName,
        quantity: item.itemType === 'course' || item.itemType === 'resource' ? 1 : item.quantity,
        price: item.price,
        image: item.productImage ?? undefined,
        variantTitle: item.variantId ? cartVariantTitleMap.get(item.variantId) || undefined : undefined,
      }));
    }

    return product
      ? [{
          id: product._id,
          type: 'Sản phẩm',
          name: product.name,
          quantity,
          price: unitPrice,
          image: product.image ?? undefined,
          variantTitle: variantTitle ?? undefined,
        }]
      : [];
  }, [cartItems, cartVariantTitleMap, fromCart, product, quantity, unitPrice, variantTitle]);

  const selectedProvince = useMemo(() => {
    return provinceList.find((province) => province.code === provinceCode) ?? null;
  }, [provinceList, provinceCode]);
  const selectedTwoLevelProvince = useMemo(() => {
    if (addressFormat !== '2-level') {
      return null;
    }
    return twoLevelData.find((province) => String(province.code) === provinceCode) ?? null;
  }, [addressFormat, provinceCode, twoLevelData]);

  const availableDistricts = useMemo(() => {
    if (addressFormat !== '3-level') {
      return [] as AddressOption[];
    }
    return districtList.filter((district) => district.parentCode === provinceCode);
  }, [addressFormat, districtList, provinceCode]);

  const availableWards = useMemo<AddressOption[]>(() => {
    if (addressFormat === '2-level') {
      return selectedTwoLevelProvince?.wards.map((ward) => ({ code: String(ward.code), name: ward.name })) ?? [];
    }
    if (addressFormat === '3-level') {
      return wardList.filter((ward) => ward.parentCode === districtCode);
    }
    return [] as AddressOption[];
  }, [addressFormat, districtCode, selectedTwoLevelProvince, wardList]);

  const selectedDistrict = useMemo(() => {
    if (addressFormat !== '3-level') {
      return null;
    }
    return availableDistricts.find((district) => district.code === districtCode) ?? null;
  }, [addressFormat, availableDistricts, districtCode]);

  const selectedWard = useMemo(() => {
    return availableWards.find((ward) => ward.code === wardCode) ?? null;
  }, [availableWards, wardCode]);

  const selectedProvinceName = useMemo(() => {
    if (addressFormat === '2-level') {
      return selectedTwoLevelProvince?.name;
    }
    return selectedProvince?.name;
  }, [addressFormat, selectedProvince, selectedTwoLevelProvince]);

  const resolvedAddress = useMemo(() => {
    if (addressFormat === 'text') {
      return shippingAddress.trim();
    }
    const parts = [
      addressDetail.trim(),
      selectedWard?.name,
      selectedDistrict?.name,
      selectedProvinceName,
    ].filter((part): part is string => Boolean(part));

    return parts.join(', ');
  }, [addressDetail, addressFormat, selectedDistrict, selectedProvinceName, selectedWard, shippingAddress]);

  const isAddressValid = shouldCollectShipping
    ? (addressFormat === 'text'
      ? Boolean(shippingAddress.trim())
      : Boolean(addressDetail.trim() && selectedProvinceName && selectedWard && (addressFormat === '2-level' || selectedDistrict)))
    : true;

  const wizardStepCount = 1 + (shouldCollectShipping ? 1 : 0) + (isPaymentEnabled ? 1 : 0);

  useEffect(() => {
    if (customer && !customerName) {
      setCustomerName(customer.name ?? '');
    }
    if (customer && !customerPhone) {
      setCustomerPhone(customer.phone ?? '');
    }
    if (customer && !customerEmail) {
      setCustomerEmail(customer.email ?? '');
    }
  }, [customer, customerEmail, customerName, customerPhone]);

  useEffect(() => {
    if (activeWizardStep >= wizardStepCount) {
      setActiveWizardStep(0);
    }
  }, [activeWizardStep, wizardStepCount]);

  const handleApplyCoupon = () => {
    const normalized = couponInput.trim().toUpperCase();
    if (!normalized) {
      toast.error('Vui lòng nhập mã khuyến mãi.');
      return;
    }
    setAppliedCode(normalized);
  };

  const handleRemoveCoupon = () => {
    setAppliedCode(null);
    setCouponInput('');
  };

  const handlePlaceOrder = async () => {
    const newErrors: typeof errors = {};
    if (!customerName.trim()) {
      newErrors.customerName = 'Vui lòng nhập họ tên.';
    }
    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'Vui lòng nhập số điện thoại.';
    }
    const emailTrimmed = customerEmail.trim();
    if (!emailTrimmed) {
      newErrors.customerEmail = 'Vui lòng nhập email.';
    } else if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      newErrors.customerEmail = 'Vui lòng nhập email hợp lệ.';
    }

    if (shouldCollectShipping) {
      if (addressFormat === 'text') {
        if (!shippingAddress.trim()) {
          newErrors.shippingAddress = 'Vui lòng nhập địa chỉ giao hàng.';
        }
      } else {
        if (!provinceCode) {
          newErrors.provinceCode = 'Vui lòng chọn Tỉnh/Thành.';
        }
        if (addressFormat === '3-level' && !districtCode) {
          newErrors.districtCode = 'Vui lòng chọn Quận/Huyện.';
        }
        if (!wardCode) {
          newErrors.wardCode = 'Vui lòng chọn Phường/Xã.';
        }
        if (!addressDetail.trim()) {
          newErrors.addressDetail = 'Vui lòng nhập số nhà, tên đường.';
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Vui lòng kiểm tra lại các thông tin còn thiếu.');
      return;
    }

    if (orderItems.length === 0) {
      toast.error('Không có sản phẩm để đặt hàng.');
      return;
    }
    if (checkoutItemPolicy.isPending) {
      toast.error('Đang kiểm tra loại hàng trong giỏ, vui lòng thử lại sau giây lát.');
      return;
    }
    if (shouldCollectShipping && !selectedShipping) {
      toast.error('Vui lòng chọn phương thức vận chuyển.');
      return;
    }
    if (isPaymentEnabled && !selectedPayment) {
      toast.error('Không có phương thức thanh toán phù hợp cho giỏ hàng này. Vui lòng chọn/chỉnh cấu hình chuyển khoản hoặc VietQR.');
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentMethod = isPaymentEnabled
        ? selectedPayment?.type
        : checkoutItemPolicy.canUseCod ? 'COD' : 'BankTransfer';
      const result = await placeOrderMutation({
        customer: { name: customerName.trim(), email: emailTrimmed, phone: customerPhone.trim() },
        items: orderItems,
        note: fromCart ? (cart?.note ?? undefined) : undefined,
        paymentMethod,
        promotionId: appliedPromotion?.promotion?._id,
        promotionCode: appliedPromotion?.promotion?.code,
        discountAmount,
        shippingMethodId: shouldCollectShipping ? selectedShipping?.id : undefined,
        shippingMethodLabel: shouldCollectShipping ? selectedShipping?.label : undefined,
        shippingAddress: shouldCollectShipping
          ? `${customerName.trim()} | ${customerPhone.trim()} | ${resolvedAddress}`
          : `${customerName.trim()} | ${customerPhone.trim()}`,
        shippingFee: shouldCollectShipping ? shippingFee : 0,
        cartId: fromCart && cart?._id ? cart._id : undefined,
        customerId: customer?.id ? (customer.id as Id<'customers'>) : undefined,
        customerAddress: shouldCollectShipping ? {
          format: addressFormat,
          detail: addressDetail.trim(),
          provinceCode: provinceCode || undefined,
          provinceName: selectedProvinceName || undefined,
          districtCode: districtCode || undefined,
          districtName: selectedDistrict?.name || undefined,
          wardCode: wardCode || undefined,
          wardName: selectedWard?.name || undefined,
        } : undefined,
      });
      if (!result.ok) {
        toast.error('Không thể tạo đơn hàng.');
        return;
      }
      setOrderId(result.orderId ?? result.orderNumber ?? 'created');
      toast.success('Đặt hàng thành công! Đang chuyển hướng...');
      router.replace(`/checkout/thank-you?orderId=${result.orderId ?? ''}&orderNumber=${result.orderNumber ?? ''}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể tạo đơn hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⚠️ Hooks phải khai báo TRƯỚC các early return để tuân thủ Rules of Hooks
  const isStepInfoCompleted = Boolean(
    customerName.trim() &&
    customerPhone.trim() &&
    customerEmail.trim().includes('@') &&
    customerEmail.trim().includes('.') &&
    isAddressValid
  );
  const isStepShippingCompleted = !shouldCollectShipping || Boolean(shippingMethodId);
  const isStepPaymentCompleted = !isPaymentEnabled || Boolean(selectedPayment);
  const stepsState = useMemo(() => {
    return [
      { label: 'Thông tin', icon: MapPin, isCompleted: isStepInfoCompleted, isActive: true },
      ...(shouldCollectShipping ? [{ label: 'Vận chuyển', icon: Truck, isCompleted: isStepShippingCompleted, isActive: isStepInfoCompleted }] : []),
      ...(isPaymentEnabled ? [{ label: 'Thanh toán', icon: CreditCard, isCompleted: isStepPaymentCompleted, isActive: isStepInfoCompleted && isStepShippingCompleted }] : []),
    ];
  }, [isPaymentEnabled, isStepInfoCompleted, isStepPaymentCompleted, isStepShippingCompleted, shouldCollectShipping]);

  if (ordersModule && !ordersModule.enabled) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.emptyStateIconBg }}
        >
          <Package size={32} style={{ color: tokens.emptyStateIcon }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>Thanh toán đang tắt</h1>
        <p style={{ color: tokens.metaText }}>Hãy bật module Đơn hàng để sử dụng tính năng này.</p>
      </div>
    );
  }



  if (!fromCart && !productId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.emptyStateIconBg }}
        >
          <Package size={32} style={{ color: tokens.emptyStateIcon }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>Chưa chọn sản phẩm</h1>
        <p className="mb-6" style={{ color: tokens.metaText }}>Vui lòng chọn sản phẩm trước khi thanh toán.</p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium"
          style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  if (!fromCart && product === undefined) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="h-6 w-48 rounded-lg animate-pulse mx-auto" style={{ backgroundColor: tokens.surfaceSoft }} />
        <div className="h-4 w-64 rounded-lg animate-pulse mt-3 mx-auto" style={{ backgroundColor: tokens.surfaceSoft }} />
      </div>
    );
  }

  if (!fromCart && !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.emptyStateIconBg }}
        >
          <Package size={32} style={{ color: tokens.emptyStateIcon }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>Sản phẩm không tồn tại</h1>
        <p className="mb-6" style={{ color: tokens.metaText }}>Sản phẩm đã bị xoá hoặc không còn khả dụng.</p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium"
          style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
        >
          Quay lại shop
        </Link>
      </div>
    );
  }

  if (fromCart && isCartLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="h-6 w-48 rounded-lg animate-pulse mx-auto" style={{ backgroundColor: tokens.surfaceSoft }} />
        <div className="h-4 w-64 rounded-lg animate-pulse mt-3 mx-auto" style={{ backgroundColor: tokens.surfaceSoft }} />
      </div>
    );
  }

  if (orderId) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="h-6 w-56 rounded-lg animate-pulse mx-auto" style={{ backgroundColor: tokens.surfaceSoft }} />
        <div className="h-4 w-72 rounded-lg animate-pulse mt-3 mx-auto" style={{ backgroundColor: tokens.surfaceSoft }} />
      </div>
    );
  }

  if (fromCart && (!cart || !cartItems || cartItems.length === 0)) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: tokens.emptyStateIconBg }}
        >
          <Package size={32} style={{ color: tokens.emptyStateIcon }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: tokens.heading }}>Giỏ hàng trống</h1>
        <p className="mb-6" style={{ color: tokens.metaText }}>Hãy thêm sản phẩm trước khi thanh toán.</p>
        <Link
          href="/products"
          className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium"
          style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
        >
          Xem sản phẩm
        </Link>
      </div>
    );
  }

  const noShippingNotice = checkoutItemPolicy.hasCourseItems
    ? 'Khóa học sẽ được xử lý theo tài khoản/email sau khi thanh toán, không cần giao hàng.'
    : checkoutItemPolicy.hasResourceItems
      ? 'Tài nguyên sẽ được mở quyền tải trong tài khoản sau khi thanh toán, không cần giao hàng.'
      : checkoutItemPolicy.hasServiceItems
      ? 'Đơn dịch vụ chỉ cần thông tin liên hệ để tư vấn/xác nhận lịch, không cần giao hàng.'
      : checkoutItemPolicy.hasDigitalProductItems
        ? 'Sản phẩm số sẽ được gửi qua email/tài khoản sau khi thanh toán, không cần giao hàng.'
        : 'Đơn hàng này không cần giao hàng.';
  const codPolicyNotice = hiddenCodByPolicy
    ? 'COD chỉ áp dụng khi toàn bộ đơn là sản phẩm vật lý cần giao hàng. Đơn có khóa học, tài nguyên, dịch vụ hoặc sản phẩm số cần thanh toán chuyển khoản/VietQR/thẻ/ví.'
    : null;
  const isPaymentBlocked = isPaymentEnabled && availablePaymentMethods.length === 0;

  const StepIndicator = (
    <div className="flex items-center justify-between mb-6">
      {stepsState.map((step, index, arr) => (
        <React.Fragment key={step.label}>
          <div className="flex flex-col items-center">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
              style={step.isCompleted
                ? { backgroundColor: tokens.stepActiveBg, color: tokens.stepActiveText }
                : step.isActive
                ? { backgroundColor: tokens.stepActiveBg, color: tokens.stepActiveText }
                : { backgroundColor: tokens.stepInactiveBg, color: tokens.stepInactiveText }
              }
            >
              {step.isCompleted ? <Check size={18} /> : <step.icon size={18} />}
            </div>
            <span
              className="text-xs mt-1 transition-colors duration-300"
              style={step.isActive ? { color: tokens.primary, fontWeight: 600 } : { color: tokens.mutedText }}
            >
              {step.label}
            </span>
          </div>
          {index < arr.length - 1 && (
            <div
              className="flex-1 h-0.5 mx-2 transition-all duration-500"
              style={{ backgroundColor: step.isCompleted ? tokens.stepLineActive : tokens.stepLineInactive }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const shippingInfoCard = (
    <div
      className="rounded-2xl border p-5 space-y-4"
      style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
    >
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5" style={{ color: tokens.primary }} />
        <h2 className="text-lg font-semibold" style={{ color: tokens.heading }}>
          {shouldCollectShipping ? 'Thông tin giao hàng' : 'Thông tin liên hệ'}
        </h2>
      </div>
      <div className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block" style={{ color: tokens.bodyText }}>
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Họ tên"
              aria-invalid={!!errors.customerName}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors ${errors.customerName ? 'border-red-500 focus:ring-red-500' : ''}`}
              style={{ backgroundColor: tokens.inputBg, borderColor: errors.customerName ? '#ef4444' : tokens.inputBorder, color: tokens.inputText }}
              value={customerName}
              onChange={(event) => {
                setCustomerName(event.target.value);
                setErrors((prev) => ({ ...prev, customerName: undefined }));
              }}
            />
            {errors.customerName && (
              <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block" style={{ color: tokens.bodyText }}>
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Số điện thoại"
              aria-invalid={!!errors.customerPhone}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors ${errors.customerPhone ? 'border-red-500 focus:ring-red-500' : ''}`}
              style={{ backgroundColor: tokens.inputBg, borderColor: errors.customerPhone ? '#ef4444' : tokens.inputBorder, color: tokens.inputText }}
              value={customerPhone}
              onChange={(event) => {
                setCustomerPhone(event.target.value);
                setErrors((prev) => ({ ...prev, customerPhone: undefined }));
              }}
            />
            {errors.customerPhone && (
              <p className="text-xs text-red-500 mt-1">{errors.customerPhone}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold block" style={{ color: tokens.bodyText }}>
            Email nhận thông tin đơn hàng <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="Email"
            aria-invalid={!!errors.customerEmail}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors ${errors.customerEmail ? 'border-red-500 focus:ring-red-500' : ''}`}
            style={{ backgroundColor: tokens.inputBg, borderColor: errors.customerEmail ? '#ef4444' : tokens.inputBorder, color: tokens.inputText }}
            value={customerEmail}
            onChange={(event) => {
              setCustomerEmail(event.target.value);
              setErrors((prev) => ({ ...prev, customerEmail: undefined }));
            }}
          />
          {errors.customerEmail && (
            <p className="text-xs text-red-500 mt-1">{errors.customerEmail}</p>
          )}
        </div>

        {shouldCollectShipping && addressFormat === 'text' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block" style={{ color: tokens.bodyText }}>
              Địa chỉ giao hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Địa chỉ giao hàng"
              aria-invalid={!!errors.shippingAddress}
              className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors ${errors.shippingAddress ? 'border-red-500 focus:ring-red-500' : ''}`}
              style={{ backgroundColor: tokens.inputBg, borderColor: errors.shippingAddress ? '#ef4444' : tokens.inputBorder, color: tokens.inputText }}
              value={shippingAddress}
              onChange={(event) => {
                setShippingAddress(event.target.value);
                setErrors((prev) => ({ ...prev, shippingAddress: undefined }));
              }}
            />
            {errors.shippingAddress && (
              <p className="text-xs text-red-500 mt-1">{errors.shippingAddress}</p>
            )}
          </div>
        ) : shouldCollectShipping ? (
          <div className="grid gap-4">
            <div className={`grid gap-4 ${addressFormat === '3-level' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold block" style={{ color: tokens.bodyText }}>
                  Tỉnh/Thành <span className="text-red-500">*</span>
                </label>
                <AddressCombobox
                  options={provinceList}
                  value={provinceCode}
                  onChange={(code) => {
                    setProvinceCode(code);
                    setDistrictCode('');
                    setWardCode('');
                    setErrors((prev) => ({ ...prev, provinceCode: undefined, districtCode: undefined, wardCode: undefined }));
                  }}
                  placeholder="Chọn Tỉnh/Thành"
                  hasError={!!errors.provinceCode}
                  inputBg={tokens.inputBg}
                  inputBorder={tokens.inputBorder}
                  inputText={tokens.inputText}
                />
                {errors.provinceCode && (
                  <p className="text-xs text-red-500 mt-1">{errors.provinceCode}</p>
                )}
              </div>

              {addressFormat === '3-level' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold block" style={{ color: tokens.bodyText }}>
                    Quận/Huyện <span className="text-red-500">*</span>
                  </label>
                  <AddressCombobox
                    options={availableDistricts}
                    value={districtCode}
                    onChange={(code) => {
                      setDistrictCode(code);
                      setWardCode('');
                      setErrors((prev) => ({ ...prev, districtCode: undefined, wardCode: undefined }));
                    }}
                    placeholder="Chọn Quận/Huyện"
                    disabled={!provinceCode}
                    hasError={!!errors.districtCode}
                    inputBg={tokens.inputBg}
                    inputBorder={tokens.inputBorder}
                    inputText={tokens.inputText}
                  />
                  {errors.districtCode && (
                    <p className="text-xs text-red-500 mt-1">{errors.districtCode}</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold block" style={{ color: tokens.bodyText }}>
                  Phường/Xã <span className="text-red-500">*</span>
                </label>
                <AddressCombobox
                  options={availableWards}
                  value={wardCode}
                  onChange={(code) => {
                    setWardCode(code);
                    setErrors((prev) => ({ ...prev, wardCode: undefined }));
                  }}
                  placeholder="Chọn Phường/Xã"
                  disabled={addressFormat === '3-level' ? !districtCode : !provinceCode}
                  hasError={!!errors.wardCode}
                  inputBg={tokens.inputBg}
                  inputBorder={tokens.inputBorder}
                  inputText={tokens.inputText}
                />
                {errors.wardCode && (
                  <p className="text-xs text-red-500 mt-1">{errors.wardCode}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold block" style={{ color: tokens.bodyText }}>
                Số nhà, tên đường <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Số nhà, tên đường"
                aria-invalid={!!errors.addressDetail}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm transition-colors ${errors.addressDetail ? 'border-red-500 focus:ring-red-500' : ''}`}
                style={{ backgroundColor: tokens.inputBg, borderColor: errors.addressDetail ? '#ef4444' : tokens.inputBorder, color: tokens.inputText }}
                value={addressDetail}
                onChange={(event) => {
                  setAddressDetail(event.target.value);
                  setErrors((prev) => ({ ...prev, addressDetail: undefined }));
                }}
              />
              {errors.addressDetail && (
                <p className="text-xs text-red-500 mt-1">{errors.addressDetail}</p>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted, color: tokens.metaText }}
          >
            {noShippingNotice}
          </div>
        )}
      </div>
    </div>
  );

  const shippingOptionsCard = !shouldCollectShipping ? null : (
    <div
      className="rounded-2xl border p-5 space-y-3"
      style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
    >
      <div className="flex items-center gap-2">
        <Truck className="w-5 h-5" style={{ color: tokens.iconMuted }} />
        <h2 className="text-lg font-semibold" style={{ color: tokens.heading }}>Vận chuyển</h2>
      </div>
      <div className="space-y-2 text-sm" style={{ color: tokens.metaText }}>
        {shippingMethods.map((method) => {
          const effectiveFee = getEffectiveFee(method, totalAmount);
          const isFree = effectiveFee === 0 && method.fee > 0;
          const isSelected = shippingMethodId === method.id;
          const threshold = method.freeShipThreshold ?? 0;
          return (
            <label
              key={method.id}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
              style={isSelected
                ? { borderColor: tokens.selectionBorder, backgroundColor: tokens.selectionBg }
                : { borderColor: tokens.border, backgroundColor: tokens.surface }
              }
            >
              <input
                type="radio"
                name="shipping"
                checked={isSelected}
                onChange={() => setShippingMethodId(method.id)}
                className="w-4 h-4"
                style={{ accentColor: tokens.radioAccent }}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm" style={{ color: tokens.bodyText }}>{method.label}</span>
                  {isFree && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      Miễn phí
                    </span>
                  )}
                </div>
                {method.description && <div className="text-xs mt-0.5" style={{ color: tokens.metaText }}>{method.description}</div>}
                {method.estimate && method.estimate !== method.description && (
                  <div className="text-xs" style={{ color: tokens.mutedText }}>{method.estimate}</div>
                )}
                {threshold > 0 && totalAmount < threshold && (
                  <div className="text-xs mt-0.5" style={{ color: tokens.mutedText }}>
                    Miễn ship khi đơn ≥ {threshold.toLocaleString('vi-VN')}đ
                  </div>
                )}
              </div>
              <div className="text-right">
                {isFree ? (
                  <div>
                    <span className="line-through text-xs" style={{ color: tokens.mutedText }}>{method.fee.toLocaleString('vi-VN')}đ</span>
                    <span className="block font-bold text-sm text-emerald-600 dark:text-emerald-400">0đ</span>
                  </div>
                ) : (
                  <span className="font-semibold text-sm" style={{ color: tokens.priceText }}>{effectiveFee.toLocaleString('vi-VN')}đ</span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );

  const paymentMethodsCard = !isPaymentEnabled ? null : (() => {
    return (
      <div
        className="rounded-2xl border p-5 space-y-3"
        style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
      >
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" style={{ color: tokens.iconMuted }} />
          <h2 className="text-lg font-semibold" style={{ color: tokens.heading }}>Thanh toán</h2>
        </div>
        {codPolicyNotice && (
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted, color: tokens.metaText }}
          >
            {codPolicyNotice}
          </div>
        )}
        <div className="space-y-2 text-sm" style={{ color: tokens.metaText }}>
          {availablePaymentMethods.length === 0 ? (
            <div
              className="rounded-lg border px-3 py-3 text-xs"
              style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted, color: tokens.metaText }}
            >
              Không có phương thức thanh toán phù hợp. Vui lòng vào Cấu hình cửa hàng để thêm Chuyển khoản ngân hàng, VietQR, thẻ hoặc ví điện tử.
            </div>
          ) : availablePaymentMethods.map((method) => (
            <label
              key={method.id}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
              style={paymentMethodId === method.id
                ? { borderColor: tokens.selectionBorder, backgroundColor: tokens.selectionBg }
                : { borderColor: tokens.border, backgroundColor: tokens.surface }
              }
            >
              <input
                type="radio"
                name="payment"
                checked={paymentMethodId === method.id}
                onChange={() => setPaymentMethodId(method.id)}
                className="w-4 h-4"
                style={{ accentColor: tokens.radioAccent }}
              />
              <div className="flex-1">
                <div className="font-medium text-sm" style={{ color: tokens.bodyText }}>{method.label}</div>
                {method.description && <div className="text-xs" style={{ color: tokens.metaText }}>{method.description}</div>}
              </div>
            </label>
          ))}
        </div>
        {(selectedPayment?.type === 'BankTransfer' || selectedPayment?.type === 'VietQR') && (
          <div
            className="border rounded-lg p-3 text-sm space-y-1.5"
            style={{ borderColor: tokens.border, backgroundColor: tokens.surfaceMuted, color: tokens.metaText }}
          >
            <div className="font-medium text-sm" style={{ color: tokens.bodyText }}>Thông tin thanh toán</div>
            <p className="text-xs" style={{ color: tokens.metaText }}>
              Sau khi bạn gửi đơn hàng thành công, mã QR và nội dung chuyển khoản chi tiết sẽ xuất hiện ở trang xác nhận đơn hàng để bạn thực hiện thanh toán chuyển khoản.
            </p>
          </div>
        )}
      </div>
    );
  })();

  const SummaryCard = (
    <div
      className="rounded-2xl border p-4 space-y-4"
      style={{ backgroundColor: tokens.summaryBg, borderColor: tokens.border }}
    >
      <div className="flex items-center justify-between text-sm">
        <span style={{ color: tokens.summaryText }}>Mục</span>
        <span className="font-medium" style={{ color: tokens.summaryValue }}>{fromCart ? cart?.itemsCount ?? 0 : quantity}x</span>
      </div>
      <div className="space-y-3">
        {summaryItems.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: tokens.surfaceSoft }}
            >
              {item.image ? (
                <Image src={item.image} alt={item.name} width={56} height={56} className="object-cover w-full h-full" mode="thumb" />
              ) : (
                <Package size={20} style={{ color: tokens.iconMuted }} />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: tokens.bodyText }}>{item.name}</p>
              <p className="text-xs" style={{ color: tokens.metaText }}>{item.type}</p>
              {item.variantTitle && <p className="text-xs" style={{ color: tokens.metaText }}>{item.variantTitle}</p>}
              <p className="text-xs" style={{ color: tokens.metaText }}>Số lượng: {item.quantity}</p>
            </div>
            <div className="text-right text-sm font-semibold" style={{ color: tokens.summaryValue }}>
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span style={{ color: tokens.summaryText }}>Tạm tính</span>
          <span className="font-semibold" style={{ color: tokens.summaryValue }}>{formatPrice(totalAmount)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span style={{ color: tokens.summaryText }}>Giảm giá</span>
            <span className="font-semibold" style={{ color: tokens.highlightText }}>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        {shouldCollectShipping && (
          <div className="flex items-center justify-between">
            <span style={{ color: tokens.summaryText }}>Phí vận chuyển</span>
            <span className="font-semibold" style={{ color: tokens.summaryValue }}>{formatPrice(shippingFee)}</span>
          </div>
        )}
      </div>
      <div className="border-t pt-3 flex items-center justify-between" style={{ borderColor: tokens.border }}>
        <span className="text-sm" style={{ color: tokens.summaryTotalLabel }}>Tổng cộng</span>
        <span className="text-lg font-bold" style={{ color: tokens.summaryTotalValue }}>{formatPrice(finalTotal)}</span>
      </div>
      <button
        type="button"
        className="w-full h-11 rounded-lg text-sm font-semibold transition-colors px-4"
        style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
        onClick={handlePlaceOrder}
        disabled={isSubmitting || Boolean(orderId) || isPaymentBlocked || checkoutItemPolicy.isPending}
      >
        {orderId ? 'Đã đặt hàng' : isSubmitting ? 'Đang xử lý...' : checkoutItemPolicy.isPending ? 'Đang kiểm tra giỏ hàng...' :
          (selectedPayment?.type === 'BankTransfer' || selectedPayment?.type === 'VietQR')
            ? 'Tạo đơn và xem thông tin thanh toán'
            : 'Đặt hàng ngay'
        }
      </button>
      {orderId && (
        <div className="text-xs text-center" style={{ color: tokens.highlightText }}>
          Mã đơn: {orderId}
        </div>
      )}
    </div>
  );

  const CouponCard = isPromotionEnabled ? (
    <div
      className="rounded-2xl border p-4 space-y-3"
      style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: tokens.bodyText }}>Mã khuyến mãi</h3>
          <p className="text-xs" style={{ color: tokens.metaText }}>Nhập mã để áp dụng giảm giá.</p>
        </div>
        {appliedCode && (
          <button
            type="button"
            className="text-xs"
            style={{ color: tokens.couponActionText }}
            onClick={handleRemoveCoupon}
          >
            Bỏ áp dụng
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="VD: TET2026"
          className="flex-1 px-3 py-2.5 border rounded-lg text-sm"
          style={{ backgroundColor: tokens.inputBg, borderColor: tokens.inputBorder, color: tokens.inputText }}
          value={couponInput}
          onChange={(event) => setCouponInput(event.target.value)}
        />
        <button
          type="button"
          className="px-4 py-2.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
          onClick={handleApplyCoupon}
        >
          Áp dụng
        </button>
      </div>
      {promotionResult && appliedCode && (
        <div
          className="text-xs"
          style={{ color: promotionResult.valid ? tokens.highlightText : tokens.mutedText }}
        >
          {promotionResult.message}
        </div>
      )}
    </div>
  ) : null;

  const wizardSteps = [
    { key: 'info', label: 'Thông tin khách hàng', content: shippingInfoCard },
    ...(shouldCollectShipping ? [{ key: 'shipping', label: 'Vận chuyển', content: shippingOptionsCard }] : []),
    ...(isPaymentEnabled ? [{ key: 'payment', label: 'Thanh toán', content: paymentMethodsCard }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-10" style={{ backgroundColor: tokens.pageBg }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: tokens.heading }}>Thanh toán</h1>
        <p className="mt-2" style={{ color: tokens.metaText }}>Hoàn tất đơn hàng của bạn trong vài bước.</p>
      </div>

      <div className={`grid gap-6 ${checkoutConfig.orderSummaryPosition === 'right' ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
        <div className={checkoutConfig.orderSummaryPosition === 'right' ? 'lg:col-span-2 space-y-6' : 'space-y-6'}>
          {checkoutConfig.flowStyle === 'multi-step' && StepIndicator}
          {checkoutConfig.flowStyle === 'wizard-accordion' ? (
            <div className="space-y-3">
              {wizardSteps.map((step, index) => (
                <div
                  key={step.key}
                  className="rounded-2xl border"
                  style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3"
                    onClick={() => setActiveWizardStep(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                        style={index === activeWizardStep
                          ? { backgroundColor: tokens.stepActiveBg, color: tokens.stepActiveText }
                          : { backgroundColor: tokens.stepInactiveBg, color: tokens.stepInactiveText }
                        }
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: tokens.bodyText }}>{step.label}</div>
                        <div className="text-xs" style={{ color: tokens.metaText }}>Nhập thông tin</div>
                      </div>
                    </div>
                  </button>
                  {index === activeWizardStep && (
                    <div className="px-4 pb-4 space-y-4">
                      {step.content}
                      <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: tokens.border }}>
                        {index > 0 && (
                          <button
                            type="button"
                            className="px-4 py-2 border rounded-lg text-sm font-semibold transition-colors"
                            style={{ borderColor: tokens.border, color: tokens.bodyText }}
                            onClick={() => setActiveWizardStep(index - 1)}
                          >
                            Quay lại
                          </button>
                        )}
                        {index < wizardSteps.length - 1 && (
                          <button
                            type="button"
                            className="px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                            style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                            onClick={() => {
                              if (step.key === 'info') {
                                const newErrors: typeof errors = {};
                                if (!customerName.trim()) newErrors.customerName = 'Vui lòng nhập họ tên.';
                                if (!customerPhone.trim()) newErrors.customerPhone = 'Vui lòng nhập số điện thoại.';
                                const emailTrimmed = customerEmail.trim();
                                if (!emailTrimmed) {
                                  newErrors.customerEmail = 'Vui lòng nhập email.';
                                } else if (!emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
                                  newErrors.customerEmail = 'Vui lòng nhập email hợp lệ.';
                                }
                                if (shouldCollectShipping) {
                                  if (addressFormat === 'text') {
                                    if (!shippingAddress.trim()) newErrors.shippingAddress = 'Vui lòng nhập địa chỉ giao hàng.';
                                  } else {
                                    if (!provinceCode) newErrors.provinceCode = 'Vui lòng chọn Tỉnh/Thành.';
                                    if (addressFormat === '3-level' && !districtCode) newErrors.districtCode = 'Vui lòng chọn Quận/Huyện.';
                                    if (!wardCode) newErrors.wardCode = 'Vui lòng chọn Phường/Xã.';
                                    if (!addressDetail.trim()) newErrors.addressDetail = 'Vui lòng nhập số nhà, tên đường.';
                                  }
                                }
                                if (Object.keys(newErrors).length > 0) {
                                  setErrors(newErrors);
                                  toast.error('Vui lòng kiểm tra lại các thông tin còn thiếu.');
                                  return;
                                }
                              }
                              setActiveWizardStep(index + 1);
                            }}
                          >
                            Tiếp tục
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {shippingInfoCard}
              {shippingOptionsCard}
              {paymentMethodsCard}
            </div>
          )}

          {CouponCard}
        </div>

        {checkoutConfig.orderSummaryPosition === 'right' ? (
          <div className="space-y-4">
            {SummaryCard}
          </div>
        ) : (
          <div className="mt-2 space-y-4">
            {SummaryCard}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutContent />
    </Suspense>
  );
}
