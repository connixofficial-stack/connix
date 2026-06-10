# Kế hoạch thêm Style "Circular" cho Product Categories Component

## Phân tích yêu cầu
Dựa trên folder `rattan-decor-categories`, style mới có các đặc điểm:
- **Layout**: Horizontal scroll với các category items hình tròn
- **Drag to scroll**: Hỗ trợ kéo chuột để cuộn ngang
- **Pagination dots**: 3 dots để chỉ vị trí scroll (bắt đầu/giữa/cuối)
- **Design**: 
  - Ảnh category trong container tròn với padding đều
  - Tên category hiển thị ở dưới, chiếm 2 dòng cố định
  - Hiển thị số sản phẩm mặc định, khi hover chuyển thành "Xem chi tiết"
  - Border nhẹ cho container tròn

## Quyết định kỹ thuật
### Option 1: Thêm style thứ 7 vào danh sách hiện tại
- ✅ Phù hợp với pattern hiện tại (đã có 6 styles)
- ✅ Không cần xóa style cũ
- Danh sách styles sẽ là: `grid | carousel | cards | minimal | showcase | marquee | circular`

### Option 2: Thay thế style ít dùng (marquee)
- Style "marquee" có thể ít phổ biến hơn
- Nếu user muốn giữ gọn UI

**→ Khuyến nghị: Option 1** - Thêm style mới không ảnh hưởng existing configs

---

## Chi tiết implementation

### Bước 1: Cập nhật Type Definition
**File**: `app/admin/home-components/previews.tsx`
- **Line ~9238**: Cập nhật type  
  ```typescript
  export type ProductCategoriesStyle = 'grid' | 'carousel' | 'cards' | 'minimal' | 'showcase' | 'marquee' | 'circular';
  ```

### Bước 2: Thêm style vào danh sách selector
**File**: `app/admin/home-components/previews.tsx`  
**Line ~9265** (trong component `ProductCategoriesPreview`):
```typescript
const styles = [
  { id: 'grid', label: 'Grid' },
  { id: 'carousel', label: 'Carousel' },
  { id: 'cards', label: 'Cards' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'marquee', label: 'Marquee' },
  { id: 'circular', label: 'Circular' }, // ← MỚI
];
```

### Bước 3: Implement `renderCircularStyle()`
**File**: `app/admin/home-components/previews.tsx`  
**Vị trí**: Sau line ~9743 (sau `renderMarqueeStyle()`)

