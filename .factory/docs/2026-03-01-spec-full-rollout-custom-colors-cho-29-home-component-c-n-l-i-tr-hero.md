## Problem Graph
1. [Main] Full implement custom color cho **29 home-component còn lại** theo skill `apply-home-component-custom-colors` <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [ROOT CAUSE] Hiện system + convex chỉ support custom cho Hero (`CUSTOM_SUPPORTED_TYPES`, `SUPPORTED_CUSTOM_TYPES`) nên không rollout được toàn bộ
   1.2 [ROOT CAUSE] Site runtime mới đọc override của Hero trong `ComponentRenderer`, các type khác có nguy cơ preview/site mismatch
   1.3 [Sub] Mỗi edit page đang dùng `useBrandColors` trực tiếp, chưa có shared resolver per-type (dễ lệch logic)
   1.4 [Sub] Chưa có shared UI/logic cho custom block nên lặp code lớn nếu copy-paste 29 lần
   1.5 [Sub] Cần đảm bảo rule màu chuẩn skill: single=monochromatic, dual auto analogous + deltaE guard, có toast, có reset-safe

## Scope đã chốt với bạn
- **Làm theo codebase thực tế:** rollout cho **29 type còn lại (trừ Hero)**.
- Kiến trúc: **Option A** (shared resolver dùng chung edit + preview + site).
- Rule secondary khi single -> dual: **auto analogous + deltaE guard** (fallback complementary nếu gần quá).
- Không chia phase, làm full implement một lượt.

## Danh sách 29 type target (trừ Hero)
1) Stats
2) Partners
3) TrustBadges
4) ProductCategories
5) ProductList
6) ProductGrid
7) CategoryProducts
8) ServiceList
9) Blog
10) Benefits
11) Features
12) Services
13) Process
14) Testimonials
15) CaseStudy
16) Gallery
17) Clients
18) CTA
19) Pricing
20) VoucherPromotions
21) Countdown
22) FAQ
23) About
24) Team
25) Video
26) Contact
27) Career
28) Footer
29) SpeedDial

## Execution (with reflection)

### 1) Chuẩn hoá nguồn type chung để tránh lệch danh sách
**Files:**
- `app/admin/home-components/create/shared.tsx`
- `app/system/home-components/page.tsx`
- `convex/homeComponentSystemConfig.ts`

**Thay đổi:**
- Export thêm hằng `HOME_COMPONENT_TYPE_VALUES` từ `create/shared.tsx` (derive từ `COMPONENT_TYPES.map(t => t.value)`).
- `app/system/home-components/page.tsx` thay `CUSTOM_SUPPORTED_TYPES` hardcode thành `new Set(HOME_COMPONENT_TYPE_VALUES)`.
- `convex/homeComponentSystemConfig.ts` thay `SUPPORTED_CUSTOM_TYPES` hardcode Hero thành `new Set(HOME_COMPONENT_TYPE_VALUES)` (import từ shared constants file phù hợp, nếu cần tách constants để dùng được ở Convex).

**Reflection:**
- ✓ Giải quyết root cause 1.1, tránh quên type mới về sau.

---

### 2) Tạo shared color override core (single source of truth)
**Files mới dự kiến:**
- `app/admin/home-components/_shared/lib/typeColorOverride.ts`
- `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts`

**Logic sẽ có:**
- Type chuẩn:
  - `ColorOverrideState { enabled, mode, primary, secondary }`
  - `ResolvedTypeColors { mode, primary, secondary, usingCustom }`
- Hàm normalize/resolve dùng chung:
  - `isValidHexColor`
  - `getAnalogousColor`
  - `getComplementaryColor`
  - `getSuggestedSecondary(primary)` với deltaE guard
  - `resolveSecondaryByMode(mode, primary, secondary)` (single => primary)
  - `resolveTypeOverrideColors({ type, systemColors, overrides })`
- Hook `useTypeColorOverride(type)`:
  - đọc `systemConfig = api.homeComponentSystemConfig.getConfig`
  - đọc `systemColors = useBrandColors()`
  - trả về `resolvedColors`, `showCustomBlock`, `overrideRaw` để edit page/site dùng cùng logic.

**Reflection:**
- ✓ Giải quyết 1.2 + 1.3; loại bỏ copy-paste logic Hero.

