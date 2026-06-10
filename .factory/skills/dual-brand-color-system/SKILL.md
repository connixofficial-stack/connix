---
name: dual-brand-color-system
description: Chuẩn hóa hệ thống phân phối màu cho home-components theo OKLCH + APCA. Dùng khi review/refactor màu component hiện tại, hoặc tạo home-component mới cần 1 màu (tint/shade đẹp) hay 2 màu (dual brand).
version: 13.0.0
---

# Dual Brand Color System (Home Components)

## Mục tiêu

- 1 màu: tự sinh **tint/shade** đẹp, đồng đều (OKLCH)
- 2 màu: **dual brand** với primary + secondary
- Text luôn **đủ contrast** (APCA)
- UI đảm bảo **60-30-10 rule**

## Khi nào dùng

- Tạo mới home-component (hero, cta, stats, partners, ...)
- Review/fix màu của component đã có
-## Không dùng khi

- Admin pages / dashboard (đi theo theme admin chung)
- Icon-only color (dùng currentColor)
- UI components chung (button/input) đã có design tokens

---

## Quick Start

### A. Review existing component

1. Mở file colors: `app/admin/home-components/<component>/_lib/colors.ts`
2. Kiểm tra HSL / getTint / getShade
3. Đổi sang OKLCH (culori)
4. Dùng APCA để kiểm tra contrast (không auto-fix text về neutral)
5. Tính accent balance (calculateAccentBalance)

### B. Create new component

1. Copy `examples/color-utils.ts` → đổi tên `get<Comp>Colors`
2. Dùng `getAPCATextColor` cho text on solid
3. Dùng `examples/theme-engine-ui.tsx` làm UI mẫu

---

## Core Principles

### 1) OKLCH Only

- Dùng OKLCH để generate tint/shade, không dùng HSL
- Ưu tiên chỉnh L/C/H có clamp để tránh wash-out

### 2) APCA Contrast

- Text/UI nên pass APCA thresholds
- Icon trên nền solid (ví dụ icon check trong badge/shield layout Cards) phải guard APCA như text
- Luôn dùng `Math.abs(APCAcontrast(...))`
- Bắt buộc pipeline APCA: `hex -> rgb tuple -> sRGBtoY -> APCAcontrast`
- **Cấm** gọi `APCAcontrast('#fff', '#000')` hoặc truyền hex/string trực tiếp vào APCA
- `ensureAPCATextColor(...)` phải là guard thật: check LC của màu preferred theo threshold, fail thì fallback `getAPCATextColor(...)`
- **Cấm** `ensureAPCATextColor` no-op kiểu `void background; return preferred`
- **Không auto-fix text về neutral** khi fail APCA; giữ màu brand theo cấu hình

### 3) 60-30-10 Distribution (đo tại content state)

- 60% Neutral: background/surface/body text
- 30% Primary: section heading (h2), CTA, icon containers, active state
- 10% Secondary: subtitle/label, badge, tag, secondary action, decorative accent
- Placeholder **không tính vào tỷ lệ** và luôn dùng neutral cho background

### 4) Accent Prominence

- Gán primary/secondary theo **accent count + tier**
- Lone accent luôn primary; 2 accents: lớn hơn = primary
- Tier S yêu cầu APCA cao hơn (>= 60)

### 5) Single Mode = Monochromatic (STRICT)

**BẮT BUỘC:**
- Single mode: `resolveSecondary()` PHẢI return `primary` (monochromatic)
- Dual mode: `resolveSecondary()` return `secondary` nếu hợp lệ, fallback `primary`

**UI Display Rules:**
- KHÔNG hiển thị secondary color info khi mode = 'single'
- KHÔNG hiển thị accent balance (P%/S%/N%) khi mode = 'single'
- Chỉ hiển thị Primary color swatch + hex
- Chỉ hiển thị Primary color swatch + hex

