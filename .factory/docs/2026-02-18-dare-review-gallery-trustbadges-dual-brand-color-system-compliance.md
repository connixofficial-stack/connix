
## Problem Graph

```
1. [Main] Gallery/TrustBadges dual mode thiếu primary color visibility
   1.1 [Sub] GalleryPreview.tsx — 6 layouts không dùng primary
      1.1.1 [ROOT] Spotlight/Explore/Stories/Grid/Marquee/Masonry: không có element nào style={{ color: primary }} hay backgroundColor: primary
   1.2 [Sub] TrustBadgesPreview.tsx — subheading/badge/accent đều secondary; primary chỉ ở heading (title)
      1.2.1 [ROOT] Cards, Wall, Carousel, Featured: `colors.subheading` (secondary) chiếm toàn bộ text/UI accent
   1.3 [Sub] ComponentRenderer GallerySection — heading dùng primary ổn, nhưng thiếu secondary token nổi bật
   1.4 [Sub] `getGalleryColorTokens` token map — `iconBg`/`iconColor` (primary) được tạo nhưng không bao giờ được dùng trong layouts
```

---

## Phân tích hiện trạng (6 layouts Gallery + 6 layouts TrustBadges)

### Gallery Preview — 6 layouts

| Layout | Primary usage | Secondary usage | Vấn đề |
|---|---|---|---|
| Spotlight | Không có | Không có | ❌ Hoàn toàn không có brand color — chỉ slate images |
| Explore | Không có | Không có | ❌ Grid ảnh thuần neutral |
| Stories | Không có | Không có | ❌ Columns ảnh thuần neutral |
| Grid | `badgeBg` (secondary tint) trên +N badge | `badgeText` | ⚠️ Primary chỉ ở placeholder icon; secondary chiếm badge |
| Marquee | Không có | Không có | ❌ Auto-scroll không có brand color |
| Masonry | `badgeBg` (secondary tint) trên +N badge | `badgeText` | ⚠️ Tương tự Grid |

**Kết luận Gallery**: Primary **gần như absent** (0–5%) — vi phạm nguyên tắc 30% primary. Dual mode không khác gì single mode vì secondary cũng chỉ xuất hiện ở +N badge tint.

### TrustBadges Preview — 6 layouts

| Layout | Primary usage | Secondary usage | Vấn đề |
|---|---|---|---|
| Grid | `heading` (h2 title) | `badgeBg`, `badgeText` (hover zoom btn) | ⚠️ Primary chỉ ở heading; secondary ở badges |
| Cards | `heading` (h2 title) | `subheading` (card footer text + hover overlay) | ⚠️ Cards footer hoàn toàn secondary |
| Marquee | `heading` (h2 title) | BrandBadge tooltip | ✅ Khá balanced |
| Wall | `heading` (h2 title) | `subheading` (certificate name text), `accentBorder` (nail dot) | ⚠️ Wall nail dot = secondary |
| Carousel | `heading` (h2 title), arrow buttons (`colors.heading`) | `subheading` (pagination dots active) | ⚠️ Arrow border = accentBorder (secondary) |
| Featured | `heading` (h2 + featured name) | `subheading` (+ count), `accentSurface`/`accentBorder` (featured card bg/border) | ⚠️ Featured card bg = secondary tint |

**Kết luận TrustBadges**: Primary P% = ~15–20%, Secondary S% = ~35–40%, Neutral = ~40–50%. Không pass 30-30 target. `subheading` (secondary) dominate UI accent.

---

## Fix Plan — Chi tiết từng bước

### Scope: Gallery + TrustBadges (không đụng ComponentRenderer nếu không cần thiết)

### Bước 1: Fix `getGalleryColorTokens` — thêm token cần thiết

**File**: `app/admin/home-components/gallery/_lib/colors.ts`

Thêm vào `GalleryColorTokens` interface:
```typescript
overlayBg: string;      // primary với opacity (dùng solid tint thay opacity)
sectionAccentBar: string; // primary — line/bar phân cách
cardHoverBorder: string;  // secondary — hover glow cho card
```

Trong `getGalleryColorTokens`, thêm:
```typescript
const sectionAccentBar = primaryResolved;  // primary solid cho accent bar
const cardHoverBorder = getSolidTint(secondaryResolved, 0.25); // secondary tint đậm hơn cho hover
```

**Rule**: `heading` = primary ✅ (đã có), thêm `sectionAccentBar` = primary để dùng cho accent line/border trên section.

---

### Bước 2: Fix `GalleryPreview.tsx` — thêm primary vào 6 layouts

**File**: `app/admin/home-components/gallery/_components/GalleryPreview.tsx`

