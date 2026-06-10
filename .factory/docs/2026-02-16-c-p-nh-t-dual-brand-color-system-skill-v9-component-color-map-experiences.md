
## Mục tiêu

Cập nhật skill `dual-brand-color-system` lên **v9.0.0** bổ sung kiến thức thực tế từ scan 30 home-components + 16 experiences. Chỉ sửa file SKILL.md.

## File thay đổi

**`/.factory/skills/dual-brand-color-system/SKILL.md`** - thêm 3 sections mới

---

### 1. Thêm section "Component Color Map" (sau section "Content-Aware Color Distribution")

Bảng phân loại 30 home-components theo tỷ lệ primary/secondary thực tế:

```md
## Component Color Map (Hiện trạng)

### Home Components - 4 nhóm

**Nhóm A: Primary-only** (secondary bị ignore `_secondary`)
| Component | P% | S% | Pattern |
|---|---|---|---|
| Blog | 100 | 0 | brandColor cho borders, hover, badges, category tags |
| CaseStudy | 100 | 0 | brandColor cho borders, hover, badges, links |
| Benefits | 95 | 5 | brandColor dominant, secondary minimal |
| Team | 95 | 5 | brandColor dominant |

**Nhóm B: Secondary-dominant** (brandColor ít hoặc chỉ cho BrandBadge)
| Component | P% | S% | Pattern |
|---|---|---|---|
| CategoryProducts | 5 | 95 | `_brandColor`, secondary cho tất cả UI |
| Features | 10 | 90 | `_brandColor`, secondary dominant |
| TrustBadges | 10 | 90 | brandColor chỉ trong BrandBadge |
| ServiceList | 10 | 90 | brandColor chỉ trong BrandBadge |
| Gallery | 5 | 95 | secondary cho borders, text, icons |
| Partners | 5 | 95 | secondary cho borders, animations |
| FAQ | 40 | 60 | secondary: expanded border/icon |
| Testimonials | 40 | 60 | secondary: quotes, rating stars |
| Services | 40 | 60 | secondary: numbers, accent bar, timeline |
| Footer | 30 | 70 | secondary: logo/dividers; brandColor: bg shade |
| Career | 40 | 60 | secondary cho borders, tags |
| Contact | 40 | 60 | secondary cho form elements |
| Process | 40 | 60 | secondary cho timeline, dots |

**Nhóm C: Balanced dual-brand** (~50/50)
| Component | P% | S% | Pattern |
|---|---|---|---|
| Hero | 50 | 50 | Hệ thống color riêng (`_lib/colors.ts`) |
| Stats | 50 | 50 | Custom implementation |
| ProductList | 55 | 45 | P: titles/prices/buttons; S: labels/borders |
| ProductGrid | 50 | 50 | Pass-through |
| CTA | 60 | 40 | P: bg/buttons; S: title text/button text |
| About | 50 | 50 | Cả 2 cho accent bar, icons |
| Pricing | 45 | 55 | S: prices/ring; P: popular bg |
| SpeedDial | 50 | 50 | Cân bằng |
| Clients | 50 | 50 | Cân bằng |
| Video | 50 | 50 | Cân bằng |
| Countdown | 50 | 50 | Cân bằng |
| VoucherPromotions | 50 | 50 | Cân bằng |

### Experiences - Chỉ dùng primary (KHÔNG có secondary)

**Dynamic** (useBrandColor()):
posts-list, posts-detail, products-list, services-list, services-detail,
promotions-list, menu, account-profile, account-orders, search

**Hard-coded** (known issues):
| Experience | Màu | Cần refactor |
|---|---|---|
| wishlist | #ec4899 | → useBrandColor() |
| contact | #6366f1 | → useBrandColor() |
| comments-rating | #a855f7 | → useBrandColor() |
| checkout | #22c55e | → useBrandColor() |
| cart | #f97316 | → useBrandColor() |
| product-detail | #06b6d4 | → useBrandColor() |
```

---

### 2. Thêm section "Element-Level Color Rules" (sau Component Color Map)

Quy tắc chuẩn hóa từng loại UI element nên dùng primary hay secondary:

```md
## Element-Level Color Rules

| UI Element | Color | Lý do |
|---|---|---|
| CTA button (primary action) | `brandColor` | Dominant action = primary brand |
| Section title/heading accent | `brandColor` | Brand recognition |
| Prices, số liệu nổi bật | `secondary` | Data highlight, contrast với heading |
| Badge solid (HOT, discount) | `brandColor` bg | Qua BrandBadge component |
| Badge outline (NEW, tag) | `secondary` border + text | Qua BrandBadge component |
| Card borders, hover glow | `secondary` (10-40% opacity) | Subtle accent |
| Icon container background | `brandColor` (10% opacity) | Brand hint |
| Section label/subtitle | `secondary` | Phân biệt với heading |
| Gradient accent line/bar | `brandColor → secondary` | Dual brand harmony |
| Footer background | Shade of `brandColor` (65%) | Dark brand tone |
| Timeline/process dots | `secondary` | Decorative, không dominant |
| Active/selected state | `brandColor` | Primary feedback |
| Form focus ring | `secondary` | Subtle feedback |
| Pagination active dot | `secondary` | Tăng visibility (nhỏ) |
| Navigation arrows | `brandColor` border + icon | Interactive control |
```

---

### 3. Thêm section "Known Issues" (cuối file, trước Dependencies)

```md
## Known Issues

### Experiences thiếu dual-brand support
- 16 experiences chỉ nhận `brandColor`, không nhận `secondary`
- Khi tạo experience mới: chỉ cần `useBrandColor()`, chưa cần secondary
- 6 experiences hard-code màu: cần refactor sang `useBrandColor()`

### Inconsistency giữa home-components
- 4 components ignore secondary (`_secondary`): Blog, CaseStudy, Benefits, Team
- 2 components ignore brandColor (`_brandColor`): CategoryProducts, Features
- Chấp nhận hiện trạng; khi refactor thì follow Element-Level Color Rules
```

---

### 4. Cập nhật version + description

- Version: `8.0.0` → `9.0.0`
- Mô tả bổ sung: thêm "Component Color Map" và "Element-Level Color Rules"

---

## Tóm tắt thay đổi

- **1 file thay đổi**: `SKILL.md`
- **3 sections mới**: Component Color Map, Element-Level Color Rules, Known Issues
- **Không sửa code** - chỉ cập nhật kiến thức trong skill
- **Không sửa** checklist.md, reference.md, examples/ (nội dung hiện tại vẫn đúng)