**ColorInfoPanel (dual mode):**
- Panel chuẩn: hiển thị "Màu chính/Màu phụ" + mô tả áp dụng màu phụ
- Chỉ render khi `mode === 'dual'` và `secondary` hợp lệ.
- Vị trí **bắt buộc**: render `ColorInfoPanel` ngay dưới `PreviewWrapper` (outside wrapper)

**Pattern chuẩn:**
```typescript
const resolveSecondary = (primary, secondary, mode, harmony) => {
  if (mode === 'single') {
    return primary;  // ✅ Monochromatic
  }

  if (secondary.trim() && isValidHexColor(secondary)) {
    return secondary;
  }

  return primary; // Fallback to primary
};
```

### 6) Single Source of Truth

- Render ≡ Preview, dùng chung helper trong `_lib/colors.ts`
- Không hardcode màu ở site nếu preview đã dùng helper

### 6.1) Experiences Color Config (Convention over Configuration)

**Áp dụng cho:** Experience pages (`app/system/experiences/*`)

**Quy tắc bắt buộc:**
- Load màu từ settings làm default: `const brandColors = useBrandColors()`
- Initialize state với **TẤT CẢ 3 giá trị**: `primary`, `secondary`, `mode`
- Sync với settings khi thay đổi: sync cả 3 giá trị trong 1 useEffect
- Có ColorConfigCard UI để user override màu trong preview
- Preview real-time khi thay đổi màu (không cần save)

**Pattern chuẩn (Experiences):**
```typescript
// ✅ Load TẤT CẢ từ settings (CoC)
const brandColors = useBrandColors();
const [brandColor, setBrandColor] = useState(brandColors.primary);
const [secondaryColor, setSecondaryColor] = useState(brandColors.secondary || '');
const [colorMode, setColorMode] = useState<'single' | 'dual'>(brandColors.mode || 'single');

// CRITICAL: Sync CẢ 3 giá trị với settings
useEffect(() => {
  setBrandColor(brandColors.primary);
  setSecondaryColor(brandColors.secondary || '');
  setColorMode(brandColors.mode || 'single');
}, [brandColors.primary, brandColors.secondary, brandColors.mode]);

// Preview props
const getPreviewProps = () => ({
  // ... other props
  brandColor,
  secondaryColor,
  colorMode,
});
```

**Anti-pattern:**
```typescript
// ❌ Chỉ load primary, bỏ qua secondary và mode
const [brandColor, setBrandColor] = useState(brandColors.primary);
const [secondaryColor, setSecondaryColor] = useState(''); // ❌ Hardcode
const [colorMode, setColorMode] = useState<'single' | 'dual'>('single'); // ❌ Hardcode

// ❌ Chỉ sync primary
useEffect(() => {
  setBrandColor(brandColors.primary);
}, [brandColors.primary]); // ❌ Thiếu secondary và mode

// Kết quả: User set dual + 2 màu ở /admin/settings
// nhưng experience vẫn hiện single + 1 màu
```

**Behavior mong đợi:**
- User set **Dual mode + 2 màu** ở `/admin/settings`
- F5 tại experience → Toggle "Hai màu" được chọn sẵn + 2 màu hiển thị đúng
- User set **Single mode** ở `/admin/settings`
- F5 tại experience → Toggle "Đơn sắc" được chọn sẵn + chỉ 1 màu

**UI Components cần có:**
- `ColorConfigCard`: Toggle single/dual mode + color pickers
- Render trong grid controls cùng với các ControlCard khác
- Accent color của buttons/toggles phải match với brand color

**Lợi ích:**
- User không cần config màu lại cho mỗi experience
- Màu nhất quán với brand settings (cả mode và secondary)
- Vẫn cho phép override trong preview để test
- Tuân thủ Rails Convention over Configuration

### 6.2) Site Implementation (Single Source of Truth)

**Áp dụng cho:** Site pages render thực tế (`app/(site)/*`)

**Quy tắc bắt buộc:**
- Site PHẢI dùng CÙNG helper với Preview: `get<Component>Colors()`
- KHÔNG hardcode colors inline (`style={{ backgroundColor: brandColor }}`)
- PHẢI pass `tokens` object vào tất cả layout components
- PHẢI thay thế TẤT CẢ inline colors bằng semantic tokens
- **Layout components PHẢI có `tokens` prop trong signature**

