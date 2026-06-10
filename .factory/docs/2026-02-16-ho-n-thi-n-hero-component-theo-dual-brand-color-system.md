
## Color Review: Hero Component (6 Layouts)

### Issues tìm thấy

#### 1. Placeholder colors vi phạm Rule 5
- **`colors.ts`**: Tất cả layout (slider, fade, bento, fullscreen, parallax) dùng `getPrimaryTint(0.35-0.4)` cho placeholder background
- **`HeroPreview.tsx`**: `getBrandColors().getPlaceholder()` trả về `getTint(primary, 0.4)` cho bg
- **Cần fix**: Placeholder bg phải là neutral (`#f1f5f9` / slate-100), chỉ icon mới dùng primary solid

#### 2. Harmony selector chỉ hiện cho Slider (single mode)
- **`HeroForm.tsx` line 39**: `brandMode === 'single' && heroStyle === 'slider'`
- **Cần fix**: Bỏ điều kiện `heroStyle === 'slider'`, harmony phải apply cho **tất cả 6 layouts** khi ở single mode

#### 3. Slider/Fade/Bento thiếu brand presence khi có data thật
- **Slider**: Primary chỉ dùng cho dots, secondary cho nav icon → quá ít khi có ảnh thật
- **Fade**: Chỉ thumbnail border dùng brand color → quá ít
- **Bento**: Chỉ main image ring dùng secondary → quá ít khi có ảnh

Tuy nhiên đây là **image-only layouts** (không có text overlay), nên brand color chủ yếu thể hiện qua nav controls, dots, borders. Điều này **chấp nhận được** vì ảnh chiếm ~90% diện tích.

#### 4. Fullscreen/Split/Parallax - đạt yêu cầu
- ✅ Primary >= 3 elements (CTA, dots/progress, badge dot)
- ✅ Secondary >= 2 elements có diện tích đủ (badge bg, overlay/nav)
- ⚠️ Chỉ cần fix placeholder bg

---

### Fix Plan

#### File 1: `hero/_lib/colors.ts`
Sửa placeholder bg thành neutral cho tất cả layout functions:

```ts
// getSliderColors - line ~140
placeholderBg: '#f1f5f9', // slate-100, KHÔNG dùng primaryPalette.surface

// getFadeColors - line ~155  
placeholderBg: '#f1f5f9',

// getBentoColors - gridTint1-4 giữ nguyên (đây là content state, không phải placeholder)
// Nhưng placeholder icon container thì bg phải neutral

// getFullscreenColors
placeholderBg: '#f1f5f9',

// getParallaxColors
placeholderBg: '#f1f5f9',
```

#### File 2: `hero/_components/HeroPreview.tsx`
- Sửa `renderPlaceholder()` để default background là `#f1f5f9` thay vì lấy từ `placeholderColors.background` (primary tint)
- Text placeholder dùng `#64748b` (slate-500)

#### File 3: `hero/_components/HeroForm.tsx`
- Bỏ điều kiện `heroStyle === 'slider'` ở harmony selector → hiện cho tất cả layouts khi single mode:

```tsx
// BEFORE
{brandMode === 'single' && heroStyle === 'slider' && (

// AFTER  
{brandMode === 'single' && (
```

---

### Color Role Matrix (6 layouts)

| Element | Slider | Fade | Bento | Fullscreen | Split | Parallax |
|---------|--------|------|-------|------------|-------|----------|
| CTA button | - | - | - | primary fill | primary fill | primary fill |
| Badge bg | - | - | - | secondary tint | secondary tint | secondary tint |
| Badge text | - | - | - | secondary solid | secondary solid | secondary solid |
| Nav icon | secondary | - | - | - | secondary | white |
| Nav border | secondary tint | - | - | - | - | - |
| Dot active | primary | - | - | primary | primary | - |
| Thumbnail border | - | primary/secondary | - | - | - | - |
| Image ring | - | - | secondary tint | - | - | - |
| Grid tints | - | - | primary tint ×4 | - | - | - |
| Placeholder bg | **neutral** | **neutral** | - | **neutral** | slate | **neutral** |
| Placeholder icon | primary | primary | primary | primary | slate | primary |

### Không thay đổi
- `getHeroColors()` function (dùng cho header bar) - giữ nguyên
- Logic `resolveSecondaryColor()` - đã đúng
- Similarity check - đã đúng
- OKLCH palette generation - đã đúng
- APCA text color - đã đúng
