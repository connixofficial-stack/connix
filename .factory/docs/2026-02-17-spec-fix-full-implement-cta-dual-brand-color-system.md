# Spec: Full implement CTA theo dual-brand-color-system (Create/Edit/Render + 6 layouts)

## Mục tiêu
Fix **toàn bộ CTA** (chỉ CTA) để tuân thủ skill `.factory/skills/dual-brand-color-system` ở cả:
- `/admin/home-components/create/cta`
- `/admin/home-components/cta/[id]/edit`
- Render thực tế trang chủ (`components/site/ComponentRenderer.tsx`)

Đảm bảo:
1. Đủ 6 layout (banner, centered, split, floating, gradient, minimal).
2. Render = Preview (single source of truth).
3. Màu theo OKLCH + APCA + Harmony (single mode auto secondary).
4. Không vi phạm anti AI-styling.

---

## Scope
### In scope
- CTA only.
- Refactor color engine + shared CTA layout renderer.
- Thêm harmony cho CTA config (single mode).
- Đồng bộ create/edit/save + render homepage.

### Out of scope
- Không đụng component khác ngoài CTA.
- Không đổi schema DB/Convex.
- Không đổi UX settings page global.

---

## Problem Graph
1. [Main] CTA chưa compliant skill dual-brand-color-system end-to-end.
   1.1 [ROOT CAUSE] Chưa có single source color engine CTA (OKLCH/APCA/Harmony).
   1.2 Create/Edit CTA chưa quản lý `brandMode` + `harmony`.
   1.3 Preview CTA dùng legacy, render homepage dùng code khác => mismatch.
   1.4 Một số style CTA vi phạm anti AI-styling (hover scale/shadow mạnh/decorative gradient).

---

## Execution (with reflection)

### 1) Chuẩn hóa type/config CTA
**File:** `app/admin/home-components/cta/_types/index.ts`

- Giữ nguyên `CTAStyle` (6 style hiện tại).
- Thêm:
  - `export type CTAHarmony = 'analogous' | 'complementary' | 'triadic';`
- Mở rộng `CTAConfig`:
  - `harmony?: CTAHarmony;`

**Lý do:** backward compatible, config cũ không có `harmony` vẫn chạy fallback.

**Reflection:** ✓ KISS + CoC, không phá dữ liệu cũ.

---

### 2) Chuẩn hóa default config CTA
**File:** `app/admin/home-components/cta/_lib/constants.ts`

- Thêm `DEFAULT_CTA_HARMONY`:
  - `export const DEFAULT_CTA_HARMONY: CTAHarmony = 'analogous';`
- `DEFAULT_CTA_CONFIG` không bắt buộc set `harmony` để giữ optional, nhưng page create/edit sẽ fallback bằng `DEFAULT_CTA_HARMONY`.

**Reflection:** ✓ DRY, fallback nhất quán.

---

### 3) Tạo CTA color engine mới (single source màu)
**File mới:** `app/admin/home-components/cta/_lib/colors.ts`

Implement các khối sau (theo pattern Hero/Stats):

#### 3.1 API chính
- `getAPCATextColor(bg, fontSize?, fontWeight?)`
- `generatePalette(hex)` (OKLCH: solid/surface/hover/active/border/disabled/textOnSolid/textInteractive)
- `getAnalogous/getComplementary/getTriadic`
- `resolveSecondaryColor(primary, secondary, mode, harmony)`
- `getHarmonyStatus(primary, secondary)` (deltaE, isTooSimilar)
- `getCTAAccessibilityScore(pairs)` (minLc + failing pairs)
- `getCTAAccentBalance(style)` (expected balance per style)
- `getCTAColors({ primary, secondary, mode, harmony, style })`

#### 3.2 Quy tắc màu bắt buộc
- Heading lớn dùng **primary** (trừ trường hợp nền solid primary -> dùng `textOnSolid` APCA).
- Secondary chỉ cho accent: badge/secondary action/border/subtle accents.
- Placeholder luôn neutral.
- Không hard-code `#fff/#000` cho text trên nền dynamic (trừ neutral semantic text chuẩn hệ thống).

#### 3.3 Token tối thiểu trả về
```ts
interface CTAStyleTokens {
  sectionBg: string;
  sectionBorder?: string;
  title: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  primaryButtonBg: string;
  primaryButtonText: string;
  primaryButtonBorder?: string;
  secondaryButtonBg?: string;
  secondaryButtonText: string;
  secondaryButtonBorder: string;
  cardBg?: string;
  cardBorder?: string;
  cardShadow?: string;
  accentLine?: string;
}
```