**Pattern chuẩn (Site Page):**
```typescript
// ✅ Load màu từ settings
const brandColors = useBrandColors();
const brandColor = brandColors.primary;

// ✅ Generate tokens từ helper (CÙNG với Preview)
const tokens = useMemo(
  () => getProductDetailColors(brandColors.primary, brandColors.secondary, brandColors.mode),
  [brandColors.primary, brandColors.secondary, brandColors.mode]
);

// ✅ Pass tokens vào component
<ClassicStyle
  product={productData}
  brandColor={brandColor}
  tokens={tokens}
  // ... other props
/>

// ✅ Component dùng tokens thay vì brandColor inline
function ClassicStyle({ tokens, ... }) {
  return (
    <div>
      <h1 style={{ color: tokens.productName }}>{product.name}</h1>
      <span style={{ color: tokens.priceColor }}>{price}</span>
      <button style={{ 
        backgroundColor: tokens.addToCartButton, 
        color: tokens.addToCartButtonText 
      }}>
        Thêm vào giỏ
      </button>
      <button style={{ 
        borderColor: tokens.buyNowButton, 
        color: tokens.buyNowButton 
      }}>
        Mua ngay
      </button>
    </div>
  );
}
```

**Anti-pattern:**
```typescript
// ❌ Không dùng helper, hardcode màu
const brandColor = useBrandColor();
// Không có tokens

// ❌ Component dùng brandColor inline
function ClassicStyle({ brandColor, ... }) {
  return (
    <div>
      <h1 className="text-slate-900">{product.name}</h1> {/* ❌ Hardcode */}
      <span style={{ color: brandColor }}>{price}</span> {/* ❌ Inline */}
      <button style={{ backgroundColor: brandColor }}>Thêm vào giỏ</button> {/* ❌ */}
      <button style={{ borderColor: brandColor, color: brandColor }}>Mua ngay</button> {/* ❌ */}
    </div>
  );
}
```

**Layout Components Pattern (CRITICAL):**
```typescript
// ✅ Layout component signature PHẢI có tokens
interface FullWidthLayoutProps {
  posts: Post[];
  brandColor: string; // Keep for backward compatibility
  tokens: PostsListColors; // REQUIRED: New tokens prop
  categoryMap: Map<string, string>;
  enabledFields: Set<string>;
}

export function FullWidthLayout({ posts, brandColor, tokens, categoryMap, enabledFields }: FullWidthLayoutProps) {
  // ✅ Dùng tokens cho TẤT CẢ màu
  return (
    <div>
      <span style={{ 
        backgroundColor: tokens.categoryBadgeBg, 
        color: tokens.categoryBadgeText,
        borderColor: tokens.categoryBadgeBorder
      }}>
        {category}
      </span>
      <h2 style={{ color: tokens.bodyText }}>{title}</h2>
      <p style={{ color: tokens.neutralTextLight }}>{excerpt}</p>
    </div>
  );
}
```

**Common Mistakes (Phải tránh):**
```typescript
// ❌ Layout component thiếu tokens prop
interface SidebarLayoutProps {
  posts: Post[];
  brandColor: string; // ❌ Chỉ có brandColor
  // ❌ THIẾU: tokens: PostsListColors
}

// ❌ Dùng inline opacity colors
<span style={{ backgroundColor: `${brandColor}15`, color: brandColor }}>
  {/* ❌ Vi phạm Anti Opacity Rules */}
</span>

// ❌ Hardcode Tailwind colors
<h2 className="text-slate-900">{title}</h2>
<p className="text-slate-500">{excerpt}</p>

// ✅ PHẢI dùng tokens
<h2 style={{ color: tokens.bodyText }}>{title}</h2>
<p style={{ color: tokens.neutralTextLight }}>{excerpt}</p>
```

