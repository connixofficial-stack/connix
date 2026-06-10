'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../../components/ui';
import { ImageUpload } from '../../../../components/ImageUpload';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';

type VariantSettings = {
  variantImages: string;
  variantPricing: string;
  variantStock: string;
  barcodeEnabled: boolean;
  skuEnabled: boolean;
};

export type VariantFormPayload = {
  allowBackorder?: boolean;
  barcode?: string;
  image?: string;
  optionValues: { optionId: Id<'productOptions'>; valueId: Id<'productOptionValues'>; customValue?: string }[];
  price?: number;
  salePrice?: number;
  sku: string;
  status: 'Active' | 'Inactive';
  stock?: number;
};

type VariantFormProps = {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: VariantFormPayload) => Promise<void>;
  options: Doc<'productOptions'>[];
  optionValues: Doc<'productOptionValues'>[];
  product: Doc<'products'>;
  settings: VariantSettings;
  submitLabel: string;
  variant?: Doc<'productVariants'> | null;
};

export function VariantForm({
  isSubmitting,
  onCancel,
  onSubmit,
  options,
  optionValues,
  product,
  settings,
  submitLabel,
  variant,
}: VariantFormProps) {
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [allowBackorder, setAllowBackorder] = useState(false);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [image, setImage] = useState<string | undefined>();
  const [optionSelections, setOptionSelections] = useState<Record<string, { valueId?: Id<'productOptionValues'>; customValue?: string }>>({});
  const [quickAddValue, setQuickAddValue] = useState<Record<string, string>>({});
  const [quickAddColor, setQuickAddColor] = useState<Record<string, string>>({});
  const [quickAddOpen, setQuickAddOpen] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [generatedSku] = useState(() => `VAR-${product._id.slice(-6)}-${Date.now()}`);
  const createOptionValue = useMutation(api.productOptionValues.create);

  const optionValuesByOption = useMemo(() => {
    const map = new Map<string, Doc<'productOptionValues'>[]>();
    optionValues.forEach((value) => {
      if (!value.active) {return;}
      const list = map.get(value.optionId) ?? [];
      list.push(value);
      map.set(value.optionId, list);
    });
    return map;
  }, [optionValues]);

  useEffect(() => {
    if (variant && !isLoaded) {
      setSku(variant.sku);
      setBarcode(variant.barcode ?? '');
      setPrice(variant.price?.toString() ?? '');
      setSalePrice(variant.salePrice?.toString() ?? '');
      setStock(variant.stock?.toString() ?? '');
      setAllowBackorder(variant.allowBackorder ?? false);
      setStatus(variant.status);
      setImage(variant.image);
      const selectionMap: Record<string, { valueId?: Id<'productOptionValues'>; customValue?: string }> = {};
      variant.optionValues.forEach((item) => {
        selectionMap[item.optionId] = { valueId: item.valueId, customValue: item.customValue };
      });
      setOptionSelections(selectionMap);
      setIsLoaded(true);
    }
    if (!variant && !isLoaded) {
      setIsLoaded(true);
    }
  }, [variant, isLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (settings.skuEnabled && !sku.trim()) {
      toast.error('Vui lòng nhập SKU');
      return;
    }

    const missingOption = options.find((option) => !optionSelections[option._id]?.valueId);
    if (missingOption) {
      toast.error(`Vui lòng chọn giá trị cho ${missingOption.name}`);
      return;
    }

    if (showVariantPricing && salePrice.trim() !== '') {
      const parsedSalePrice = Number.parseInt(salePrice);
      if (Number.isFinite(parsedSalePrice) && parsedSalePrice > 0) {
        const parsedPrice = Number.parseInt(price);
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedSalePrice <= parsedPrice) {
          toast.error('Giá so sánh phải lớn hơn giá bán');
          return;
        }
      }
    }

    const optionValuesPayload = options.map((option) => {
      const selection = optionSelections[option._id];
      return {
        optionId: option._id,
        valueId: selection?.valueId as Id<'productOptionValues'>,
        customValue: selection?.customValue?.trim() || undefined,
      };
    });

    const resolvedSku = settings.skuEnabled
      ? sku.trim()
      : (variant?.sku ?? (sku.trim() || generatedSku));

    await onSubmit({
      allowBackorder: settings.variantStock === 'variant' ? allowBackorder : undefined,
      barcode: settings.barcodeEnabled ? (barcode.trim() || undefined) : undefined,
      image: settings.variantImages === 'inherit' ? undefined : image,
      optionValues: optionValuesPayload,
      price: settings.variantPricing === 'variant' ? (price.trim() === '' ? undefined : Number.parseInt(price)) : undefined,
      salePrice: settings.variantPricing === 'variant' ? (salePrice.trim() === '' ? undefined : Number.parseInt(salePrice)) : undefined,
      sku: resolvedSku,
      status,
      stock: settings.variantStock === 'variant' ? (stock.trim() === '' ? undefined : Number.parseInt(stock)) : undefined,
    });
  };

  const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(value);

  const showVariantIdentity = settings.skuEnabled || settings.barcodeEnabled;
  const showVariantPricing = settings.variantPricing === 'variant';
  const showVariantStock = settings.variantStock === 'variant';
  const showVariantImages = settings.variantImages !== 'inherit';

  const handleQuickAdd = async (optionId: Id<'productOptions'>) => {
    const rawValue = quickAddValue[optionId]?.trim();
    if (!rawValue) {
      toast.error('Vui lòng nhập giá trị');
      return;
    }
    const values = optionValuesByOption.get(optionId) ?? [];
    const exists = values.some((value) => value.value.toLowerCase() === rawValue.toLowerCase());
    if (exists) {
      toast.error('Giá trị đã tồn tại');
      return;
    }
    try {
      const id = await createOptionValue({
        optionId,
        value: rawValue,
        label: rawValue,
        colorCode: quickAddColor[optionId],
      });
      setOptionSelections(prev => ({
        ...prev,
        [optionId]: { ...prev[optionId], valueId: id },
      }));
      setQuickAddValue(prev => ({ ...prev, [optionId]: '' }));
      setQuickAddColor(prev => ({ ...prev, [optionId]: '#000000' }));
      setQuickAddOpen(prev => ({ ...prev, [optionId]: false }));
      toast.success('Đã thêm giá trị');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể thêm giá trị');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {showVariantIdentity && (
            <Card>
              <CardHeader><CardTitle className="text-base">Thông tin phiên bản</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settings.skuEnabled && (
                    <div className="space-y-2">
                      <Label>SKU <span className="text-red-500">*</span></Label>
                      <Input value={sku} onChange={(e) =>{  setSku(e.target.value); }} placeholder="VD: PROD-RED-M" className="font-mono" required />
                    </div>
                  )}
                  {settings.barcodeEnabled && (
                    <div className="space-y-2">
                      <Label>Barcode</Label>
                      <Input value={barcode} onChange={(e) =>{  setBarcode(e.target.value); }} placeholder="Barcode (nếu có)" className="font-mono" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base">Tùy chọn phiên bản</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {options.map(option => {
                const values = optionValuesByOption.get(option._id) ?? [];
                const selection = optionSelections[option._id];
                const needsCustomValue = ['text_input', 'number_input', 'color_picker'].includes(option.displayType);
                const customInputType = option.displayType === 'number_input'
                  ? 'number'
                  : option.displayType === 'color_picker'
                    ? 'color'
                    : 'text';

                return (
                  <div key={option._id} className="space-y-2">
                    <Label>{option.name} <span className="text-red-500">*</span></Label>
                    <div className={needsCustomValue ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : ''}>
                      <select
                        value={selection?.valueId ?? ''}
                        onChange={(e) =>{
                          const valueId = e.target.value as Id<'productOptionValues'>;
                          setOptionSelections(prev => ({
                            ...prev,
                            [option._id]: { ...prev[option._id], valueId },
                          }));
                        }}
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                      >
                        <option value="">-- Chọn giá trị --</option>
                        {values.map(value => (
                          <option key={value._id} value={value._id}>{value.label ?? value.value}</option>
                        ))}
                      </select>
                      {needsCustomValue && (
                        <Input
                          type={customInputType}
                          value={selection?.customValue ?? (option.displayType === 'color_picker' ? '#000000' : '')}
                          onChange={(e) =>{
                            const customValue = e.target.value;
                            setOptionSelections(prev => ({
                              ...prev,
                              [option._id]: { ...prev[option._id], customValue },
                            }));
                          }}
                          placeholder={option.displayType === 'color_picker' ? '' : 'Nhập giá trị custom'}
                        />
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-2 text-xs"
                        onClick={() =>{
                          setQuickAddOpen(prev => ({ ...prev, [option._id]: !prev[option._id] }));
                          if (!quickAddColor[option._id]) {
                            setQuickAddColor(prev => ({ ...prev, [option._id]: '#000000' }));
                          }
                        }}
                      >
                        + Thêm nhanh
                      </Button>
                      {values.length === 0 && (
                        <p className="text-xs text-slate-500">Option này chưa có giá trị hoạt động.</p>
                      )}
                    </div>
                    {quickAddOpen[option._id] && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                        <div className="md:col-span-2 space-y-1">
                          <Label className="text-xs">Giá trị mới</Label>
                          <Input
                            value={quickAddValue[option._id] ?? ''}
                            onChange={(e) =>{
                              const value = e.target.value;
                              setQuickAddValue(prev => ({ ...prev, [option._id]: value }));
                            }}
                            placeholder="Nhập giá trị"
                          />
                        </div>
                        {option.displayType === 'color_picker' ? (
                          <div className="space-y-1">
                            <Label className="text-xs">Màu</Label>
                            <Input
                              type="color"
                              value={quickAddColor[option._id] ?? '#000000'}
                              onChange={(e) =>{
                                const value = e.target.value;
                                setQuickAddColor(prev => ({ ...prev, [option._id]: value }));
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleQuickAdd(option._id)}
                            >
                              Thêm
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setQuickAddOpen(prev => ({ ...prev, [option._id]: false }))}
                            >
                              Hủy
                            </Button>
                          </div>
                        )}
                        {option.displayType === 'color_picker' && (
                          <div className="flex gap-2 md:col-span-3">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleQuickAdd(option._id)}
                            >
                              Thêm
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setQuickAddOpen(prev => ({ ...prev, [option._id]: false }))}
                            >
                              Hủy
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Giá & Kho hàng</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {showVariantPricing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Giá bán (VNĐ)</Label>
                    <Input type="number" value={price} onChange={(e) =>{  setPrice(e.target.value); }} placeholder="0" min="0" />
                    {price.trim() !== '' && Number.isFinite(Number.parseInt(price)) && (
                      <p className="text-xs text-slate-500">{new Intl.NumberFormat('en-US').format(Number.parseInt(price))}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Giá so sánh (trước giảm)</Label>
                    <Input type="number" value={salePrice} onChange={(e) =>{  setSalePrice(e.target.value); }} placeholder="Để trống nếu không KM" min="0" />
                    {salePrice.trim() !== '' && Number.isFinite(Number.parseInt(salePrice)) && (
                      <p className="text-xs text-slate-500">{new Intl.NumberFormat('en-US').format(Number.parseInt(salePrice))}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Giá lấy từ sản phẩm: <span className="font-medium text-slate-700">{formatPrice(product.salePrice ?? product.price)}</span></div>
              )}

              {showVariantStock ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Số lượng tồn kho</Label>
                    <Input type="number" value={stock} onChange={(e) =>{  setStock(e.target.value); }} placeholder="0" min="0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="allow-backorder"
                      checked={allowBackorder}
                      onChange={(e) =>{  setAllowBackorder(e.target.checked); }}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                    <Label htmlFor="allow-backorder" className="cursor-pointer">Cho phép đặt hàng khi hết</Label>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Tồn kho lấy từ sản phẩm: <span className="font-medium text-slate-700">{product.stock}</span></div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Trạng thái</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <select
                  value={status}
                  onChange={(e) =>{  setStatus(e.target.value as 'Active' | 'Inactive'); }}
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                >
                  <option value="Active">Đang bán</option>
                  <option value="Inactive">Ẩn</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {showVariantImages && (
            <Card>
              <CardHeader><CardTitle className="text-base">Ảnh phiên bản</CardTitle></CardHeader>
              <CardContent>
                <ImageUpload value={image} onChange={setImage} folder="product-variants" />
                {settings.variantImages === 'both' && (
                  <p className="text-xs text-slate-500 mt-2">Nếu không chọn ảnh, sẽ dùng ảnh sản phẩm.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <HomeComponentStickyFooter
        isSubmitting={isSubmitting}
        submitLabel={submitLabel}
        onCancel={onCancel}
        disableSave={isSubmitting}
      >
        <>
          <Button type="button" variant="ghost" onClick={onCancel}>Hủy bỏ</Button>
          <div className="flex gap-2">
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              {submitLabel}
            </Button>
          </div>
        </>
      </HomeComponentStickyFooter>
    </form>
  );
}
