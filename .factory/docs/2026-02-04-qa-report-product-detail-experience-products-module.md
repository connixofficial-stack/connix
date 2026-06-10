# QA Report: Product Detail Experience & Products Module

## CRITICAL ISSUES (Cần fix ngay)

### ISSUE #1: Config Structure Mismatch - Experience Config không đồng bộ
**Severity**: HIGH  
**Location**: 
- `app/system/experiences/product-detail/page.tsx` (admin)
- `app/(site)/products/[slug]/page.tsx` (site)

**Problem**: 
Admin lưu config theo cấu trúc nested `layouts[layoutStyle]`:
```typescript
// Admin saves:
{
  layoutStyle: 'classic',
  layouts: {
    classic: { showRating, showWishlist, showAddToCart, showHighlights },
    modern: { showRating, showWishlist, showAddToCart, heroStyle },
    minimal: { showRating, showWishlist, showAddToCart, contentWidth }
  },
  showBuyNow: true
}
```

Nhưng Site reads theo cấu trúc flat:
```typescript
// Site reads:
{
  layoutStyle: 'classic',
  showAddToCart: boolean,      // ← FLAT, không phải layouts[x].showAddToCart
  showClassicHighlights: boolean,
  showRating: boolean,
  showWishlist: boolean,
  showBuyNow: boolean
}
```

**Impact**: Khi user thay đổi layout style từ Classic → Modern, các config toggle (showRating, showWishlist, showAddToCart) KHÔNG ÁP DỤNG vì site đọc sai cấu trúc.

**Fix**: Đồng bộ cấu trúc - Site cần đọc từ `config.layouts[config.layoutStyle]` HOẶC Admin cần save theo flat structure.

---

### ISSUE #2: showClassicHighlights vs showHighlights naming mismatch
**Severity**: MEDIUM  
**Location**: 
- Admin: `showHighlights` (trong `ClassicLayoutConfig`)
- Site: `showClassicHighlights` 
- Preview: `showClassicHighlights`

**Fix**: Đổi tên thống nhất thành `showClassicHighlights` ở tất cả.

---

### ISSUE #3: Layout-specific config không được apply cho site
**Severity**: HIGH  

**Problem**: Site's `useProductDetailExperienceConfig()` chỉ đọc các field ở root level:
```typescript
return {
  layoutStyle: raw?.layoutStyle ?? legacyStyle,
  showAddToCart: configShowAddToCart && cartAvailable,  // từ raw?.showAddToCart
  showClassicHighlights: raw?.showClassicHighlights ?? legacyHighlightsEnabled,
  showRating: raw?.showRating ?? true,  // từ raw?.showRating  
  showWishlist: raw?.showWishlist ?? true,
  showBuyNow: raw?.showBuyNow ?? true,
};
```

Không đọc từ `raw?.layouts?.[layoutStyle]?.showRating` → User toggle off showRating cho Modern layout, site vẫn hiện Rating.

---

## MEDIUM ISSUES

### ISSUE #4: Legacy settings sync có thể conflict
**Location**: `app/system/experiences/product-detail/page.tsx` line 131-134

**Problem**: Admin vẫn sync xuống legacy keys (`products_detail_style`, `products_detail_classic_highlights_enabled`), nhưng Site đọc từ experience setting first → có thể race condition nếu user save nhiều lần nhanh.

---

### ISSUE #5: heroStyle và contentWidth không được sử dụng trong site
**Location**: `app/(site)/products/[slug]/page.tsx`

**Problem**: Admin cho phép config `heroStyle` (full/split/minimal) cho Modern layout và `contentWidth` (narrow/medium/wide) cho Minimal layout, nhưng các Style components không sử dụng chúng.

---

## LOW ISSUES

### ISSUE #6: Missing type safety for ProductDetailExperienceConfig
**Problem**: Type định nghĩa khác nhau giữa admin và site, không share type.

---

## RECOMMENDED FIX APPROACH

### Option A: Fix Site để đọc nested config (Recommended - ít thay đổi hơn)

```typescript
// app/(site)/products/[slug]/page.tsx
function useProductDetailExperienceConfig(): ProductDetailExperienceConfig {
  // ... existing queries ...
  
  return useMemo(() => {
    const raw = experienceSetting?.value as any;
    const layoutStyle = raw?.layoutStyle ?? legacyStyle;
    
    // Đọc từ layouts[layoutStyle] nếu có, fallback về root level
    const layoutConfig = raw?.layouts?.[layoutStyle];
    
    return {
      layoutStyle,
      showAddToCart: (layoutConfig?.showAddToCart ?? raw?.showAddToCart ?? true) && cartAvailable,
      showClassicHighlights: layoutConfig?.showHighlights ?? raw?.showClassicHighlights ?? legacyHighlightsEnabled,
      showRating: layoutConfig?.showRating ?? raw?.showRating ?? true,
      showWishlist: layoutConfig?.showWishlist ?? raw?.showWishlist ?? true,
      showBuyNow: raw?.showBuyNow ?? true,
      // Layout-specific
      heroStyle: layoutConfig?.heroStyle ?? 'full',
      contentWidth: layoutConfig?.contentWidth ?? 'medium',
    };
  }, [experienceSetting?.value, legacyHighlightsEnabled, legacyStyle, cartAvailable]);
}
```

### Option B: Fix Admin để save flat config

Admin save config ở root level thay vì nested `layouts`, nhưng cách này mất tính năng "giữ config riêng cho mỗi layout".

---

## Files cần sửa:

1. `app/(site)/products/[slug]/page.tsx` - Fix `useProductDetailExperienceConfig()` 
2. `app/system/experiences/product-detail/page.tsx` - Đổi `showHighlights` → `showClassicHighlights`
3. `app/(site)/products/[slug]/page.tsx` - Áp dụng `heroStyle` và `contentWidth` vào UI components

---

## Checklist sau khi fix:

- [ ] Chuyển layout từ Classic → Modern → Minimal, verify UI thay đổi
- [ ] Toggle off showRating ở Modern layout, verify site không hiện rating
- [ ] Toggle off showWishlist, verify site không hiện heart button
- [ ] Toggle off showAddToCart, verify site không hiện cart button
- [ ] Config heroStyle cho Modern, verify UI thay đổi
- [ ] Config contentWidth cho Minimal, verify độ rộng content thay đổi