**Semantic tokens mapping (ví dụ Product Detail):**
- `productName` → Tiêu đề sản phẩm (h1)
- `priceColor` → Giá hiển thị
- `addToCartButton` / `addToCartButtonText` → Nút "Thêm vào giỏ"
- `buyNowButton` / `buyNowButtonText` → Nút "Mua ngay"
- `variantSelectedRing` → Variant selector accent
- `primarySurface` / `primaryText` → Category badge
- `discountBadgeBg` / `discountBadgeText` → Discount badge
- `thumbnailActiveBorder` → Active thumbnail border

**Semantic tokens mapping (ví dụ Posts List):**
- `headingColor` → Section title (h1, h2)
- `categoryBadgeBg` / `categoryBadgeText` / `categoryBadgeBorder` → Category badges
- `paginationButtonBg` / `paginationButtonText` / `paginationButtonBorder` → Pagination buttons
- `paginationActiveBg` / `paginationActiveText` → Active page
- `searchIconColor` → Search icon và focus ring
- `filterActiveColor` / `filterActiveBg` / `filterActiveText` → Active filters
- `sidebarWidgetIcon` → Sidebar widget icons
- `sidebarActiveItemBg` / `sidebarActiveItemText` → Active sidebar items
- `bodyText` → Main text content
- `metaText` → Secondary text (dates, counts)
- `neutralTextLight` → Tertiary text (placeholders, hints)
- `cardBackground` / `cardBorder` → Card styling
- `inputBorder` / `inputBackground` / `inputText` → Form inputs

**Checklist bắt buộc:**
- [ ] Site page load màu từ `useBrandColors()` (primary, secondary, mode)
- [ ] Generate tokens bằng helper: `get<Component>Colors(primary, secondary, mode)`
- [ ] Pass `tokens` vào TẤT CẢ layout components (Classic, Modern, Minimal, Sidebar, Magazine, etc.)
- [ ] **Layout component signature có `tokens: ReturnType<typeof get<Component>Colors>`**
- [ ] KHÔNG còn `style={{ backgroundColor: brandColor }}` inline
- [ ] KHÔNG còn `style={{ color: brandColor }}` inline
- [ ] KHÔNG còn `${brandColor}15` opacity colors (vi phạm Anti Opacity Rules)
- [ ] KHÔNG còn hardcode colors (`bg-red-500`, `text-slate-900`, `#0f172a`)
- [ ] KHÔNG còn hardcode Tailwind colors (`text-slate-400`, `border-slate-200`)
- [ ] Mọi semantic element dùng token tương ứng (headings, badges, buttons, text)
- [ ] Test: Đổi màu ở `/admin/settings` → F5 site page → màu thay đổi đúng
- [ ] Test: Dual mode → Site hiển thị 2 màu như Preview
- [ ] Test: Single mode → Site hiển thị 1 màu như Preview

**Refactoring Steps (Khi fix existing layout):**
1. **Add tokens prop** vào layout component interface
2. **Add tokens parameter** vào component function signature
3. **Replace inline colors**: Tìm tất cả `style={{ backgroundColor: brandColor }}` → thay bằng tokens
4. **Replace opacity colors**: Tìm tất cả `${brandColor}15` → thay bằng `tokens.categoryBadgeBg`
5. **Replace Tailwind colors**: Tìm tất cả `text-slate-900`, `border-slate-200` → thay bằng tokens
6. **Pass tokens from parent**: Update nơi gọi layout component để pass tokens
7. **Type check**: Chạy `bunx tsc --noEmit` để verify
8. **Test dual mode**: Verify màu phụ hiển thị đúng

**Lợi ích:**
- Preview và Site render HOÀN TOÀN nhất quán về màu
- Thay đổi màu ở 1 chỗ (_lib/colors.ts) → cả Preview và Site đều update
- Dual-brand colors hoạt động đúng trên site thực tế
- Dễ maintain: không phải tìm và sửa inline colors khắp nơi
- Tuân thủ DRY: không duplicate color logic
- Tuân thủ Anti Opacity Rules: không còn `${color}15` decorative

