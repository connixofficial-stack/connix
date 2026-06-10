## Kế hoạch cải thiện Dual Brand Color System và fix layout Fade

### 1. Cập nhật Skill Dual Brand Color System
**File: `.factory/skills/dual-brand-color-system/SKILL.md`**
- Thêm section mới: "Placeholder vs Content Colors"
- Cập nhật Core Rules #5: Placeholder phải tôn màu brand
- Thêm pattern mới: "Placeholder should use subtle brand colors"
- Thêm utility function: `getPlaceholderColors()` cho different states

**File: `.factory/skills/dual-brand-color-system/examples/color-utils.ts`**
- Thêm function `getPlaceholderColors()` với logic:
  - Khi mode=dual: dùng primary tint 40% cho background
  - Khi mode=single: dùng primary tint 30% cho background
  - Icon color: luôn dùng primary solid
  - Text color: dùng muted text color

### 2. Fix Layout Fade Color Display
**File: `app/admin/home-components/hero/_components/HeroPreview.tsx`**
- Fix `renderPlaceholder()` function (line ~95-110):
  - Remove gradient background `from-slate-800 to-slate-900`
  - Chỉ sử dụng `backgroundColor` được truyền vào
  - Giữ nguyên icon và text styling

### 3. Cập nhật Fade Color Scheme Logic
**File: `app/admin/home-components/hero/_lib/colors.ts`**
- Update `getFadeColors()` function:
  - `placeholderBg`: dùng primary tint 40% (thay vì tự động tính)
  - `placeholderIconColor`: dùng primary solid
  - `thumbnailBorderActive`: dùng secondary solid (khi mode=dual)
  - `thumbnailBorderInactive`: transparent

### 4. Update getBrandColors utility
**File: `lib/utils/colors.ts`**
- Thêm method `placeholder` vào BrandPalette interface
- Generate placeholder colors với tint/subtle variants

### Expected Outcome
- Placeholder sẽ hiển thị đúng màu brand (subtle primary tint)
- Layout Fade sẽ respect color scheme
- Skill sẽ có hướng dẫn rõ ràng cho placeholder vs content states
- Tất cả layouts sẽ đồng nhất trong cách xử lý placeholder colors