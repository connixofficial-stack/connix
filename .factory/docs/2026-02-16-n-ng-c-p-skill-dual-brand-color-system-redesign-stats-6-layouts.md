
## Problem Graph

1. **[Main] UI/UX Stats + Skill quá "AI styling"** <- depends on 1.1, 1.2
   1.1 **[Skill] dual-brand-color-system chưa có anti-AI-styling rules** <- ROOT CAUSE 1
   1.2 **[Stats] 6 layouts có UI nhà quê** <- depends on 1.1

## Phần 1: Nâng cấp Skill `dual-brand-color-system`

### Thêm section "Anti AI-Styling Design Rules" vào SKILL.md

Bổ sung nguyên tắc thiết kế **doanh nghiệp, chuyên nghiệp** vào skill:

```md
## Anti AI-Styling Design Rules (STRICT)

### Tech Stack bắt buộc
- Shadcn/ui components + Tailwind CSS + Lucide React icons
- CSS Variables cho brand colors

### Mobile-First
- Design mobile first, scale up desktop
- Touch targets >= 44px
- `max-md:` cho mobile-specific overrides

### CẤM (AI Styling)
- NO gradient backgrounds loang màu (trừ gradient style có chủ đích)
- NO hover effects phức tạp (mobile không có hover)
- NO blur/backdrop-blur decorative
- NO drop-shadow-lg, shadow phức tạp nhiều lớp
- NO animate-pulse/scale decorative
- NO opacity layers chồng chéo
- NO rainbow/flashy accent colors
- NO group-hover:scale-105 trên text/numbers

### PHẢI (Enterprise UI)
- Flat design + subtle depth: `shadow-sm`, `border` nhẹ
- Whitespace > decoration (spacing 4/8/12/16/24/32px)
- 1 font family, 3-4 weights max
- Border-radius nhất quán: `rounded-lg` hoặc `rounded-xl`
- Contrast: Text >= 4.5:1, UI >= 3:1 (APCA)
- Skeleton loading thay spinner
- Transitions chỉ 150-300ms, chỉ cho state changes thật sự

### Scrollbar
- Width: 6px, track: transparent
- Thumb: muted 30% opacity, radius 3px

### Accessibility
- `aria-label` on icon-only buttons
- `focus-visible:ring-2` states
- Keyboard navigation
- Heading hierarchy (h1->h2->h3)
```

### Cập nhật checklist.md

Thêm section **E. Anti AI-Styling** vào checklist:
- [ ] Không gradient decorative (chỉ gradient style mới dùng)
- [ ] Không hover effects phức tạp (mobile-first)
- [ ] Không blur/shadow nhiều lớp
- [ ] Không animate decorative (pulse, scale)
- [ ] Flat design + border + whitespace
- [ ] Touch targets >= 44px

### Cập nhật examples/color-utils.ts

- Xóa `hover` property khỏi `BrandPalette` (mobile-first, không cần hover variant)
- Giữ lại: `solid`, `surface`, `border`, `textOnSolid`, `textInteractive`

### Cập nhật examples/theme-engine-ui.tsx

- Bỏ `Hover` swatch trong PaletteStrip

---

## Phần 2: Redesign Stats 6 Layouts

### File `_lib/colors.ts` - Đơn giản hóa

Loại bỏ shadow colors phức tạp, chỉ giữ lại flat colors:

| Style | Colors cũ | Colors mới |
|---|---|---|
| horizontal | border, shadow | border (chỉ 1 border nhẹ) |
| cards | border, accent | border, accent (giữ nguyên, đã OK) |
| icons | circleBg, textOnCircle, label, shadowStrong, shadowSoft | circleBg, textOnCircle, label (bỏ shadow phức tạp) |
| gradient | background gradient, border, text, label | Giữ gradient vì đây là style chủ đích, bỏ blur/decorative |
| minimal | accent, value | Giữ nguyên (đã clean) |
| counter | border, progress, value, watermark | border, progress, value (bỏ watermark decorative) |

### File `_components/StatsPreview.tsx` - Redesign 6 layouts

#### Style 1: Horizontal (Thanh ngang)
- Bỏ `hover:bg-slate-50` + `transition-colors`
- Bỏ `boxShadow` phức tạp, chỉ dùng `shadow-sm`
- Clean dividers, spacing chuẩn

#### Style 2: Cards
- Bỏ `group-hover:scale-105 transition-transform`
- Bỏ `hover:shadow-md hover:border-opacity-50`
- Giữ accent line nhỏ dưới mỗi card (decorative có mục đích)
- Flat card với `shadow-sm` + `border`

#### Style 3: Icons (Circle)
- Bỏ `group-hover:scale-105 transition-all duration-300`
- Bỏ `boxShadow` 2 lớp phức tạp, thay bằng `shadow-sm`
- Bỏ `border-[3px] border-white ring-1 ring-slate-100` phức tạp
- Circle đơn giản: bg solid + `shadow-sm`

#### Style 4: Gradient
- Giữ gradient background (vì đây là style chủ đích)
- Bỏ blur circle decorative (`blur-xl`)
- Bỏ `drop-shadow-lg`
- Bỏ `backdrop-blur-sm`
- Clean text trực tiếp trên gradient

#### Style 5: Minimal
- Giữ nguyên (đã rất clean, enterprise-ready)

#### Style 6: Counter
- Bỏ `group-hover:scale-110 transition-transform duration-300` trên số
- Bỏ watermark số decorative ở góc
- Giữ progress bar (functional, không decorative)
- Clean card với `shadow-sm`

### File `ComponentRenderer.tsx` - Sync với Preview

Áp dụng cùng thay đổi cho StatsSection trong ComponentRenderer để đảm bảo **Single Source of Truth** (render === preview).

---

## Summary thay đổi

| File | Hành động |
|---|---|
| `.factory/skills/dual-brand-color-system/SKILL.md` | Thêm Anti AI-Styling rules |
| `.factory/skills/dual-brand-color-system/checklist.md` | Thêm section E |
| `.factory/skills/dual-brand-color-system/examples/color-utils.ts` | Bỏ hover variant |
| `.factory/skills/dual-brand-color-system/examples/theme-engine-ui.tsx` | Bỏ Hover swatch |
| `stats/_lib/colors.ts` | Đơn giản hóa, bỏ shadow phức tạp |
| `stats/_components/StatsPreview.tsx` | Redesign 6 layouts, bỏ AI styling |
| `components/site/ComponentRenderer.tsx` | Sync stats section với preview |
