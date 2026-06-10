import React, { useMemo } from 'react';
import { Clock, Minus, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCartExpiry } from '@/lib/cart';
import { getCartColors, type CartColors } from '@/components/site/cart/colors';

type CartPreviewProps = {
  layoutStyle: 'drawer' | 'page' | 'table';
  showExpiry: boolean;
  showNote: boolean;
  device?: 'desktop' | 'tablet' | 'mobile';
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
  expiresAt?: number;
};

const mockCartItems = [
  { id: 1, name: 'Giày Thể Thao Cao Cấp ThanShoes', price: 1250000, quantity: 1, variantTitle: 'Size: 42 • Màu: Đen' },
  { id: 2, name: 'Vớ Thể Thao ThanShoes Cổ Ngắn', price: 45000, quantity: 2, variantTitle: undefined },
];

const DEFAULT_EXPIRES_AT = Date.now() + 30 * 60 * 1000;

const formatVND = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
const subtotal = mockCartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

type CartItem = (typeof mockCartItems)[number];

function CartItemRow({ item, tokens }: { item: CartItem; tokens: CartColors }) {
  return (
    <div className="flex gap-3 py-3 border-b last:border-0" style={{ borderColor: tokens.itemDivider }}>
      <div
        className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{ backgroundColor: tokens.thumbBg, borderColor: tokens.thumbBorder }}
      >
        <div className="w-10 h-10 rounded" style={{ backgroundColor: tokens.surfaceMuted }} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-1" style={{ color: tokens.bodyText }}>{item.name}</h4>
        {item.variantTitle && (
          <p className="text-xs mt-0.5" style={{ color: tokens.metaText }}>{item.variantTitle}</p>
        )}
        <p className="text-sm font-semibold mt-0.5" style={{ color: tokens.priceText }}>{formatVND(item.price)}</p>
        <div className="flex items-center gap-2 mt-2">
          <button
            className="w-6 h-6 rounded border flex items-center justify-center hover:bg-[var(--qty-hover-bg)]"
            style={{
              borderColor: tokens.quantityButtonBorder,
              backgroundColor: tokens.quantityButtonBg,
              ['--qty-hover-bg' as never]: tokens.quantityButtonHoverBg,
            }}
          >
            <Minus size={12} style={{ color: tokens.quantityButtonIcon }} />
          </button>
          <span className="text-sm font-medium w-6 text-center" style={{ color: tokens.bodyText }}>{item.quantity}</span>
          <button
            className="w-6 h-6 rounded border flex items-center justify-center hover:bg-[var(--qty-hover-bg)]"
            style={{
              borderColor: tokens.quantityButtonBorder,
              backgroundColor: tokens.quantityButtonBg,
              ['--qty-hover-bg' as never]: tokens.quantityButtonHoverBg,
            }}
          >
            <Plus size={12} style={{ color: tokens.quantityButtonIcon }} />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between">
        <button
          className="group p-1 rounded hover:bg-[var(--action-hover-bg)]"
          style={{ ['--action-hover-bg' as never]: tokens.actionHoverBg }}
        >
          <Trash2
            size={14}
            className="text-[var(--action-icon)] group-hover:text-[var(--action-icon-hover)]"
            style={{
              ['--action-icon' as never]: tokens.actionIcon,
              ['--action-icon-hover' as never]: tokens.actionHoverIcon,
            }}
          />
        </button>
        <span className="text-sm font-semibold" style={{ color: tokens.bodyText }}>{formatVND(item.price * item.quantity)}</span>
      </div>
    </div>
  );
}

function CartSummary({ subtotal, tokens }: { subtotal: number; tokens: CartColors }) {
  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: tokens.summaryBg }}>
      <div className="flex justify-between text-sm">
        <span style={{ color: tokens.summaryLabel }}>Tạm tính</span>
        <span className="font-medium" style={{ color: tokens.summaryValue }}>{formatVND(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span style={{ color: tokens.summaryLabel }}>Phí vận chuyển</span>
        <span style={{ color: tokens.mutedText }}>Tính khi checkout</span>
      </div>
      <div className="border-t pt-3 flex justify-between" style={{ borderColor: tokens.border }}>
        <span className="font-semibold" style={{ color: tokens.summaryTotalLabel }}>Tổng cộng</span>
        <span className="text-lg font-bold" style={{ color: tokens.summaryTotalValue }}>{formatVND(subtotal)}</span>
      </div>
      <button
        className="w-full py-3 rounded-xl font-semibold text-sm"
        style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
      >
        Tiến hành thanh toán
      </button>
    </div>
  );
}

