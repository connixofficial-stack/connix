import React, { useMemo } from 'react';
import { Bell, Heart, ShoppingCart, Trash2, X } from 'lucide-react';
import { getWishlistColors } from '@/components/site/wishlist/colors';

type WishlistPreviewProps = {
  layoutStyle: 'grid' | 'list' | 'table';
  showWishlistButton: boolean;
  showNote: boolean;
  showNotification: boolean;
  showAddToCartButton?: boolean;
  device?: 'desktop' | 'tablet' | 'mobile';
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
};

const mockWishlistItems = [
  { id: 1, name: 'iPhone 15 Pro Max 256GB', category: 'Điện thoại', price: 34990000, originalPrice: 36990000, inStock: true, rating: 4.8 },
  { id: 2, name: 'MacBook Pro 14" M3 Pro', category: 'Laptop', price: 52990000, originalPrice: null, inStock: true, rating: 4.9 },
  { id: 3, name: 'AirPods Pro 2nd Gen', category: 'Phụ kiện', price: 6490000, originalPrice: 6990000, inStock: false, rating: 4.6 },
];

const formatVND = (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export function WishlistPreview({
  layoutStyle,
  showWishlistButton,
  showNote,
  showNotification,
  showAddToCartButton = true,
  device = 'desktop',
  brandColor = '#ec4899',
  secondaryColor,
  colorMode = 'single',
}: WishlistPreviewProps) {
  const isMobile = device === 'mobile';
  const gridCols = isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3';
  const tokens = useMemo(
    () => getWishlistColors(brandColor, secondaryColor, colorMode),
    [brandColor, secondaryColor, colorMode]
  );

  return (
    <div className="py-6 px-4 min-h-[300px]" style={{ backgroundColor: tokens.pageBackground }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6" style={{ color: tokens.iconPrimary }} fill={tokens.iconPrimary} />
            <div>
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: tokens.headingColor }}>Sản phẩm yêu thích</h1>
              <p className="text-sm" style={{ color: tokens.metaText }}>{mockWishlistItems.length} sản phẩm</p>
            </div>
          </div>
          {showWishlistButton && (
            <button
              className="text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: tokens.secondaryButtonBg, color: tokens.secondaryButtonText }}
            >
              Thêm tất cả vào giỏ
            </button>
          )}
        </div>

        {layoutStyle === 'grid' && (
          <div className={`grid ${gridCols} gap-4`}>
            {mockWishlistItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border overflow-hidden shadow-sm"
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                <div
                  className="aspect-square relative flex items-center justify-center"
                  style={{ backgroundColor: tokens.surfaceSoft }}
                >
                  <div className="w-20 h-20 rounded-lg" style={{ backgroundColor: tokens.skeletonHighlight }} />
                  {!item.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: tokens.overlayBg }}>
                      <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: tokens.overlayBg, color: tokens.overlayText }}>Hết hàng</span>
                    </div>
                  )}
                  <button
                    className="absolute top-2 right-2 p-1.5 rounded-full"
                    style={{ backgroundColor: tokens.surface, color: tokens.actionIcon }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-medium text-sm line-clamp-2" style={{ color: tokens.bodyText }}>{item.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold" style={{ color: tokens.priceText }}>{formatVND(item.price)}</span>
                    {item.originalPrice && (
                      <span className="text-xs line-through" style={{ color: tokens.priceOriginalText }}>{formatVND(item.originalPrice)}</span>
                    )}
                  </div>
                  {showNote && (
                    <div className="rounded-lg p-2 text-xs" style={{ backgroundColor: tokens.noteBg, color: tokens.noteText }}>
                      <span className="font-medium">Ghi chú:</span> Mua khi giảm giá
                    </div>
                  )}
                  {showNotification && (
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: tokens.notificationText }}>
                      <Bell size={12} style={{ color: tokens.notificationIcon }} />
                      <span>Thông báo khi giảm giá</span>
                    </div>
                  )}
                  {showAddToCartButton && (
                    <button 
                      className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                      disabled={!item.inStock}
                    >
                      <ShoppingCart size={14} />
                      {item.inStock ? 'Thêm vào giỏ' : 'Hết hàng'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {layoutStyle === 'list' && (
          <div className="space-y-3">
            {mockWishlistItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-4 flex gap-4 items-start shadow-sm"
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                <div
                  className="w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center relative"
                  style={{ backgroundColor: tokens.surfaceSoft }}
                >
                  <div className="w-12 h-12 rounded" style={{ backgroundColor: tokens.skeletonHighlight }} />
                  {!item.inStock && (
                    <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ backgroundColor: tokens.overlayBg }}>
                      <span className="text-xs" style={{ color: tokens.overlayText }}>Hết</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm line-clamp-1" style={{ color: tokens.bodyText }}>{item.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-bold" style={{ color: tokens.priceText }}>{formatVND(item.price)}</span>
                    {item.originalPrice && (
                      <span className="text-xs line-through" style={{ color: tokens.priceOriginalText }}>{formatVND(item.originalPrice)}</span>
                    )}
                  </div>
                  {showNote && (
                    <div className="mt-2 rounded p-1.5 text-xs" style={{ backgroundColor: tokens.noteBg, color: tokens.noteText }}>
                      Ghi chú: Cần mua khi giảm giá
                    </div>
                  )}
                  {showNotification && (
                    <div className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: tokens.notificationText }}>
                      <Bell size={12} style={{ color: tokens.notificationIcon }} />
                      <span>Thông báo khi giảm giá</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button className="p-1.5 rounded" style={{ color: tokens.actionIcon }}>
                    <X size={16} />
                  </button>
                  {showAddToCartButton && (
                    <button 
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                      style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                      disabled={!item.inStock}
                    >
                      <ShoppingCart size={12} />
                      Thêm
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {layoutStyle === 'table' && !isMobile && (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: tokens.tableHeaderBg, color: tokens.tableHeaderText }}>
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Sản phẩm</th>
                  <th className="px-4 py-3 text-left font-medium">Giá</th>
                  <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-3 text-left font-medium">Đánh giá</th>
                  <th className="px-4 py-3 text-right font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {mockWishlistItems.map((item) => (
                  <tr key={item.id} className="border-t" style={{ borderColor: tokens.tableRowBorder }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: tokens.surfaceSoft }}>
                          <div className="h-6 w-6 rounded" style={{ backgroundColor: tokens.skeletonHighlight }} />
                        </div>
                        <div>
                          <div className="font-medium line-clamp-2" style={{ color: tokens.bodyText }}>{item.name}</div>
                          <div className="text-xs" style={{ color: tokens.metaText }}>{item.category}</div>
                          {showNote && (
                            <div className="text-xs mt-1" style={{ color: tokens.mutedText }}>Ghi chú: Mua khi giảm giá</div>
                          )}
                          {showNotification && (
                            <div className="flex items-center gap-1 text-xs mt-1" style={{ color: tokens.notificationText }}>
                              <Bell size={12} style={{ color: tokens.notificationIcon }} />
                              <span>Thông báo khi giảm giá</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold" style={{ color: tokens.priceText }}>{formatVND(item.price)}</div>
                      {item.originalPrice && (
                        <div className="text-xs line-through" style={{ color: tokens.priceOriginalText }}>{formatVND(item.originalPrice)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: item.inStock ? tokens.badgeInStockBg : tokens.badgeOutStockBg,
                          color: item.inStock ? tokens.badgeInStockText : tokens.badgeOutStockText,
                        }}
                      >
                        {item.inStock ? 'Sẵn hàng' : 'Hết hàng'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium" style={{ color: tokens.ratingText }}>{item.rating.toFixed(1)} / 5</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-2 rounded-lg" style={{ color: tokens.actionIcon }}>
                          <Trash2 size={14} />
                        </button>
                        {showAddToCartButton && (
                          <button
                            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                            style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                            disabled={!item.inStock}
                          >
                            <ShoppingCart size={12} />
                            Thêm
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {layoutStyle === 'table' && isMobile && (
          <div className="space-y-3">
            {mockWishlistItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border p-3 flex gap-3"
                style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}
              >
                <div className="h-20 w-20 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: tokens.surfaceSoft }}>
                  <div className="h-10 w-10 rounded" style={{ backgroundColor: tokens.skeletonHighlight }} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-xs" style={{ color: tokens.metaText }}>{item.category}</div>
                  <div className="font-medium line-clamp-2 text-sm" style={{ color: tokens.bodyText }}>{item.name}</div>
                  <div className="text-xs" style={{ color: tokens.ratingText }}>{item.rating.toFixed(1)} / 5</div>
                  <div className="font-semibold" style={{ color: tokens.priceText }}>{formatVND(item.price)}</div>
                  {showNote && (
                    <div className="text-xs" style={{ color: tokens.mutedText }}>Ghi chú: Mua khi giảm giá</div>
                  )}
                  {showNotification && (
                    <div className="flex items-center gap-1 text-xs" style={{ color: tokens.notificationText }}>
                      <Bell size={12} style={{ color: tokens.notificationIcon }} />
                      <span>Thông báo khi giảm giá</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button className="p-1.5 rounded" style={{ color: tokens.actionIcon }}>
                    <X size={16} />
                  </button>
                  {showAddToCartButton && (
                    <button
                      className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                      style={{ backgroundColor: tokens.primaryButtonBg, color: tokens.primaryButtonText }}
                      disabled={!item.inStock}
                    >
                      <ShoppingCart size={12} />
                      Thêm
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
