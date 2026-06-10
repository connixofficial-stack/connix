## Problem Graph
1. [Main] Thêm experience mới “Trang lỗi hệ thống” trong `/system/experiences` <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [ROOT CAUSE] Chưa có contract config chuẩn cho error experience (layout + code + CTA + message)
   1.2 Chưa có preview/editor 3 layout theo pattern experiences hiện tại
   1.3 Chưa có renderer site dùng chung cho 404/500 và route lỗi tổng quát
   1.4 Chưa có pipeline màu dual-brand chuẩn OKLCH/APCA cho error UI

## Execution (with reflection)
1. Solving 1.1 (contract config)
- Thought: cần thống nhất key/config trước để save/load ổn định, tránh lệch editor/site.
- Action: tạo `error_pages_ui` + parser tương tự `contact_ui`, gồm:
  - `layoutStyle`: `'centered' | 'split' | 'illustrated'`
  - `statusCode`: `number` (cho preview động)
  - `showGoHome`: boolean
  - `showGoBack`: boolean
  - `showShortApology`: boolean
  - `customHeadline?`, `customMessage?`
- Reflection: ✓ bám CoC, dễ mở rộng.

2. Solving 1.2 (editor + preview)
- Thought: giữ UI nhất quán với các experiences đang có (ColorConfigCard, LayoutTabs, DeviceToggle, useExperienceSave).
- Action:
  - Thêm card vào `app/system/experiences/page.tsx`: “Trang lỗi hệ thống”.
  - Tạo `app/system/experiences/error-pages/page.tsx` với 3 layout tabs + chọn mã lỗi động.
  - Tạo `components/experiences/previews/ErrorPagesPreview.tsx`.
  - 10 mã lỗi phổ biến (theo MDN/Cloudflare): `400, 401, 403, 404, 408, 429, 500, 502, 503, 504`.
  - Text tiếng Việt theo code map (ví dụ 429: “Bạn thao tác quá nhanh”, 503: “Dịch vụ đang bảo trì”).
- Reflection: ✓ đúng yêu cầu “1 experience dùng nhiều trạng thái”, có 3 layout.

3. Solving 1.3 (site runtime)
- Thought: cần 1 renderer dùng chung để tránh duplicate giữa not-found và error.
- Action (Option A):
  - Tạo `app/(site)/errors/[code]/page.tsx` dùng renderer chung.
  - Tạo `app/(site)/not-found.tsx` -> render code 404.
  - Tạo `app/(site)/global-error.tsx` -> render code 500.
  - CTA: “Về trang chủ” + “Quay lại”.
- Reflection: ✓ DRY, maintain tốt.

4. Solving 1.4 (dual-brand color system)
- Thought: preview/site phải dùng chung token generator, tuân thủ APCA + single/dual mode.
- Action:
  - Tạo `components/site/error/colors.ts` (OKLCH tints/shades + APCA text guard).
  - Quy tắc `resolveSecondary(mode)`:
    - single => secondary = primary
    - dual => dùng secondary hợp lệ, fallback primary
  - Thêm token semantic cho: `errorCode`, `headline`, `message`, `primaryButton`, `secondaryButton`, `accentSurface`, `icon`.
  - Preview và site cùng gọi 1 helper màu (single source of truth).
- Reflection: ✓ đúng skill `dual-brand-color-system`.

---

## Scope & Impacted Paths
### 1) Core experience contract
- `lib/experiences/constants.ts` (add `error_pages_ui` vào `ExperienceKey`, `EXPERIENCE_NAMES`, `EXPERIENCE_COLORS`)
- `lib/experiences/index.ts` (export config parser/key mới)
- `lib/experiences/error-pages/config.ts` (new)

### 2) System editor
- `app/system/experiences/page.tsx` (thêm card điều hướng)
- `app/system/experiences/error-pages/page.tsx` (new editor page)
- `components/experiences/index.ts` (export preview mới)
- `components/experiences/previews/ErrorPagesPreview.tsx` (new)

