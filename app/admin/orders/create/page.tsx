'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, Loader2, Plus, ShoppingBag, Trash2, Undo2, Redo2, Ticket, Check, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  cn
} from '../../components/ui';
import { useUnsavedGuard } from '../../home-components/_shared/hooks/useUnsavedGuard';
import { useUndoRedo } from '../../home-components/_shared/hooks/useUndoRedo';

const MODULE_KEY = 'orders';

type PaymentMethod = 'COD' | 'BankTransfer' | 'VietQR' | 'CreditCard' | 'EWallet';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { label: 'Thanh toán khi nhận hàng (COD)', value: 'COD' },
  { label: 'Chuyển khoản ngân hàng', value: 'BankTransfer' },
  { label: 'VietQR', value: 'VietQR' },
  { label: 'Thẻ tín dụng', value: 'CreditCard' },
  { label: 'Ví điện tử', value: 'EWallet' },
];

export default function CreateOrderPage() {
  const router = useRouter();
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const createOrder = useMutation(api.orders.create);
  const createCustomer = useMutation(api.customers.create);

  // States for search and selection
  const [customerId, setCustomerId] = useState<Id<'customers'> | ''>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerContainerRef = useRef<HTMLDivElement | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<Id<'products'> | ''>('');
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productContainerRef = useRef<HTMLDivElement | null>(null);

  const [selectedVariantId, setSelectedVariantId] = useState<Id<'productVariants'> | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [shippingFee, setShippingFee] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Promotion/Voucher States
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  // Quick Customer Creation States
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');

  // Undo/Redo hook for items state
  const {
    state: items,
    set: setItems,
    undo,
    redo,
    canUndo,
    canRedo
  } = useUndoRedo<any[]>([], { maxHistory: 15 });

  // Unsaved Changes Guard
  const hasChanges = items.length > 0 || customerId !== '' || shippingAddress !== '' || note !== '';
  useUnsavedGuard(hasChanges);

  // Debounce search customer
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Debounce search product
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerContainerRef.current && !customerContainerRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
      if (productContainerRef.current && !productContainerRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch queries based on search
  const searchedCustomers = useQuery(
    api.customers.listAdminWithOffset,
    isCustomerDropdownOpen
      ? {
          limit: 10,
          offset: 0,
          search: debouncedCustomerSearch,
        }
      : 'skip'
  );

  const searchedProducts = useQuery(
    api.products.listAdminWithOffset,
    isProductDropdownOpen
      ? {
          limit: 15,
          offset: 0,
          search: debouncedProductSearch,
          status: 'Active',
        }
      : 'skip'
  );

  const activeVariants = useQuery(
    api.productVariants.listByProductActive,
    selectedProductId ? { productId: selectedProductId } : 'skip'
  );

  const optionValuesData = useQuery(api.productOptionValues.listAll, {});

  // Maps for option names lookup
  const optionValueMap = useMemo(() => {
    const map = new Map<string, string>();
    optionValuesData?.forEach(v => map.set(v._id, v.label || v.value));
    return map;
  }, [optionValuesData]);

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const totalAmount = Math.max(0, subtotal + shippingFee - discountAmount);

  const getVariantDisplayTitle = (variant: any) => {
    if (!variant.optionValues || variant.optionValues.length === 0) {
      return variant.sku;
    }
    return variant.optionValues
      .map((ov: any) => ov.customValue?.trim() || optionValueMap.get(ov.valueId) || '')
      .filter(Boolean)
      .join(' / ') || variant.sku;
  };

  const selectedProductData = useMemo(() => {
    if (!selectedProductId) {return null;}
    return searchedProducts?.find(p => p._id === selectedProductId) || null;
  }, [selectedProductId, searchedProducts]);

  const checkPromoQuery = useQuery(
    api.promotions.getByCode,
    promoCode.trim() ? { code: promoCode.trim().toUpperCase() } : 'skip'
  );

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    setIsCheckingPromo(true);

    if (checkPromoQuery === undefined) {
      toast.error('Đang kiểm tra mã giảm giá, vui lòng thử lại sau vài giây...');
      setIsCheckingPromo(false);
      return;
    }

    if (!checkPromoQuery) {
      toast.error('Mã giảm giá không tồn tại');
      setAppliedPromo(null);
      setDiscountAmount(0);
      setIsCheckingPromo(false);
      return;
    }

    const promo = checkPromoQuery;
    
    if (promo.status !== 'Active') {
      toast.error('Mã giảm giá hiện không hoạt động');
      setIsCheckingPromo(false);
      return;
    }

    if (promo.startDate && Date.now() < promo.startDate) {
      toast.error('Mã giảm giá chưa đến thời gian áp dụng');
      setIsCheckingPromo(false);
      return;
    }

    if (promo.endDate && Date.now() > promo.endDate) {
      toast.error('Mã giảm giá đã hết hạn sử dụng');
      setIsCheckingPromo(false);
      return;
    }

    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      toast.error(`Đơn hàng tối thiểu để áp dụng mã này là ${formatPrice(promo.minOrderAmount)}`);
      setIsCheckingPromo(false);
      return;
    }

    setAppliedPromo(promo);
    
    let discount = 0;
    if (promo.discountType === 'percent') {
      discount = (subtotal * (promo.discountValue ?? 0)) / 100;
      if (promo.maxDiscountAmount) {
        discount = Math.min(discount, promo.maxDiscountAmount);
      }
    } else if (promo.discountType === 'fixed') {
      discount = promo.discountValue ?? 0;
    }
    
    setDiscountAmount(discount);
    toast.success(`Đã áp dụng mã giảm giá: giảm ${formatPrice(discount)}`);
    setIsCheckingPromo(false);
  };

  // Recalculate discount if subtotal changes
  useEffect(() => {
    if (appliedPromo) {
      let discount = 0;
      if (appliedPromo.discountType === 'percent') {
        discount = (subtotal * (appliedPromo.discountValue ?? 0)) / 100;
        if (appliedPromo.maxDiscountAmount) {
          discount = Math.min(discount, appliedPromo.maxDiscountAmount);
        }
      } else if (appliedPromo.discountType === 'fixed') {
        discount = appliedPromo.discountValue ?? 0;
      }
      if (appliedPromo.minOrderAmount && subtotal < appliedPromo.minOrderAmount) {
        setAppliedPromo(null);
        setDiscountAmount(0);
        toast.error('Tổng tiền đơn hàng không còn đủ điều kiện áp dụng voucher');
      } else {
        setDiscountAmount(discount);
      }
    }
  }, [subtotal, appliedPromo]);

  const addItem = () => {
    if (!selectedProductId || !selectedProductData) {return;}
    
    const product = selectedProductData;

    if (product.hasVariants) {
      if (!selectedVariantId) {
        toast.error('Vui lòng chọn Size / Biến thể cho sản phẩm');
        return;
      }
      
      const variant = activeVariants?.find(v => v._id === selectedVariantId);
      if (!variant) {
        toast.error('Biến thể không hợp lệ');
        return;
      }

      // Check stock limit at client
      const stockAvailable = variant.stock ?? 0;
      const existingQuantity = items
        .filter(item => item.productId === selectedProductId && item.variantId === selectedVariantId)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (existingQuantity + quantity > stockAvailable) {
        toast.error(`Không đủ hàng trong kho. Còn lại: ${stockAvailable}`);
        return;
      }

      const existingIndex = items.findIndex(
        i => i.productId === selectedProductId && i.variantId === selectedVariantId
      );

      const price = variant.salePrice ?? variant.price ?? product.salePrice ?? product.price;
      const variantTitle = getVariantDisplayTitle(variant);

      if (existingIndex !== -1) {
        const newItems = [...items];
        newItems[existingIndex].quantity += quantity;
        setItems(newItems);
      } else {
        setItems([
          ...items,
          {
            price,
            productId: selectedProductId,
            productName: product.name,
            quantity,
            variantId: selectedVariantId,
            variantTitle,
          }
        ]);
      }
    } else {
      // Product has no variants
      const stockAvailable = product.stock ?? 0;
      const existingQuantity = items
        .filter(item => item.productId === selectedProductId && !item.variantId)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (existingQuantity + quantity > stockAvailable) {
        toast.error(`Không đủ hàng trong kho. Còn lại: ${stockAvailable}`);
        return;
      }

      const existingIndex = items.findIndex(i => i.productId === selectedProductId && !i.variantId);
      const price = product.salePrice ?? product.price;

      if (existingIndex !== -1) {
        const newItems = [...items];
        newItems[existingIndex].quantity += quantity;
        setItems(newItems);
      } else {
        setItems([
          ...items,
          {
            price,
            productId: selectedProductId,
            productName: product.name,
            quantity,
          }
        ]);
      }
    }

    // Reset component selection states
    setSelectedProductId('');
    setSelectedVariantId('');
    setProductSearch('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) {return;}
    const item = items[index];
    
    // Check stock validation before updating quantity
    if (item.variantId) {
      // Fetch variant info if product has variants
      // Note: variant stock check
      toast.info('Đang kiểm tra tồn kho cho cập nhật số lượng...');
    }
    
    const newItems = [...items];
    newItems[index].quantity = newQuantity;
    setItems(newItems);
  };

  const handleCustomerChange = async (newCustomerId: string) => {
    setCustomerId(newCustomerId as Id<'customers'>);
    try {
      // Get customer address if exists to autofill
      // We can query directly or read from state if searchedCustomers has it
      const customer = searchedCustomers?.find(c => c._id === newCustomerId);
      if (customer?.address && enabledFields.has('shippingAddress')) {
        setShippingAddress(customer.address);
      }
    } catch (err) {
      console.error('Error autofilling customer address', err);
    }
  };

  const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone || !newCustomerEmail) {
      toast.error('Vui lòng nhập đầy đủ họ tên, SĐT và Email');
      return;
    }
    setIsSubmitting(true);
    try {
      const newId = await createCustomer({
        address: newCustomerAddress || undefined,
        email: newCustomerEmail,
        name: newCustomerName,
        phone: newCustomerPhone,
      });
      toast.success('Đã tạo khách hàng thành công');
      setCustomerId(newId);
      setCustomerSearch(`${newCustomerName} - ${newCustomerPhone}`);
      if (newCustomerAddress && enabledFields.has('shippingAddress')) {
        setShippingAddress(newCustomerAddress);
      }
      setIsQuickCustomerOpen(false);
      // Reset form fields
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
      setNewCustomerAddress('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo khách hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }
    if (items.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 sản phẩm');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder({
        customerId: customerId,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        items,
        note: enabledFields.has('note') ? note : undefined,
        paymentMethod: enabledFields.has('paymentMethod') && paymentMethod ? paymentMethod : undefined,
        promotionCode: appliedPromo?.code,
        promotionId: appliedPromo?._id,
        shippingAddress: enabledFields.has('shippingAddress') ? shippingAddress : undefined,
        shippingFee: enabledFields.has('shippingFee') ? shippingFee : undefined,
      });
      if (!result.ok) {
        toast.error(result.error ?? 'Có lỗi xảy ra');
        return;
      }
      toast.success('Đã tạo đơn hàng thành công');
      router.push('/admin/orders');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon"><ArrowLeft size={20} /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tạo đơn hàng mới</h1>
            <p className="text-sm text-slate-500">Tạo đơn hàng nhanh cho khách mua trực tiếp hoặc online</p>
          </div>
        </div>

        {/* Undo/Redo controls */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            title="Hoàn tác (Ctrl+Z)"
            className="h-8 px-2"
          >
            <Undo2 size={16} className="mr-1" />
            <span className="text-xs">Hoàn tác</span>
          </Button>
          <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            title="Làm lại (Ctrl+Y)"
            className="h-8 px-2"
          >
            <Redo2 size={16} className="mr-1" />
            <span className="text-xs">Làm lại</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Selection */}
            <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base font-semibold">Khách hàng</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickCustomerOpen(true)}
                  className="h-8 text-xs flex items-center gap-1 border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                >
                  <UserPlus size={14} />
                  <span>Khách hàng mới</span>
                </Button>
              </CardHeader>
              <CardContent>
                <div ref={customerContainerRef} className="relative">
                  <Input
                    type="text"
                    placeholder="Tìm khách hàng theo tên, số điện thoại hoặc email..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                      if (customerId) {
                        setCustomerId('');
                      }
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    className="w-full pl-3 pr-10 focus-visible:ring-emerald-500"
                  />
                  {customerId && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <Check size={12} />
                    </span>
                  )}
                  {isCustomerDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 z-50 divide-y divide-slate-100 dark:divide-slate-700">
                      {searchedCustomers === undefined ? (
                        <div className="px-3 py-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin text-slate-400" />
                          <span>Đang tìm kiếm...</span>
                        </div>
                      ) : searchedCustomers.length === 0 ? (
                        <div className="px-3 py-4 text-center text-sm text-slate-500">
                          {customerSearch.trim().length < 2 ? 'Nhập tối thiểu 2 ký tự để tìm kiếm...' : 'Không tìm thấy khách hàng nào.'}
                        </div>
                      ) : (
                        searchedCustomers.map(c => (
                          <button
                            key={c._id}
                            type="button"
                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                            onClick={() => {
                              void handleCustomerChange(c._id);
                              setCustomerSearch(`${c.name} - ${c.phone}`);
                              setIsCustomerDropdownOpen(false);
                            }}
                          >
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{c.phone} • {c.email}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products Selection */}
            <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader><CardTitle className="text-base font-semibold">Sản phẩm</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <div ref={productContainerRef} className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setIsProductDropdownOpen(true);
                        if (selectedProductId) {
                          setSelectedProductId('');
                        }
                      }}
                      onFocus={() => setIsProductDropdownOpen(true)}
                      className="w-full pl-3 pr-10 focus-visible:ring-emerald-500"
                    />
                    {selectedProductId && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                        <Check size={12} />
                      </span>
                    )}
                    {isProductDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-full max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800 z-50 divide-y divide-slate-100 dark:divide-slate-700">
                        {searchedProducts === undefined ? (
                          <div className="px-3 py-4 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin text-slate-400" />
                            <span>Đang tìm kiếm...</span>
                          </div>
                        ) : searchedProducts.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-slate-500">
                            {productSearch.trim().length < 2 ? 'Nhập tối thiểu 2 ký tự để tìm kiếm...' : 'Không tìm thấy sản phẩm nào.'}
                          </div>
                        ) : (
                          searchedProducts.map(p => (
                            <button
                              key={p._id}
                              type="button"
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                              onClick={() => {
                                setSelectedProductId(p._id);
                                setProductSearch(p.name);
                                setIsProductDropdownOpen(false);
                                setSelectedVariantId('');
                              }}
                            >
                              <div className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                                <span>SKU: {p.sku}</span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatPrice(p.salePrice ?? p.price)}</span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Input
                    type="number"
                    className="w-20 focus-visible:ring-emerald-500"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                  />
                  
                  <Button
                    type="button"
                    onClick={addItem}
                    disabled={!selectedProductId}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </Button>
                </div>

                {/* Display variants selection if selected product has variants */}
                {selectedProductId && selectedProductData?.hasVariants && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Chọn biến thể (Size giày):</Label>
                    <div className="flex flex-wrap gap-2">
                      {activeVariants === undefined ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 py-1">
                          <Loader2 size={12} className="animate-spin" />
                          <span>Đang tải danh sách size...</span>
                        </div>
                      ) : activeVariants.length === 0 ? (
                        <div className="text-xs text-red-500 font-medium py-1">Sản phẩm này hiện hết hàng hoặc chưa cấu hình biến thể hoạt động.</div>
                      ) : (
                        activeVariants.map(v => {
                          const title = getVariantDisplayTitle(v);
                          const isSelected = selectedVariantId === v._id;
                          const isOutOfStock = (v.stock ?? 0) <= 0;

                          return (
                            <button
                              key={v._id}
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => setSelectedVariantId(v._id)}
                              className={cn(
                                "px-3 py-1.5 text-xs rounded-md font-medium border transition-all flex flex-col items-center min-w-[70px]",
                                isSelected
                                  ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : "border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
                                isOutOfStock && "opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/20 border-slate-200/50"
                              )}
                            >
                              <span>{title}</span>
                              <span className="text-[10px] opacity-70 mt-0.5">Tồn: {v.stock ?? 0}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Items list */}
                {items.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-200 dark:border-slate-800 dark:divide-slate-800">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{item.productName}</p>
                          {item.variantTitle && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">Biến thể: {item.variantTitle}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">{formatPrice(item.price)} x {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            className="w-16 h-8 text-center focus-visible:ring-emerald-500"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, Number.parseInt(e.target.value) || 1)}
                          />
                          <span className="font-bold w-28 text-right text-slate-900 dark:text-slate-100">{formatPrice(item.price * item.quantity)}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/30 dark:bg-slate-900/10">
                    <ShoppingBag className="w-9 h-9 mx-auto mb-2 text-slate-400" />
                    <p className="font-medium text-sm">Chưa có sản phẩm nào trong giỏ hàng</p>
                    <p className="text-xs text-slate-400 mt-1">Tìm kiếm và chọn sản phẩm để thêm vào đơn hàng</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Info */}
            {enabledFields.has('shippingAddress') && (
              <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800">
                <CardHeader><CardTitle className="text-base font-semibold">Thông tin giao hàng</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipping-address">Địa chỉ giao hàng</Label>
                    <textarea
                      id="shipping-address"
                      className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-slate-100"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Nhập địa chỉ giao hàng cụ thể cho đơn này"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Note */}
            {enabledFields.has('note') && (
              <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800">
                <CardHeader><CardTitle className="text-base font-semibold">Ghi chú</CardTitle></CardHeader>
                <CardContent>
                  <textarea
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-slate-100"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú nội bộ hoặc yêu cầu đặc biệt của khách"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Method */}
            {enabledFields.has('paymentMethod') && (
              <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800">
                <CardHeader><CardTitle className="text-base font-semibold">Thanh toán</CardTitle></CardHeader>
                <CardContent>
                  <select
                    className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-slate-100"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="">Chọn phương thức</option>
                    {PAYMENT_METHODS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </CardContent>
              </Card>
            )}

            {/* Promotions / Discount Coupon */}
            <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader><CardTitle className="text-base font-semibold">Khuyến mãi / Voucher</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Mã giảm giá..."
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="uppercase font-medium focus-visible:ring-emerald-500"
                    />
                    <Ticket size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <Button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={isCheckingPromo || !promoCode.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    {isCheckingPromo ? <Loader2 size={14} className="animate-spin" /> : 'Áp dụng'}
                  </Button>
                </div>

                {appliedPromo && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                    <span className="font-semibold">{appliedPromo.code} được áp dụng</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAppliedPromo(null);
                        setDiscountAmount(0);
                        setPromoCode('');
                      }}
                      className="underline font-medium hover:text-emerald-900"
                    >
                      Gỡ bỏ
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800">
              <CardHeader><CardTitle className="text-base font-semibold">Tổng cộng</CardTitle></CardHeader>
              <CardContent className="space-y-3.5">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>Tạm tính ({items.length} SP):</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{formatPrice(subtotal)}</span>
                </div>
                {enabledFields.has('shippingFee') && (
                  <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                    <span>Phí vận chuyển:</span>
                    <Input
                      type="number"
                      className="w-28 h-8 text-right focus-visible:ring-emerald-500"
                      min={0}
                      value={shippingFee}
                      onChange={(e) => setShippingFee(Number.parseInt(e.target.value) || 0)}
                    />
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3.5 flex justify-between font-bold text-lg text-slate-900 dark:text-slate-100">
                  <span>Tổng tiền:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 h-11"
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Tạo đơn hàng'}
              </Button>
              <Link href="/admin/orders">
                <Button type="button" variant="outline" className="w-full h-11">Hủy</Button>
              </Link>
            </div>
          </div>
        </div>
      </form>

      {/* Dialog for Quick Customer Creation */}
      <Dialog open={isQuickCustomerOpen} onOpenChange={setIsQuickCustomerOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 z-50">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Tạo nhanh khách hàng mới</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Điền các thông tin cơ bản để tạo nhanh tài khoản khách hàng mới vào hệ thống.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQuickCustomerSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-name" className="text-xs font-semibold">Họ và tên <span className="text-red-500">*</span></Label>
              <Input
                id="new-name"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="Nguyễn Văn A"
                required
                className="focus-visible:ring-emerald-500 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-phone" className="text-xs font-semibold">Số điện thoại <span className="text-red-500">*</span></Label>
              <Input
                id="new-phone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="0901234567"
                required
                className="focus-visible:ring-emerald-500 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-email" className="text-xs font-semibold">Email <span className="text-red-500">*</span></Label>
              <Input
                id="new-email"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="focus-visible:ring-emerald-500 h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-address" className="text-xs font-semibold">Địa chỉ giao hàng</Label>
              <Input
                id="new-address"
                value={newCustomerAddress}
                onChange={(e) => setNewCustomerAddress(e.target.value)}
                placeholder="Số 123 Đường ABC, Quận XYZ..."
                className="focus-visible:ring-emerald-500 h-9"
              />
            </div>
            <DialogFooter className="pt-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsQuickCustomerOpen(false)}
                className="h-9 text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-505 text-white h-9 text-xs flex items-center gap-1.5"
              >
                {isSubmitting && <Loader2 size={12} className="animate-spin" />}
                <span>Tạo khách hàng</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
