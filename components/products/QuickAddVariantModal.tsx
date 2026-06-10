"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { X } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { VariantSelector, type VariantSelectorOption } from '@/components/products/VariantSelector';
import { getPublicPriceLabel } from '@/lib/products/public-price';

type QuickAddProduct = {
  _id: Id<'products'>;
  name: string;
  slug: string;
  price: number;
  salePrice?: number;
  stock: number;
  image?: string;
  hasVariants?: boolean;
};

type ProductVariantOptionValue = {
  optionId: Id<'productOptions'>;
  valueId: Id<'productOptionValues'>;
  customValue?: string;
};

type ProductVariant = {
  _id: Id<'productVariants'>;
  optionValues: ProductVariantOptionValue[];
  price?: number;
  salePrice?: number;
  stock?: number;
  sku: string;
  image?: string;
  images?: string[];
};

type ProductOption = {
  _id: Id<'productOptions'>;
  name: string;
  order: number;
  displayType: VariantSelectorOption['displayType'];
  inputType?: VariantSelectorOption['inputType'];
};

type ProductOptionValue = {
  _id: Id<'productOptionValues'>;
  optionId: Id<'productOptions'>;
  order: number;
  value: string;
  label?: string;
  colorCode?: string;
  image?: string;
};

type VariantSelectionMap = Record<string, Id<'productOptionValues'>>;

type QuickAddVariantModalProps = {
  isOpen: boolean;
  product: QuickAddProduct | null;
  brandColor: string;
  actionLabel: string;
  onClose: () => void;
  onConfirm: (variantId: Id<'productVariants'>, quantity: number) => void;
};

const buildSelectionFromVariant = (variant: ProductVariant): VariantSelectionMap =>
  variant.optionValues.reduce<VariantSelectionMap>((acc, optionValue) => {
    acc[optionValue.optionId] = optionValue.valueId;
    return acc;
  }, {});

const findMatchingVariant = (variants: ProductVariant[], selection: VariantSelectionMap) =>
  variants.find((variant) =>
    variant.optionValues.every((optionValue) => {
      const selected = selection[optionValue.optionId];
      return !selected || selected === optionValue.valueId;
    })
  ) ?? null;

const findExactVariant = (variants: ProductVariant[], selection: VariantSelectionMap) =>
  variants.find((variant) =>
    variant.optionValues.every((optionValue) => selection[optionValue.optionId] === optionValue.valueId)
  ) ?? null;

