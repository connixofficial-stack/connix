## Problem Graph

```
1. [Main] Màu chủ đạo (primary/brandColor) ít được dùng trên site
   1.1 [ROOT CAUSE #1] Element-Level Color Rules trong skill BỊ ĐẢO NGƯỢC vai trò
   1.2 [ROOT CAUSE #2] BrandColorHelpers.tsx đẩy primary ra khỏi các element lớn
   1.3 [SYMPTOM] Component Color Map phản ánh sai - Nhóm B quá nhiều
```

## Phân tích chi tiết

### ROOT CAUSE #1: Element-Level Color Rules trong SKILL.md bị sai logic

Skill hiện tại viết:

| UI Element | Color | 
|---|---|
| **Section title/heading accent** | `brandColor` (primary) |
| **Prices, số liệu nổi bật** | `secondary` |
| **Section label/subtitle** | `secondary` |

**NHƯNG thực tế code lại làm ngược:**
- **11 section headings (h2)** dùng `style={{ color: secondary }}` → secondary chiếm heading = element lớn nhất, nổi bật nhất
- **0 section headings** dùng `brandColor`
- Section label/subtitle dùng `secondary` → đúng nhưng heading cũng secondary → mất phân biệt

**Hệ quả:** Cả heading LẪN subtitle đều dùng secondary → primary gần như biến mất khỏi phần lớn sections.

### ROOT CAUSE #2: BrandColorHelpers.tsx đẩy primary vào role nhỏ

- `BrandBadge`: 100% dùng **secondary** (bg, text, border) → đúng theo skill
- `StatBox`: 100% dùng **secondary** cho stat values → đúng
- `IconContainer`: dùng **primary** → đúng, NHƯNG icon container là element nhỏ (~5% area)
- `AccentLine`: dùng **secondary** → đúng
- `CheckIcon`: dùng **secondary** → đúng

**Kết quả:** Primary chỉ còn xuất hiện ở:
1. CTA buttons (đúng)
2. Icon containers nhỏ (area ~5%)
3. Pulse dots (area ~1%)

→ Primary chiếm khoảng **10-15%** thay vì **30%** như quy tắc 60-30-10.

### Mâu thuẫn trong Skill

Skill nói "Section title/heading accent = `brandColor`" nhưng:
1. Code thực tế toàn dùng `secondary` cho headings
2. BrandColorHelpers không có `SectionHeading` component
3. Không có rule enforcement cho heading color
4. `getAccentDistribution()` trong examples chỉ distribute primary/secondary nhưng **không có hướng dẫn áp element nào là primary**

---

## Đề xuất nâng cấp Skill v10

### 1. Sửa Element-Level Color Rules (SKILL.md)

Thay đổi quan trọng nhất - **đảo lại vai trò đúng:**

| UI Element | Color | Lý do |
|---|---|---|
| **Section title/heading** | `brandColor` ← **SỬA** | Brand recognition, element lớn nhất → phải primary |
| CTA button (primary action) | `brandColor` | Dominant action |
| Icon container background | `brandColor` (10% opacity) | Brand hint |
| Active/selected state | `brandColor` | Primary feedback |
| Navigation arrows | `brandColor` | Interactive control |
| Section label/subtitle | `secondary` | Phân biệt với heading |
| Badge outline | `secondary` border + text | Decorative |
| Card borders, hover glow | `secondary` (10-40% opacity) | Subtle |
| Prices, số liệu nổi bật | `secondary` | Data highlight |
| Timeline/process dots | `secondary` | Decorative |
| Form focus ring | `secondary` | Subtle feedback |

**Thêm rule mới:**
> Heading (h2 section title) LUÔN dùng `brandColor`. Nếu heading dùng neutral (slate-900) thì KHÔNG dùng secondary cho heading - hãy để neutral.

### 2. Cập nhật Component Color Map

Sau khi sửa heading → nhiều component Nhóm B sẽ chuyển sang Nhóm C (balanced):
- TrustBadges: headings = primary → P↑ từ 10% lên 30%
- Gallery/Partners: headings = primary → P↑
- FAQ: headings = primary → P↑
- ...

### 3. Thêm SectionHeading vào BrandColorHelpers

```tsx
export const SectionHeading: React.FC<{
  children: React.ReactNode;
  brandColor: string;
  className?: string;
}> = ({ children, brandColor, className = '' }) => (
  <h2
    className={`text-2xl md:text-3xl font-bold ${className}`}
    style={{ color: brandColor }}
  >
    {children}
  </h2>
);
```

### 4. Cập nhật checklist.md

Thêm check item:
- `[ ] Section headings (h2) dùng brandColor, KHÔNG dùng secondary`
- `[ ] Primary chiếm >= 25% visual weight (headings + CTA + icons)`

### 5. Cập nhật 60-30-10 guidance

Thêm ví dụ cụ thể:
> **30% Primary gồm:** section headings (h2) + CTA buttons + icon containers + active states
> **10% Secondary gồm:** subtitles/labels + badges + borders + hover + stat values

---

## Scope thay đổi

| File | Thay đổi |
|---|---|
| `.factory/skills/.../SKILL.md` | Sửa Element-Level Color Rules, 60-30-10 guidance, Component Color Map |
| `.factory/skills/.../checklist.md` | Thêm 2 check items cho heading color |

**KHÔNG sửa code component** trong lần này - chỉ nâng cấp skill trước. Sau khi skill đúng, sẽ dùng skill để review/fix từng component.