### 3) Site renderer + routes
- `components/site/error/ErrorPageView.tsx` (new, renderer dùng chung)
- `components/site/error/colors.ts` (new, dual-brand tokens)
- `app/(site)/errors/[code]/page.tsx` (new, route tổng quát)
- `app/(site)/not-found.tsx` (new, map 404)
- `app/(site)/global-error.tsx` (new, map 500)

### 4) Optional sync presets (non-critical)
- `components/data/seed-wizard/experience-presets.ts` (có thể bổ sung default preset cho `error_pages_ui` nếu muốn đồng bộ wizard)

---

## Ordered Actions (step-by-step implementable)
1. Tạo `lib/experiences/error-pages/config.ts` với type/default/parser + map message tiếng Việt cho 10 mã lỗi.
2. Cập nhật `lib/experiences/constants.ts` + `lib/experiences/index.ts` để đăng ký experience key mới.
3. Tạo `components/site/error/colors.ts` theo OKLCH/APCA (shared tokens).
4. Tạo `components/site/error/ErrorPageView.tsx` nhận props: `{ code, layoutStyle, brandColor, secondaryColor, colorMode, showGoHome, showGoBack, showShortApology, customHeadline, customMessage }`.
5. Tạo `components/experiences/previews/ErrorPagesPreview.tsx` dùng chung `ErrorPageView` (mock action cho nút).
6. Tạo `app/system/experiences/error-pages/page.tsx` theo pattern page experiences hiện tại:
   - Query settings key `error_pages_ui`
   - `ColorConfigCard` + `LayoutTabs` + `DeviceToggle`
   - control chọn mã lỗi (select 10 codes)
   - save với `useExperienceSave`
7. Thêm card mới vào `app/system/experiences/page.tsx` (title: “Trang lỗi hệ thống”, mô tả rõ 10 mã lỗi).
8. Tạo `app/(site)/errors/[code]/page.tsx` parse `code`, fallback 404 nếu invalid, render `ErrorPageView`.
9. Tạo `app/(site)/not-found.tsx` và `app/(site)/global-error.tsx` dùng `ErrorPageView` với code 404/500.
10. Type-check bằng `bunx tsc --noEmit`.

---

## Gate Matrix
### Critical gates (phải pass)
- C1: Experience xuất hiện trong `/system/experiences` và mở editor được.
- C2: Save/load `error_pages_ui` hoạt động ổn định qua refresh.
- C3: 3 layout hiển thị đúng trên desktop/tablet/mobile preview.
- C4: Màu single/dual mode sync từ settings và override realtime trong preview.
- C5: Site route `not-found` và `global-error` render đúng text tiếng Việt + CTA.
- C6: `bunx tsc --noEmit` pass.

### Non-critical gates (warning nếu fail)
- N1: Đồng bộ preset trong seed wizard.
- N2: Tối ưu copywriting từng mã lỗi theo tone brand riêng.

---

## Warnings + Remediation
- Warning 1: Next.js không tự sinh riêng 429/503 theo core flow; cần route `/errors/[code]` để mô phỏng/hiển thị chủ động.
  - Remediation: map từ middleware/API guard về route này khi cần.
- Warning 2: `global-error.tsx` là client boundary, cần đảm bảo minimal deps.
  - Remediation: renderer tách logic nặng sang component thuần props.

---

## Best-practice checklist (dễ duyệt)
- [ ] DRY: preview và site dùng chung `ErrorPageView` + color helper.
- [ ] CoC: load đủ `primary/secondary/mode` từ `useBrandColors`.
- [ ] APCA: text trên solid luôn qua guard contrast.
- [ ] UX: luôn có 2 CTA “Về trang chủ” + “Quay lại”.
- [ ] 10 mã lỗi phổ biến có message tiếng Việt ngắn gọn, dễ hiểu.
- [ ] Không thêm feature ngoài scope (KISS/YAGNI).

## Next-safe-step
Sau khi bạn chọn Option A hoặc B, tôi sẽ implement đúng spec này và chỉ chạy `bunx tsc --noEmit` trước khi commit.