**Nguyên tắc áp dụng (Element-Level Color Rules)**:
- Section accent bar (gradient line dưới title) = **primary**
- Image overlay hover (khi có name) = **secondary** text, primary border
- Navigation arrows (nếu có) = **primary** border + icon

**Thay đổi cụ thể**:

#### renderGalleryEmptyState (tất cả layouts)
Thêm `iconBg` đúng chuẩn:
```tsx
<div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
  style={{ backgroundColor: colors.iconBg }}>  {/* đã đúng */}
  <ImageIcon size={32} style={{ color: colors.iconColor }} />  {/* primary ✅ */}
</div>
```
→ Đã dùng `colors.iconBg` và `colors.iconColor` (primary) — **ĐÚNG**, không cần sửa.

#### renderSpotlightStyle — thêm accent bar
```tsx
// Sau grid images, thêm accent bar bottom nếu items có name
// Thêm hover overlay với primary tint border trên featured image
<div className="absolute inset-0 border-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm"
  style={{ borderColor: colors.primary }} />
```

#### renderGalleryGridStyle — fix +N badge + card hover border
```tsx
// Card hover: thêm ring primary
// +N badge: badgeBg = secondary tint — GIỮ NGUYÊN (secondary đúng vai trò count/data badge)
// Nhưng icon trong badge: dùng primary
<Plus size={28} style={{ color: colors.iconColor }} className="mb-1" />
<span className="text-lg font-bold" style={{ color: colors.badgeText }}>+{remainingCount}</span>
```

#### renderGalleryMarqueeStyle — thêm section header với accent bar
Trong `renderGalleryContent()` wrapper, khi `title` prop tồn tại (Gallery thường có title), thêm section header:
```tsx
// Trong renderGalleryContent() — bọc content trong section với optional title
// Section heading dùng colors.heading (primary)
```

Tuy nhiên `GalleryPreview` không nhận `title` prop — cần xem lại.

---

### Bước 3: Fix `TrustBadgesPreview.tsx` — tăng primary presence

**File**: `app/admin/home-components/gallery/_components/TrustBadgesPreview.tsx`

**`SectionHeader` component** — đã có `colors.heading` (primary) ✅

**Cards layout** — `renderCardsStyle`:
- Card footer `subheading` = secondary → **GIỮ NGUYÊN** (item name dùng secondary là đúng rule)
- Hover overlay button: thêm primary border thay neutral
- **Thêm**: Accent bar `h-1` dưới SectionHeader với `colors.primary`

**Wall layout** — `renderWallStyle`:
- Nail dot `backgroundColor: colors.accentBorder` (secondary tint) → đổi thành `colors.primary` (nail = structural element, dùng primary)

**Carousel layout** — `renderCarouselStyle`:
- Arrow border dùng `accentBorder` (secondary tint) → đổi sang `primary` border (navigation arrow = primary theo rule)
- Arrow active dùng `colors.heading` (primary) ✅
- Pagination dot active: `subheading` (secondary) → **GIỮ NGUYÊN** (pagination dot nhỏ = secondary đúng)

**Featured layout** — `renderFeaturedStyle`:
- Featured card bg: `accentSurface` (secondary tint) → đổi sang `iconBg` (primary tint) cho featured item (prominent = primary)
- Featured card border: `accentBorder` (secondary) → đổi sang primary
- Featured name text: `colors.heading` (primary) ✅

---

### Bước 4: Fix `ComponentRenderer.tsx` — đồng bộ với Preview

**File**: `components/site/ComponentRenderer.tsx`

Đồng bộ các thay đổi tương ứng trong `GallerySection` và `TrustBadgesSection`.

---

### Bước 5: Kiểm tra single mode

Đảm bảo `resolveSecondaryForMode` trả về `primary` khi `mode='single'` — đã đúng trong `colors.ts`.

---

## Accent Balance Target (sau fix)

| Component | P% target | S% target | N% target |
|---|---|---|---|
| Gallery (các layouts) | 25–30% | 10–15% | 55–65% |
| TrustBadges | 30–35% | 20–25% | 40–50% |

---

## Files cần sửa

1. `app/admin/home-components/gallery/_lib/colors.ts` — thêm tokens
2. `app/admin/home-components/gallery/_components/GalleryPreview.tsx` — fix 6 layouts
3. `app/admin/home-components/gallery/_components/TrustBadgesPreview.tsx` — fix 6 layouts
4. `components/site/ComponentRenderer.tsx` — đồng bộ GallerySection + TrustBadgesSection

**Không sửa**: `_types/index.ts`, `GalleryForm.tsx`, edit page.