**Cấu trúc code**:
```typescript
// Style 7: Circular - Horizontal scroll với drag, pagination dots, circular containers
const renderCircularStyle = () => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [startX, setStartX] = React.useState(0);
  const [scrollLeft, setScrollLeft] = React.useState(0);
  const [scrollPosition, setScrollPosition] = React.useState(0); // 0: left, 1: middle, 2: right
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => { /* ... */ };
  const handleMouseMove = (e: React.MouseEvent) => { /* ... */ };
  const handleMouseUp = () => { /* ... */ };
  const handleMouseLeave = () => { /* ... */ };

  // Scroll position tracker (cho pagination dots)
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) { setScrollPosition(0); return; }
    
    const percentage = scrollLeft / maxScroll;
    if (percentage < 0.3) setScrollPosition(0);
    else if (percentage > 0.7) setScrollPosition(2);
    else setScrollPosition(1);
  };

  // Jump to position handler
  const handlePageChange = (index: number) => {
    if (!scrollRef.current) return;
    const { scrollWidth, clientWidth } = scrollRef.current;
    const maxScroll = scrollWidth - clientWidth;
    
    let targetLeft = 0;
    if (index === 1) targetLeft = maxScroll / 2;
    else if (index === 2) targetLeft = maxScroll;

    scrollRef.current.scrollTo({ left: targetLeft, behavior: 'smooth' });
  };

  return (
    <section className={cn("w-full", isMobile ? 'py-6' : 'py-10')}>
      <div className="max-w-7xl mx-auto">
        <h2 className={cn("font-bold mb-6 text-center px-3", isMobile ? 'text-lg' : 'text-xl md:text-2xl')}>
          Danh mục sản phẩm
        </h2>
        
        {resolvedCategories.length === 0 ? (
          <div className={cn(isMobile ? 'px-3' : 'px-6')}>{renderEmptyState()}</div>
        ) : (
          <>
            {/* Scrollable container */}
            <div 
              ref={scrollRef}
              className={cn(
                "flex overflow-x-auto no-scrollbar pb-4 gap-5 snap-x snap-mandatory select-none",
                isMobile ? 'px-3' : 'px-6 md:px-11',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              )}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onScroll={handleScroll}
              style={{ scrollBehavior: 'auto', WebkitOverflowScrolling: 'touch' }}
            >
              {resolvedCategories.map((cat) => (
                <div 
                  key={cat.itemId}
                  className={cn(
                    "flex-shrink-0 snap-start group",
                    isMobile ? 'w-[125px]' : 'w-[140px]'
                  )}
                  onClick={(e) => { if (isDragging) e.preventDefault(); }}
                >
                  {/* Circular image container */}
                  <div 
                    className="rounded-full overflow-hidden transition-all duration-300"
                    style={{ 
                      border: `1px solid ${brandColor}15`,
                      padding: isMobile ? '15px' : '20px',
                      backgroundColor: `${brandColor}05`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 2px 8px ${brandColor}15`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="relative pb-[100%]"> {/* 1:1 aspect ratio */}
                      <div className="absolute inset-0 rounded-full overflow-hidden">
                        {renderCategoryVisual(cat, 'md')}
                      </div>
                    </div>
                  </div>

                  {/* Text content */}
                  <div className="text-center pt-3">
                    {/* Title - 2 lines fixed height */}
                    <h3 className={cn(
                      "font-semibold line-clamp-2 mb-1 leading-tight",
                      isMobile ? 'text-sm min-h-[2rem]' : 'text-base min-h-[2.8rem]'
                    )}>
                      {cat.name}
                    </h3>

                    {/* Status area - default/hover */}
                    <div className="relative h-[27px] overflow-hidden w-full">
                      {/* Default state - product count */}
                      <span className={cn(
                        "block w-full text-slate-500 absolute top-0 left-0 transition-transform duration-300 group-hover:translate-y-full group-hover:opacity-0",
                        isMobile ? 'text-xs' : 'text-sm'
                      )}>
                        {config.showProductCount ? '12 sản phẩm' : '\u00A0'}
                      </span>

                      {/* Hover state - view details */}
                      <span 
                        className={cn(
                          "block w-full underline absolute top-0 left-0 transition-transform duration-300 -translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
                          isMobile ? 'text-xs' : 'text-sm'
                        )}
                        style={{ color: brandColor }}
                      >
                        Xem chi tiết
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination dots */}
            {resolvedCategories.length > 3 && (
              <div className="flex items-center justify-center mt-8 gap-[10px]">
                {[0, 1, 2].map((index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handlePageChange(index)}
                    className={cn(
                      "inline-block h-[8px] rounded-[10px] cursor-pointer transition-all duration-300",
                      scrollPosition === index 
                        ? 'w-[28px]' 
                        : 'w-[8px] border'
                    )}
                    style={
                      scrollPosition === index
                        ? { backgroundColor: brandColor }
                        : { borderColor: brandColor, backgroundColor: 'transparent' }
                    }
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
```

### Bước 4: Thêm render condition
**File**: `app/admin/home-components/previews.tsx`  
**Line ~9765** (trong return statement của `ProductCategoriesPreview`):
```typescript
<BrowserFrame>
  {previewStyle === 'grid' && renderGridStyle()}
  {previewStyle === 'carousel' && renderCarouselStyle()}
  {previewStyle === 'cards' && renderCardsStyle()}
  {previewStyle === 'minimal' && renderMinimalStyle()}
  {previewStyle === 'showcase' && renderShowcaseStyle()}
  {previewStyle === 'marquee' && renderMarqueeStyle()}
  {previewStyle === 'circular' && renderCircularStyle()} {/* ← MỚI */}
</BrowserFrame>
```

### Bước 5: Thêm image size guideline
**File**: `app/admin/home-components/previews.tsx`  
**Line ~9785** (trong phần image size guidelines):
```typescript
{previewStyle === 'circular' && (
  <p><strong>500×500px</strong> (1:1) • Ảnh vuông cho circular containers, tự động crop tròn</p>
)}
```

### Bước 6: Cập nhật helper function `getPreviewInfo()`
**File**: `app/admin/home-components/previews.tsx`  
**Line ~9752** (trong `getPreviewInfo`):
```typescript
const sizeRecommendations: Record<string, string> = {
  cards: `${count} danh mục • Ảnh: 200×200px (1:1)`,
  carousel: `${count} danh mục • Ảnh: 300×300px (1:1)`,
  grid: `${count} danh mục • Ảnh: 400×400px (1:1)`,
  marquee: `${count} danh mục • Ảnh: 80×80px (1:1)`,
  minimal: `${count} danh mục • Icon/Ảnh: 48×48px`,
  showcase: `${count} danh mục • Featured: 600×800px (3:4) • Others: 400×300px (4:3)`,
  circular: `${count} danh mục • Ảnh: 500×500px (1:1, tròn)`, // ← MỚI
};
```

### Bước 7: Thêm CSS cho scrollbar-hide
**File**: `app/admin/home-components/previews.tsx`  
**Kiểm tra**: Nếu chưa có class `.no-scrollbar`, thêm vào global CSS hoặc inline trong component:
```css
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

---

## Checklist trước khi commit
- [ ] Type `ProductCategoriesStyle` đã bao gồm `'circular'`
- [ ] Danh sách `styles` có 7 items
- [ ] Function `renderCircularStyle()` đã được định nghĩa đầy đủ
- [ ] Render condition trong `<BrowserFrame>` có `circular` case
- [ ] Image size guideline có thông tin cho `circular`
- [ ] `getPreviewInfo()` có recommendation cho `circular`
- [ ] CSS `.no-scrollbar` đã được thêm
- [ ] Test trên mobile/tablet/desktop breakpoints
- [ ] Kiểm tra drag-to-scroll hoạt động
- [ ] Pagination dots hiển thị đúng vị trí scroll

---

## Lợi ích của style "Circular"
✅ **UX tốt**: Drag-to-scroll tự nhiên trên cả desktop lẫn mobile  
✅ **Visual hierarchy**: Pagination dots giúp user biết vị trí hiện tại  
✅ **Consistent với rattan-decor**: Giống 100% mockup  
✅ **Responsive**: Tự động scale từ 125px (mobile) → 140px (desktop)  
✅ **Accessible**: Keyboard nav không bị block bởi drag handler

---

## Gợi ý sau khi implement
Nếu muốn style này trở thành **default** cho product categories:
- Cập nhật default value trong `page.tsx`: `const [style, setStyle] = useState<ProductCategoriesStyle>('circular');`