#### 3.4 Rule anti AI-styling trong helper/tokens
- Không token cho blur/backdrop-blur decorative.
- Shadow chỉ mức nhẹ (`shadow-sm`/subtle alpha), không glow mạnh.
- Gradient style dùng tint gradient nhẹ, không loang nhiều lớp decorative.

**Reflection:** ✓ Root cause đã được giải từ lõi màu.

---

### 4) Tạo shared CTA renderer dùng chung Preview + Site
**File mới:** `app/admin/home-components/cta/_components/CTASectionShared.tsx`

Tạo component thuần render:
- Input:
  - `config: CTAConfig`
  - `style: CTAStyle`
  - `tokens: CTAStyleTokens`
  - `context: 'preview' | 'site'`
- Render đủ 6 style: `banner|centered|split|floating|gradient|minimal`.

Yêu cầu bắt buộc:
- Logic fallback text/title/description/button giống nhau cho mọi nơi.
- Không dùng class vi phạm anti AI-styling:
  - Bỏ `hover:scale-*`, `shadow-xl` decorative, blur/backdrop blur decor.
- Touch targets >= 44px cho button.
- Giữ semantic heading rõ (site dùng `h2`, preview có thể `h3` nhưng mapping màu giống hệt).

**Reflection:** ✓ DRY tuyệt đối cho layout CTA.

---

### 5) Rewrite CTAPreview khỏi legacy
**File:** `app/admin/home-components/cta/_components/CTAPreview.tsx`

Hiện file chỉ re-export legacy, cần thay bằng implementation thật:

- Dùng `PreviewWrapper`, `BrowserFrame`, `usePreviewDevice`.
- Dùng `getCTAColors` + `CTASectionShared`.
- Style selector vẫn đủ 6 style như hiện tại.
- Nếu `mode === 'single'` thì secondary derive từ harmony qua helper (không tự tính trong JSX).
- Hiển thị warnings:
  - Harmony: `deltaE < 20`.
  - Accessibility: pair fail APCA.

**Reflection:** ✓ Preview không còn lệ thuộc legacy monolith.

---

### 6) Cập nhật CTAForm hỗ trợ harmony
**File:** `app/admin/home-components/cta/_components/CTAForm.tsx`

- Mở rộng props:
  - `brandMode: 'single' | 'dual'`
  - `harmony: CTAHarmony`
  - `setHarmony: (value: CTAHarmony) => void`
- Khi `brandMode === 'single'`, show select harmony với 3 option:
  - Analogous (+30°)
  - Complementary (180°)
  - Triadic (120°)

Giữ nguyên form fields nội dung CTA.

**Reflection:** ✓ YAGNI: chỉ thêm đúng phần CTA cần.

---

### 7) Refactor create CTA page theo pipeline mới
**File:** `app/admin/home-components/create/cta/page.tsx`

Thay đổi cụ thể:
1. Bỏ import preview legacy (`../../_shared/legacy/previews`).
2. Import:
   - `useQuery` + `api` để đọc `site_brand_mode`.
   - `CTAForm`, `CTAPreview`, `DEFAULT_CTA_HARMONY`, `CTAHarmony`.
3. Thêm state:
   - `ctaHarmony` (default `DEFAULT_CTA_HARMONY`).
4. Tính `brandMode`:
   - `modeSetting?.value === 'single' ? 'single' : 'dual'`.
5. Submit config:
   - `{ ...ctaConfig, style, harmony: ctaHarmony }`.
6. UI:
   - Dùng `CTAForm` thay form inline cũ để tránh duplication.
   - Truyền `brandMode/harmony` vào form + preview.

**Reflection:** ✓ Create flow đồng nhất edit flow.

---

### 8) Refactor edit CTA page theo pipeline mới
**File:** `app/admin/home-components/cta/[id]/edit/page.tsx`

Thay đổi cụ thể:
1. Đọc `site_brand_mode` tương tự create page.
2. Thêm state `ctaHarmony`.
3. Khi load config:
   - `setCtaHarmony((config.harmony as CTAHarmony) || DEFAULT_CTA_HARMONY)`.
4. Khi update mutation:
   - `config: { ...ctaConfig, style: ctaStyle, harmony: ctaHarmony }`.
5. Truyền props mới cho `CTAForm` và `CTAPreview`.

