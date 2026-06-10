
## Color Review: ProductCategories (Dual Mode)

### Phân tích hiện trạng

#### `colors.ts` - Phân bổ primary vs secondary hiện tại

| Thuộc tính | Hiện dùng | Theo Skill Rule |
|---|---|---|
| **Heading (h2)** | `primary.solid` | primary (ĐÚNG) |
| **cardShadow / cardShadowHover** | `secondary` | secondary (OK - subtle) |
| **cardBorder / cardBorderHover** | `secondary` | secondary (OK) |
| **linkText** | `secondary.textInteractive` | secondary (OK) |
| **productCountText** | `secondary.textInteractive` | secondary (OK - data highlight) |
| **iconContainerBg** | `primary 12%` | primary (OK) |
| **pillBg / pillBorder** | `secondary 8%/20%` | **ISSUE** - pill quá nhạt, chỉ secondary |
| **ctaMoreBg / ctaMoreBorder / ctaMoreText** | `primary` | primary (OK - CTA) |
| **circularBg / circularBorder** | `secondary 5%/15%` | **ISSUE** - quá nhạt |
| **paginationDotActive** | `secondary` | secondary (OK theo skill) |
| **arrowIcon** | `primary` | primary (OK) |
| **sectionBg** | `neutral.background` | neutral (OK) |

#### Vấn đề chính: Primary chỉ xuất hiện ở 3 chỗ

1. Heading (h2) - text nhỏ
2. Icon trong iconContainerBg - opacity 12% rất nhạt
3. ctaMore (CTA "+N danh mục khác") - chỉ hiện khi có nhiều items
4. arrowIcon (marquee) - icon 14px rất nhỏ

=> **Primary chiếm ~15% visual weight** (quá thấp, cần >= 25%)
=> **Secondary gần như invisible** ở nhiều style vì chỉ dùng cho border/shadow rất nhạt

### Issues cụ thể theo từng style

| Style | Primary Issue | Secondary Issue |
|---|---|---|
| **Grid** | Chỉ heading + icon, card overlay che hết | cardBorder/shadow quá nhạt (opacity 12-20%) |
| **Carousel** | Chỉ heading, card border quá mỏng | linkText nhỏ, productCount nhỏ |
| **Cards** | Chỉ heading, card rất trắng | linkText "Xem sản phẩm" quá nhỏ |
| **Minimal** | Heading + icon OK nhưng pill bg quá nhạt | pillBg 8% gần như invisible |
| **Marquee** | Heading + arrowIcon 14px | pillBorder nhạt, productCount nhỏ |
| **Circular** | Heading + icon | circularBg 5% / circularBorder 15% gần invisible |

### Fix Plan

#### 1. Tăng primary trong `colors.ts` (file: `_lib/colors.ts`)

```ts
// TRƯỚC: secondary cho tất cả card elements
cardBorder: secondaryPalette.border,
cardBorderHover: secondaryPalette.solid,

// SAU: primary cho card border hover (tăng nhận diện)
cardBorderHover: primaryPalette.solid,
```

Thay đổi cụ thể:

| Thuộc tính | Trước | Sau | Lý do |
|---|---|---|---|
| `cardBorderHover` | `secondary.solid` | `primary.solid` | Active state = primary (Element Rule) |
| `iconContainerBg` | `primary 12%` | `primary 15%` | Tăng visibility nhẹ |
| `pillBg` | `secondary 8%` | `primary 8%` | Pill default = primary hint |
| `pillBorder` | `secondary 20%` | `primary 20%` | Đồng bộ pill với primary |
| `circularBg` | `secondary 5%` | `primary 6%` | Tăng nhận diện primary |
| `circularBorder` | `secondary 15%` | `primary 20%` | Tăng visibility |
| `ctaMoreBg` | `primary.surface` | giữ nguyên | OK |
| `ctaMoreBorder` | `primary.border` | giữ nguyên | OK |

#### 2. Thêm primary accent elements trong Preview + Render (cả 6 styles)

**2a. Thêm `categoryNameText` cho category name (h3):**

```ts
// colors.ts - thêm thuộc tính mới
categoryNameText: primaryPalette.textInteractive,  // primary cho tên danh mục
```

Áp dụng: Category name (h3) trong **carousel**, **cards**, **minimal**, **marquee**, **circular** sẽ dùng `colors.categoryNameText` thay vì text mặc định (slate-900).

> Grid style KHÔNG áp dụng vì h3 nằm trên overlay ảnh, cần giữ `overlayText` (trắng).

**2b. Thêm `sectionAccent` line dưới heading:**

```ts
// colors.ts
sectionAccent: primaryPalette.solid,  // accent line dưới heading
```

Áp dụng: Thêm 1 underline bar (w-12, h-1, rounded) màu `sectionAccent` ngay dưới heading h2 ở các style có heading center (grid, cards, marquee, circular). Đây là pattern đã dùng ở Stats, Hero.

**2c. Cards style - thêm left accent bar:**

Thêm `cardAccentBar` = `primaryPalette.solid` - 1 thanh dọc 3px bên trái mỗi card (giống CTA style trong các component khác).

#### 3. Tăng secondary visibility

| Thuộc tính | Trước | Sau | Lý do |
|---|---|---|---|
| `cardShadow` | `secondary 12%` | `secondary 15%` | Tăng nhẹ |
| `cardShadowHover` | `secondary 20%` | `secondary 25%` | Hover rõ hơn |
| `paginationDotInactive` | `secondary.border` | `secondary 40%` | Rõ hơn khi inactive |

### Tóm tắt phân bổ sau fix

| Role | Elements | Est % |
|---|---|---|
| **Primary (~30%)** | heading h2, heading accent bar, category name h3, CTA more, icon container, pill bg/border, card border hover, circular bg/border, arrow icon | 30% |
| **Secondary (~10%)** | card shadow, card border (default), link text, product count, pagination dots | 10% |
| **Neutral (~60%)** | section bg, card surface, body text, placeholder | 60% |

### Files cần sửa

1. `app/admin/home-components/product-categories/_lib/colors.ts` - thêm/sửa color mappings
2. `app/admin/home-components/product-categories/_components/ProductCategoriesPreview.tsx` - áp dụng colors mới (6 styles)
3. `components/site/ComponentRenderer.tsx` - áp dụng tương tự cho ProductCategoriesSection (6 styles)

### Checklist compliance

- [x] OKLCH only (đã sẵn)
- [x] APCA cho text (đã sẵn)
- [x] Heading h2 dùng primary (đã sẵn)
- [x] Primary >= 25% visual weight (sau fix: ~30%)
- [x] Secondary có element đủ lớn: card shadow + link text + pagination
- [x] Placeholder bg neutral (đã sẵn)
- [x] Single Source of Truth: Preview + Render dùng chung `_lib/colors.ts`
