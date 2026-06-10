Dưới đây là spec triển khai custom font tương tự custom color, có control ở /system/home-components và custom tại create/edit per-type, với default fallback là Be Vietnam Pro. Roadmap gồm 1 commit nền tảng + 29 commit theo type.

## Audit Summary
- Hiện có hệ thống custom color per-type đầy đủ: system config (Convex), hook `useTypeColorOverrideState`, UI card, create/edit/admin/site đều resolve qua `resolveTypeOverrideColors`.
- System page `/system/home-components` có bảng type + action per-row (Custom/System) và bulk action, dùng `homeComponentSystemConfig`.
- Home components có 29 type trong `lib/home-components/componentTypes.ts`.
- Fonts hiện load ở `app/layout.tsx` với `Be_Vietnam_Pro`, `Geist`, `Geist_Mono`; CSS `body` dùng `--font-vietnamese-sans` + fallback.

## Root Cause Confidence
**High** — Hệ thống chưa có “font override” per-type/global; cần mở rộng theo pattern custom color để đồng bộ create/edit/preview/site và quản trị ở system page.

## Proposal (Implementation Plan)
### 1) Data model & Convex
**Mục tiêu:** Lưu 2 tầng: global font override + per-type override, có `systemEnabled` giống custom color để control hiển thị UI. Fallback về Be Vietnam Pro khi không bật.

**Files:** `convex/homeComponentSystemConfig.ts`, `convex/schema.ts` (nếu cần type), `lib/home-components/componentTypes.ts` (reuse list).

**Thêm keys:**
- `FONT_OVERRIDE_KEY = "font_overrides"` (record per-type)
- `GLOBAL_FONT_OVERRIDE_KEY = "global_font_override"` (global)

**Shape:**
```ts
// FontOverride
{
  enabled: boolean;        // runtime dùng custom?
  systemEnabled: boolean;  // system bật panel?
  fontKey: string;         // key font đã load (vd: "be-vietnam-pro")
}
```

**Normalization:**
- validate `fontKey` thuộc whitelist (danh sách font load sẵn).
- nếu `enabled=false` => runtime fallback về global/system default.
- nếu `systemEnabled=false` => hide panel ở create/edit.

**Mutations:**
- `setTypeFontOverride({ type, enabled?, systemEnabled?, fontKey? })`
- `bulkSetTypeFontOverride({ systemEnabled, types })` (tương tự color)
- `setGlobalFontOverride({ enabled?, fontKey? })`

### 2) Font registry & loading
**Mục tiêu:** Có 10 font tiếng Việt load sẵn bằng `next/font/google` (build-time), map thành CSS variables + `fontKey`.

**Files:** `app/layout.tsx`, `app/globals.css`, tạo mới `lib/fonts/registry.ts`.

**Registry (ví dụ):**
```ts
export const FONT_REGISTRY = [
  { key: 'be-vietnam-pro', label: 'Be Vietnam Pro', variable: '--font-be-vietnam-pro' },
  { key: 'inter', label: 'Inter', variable: '--font-inter' },
  { key: 'roboto', label: 'Roboto', variable: '--font-roboto' },
  { key: 'noto-sans', label: 'Noto Sans', variable: '--font-noto-sans' },
  { key: 'nunito', label: 'Nunito', variable: '--font-nunito' },
  { key: 'source-sans-three', label: 'Source Sans 3', variable: '--font-source-sans-3' },
  { key: 'ibm-plex-sans', label: 'IBM Plex Sans', variable: '--font-ibm-plex-sans' },
  { key: 'poppins', label: 'Poppins', variable: '--font-poppins' },
  { key: 'mulish', label: 'Mulish', variable: '--font-mulish' },
  { key: 'lexend', label: 'Lexend', variable: '--font-lexend' },
];
export const DEFAULT_FONT_KEY = 'be-vietnam-pro';
```

**Layout.tsx:** import fonts và gắn `variable` vào `<body>` className.