**Reflection:** ✓ Backward compatible với bản ghi cũ không có harmony.

---

### 9) Đồng bộ render trang chủ với CTA shared renderer
**File:** `components/site/ComponentRenderer.tsx`

Thay đổi cụ thể:
1. Import thêm:
   - `getCTAColors` từ `app/admin/home-components/cta/_lib/colors`
   - `CTASectionShared` từ `app/admin/home-components/cta/_components/CTASectionShared`
   - type `CTAHarmony`, `CTAStyle` nếu cần.
2. Trong `ComponentRenderer` switch case `CTA`:
   - truyền `mode` xuống `CTASection`.
3. Refactor hàm `CTASection` hiện tại:
   - bỏ toàn bộ hard-coded 6 style cũ.
   - parse config + fallback:
     - `style = ctaStyle ?? 'banner'`
     - `harmony = config.harmony ?? 'analogous'`
   - gọi `getCTAColors({ primary: brandColor, secondary, mode, harmony, style })`
   - render bằng `<CTASectionShared context="site" ... />`

**Kết quả bắt buộc:** preview và site render cùng nguồn JSX + tokens.

**Reflection:** ✓ Single Source of Truth hoàn chỉnh.

---

### 10) Dọn mismatch/fallback CTA cũ
**File liên quan:**
- `app/admin/home-components/create/cta/page.tsx`
- `app/admin/home-components/cta/[id]/edit/page.tsx`
- `components/site/ComponentRenderer.tsx`
- `app/admin/home-components/cta/_components/CTASectionShared.tsx`

Checklist đồng bộ:
- Fallback text/title/description/button giống nhau ở preview/site.
- Rule hiển thị secondary button giống nhau (chỉ render khi có `secondaryButtonText`).
- Không còn style inline mâu thuẫn (`split` shadow dùng cùng token, không chỗ dùng secondary/chỗ dùng brand lẫn lộn).

**Reflection:** ✓ Khóa chặt mismatch regressions.

---

## Acceptance Criteria
1. `/admin/home-components/create/cta`:
   - Có select harmony khi site_brand_mode=single.
   - Đổi style/harmony phản ánh ngay trên preview.
2. `/admin/home-components/cta/[id]/edit`:
   - Load đúng harmony từ config cũ/mới.
   - Save xong reload vẫn giữ đúng style + harmony.
3. Trang chủ:
   - CTA render khớp preview cho cả 6 styles.
4. Color system:
   - Dùng OKLCH/APCA helpers, không hard-code text contrast trên nền dynamic.
   - Cảnh báo khi màu quá giống (`deltaE < 20`) ở preview.
5. Anti AI-styling:
   - Không hover scale/shadow lớn/blur decor trong CTA mới.

---

## QA Checklist chi tiết
- [ ] Test mode dual với 2 màu tương phản mạnh.
- [ ] Test mode dual với 2 màu gần nhau => warning harmony.
- [ ] Test mode single + harmonious secondary cho cả 3 scheme.
- [ ] Test cả 6 layouts ở create.
- [ ] Test cả 6 layouts ở edit (load existing record).
- [ ] Test render homepage cho record mỗi layout.
- [ ] Test dark mode không vỡ contrast.
- [ ] Test mobile preview (touch targets >=44px).

---

## Lệnh verify khi implement
```bash
bunx tsc --noEmit
```

---

## Commit đề xuất (khi implement xong)
```bash
git add app/admin/home-components/cta/_types/index.ts
git add app/admin/home-components/cta/_lib/constants.ts
git add app/admin/home-components/cta/_lib/colors.ts
git add app/admin/home-components/cta/_components/CTASectionShared.tsx
git add app/admin/home-components/cta/_components/CTAPreview.tsx
git add app/admin/home-components/cta/_components/CTAForm.tsx
git add app/admin/home-components/create/cta/page.tsx
git add app/admin/home-components/cta/[id]/edit/page.tsx
git add components/site/ComponentRenderer.tsx
git commit -m "feat(cta): full align CTA with dual-brand-color-system (oklch/apca/harmony)"
```

---

## Kết quả kỳ vọng cuối
- CTA đạt chuẩn skill ở **full flow**: create/edit/preview/render.
- Không còn tình trạng “preview đúng nhưng site lệch”.
- CTA color behavior nhất quán với kiến trúc Hero/Stats hiện có, đúng DRY/KISS/YAGNI.
