# Spec: Thêm style "circular" vào ComponentRenderer

## Vấn đề phát hiện
- **Preview (trang admin)**: Có 7 styles bao gồm "circular" → hiển thị OK ✅
- **ComponentRenderer (trang chủ thực)**: Chỉ có 6 styles, THIẾU "circular" → fallback về Marquee ❌
- User chọn "circular" trong admin → save OK → nhưng trang chủ không render đúng

## Root Cause
File `components/site/ComponentRenderer.tsx` - Hàm `ProductCategoriesSection()`:
- Dòng ~5645: `type ProductCategoriesStyle = 'grid' | 'carousel' | 'cards' | 'minimal' | 'showcase' | 'marquee';`
- Thiếu `'circular'` trong type definition
- Thiếu render logic cho style "circular"
- Fallback về Marquee khi style = 'circular'

## Giải pháp - Full Implementation

### 1. Update Type Definition
**File**: `components/site/ComponentRenderer.tsx` (dòng ~5645)

```diff
-type ProductCategoriesStyle = 'grid' | 'carousel' | 'cards' | 'minimal' | 'showcase' | 'marquee';
+type ProductCategoriesStyle = 'grid' | 'carousel' | 'cards' | 'minimal' | 'showcase' | 'marquee' | 'circular';
```

### 2. Thêm Circular Style Logic
**File**: `components/site/ComponentRenderer.tsx` (sau style "showcase", trước style "marquee")

Thêm đoạn code sau (copy từ preview, adjust cho ComponentRenderer):

```tsx
// Style 6: Circular - Horizontal scroll với circular containers (NEW)
if (style === 'circular') {
  return (
    <section className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 md:mb-8 text-center px-4 md:px-6">{title}</h2>
        <div
          className="flex overflow-x-auto scrollbar-hide pb-4 gap-4 md:gap-6 snap-x snap-mandatory px-4 md:px-6"
          style={{ WebkitOverflowScrolling: 'touch', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
        >
          {resolvedCategories.map((cat) => (
            <a
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="flex-shrink-0 snap-start group flex flex-col items-center w-28 md:w-36"
            >
              <div
                className="rounded-full overflow-hidden transition-all duration-300 mb-3"
                style={{
                  border: `2px solid ${brandColor}15`,
                  padding: '18px',
                  backgroundColor: `${brandColor}05`,
                  width: '100%',
                  aspectRatio: '1/1'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${brandColor}40`;
                  e.currentTarget.style.boxShadow = `0 4px 12px ${brandColor}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${brandColor}15`;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  {renderCategoryVisual(cat, 40)}
                </div>
              </div>
              <h3 className="font-semibold text-center text-sm line-clamp-1 w-full">{cat.name}</h3>
              {showProductCount && (
                <p className="text-xs text-slate-500 text-center">{cat.productCount} sản phẩm</p>
              )}
            </a>
          ))}
        </div>
      </div>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

// Style 7: Marquee - Auto-scrolling horizontal animation (đổi từ style 6 → 7)
```

### 3. Update Comment cho Marquee
**File**: `components/site/ComponentRenderer.tsx` (dòng ~6055)

```diff
-  // Style 6: Marquee - Auto-scrolling horizontal animation (default fallback)
+  // Style 7: Marquee - Auto-scrolling horizontal animation (default fallback)
```

## Chi tiết kỹ thuật

1. **Circular Style Features**:
   - Container tròn với border động theo brandColor
   - Horizontal scroll với snap points
   - Hover effects: border color + box shadow
   - Responsive: 112px (mobile) → 144px (desktop)
   - Aspect ratio 1:1 đảm bảo tròn đều

2. **Render Helper** (đã có sẵn):
   - `renderCategoryVisual()` - xử lý icon/image/fallback
   - `resolvedCategories` - data đã xử lý từ config

3. **CSS**:
   - `.scrollbar-hide` - ẩn scrollbar
   - `snap-x snap-mandatory` - scroll mượt
   - `WebkitOverflowScrolling: touch` - iOS smooth scroll

## Testing Steps
1. Admin: Chọn component đã có (ID: `js758g3nq5fh49e480xnbf6yqh8111nr`)
2. Chọn style "Circular"
3. Save
4. Mở trang chủ `/` → Xác nhận hiển thị tròn, không còn Marquee

## Files Changed
- `components/site/ComponentRenderer.tsx` (~60 dòng thêm)

## Checklist
- [ ] Update type definition: +`'circular'`
- [ ] Thêm render logic cho circular (sau showcase, trước marquee)
- [ ] Update comment "Style 7" cho Marquee
- [ ] Không cần sửa admin (đã OK)
- [ ] Test trên trang chủ