**globals.css:**
- Thêm CSS var `--font-active` và utility class `font-active`.
- Default: `--font-active: var(--font-be-vietnam-pro)`
- Khi runtime override, set inline style `style={{ '--font-active': 'var(--font-xxx)' }}`.

### 3) Font override resolver (tương tự color)
**Files:** tạo `app/admin/home-components/_shared/lib/typeFontOverride.ts`

**API:**
- `getTypeFontOverrideState()`
- `resolveTypeOverrideFont()` => trả `fontKey` + `usingCustom`.
- `resolveFontVar(fontKey)` => map sang CSS var.

### 4) Hooks & UI components
**Files:**
- `app/admin/home-components/_shared/hooks/useTypeFontOverride.ts`
- `app/admin/home-components/_shared/components/TypeFontOverrideCard.tsx`

**Behavior:**
- `showCustomBlock` = type supported & systemEnabled.
- Card tương tự `TypeColorOverrideCard` nhưng chỉ có toggle + select font.
- Nếu `enabled=false`, hiển thị font global/system nhưng disabled.

### 5) System page /system/home-components
**Update:** add action “Custom Font” per-row (System/Custom toggle) tương tự custom color.
**UI:** chỉ toggle System/Custom (không chọn font ở đây) theo yêu cầu user.

### 6) Admin create/edit integration
**Create:**
- Extend `ComponentFormWrapper` nhận `customFontState` + `setCustomFontState` + `showFontCustomBlock`.
- Hiển thị `TypeFontOverrideCard` dưới `TypeColorOverrideCard`.
- Submit create sẽ call `setTypeFontOverride` nếu panel bật.

**Edit:**
- Mỗi edit page dùng `useTypeFontOverrideState(type)`.
- `hasChanges` bao gồm `customFontChanged`.
- Cập nhật `setTypeFontOverride` khi lưu.

### 7) Preview/Site runtime
**Mục tiêu:** sử dụng font override cho preview & site renderer.

**Approach (SaaS best-practice):**
- Apply font ở **root container của từng component** bằng inline style `style={{ '--font-active': var(...) }}` và className `font-active`.
- Không đổi font toàn trang để tránh ảnh hưởng module khác.

**Files:**
- `components/site/ComponentRenderer.tsx`: resolve font per-type + wrap component root.
- `app/admin/home-components/*/_components/*Preview.tsx`: apply same pattern cho preview (6 layouts) qua shared wrapper `PreviewWrapper` nếu có.

### 8) Roadmap 30 commit
**Commit 0 (foundation):**
- Add font registry + load 10 fonts in layout.
- Add global/type font override schema + hooks + card UI + system page toggle + renderer integration base.

**Commit 1-29 (per type):** add create + edit + preview font override integration for each type:
1. Hero
2. Stats
3. Partners
4. TrustBadges
5. ProductCategories
6. ProductList
7. ProductGrid
8. CategoryProducts
9. ServiceList
10. Blog
11. Benefits
12. Features
13. Services
14. Process
15. Testimonials
16. CaseStudy
17. Gallery
18. Clients
19. CTA
20. Pricing
21. VoucherPromotions
22. Countdown
23. FAQ
24. About
25. Team
26. Video
27. Contact
28. Career
29. Footer
30. SpeedDial

(Mỗi commit: update create + edit + preview + site if needed; keep diff nhỏ, dễ rollback.)

## Verification Plan
- Không chạy lint/test (theo rule). Chỉ chạy `bunx tsc --noEmit` khi có thay đổi code/TS.
- Checklist per type:
  1) System toggle bật/tắt panel ở create/edit.
  2) Enable custom font -> preview + site đổi font.
  3) Disable -> fallback về Be Vietnam Pro.
  4) Reload vẫn giữ font đã chọn.
  5) Không ảnh hưởng component khác.

Nếu bạn ok spec này, tôi sẽ bắt đầu implement theo commit roadmap.