**Khi nào cần làm:**
- Khi tạo mới site page render từ experience
- Khi refactor site page hiện có để match với Preview
- Khi user báo "preview đúng màu nhưng site không đúng"
- Khi thêm layout mới (Modern, Minimal, Sidebar, Magazine, etc.)
- **Khi thấy layout component chỉ có `brandColor` prop mà không có `tokens` prop**

### 7) Color Adjacency Rule

**Quy tắc:** Khi dùng `primary` hoặc `secondary` ở dạng **solid**, nền hoặc border tiếp giáp phải là **neutral** (`#ffffff`, `#0f172a`, `#f8fafc`, `#e2e8f0`...), KHÔNG dùng tint/shade cùng family.

**Hợp lệ**
- `primary` icon/text trên `neutralSurface`
- `secondary` text trên `neutralSurface`
- `white` text/icon trên `primary` solid bg

**Vi phạm (cấm)**
- `primary` solid trên `primaryTint`
- `secondary` border trên `secondaryTint` background

**Snippet chuẩn:**
```ts
// ❌ Anti-pattern
iconBg: getSolidTint(primary, 0.42),
iconColor: primary,

// ✅ Canonical
iconBg: neutralSurface,
iconColor: primary,
```

### 8) Badge Token Contract

**Bắt buộc:**
- Mỗi badge state phải có bộ token riêng: `bg`, `border`, `text`.
- `text` phải được validate APCA trên **chính `bg` của badge đó**.
- Với badge nền solid, chọn text bằng công thức luminance/contrast: so sánh tương phản của nền với trắng và near-black (`#111`), lấy màu có contrast cao hơn.
- Sau khi chọn bằng luminance, vẫn phải đi qua APCA guard (`ensureAPCATextColor`) để đảm bảo ngưỡng theo font size/weight.
- Khi dùng `apca-w3`, **không truyền hex trực tiếp vào `APCAcontrast`**. Bắt buộc parse sang RGB và gọi `APCAcontrast(sRGBtoY(textRgb), sRGBtoY(bgRgb))`.
- Không dùng stroke/glow cho badge text theo mặc định; readability đến từ color pairing đúng và APCA pass.

---

## Critical Safety Rules

### S1) Guard parse màu trước khi dùng OKLCH/APCA

- Không gọi trực tiếp `oklch(value).l` khi `value` có thể rỗng/invalid.
- Bắt buộc có `safeParseOklch(value, fallback)` hoặc guard tương đương.

### S2) Resolve secondary theo mode trước khi build palette

- Bắt buộc gọi `resolveSecondaryForMode(primary, secondary, mode)` trước mọi `getTint/getGradient/getContrast`.
- `mode='single'`: dùng primary làm secondaryResolved.
- `mode='dual'`: dùng secondary nếu hợp lệ, fallback primary

### S3) Edit page phải có dirty-state parity cho Save button

- Save button phải `disabled` khi pristine (không thay đổi dữ liệu).
- Pattern chuẩn: `initialData + hasChanges + reset sau save thành công`.
- Label chuẩn: `Đang lưu...` / `Lưu thay đổi` / `Đã lưu`

---

## Anti AI-Styling Design Rules (STRICT)

### CẤM (AI Styling)
- NO gradient backgrounds loang màu (trừ gradient style có chủ đích)
- NO hover effects phức tạp (mobile không có hover)
- NO hover-only reveal cho nội dung/chức năng quan trọng
- NO blur/backdrop-blur decorative
- NO drop-shadow-lg, shadow phức tạp nhiều lớp
- NO animate-pulse/scale decorative
- NO opacity layers chồng chéo
- NO opacity decorative (chỉ disabled state)
- NO box-shadow decorative (chỉ focus-ring nếu cần)

### PHẢI (Enterprise UI)
- Flat design + subtle depth: `shadow-sm`, `border` nhẹ
- Whitespace > decoration (spacing 4/8/12/16/24/32px)
- 1 font family, 3-4 weights max
- Border-radius nhất quán: `rounded-lg` hoặc `rounded-xl`
- Skeleton loading thay spinner
- Nội dung/chức năng quan trọng phải hiển thị sẵn (không phụ thuộc hover)
- Transitions chỉ 150-300ms, chỉ cho state changes thật sự