---

### 3) Tạo shared UI block custom color để tái sử dụng 29 edit pages
**File mới dự kiến:**
- `app/admin/home-components/_shared/components/TypeColorOverrideCard.tsx`

**Nội dung component:**
- Props: `type`, `enabled`, `mode`, `primary`, `secondary`, `onEnabledChange`, `onModeChange`, `onPrimaryChange`, `onSecondaryChange`, `disabled?`.
- UI tương tự Hero:
  - Toggle “Dùng màu custom”
  - Nút mode Single/Dual
  - Input color + text cho primary/secondary
  - Khi switch single -> dual: auto fill secondary bằng `getSuggestedSecondary`.
  - Khi single: secondary input disabled.
- Không auto save; chỉ bind state, save ở nút “Lưu thay đổi” của từng page (giữ UX hiện tại).

**Reflection:**
- ✓ Giảm rủi ro sai lệch giữa 29 type, DRY đúng yêu cầu.

---

### 4) Chuẩn hoá site runtime: ComponentRenderer đọc override cho mọi type
**File:**
- `components/site/ComponentRenderer.tsx`

**Thay đổi cụ thể:**
- Bỏ special-case Hero-only (`heroOverride`, `heroMode`, ...).
- Trước switch(type): dùng shared resolver để tính `resolved = resolveTypeOverrideColors({ type, systemColors, overrides })`.
- Tất cả case dùng `resolved.primary`, `resolved.secondary`, `resolved.mode` thay `brandColor/secondary/mode` raw.
- Giữ fallback system colors khi override chưa bật.

**Reflection:**
- ✓ Giải quyết trực diện bug class “preview đổi nhưng site không đổi” theo lesson `bec3060`.

---

### 5) Chuẩn hoá admin edit cho 29 type còn lại (không đụng Hero)
**Files sẽ sửa (29 pages):**
- `app/admin/home-components/stats/[id]/edit/page.tsx`
- `.../partners/[id]/edit/page.tsx`
- `.../trust-badges/[id]/edit/page.tsx`
- `.../product-categories/[id]/edit/page.tsx`
- `.../product-list/[id]/edit/page.tsx`
- `.../product-grid/[id]/edit/page.tsx`
- `.../category-products/[id]/edit/page.tsx`
- `.../service-list/[id]/edit/page.tsx`
- `.../blog/[id]/edit/page.tsx`
- `.../benefits/[id]/edit/page.tsx`
- `.../features/[id]/edit/page.tsx`
- `.../services/[id]/edit/page.tsx`
- `.../process/[id]/edit/page.tsx`
- `.../testimonials/[id]/edit/page.tsx`
- `.../case-study/[id]/edit/page.tsx`
- `.../gallery/[id]/edit/page.tsx`
- `.../clients/[id]/edit/page.tsx`
- `.../cta/[id]/edit/page.tsx`
- `.../pricing/[id]/edit/page.tsx`
- `.../voucher-promotions/[id]/edit/page.tsx`
- `.../countdown/[id]/edit/page.tsx`
- `.../faq/[id]/edit/page.tsx`
- `.../about/[id]/edit/page.tsx`
- `.../team/[id]/edit/page.tsx`
- `.../video/[id]/edit/page.tsx`
- `.../contact/[id]/edit/page.tsx`
- `.../career/[id]/edit/page.tsx`
- `.../footer/[id]/edit/page.tsx`
- `.../speed-dial/[id]/edit/page.tsx`

**Pattern áp dụng nhất quán cho mỗi file:**
1. Thêm `type = '<TypeName>'` cố định.
2. Dùng `useTypeColorOverride(type)` để lấy `resolvedColors` + `showCustomBlock` + override raw.
3. State local cho custom block (enabled/mode/primary/secondary) + initial snapshot để tính `hasChanges`.
4. Gắn `TypeColorOverrideCard` vào cột preview sticky, hiển thị **chỉ khi** `showCustomBlock` true (system đã bật custom type đó).
5. Truyền màu preview bằng `resolvedColors` (không truyền `useBrandColors` trực tiếp nữa).
6. Trong `handleSubmit`:
   - save component config như cũ
   - nếu `showCustomBlock`: gọi `setTypeColorOverride({ type, enabled, mode, primary, secondaryResolved })`