export function CartPreview({
  layoutStyle,
  showExpiry,
  showNote,
  device = 'desktop',
  brandColor = '#f97316',
  secondaryColor,
  colorMode = 'single',
  expiresAt: expiresAtProp,
}: CartPreviewProps) {
  const isMobile = device === 'mobile';
  const expiresAt = expiresAtProp ?? DEFAULT_EXPIRES_AT;
  const { expiryText, isExpired } = useCartExpiry(expiresAt);
  const shouldShowExpiry = showExpiry && (expiryText || isExpired);
  const tokens = useMemo(
    () => getCartColors(brandColor, secondaryColor, colorMode),
    [brandColor, secondaryColor, colorMode]
  );

  return (
    <div className="min-h-[300px]">
      {layoutStyle === 'drawer' ? (
        <div className="flex h-full">
          <div className="flex-1 p-4 flex items-center justify-center" style={{ backgroundColor: tokens.pageBackground }}>
            <div className="text-center" style={{ color: tokens.mutedText }}>
              <div className="w-20 h-20 rounded-lg mx-auto mb-2" style={{ backgroundColor: tokens.surfaceSoft }} />
              <p className="text-sm">Nội dung trang</p>
            </div>
          </div>
          <div
            className="w-80 border-l p-4 flex flex-col"
            style={{ backgroundColor: tokens.drawerSurface, borderColor: tokens.drawerBorder }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} style={{ color: tokens.primary }} />
                <h3 className="font-semibold" style={{ color: tokens.drawerTitle }}>Giỏ hàng ({mockCartItems.length})</h3>
              </div>
              <button
                className="p-1 rounded hover:bg-[var(--qty-hover-bg)]"
                style={{ ['--qty-hover-bg' as never]: tokens.surfaceSoft }}
              >
                <X size={18} style={{ color: tokens.drawerCloseIcon }} />
              </button>
            </div>
            {shouldShowExpiry && (
              <div
                className="flex items-center justify-center gap-1.5 text-xs mb-3"
                style={{ color: isExpired ? tokens.expiryExpiredText : tokens.expiryActiveText }}
              >
                <Clock size={12} />
                <span>{isExpired ? 'Giỏ hàng đã hết hạn' : `Giỏ hàng sẽ hết hạn sau ${expiryText}`}</span>
              </div>
            )}
            <div className="flex-1 overflow-auto">
              {mockCartItems.map(item => <CartItemRow key={item.id} item={item} tokens={tokens} />)}
            </div>
            {showNote && (
              <div className="mt-3">
                <textarea
                  className="w-full px-3 py-2 border rounded-lg text-sm resize-none placeholder:text-[var(--input-placeholder)]"
                  rows={2}
                  placeholder="Ghi chú đơn hàng..."
                  disabled
                  style={{
                    backgroundColor: tokens.inputBg,
                    borderColor: tokens.inputBorder,
                    color: tokens.inputText,
                    ['--input-placeholder' as never]: tokens.inputPlaceholder,
                  }}
                />
              </div>
            )}
            <div className="mt-3 pt-3 border-t" style={{ borderColor: tokens.border }}>
              <div className="flex justify-between mb-3">
                <span className="text-sm" style={{ color: tokens.summaryLabel }}>Tổng cộng</span>
                <span className="font-bold" style={{ color: tokens.summaryTotalValue }}>{formatVND(subtotal)}</span>
              </div>
              <button
                className="w-full py-2.5 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
              >
                Thanh toán
              </button>
            </div>
          </div>
        </div>
      ) : layoutStyle === 'table' ? (
        <div className="py-6 px-4">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl md:text-2xl font-bold" style={{ color: tokens.headingColor }}>Giỏ hàng</h1>
                <p className="text-sm" style={{ color: tokens.metaText }}>{mockCartItems.length} sản phẩm</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: tokens.searchIcon }} />
                  <input
                    className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm placeholder:text-[var(--input-placeholder)]"
                    placeholder="Tìm sản phẩm..."
                    disabled
                    style={{
                      backgroundColor: tokens.inputBg,
                      borderColor: tokens.inputBorder,
                      color: tokens.inputText,
                      ['--input-placeholder' as never]: tokens.inputPlaceholder,
                    }}
                  />
                </div>
                <select
                  className="w-full sm:w-44 rounded-lg border px-3 py-2 text-sm"
                  style={{ backgroundColor: tokens.inputBg, borderColor: tokens.inputBorder, color: tokens.inputText }}
                  disabled
                >
                  <option>Sắp xếp</option>
                </select>
              </div>
            </div>

            {shouldShowExpiry && (
              <div
                className="flex items-center gap-2 text-sm"
                style={{ color: isExpired ? tokens.expiryExpiredText : tokens.expiryActiveText }}
              >
                <Clock size={14} />
                <span>{isExpired ? 'Giỏ hàng đã hết hạn' : `Giỏ hàng sẽ hết hạn sau ${expiryText}`}</span>
              </div>
            )}

            {!isMobile ? (
              <div
                className="overflow-hidden rounded-xl border"
                style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}
              >
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: tokens.tableHeaderBg, color: tokens.tableHeaderText }}>
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Sản phẩm</th>
                      <th className="px-4 py-3 text-left font-medium">Đơn giá</th>
                      <th className="px-4 py-3 text-left font-medium">Số lượng</th>
                      <th className="px-4 py-3 text-left font-medium">Thành tiền</th>
                      <th className="px-4 py-3 text-right font-medium">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCartItems.map((item) => (
                      <tr key={item.id} className="border-t" style={{ borderColor: tokens.border }}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: tokens.thumbBg }}>
                              <div className="h-6 w-6 rounded" style={{ backgroundColor: tokens.surfaceMuted }} />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium line-clamp-1" style={{ color: tokens.bodyText }}>{item.name}</div>
                              {item.variantTitle && (
                                <div className="text-xs mt-1" style={{ color: tokens.metaText }}>{item.variantTitle}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-medium" style={{ color: tokens.priceText }}>{formatVND(item.price)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              className="w-6 h-6 rounded border flex items-center justify-center"
                              style={{ borderColor: tokens.quantityButtonBorder, backgroundColor: tokens.quantityButtonBg }}
                            >
                              <Minus size={12} style={{ color: tokens.quantityButtonIcon }} />
                            </button>
                            <span className="text-sm font-medium w-6 text-center" style={{ color: tokens.bodyText }}>{item.quantity}</span>
                            <button
                              className="w-6 h-6 rounded border flex items-center justify-center"
                              style={{ borderColor: tokens.quantityButtonBorder, backgroundColor: tokens.quantityButtonBg }}
                            >
                              <Plus size={12} style={{ color: tokens.quantityButtonIcon }} />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold" style={{ color: tokens.bodyText }}>{formatVND(item.price * item.quantity)}</td>
                        <td className="px-4 py-4 text-right">
                          <button
                            className="group p-2 rounded-lg hover:bg-[var(--action-hover-bg)]"
                            style={{ ['--action-hover-bg' as never]: tokens.actionHoverBg }}
                          >
                            <Trash2
                              size={14}
                              className="text-[var(--action-icon)] group-hover:text-[var(--action-icon-hover)]"
                              style={{
                                ['--action-icon' as never]: tokens.actionIcon,
                                ['--action-icon-hover' as never]: tokens.actionHoverIcon,
                              }}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-3">
                {mockCartItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border p-3"
                    style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                  >
                    <CartItemRow item={item} tokens={tokens} />
                  </div>
                ))}
              </div>
            )}

            <CartSummary subtotal={subtotal} tokens={tokens} />
          </div>
        </div>
      ) : (
        <div className="py-6 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold" style={{ color: tokens.headingColor }}>Giỏ hàng của bạn</h1>
                <p className="text-sm" style={{ color: tokens.metaText }}>{mockCartItems.length} sản phẩm</p>
              </div>
            </div>
            {shouldShowExpiry && (
              <div
                className="flex items-center justify-center gap-2 text-sm mb-4"
                style={{ color: isExpired ? tokens.expiryExpiredText : tokens.expiryActiveText }}
              >
                <Clock size={14} />
                <span>{isExpired ? 'Giỏ hàng đã hết hạn' : `Giỏ hàng sẽ hết hạn sau ${expiryText}`}</span>
              </div>
            )}
            <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-3 gap-6'}`}>
              <div
                className={`${isMobile ? '' : 'col-span-2'} rounded-xl border p-4`}
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                {mockCartItems.map(item => <CartItemRow key={item.id} item={item} tokens={tokens} />)}
              </div>
              <div>
                {showNote && (
                  <div
                    className="rounded-xl border p-4 mb-4"
                    style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
                  >
                    <h4 className="font-medium text-sm mb-2" style={{ color: tokens.bodyText }}>Ghi chú đơn hàng</h4>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg text-sm resize-none placeholder:text-[var(--input-placeholder)]"
                      rows={3}
                      placeholder="Ghi chú cho shop..."
                      disabled
                      style={{
                        backgroundColor: tokens.inputBg,
                        borderColor: tokens.inputBorder,
                        color: tokens.inputText,
                        ['--input-placeholder' as never]: tokens.inputPlaceholder,
                      }}
                    />
                  </div>
                )}
                <CartSummary subtotal={subtotal} tokens={tokens} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