export function QuickAddVariantModal({ isOpen, product, brandColor, actionLabel, onClose, onConfirm }: QuickAddVariantModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<VariantSelectionMap>({});
  const [quantity, setQuantity] = useState(1);
  const saleModeSetting = useQuery(api.admin.modules.getModuleSetting, { moduleKey: 'products', settingKey: 'saleMode' });
  const stockFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableStock', moduleKey: 'products' });

  const variants = useQuery(
    api.productVariants.listByProductActive,
    isOpen && product?._id ? { productId: product._id } : 'skip'
  );

  const variantOptionIds = useMemo(() => {
    if (!variants || variants.length === 0) {
      return [] as Id<'productOptions'>[];
    }
    const ids = new Set<Id<'productOptions'>>();
    variants.forEach((variant) => variant.optionValues.forEach((item) => ids.add(item.optionId)));
    return Array.from(ids);
  }, [variants]);

  const variantValueIds = useMemo(() => {
    if (!variants || variants.length === 0) {
      return [] as Id<'productOptionValues'>[];
    }
    const ids = new Set<Id<'productOptionValues'>>();
    variants.forEach((variant) => variant.optionValues.forEach((item) => ids.add(item.valueId)));
    return Array.from(ids);
  }, [variants]);

  const variantOptionsSource = useQuery(
    api.productOptions.listByIds,
    isOpen && variantOptionIds.length > 0 ? { ids: variantOptionIds } : 'skip'
  );

  const variantValuesSource = useQuery(
    api.productOptionValues.listByIds,
    isOpen && variantValueIds.length > 0 ? { ids: variantValueIds } : 'skip'
  );

  const variantOptions = useMemo(() => {
    if (!variantOptionsSource || !variantValuesSource) {
      return [] as VariantSelectorOption[];
    }

    const valuesByOption = new Map<Id<'productOptions'>, ProductOptionValue[]>();
    variantValuesSource.forEach((value) => {
      const existing = valuesByOption.get(value.optionId) ?? [];
      existing.push(value);
      valuesByOption.set(value.optionId, existing);
    });

    return (variantOptionsSource as ProductOption[])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((option) => ({
        id: option._id,
        name: option.name,
        displayType: option.displayType,
        inputType: option.inputType,
        values: (valuesByOption.get(option._id) ?? [])
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((value) => ({
            id: value._id,
            label: value.label ?? value.value,
            value: value.value,
            colorCode: value.colorCode,
            image: value.image,
          })),
      }))
      .filter((option) => option.values.length > 0);
  }, [variantOptionsSource, variantValuesSource]);

  const hasVariantData = Boolean(variants && variants.length > 0);
  const hasVariants = hasVariantData && variantOptions.length > 0;

  const baseSelection = useMemo(
    () => (hasVariants ? buildSelectionFromVariant(variants![0]) : {}),
    [hasVariants, variants]
  );
  const resolvedSelection = Object.keys(selectedOptions).length > 0 ? selectedOptions : baseSelection;
  const selectedVariant = hasVariants ? findExactVariant(variants!, resolvedSelection) : null;
  const saleMode = useMemo<'cart' | 'contact' | 'affiliate'>(() => {
    const value = saleModeSetting?.value;
    if (value === 'contact' || value === 'affiliate') {
      return value;
    }
    return 'cart';
  }, [saleModeSetting?.value]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || !product) {
    return null;
  }

  const basePrice = selectedVariant?.price ?? product.price;
  const salePrice = selectedVariant ? selectedVariant.salePrice : product.salePrice;
  const isRangeFromVariant = Boolean(hasVariantData && !selectedVariant);
  const showStock = stockFeature?.enabled ?? true;
  const priceDisplay = getPublicPriceLabel({ saleMode, price: basePrice, salePrice, isRangeFromVariant });
  const stockValue = selectedVariant?.stock ?? product.stock;
  const inStock = !showStock || stockValue > 0;
  const isLoading = variants === undefined || (hasVariantData && (!variantOptionsSource || !variantValuesSource));

  const handleSelectOption = (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) => {
    if (!hasVariants) {
      return;
    }
    const nextSelection = { ...resolvedSelection, [optionId]: valueId };
    const matching = findMatchingVariant(variants!, nextSelection);
    setSelectedOptions(matching ? buildSelectionFromVariant(matching) : nextSelection);
  };

  const isOptionValueAvailable = (optionId: Id<'productOptions'>, valueId: Id<'productOptionValues'>) =>
    variants?.some((variant) =>
      variant.optionValues.every((optionValue) => {
        if (optionValue.optionId === optionId) {
          return optionValue.valueId === valueId;
        }
        const selected = resolvedSelection[optionValue.optionId];
        return !selected || selected === optionValue.valueId;
      }) && (!showStock || (variant.stock ?? product.stock ?? 0) > 0)
    ) ?? false;

  const canSubmit = Boolean(selectedVariant && inStock && quantity > 0);

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-xl bg-slate-100 overflow-hidden relative">
            {product.image ? (
              <Image src={product.image} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No image</div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{product.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-base font-semibold" style={{ color: brandColor }}>{priceDisplay.label}</span>
              {priceDisplay.comparePrice && (
                <span className="text-sm text-slate-400 line-through">
                  {getPublicPriceLabel({ saleMode: 'cart', price: priceDisplay.comparePrice }).label}
                </span>
              )}
            </div>
            {showStock && (
              <p className={`text-xs mt-1 ${inStock ? 'text-emerald-600' : 'text-red-500'}`}>
                {inStock ? 'Còn hàng' : 'Hết hàng'}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5">
          {isLoading ? (
            <p className="text-sm text-slate-500">Đang tải phiên bản...</p>
          ) : hasVariants ? (
            <VariantSelector
              options={variantOptions}
              selectedOptions={resolvedSelection}
              onSelect={handleSelectOption}
              isOptionValueAvailable={isOptionValueAvailable}
              accentColor={brandColor}
            />
          ) : (
            <p className="text-sm text-slate-500">Sản phẩm chưa có phiên bản khả dụng.</p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="h-9 w-9 rounded-full border border-slate-200 text-slate-600"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Giảm số lượng"
            >
              -
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              className="h-9 w-9 rounded-full border border-slate-200 text-slate-600"
              onClick={() => setQuantity(q => (showStock ? Math.min(stockValue, q + 1) : q + 1))}
              disabled={showStock && (!inStock || quantity >= stockValue)}
              aria-label="Tăng số lượng"
            >
              +
            </button>
          </div>

          <button
            className="px-5 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
            disabled={!canSubmit}
            onClick={() => {
              if (selectedVariant) {
                onConfirm(selectedVariant._id, quantity);
              }
            }}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