7. Cập nhật `hasChanges` bao gồm cả thay đổi custom màu.

**Reflection:**
- ✓ Đúng lesson skill: custom block gần preview, ẩn khi system OFF, save đồng bộ component + override.

---

### 6) Chuẩn hoá logic system page bulk/per-row với toast đầy đủ
**File:**
- `app/system/home-components/page.tsx`

**Thay đổi:**
- Per-row toggle custom giữ nguyên nhưng enable cho 30 type.
- `handleBulkCustom` thêm toast success/error (hiện tại chưa có try/catch + toast như toggle đơn).
- Bulk custom khi enable sẽ set default override an toàn (mode/system colors), single => secondary=primary.
- Giữ UX table 1 khối + select all như hiện tại.

**Reflection:**
- ✓ Bám lesson `dc764b4`: mọi thao tác toggle/bulk đều có feedback rõ.

---

### 7) Convex guard + normalize để an toàn dữ liệu
**File:**
- `convex/homeComponentSystemConfig.ts`

**Thay đổi:**
- Validation type theo set đầy đủ từ source chung.
- `bulkSetTypeColorOverride` giữ normalize chặt:
  - invalid hex -> fallback
  - mode single -> secondary=primary
- Không đổi shape settings key (`home_components/type_color_overrides`) để backward compatibility.

**Reflection:**
- ✓ Dữ liệu sạch, không phá config cũ/seed.

---

### 8) Tương thích create + reset (xác nhận không regression)
**Files check/sửa nhẹ nếu cần:**
- `app/admin/home-components/create/page.tsx` (đang filter hiddenTypes ổn, giữ nguyên)
- `components/data/SeedWizardDialog.tsx` (đã reset overrides `{}`)
- `convex/admin/modules.ts` (đã reset hidden types)

**Mục tiêu:**
- Không đổi hành vi reset hiện tại, chỉ đảm bảo full rollout không phá default.

**Reflection:**
- ✓ Đáp ứng checklist ops/reset của skill.

---

### 9) Verification bắt buộc trước commit
**Chạy:**
- `bunx tsc --noEmit`

**Test tay bắt buộc (không bỏ):**
1. `/system/home-components`: bật custom cho vài type bất kỳ + bulk enable, có toast.
2. Vào từng edit page mẫu đại diện (ít nhất 8 nhóm UI khác nhau: Stats, Gallery, CTA, FAQ, Pricing, Contact, Footer, SpeedDial):
   - custom block hiện khi system ON
   - single mode khóa secondary
   - dual mode auto secondary analogous+deltaE
3. Preview đổi màu đúng theo override.
4. Site render ở `/` đổi đúng theo cùng type override (đặc biệt non-Hero).
5. Tắt custom type -> edit/preview/site quay về system colors.
6. Hidden type ở create vẫn hoạt động.

---

### 10) Commit theo rule repo
- Stage toàn bộ file thay đổi + **add kèm `.factory/docs` nếu có thay đổi trong đó**.
- Trước commit chạy:
  - `git diff --cached`
  - `git status`
  - rà secrets.
- Commit message đề xuất:
  - `feat(home-components): rollout custom type colors for remaining 29 components`

## Danh sách file chính dự kiến tạo/sửa
**Tạo mới**
- `app/admin/home-components/_shared/lib/typeColorOverride.ts`
- `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts`
- `app/admin/home-components/_shared/components/TypeColorOverrideCard.tsx`

**Sửa trọng tâm**
- `components/site/ComponentRenderer.tsx`
- `app/system/home-components/page.tsx`
- `convex/homeComponentSystemConfig.ts`
- `app/admin/home-components/create/shared.tsx`
- 29 file edit page của 29 type còn lại (list ở bước 5)

## Done Criteria (pass hết mới coi là xong)
- [ ] System hỗ trợ custom cho toàn bộ type (không chỉ Hero)
- [ ] Mỗi edit page trong 29 type có custom block chuẩn, ẩn khi system OFF
- [ ] Preview và site dùng cùng resolver, không còn mismatch
- [ ] Single mode luôn secondary=primary
- [ ] Dual mode auto analogous + deltaE guard
- [ ] Per-row + bulk toggle đều có sonner toast
- [ ] `bunx tsc --noEmit` pass
- [ ] Đã commit local, không push