### Anti Opacity/Shadow Rules (STRICT)

**CẤM tuyệt đối**:
- `${color}XX` opacity cho decorative elements (badge bg, borders, overlays)
- `box-shadow` nhiều lớp hoặc decorative depth
- `backdrop-blur`, `filter: blur()` decorative
- `opacity: 0.X` layers chồng chéo
- Gradient overlay với opacity

**CHỈ cho phép (functional only)**:
- `opacity` cho disabled state (0.4-0.5, rõ ràng)
- `shadow-sm` (0 1px 2px) cho focus ring nếu cần thiết
- Border opacity CHỈ khi background KHÔNG thể dùng solid

**Thay thế chuẩn**:
- Badge bg: Solid tint với `l+0.42` (OKLCH)
- Card border: Solid `#e2e8f0` (slate-200) hoặc tint với `l+0.45`
- Card depth: Border 1px solid, không shadow

---

## Element-Level Color Rules

| UI Element | Color | Lý do |
|---|---|---|
| Section title/heading | `brandColor` | Element lớn nhất, nhận diện thương hiệu |
| CTA button (primary action) | `brandColor` | Dominant action = primary brand |
| CTA button (secondary action) | `secondary` | Phân biệt rõ primary/secondary action |
| Icon container background | `brandColor` (10% opacity) | Brand hint |
| Active/selected state | `brandColor` | Primary feedback |
| Navigation arrows | `brandColor` border + icon | Interactive control |
| Interactive link (primary) | `brandColor` | Nhận diện action chính |
| Interactive link (secondary) | `secondary` | Action phụ, ít nổi bật |
| Section label/subtitle | `secondary` | Phân biệt với heading |
| Prices, số liệu nổi bật | `secondary` | Data highlight, contrast với heading |
| Data count/badge | `secondary` | Tăng focus cho dữ liệu |
| Badge outline (NEW, tag) | `secondary` border + text (APCA-pass trên badge bg) | Qua BrandBadge component |
| Badge solid (HOT, discount) | `brandColor` bg + APCA text | Qua BrandBadge component |
| Card borders, hover glow | `secondary` (10-40% opacity) | Subtle accent |
| Divider/section line | `secondary` (10-30% opacity) | Structural separator |
| Timeline/process dots | `secondary` | Decorative, không dominant |
| Form focus ring | `secondary` | Subtle feedback |
| Pagination active dot | `secondary` | Tăng visibility (nhỏ) |

**Rule bắt buộc:**
- Heading (h2 section title) LUÔN dùng `brandColor`.
- Nếu heading dùng neutral (slate-900), KHÔNG dùng `secondary` cho heading.

---

## Auto-Refactor Patterns

### Pattern 1: getTint -> OKLCH

```ts
// BEFORE
const tint = getTint(primary, 0.15);

// AFTER
const color = oklch(primary);
const tint = formatHex(oklch({ ...color, l: color.l + 0.15 }));
```

### Pattern 2: getShade -> OKLCH

```ts
// BEFORE
const shade = getShade(primary, 10);

// AFTER
const shade = formatHex(oklch({ ...color, l: color.l - 0.1 }));
```

### Pattern 3: Hard-coded text -> APCA

```ts
// BEFORE
textOnSolid: '#ffffff'

// AFTER
textOnSolid: getAPCATextColor(primary, 16, 500)
```

### Pattern 4: Unsafe oklch parse -> safe parse

```ts
// BEFORE
const c = oklch(secondary);
const border = formatHex(oklch({ ...c, l: c.l + 0.35 }));

// AFTER
const c = safeParseOklch(secondary, primary);
const border = formatHex(oklch({ ...c, l: Math.min(c.l + 0.35, 0.98) }));
```

---

## Dependencies

```json
{
  "dependencies": {
    "culori": "^4.0.1",
    "apca-w3": "^0.1.9"
  }
}
```
