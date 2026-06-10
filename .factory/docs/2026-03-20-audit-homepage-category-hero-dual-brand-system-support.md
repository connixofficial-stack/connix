## TL;DR kiểu Feynman
- `HomepageCategoryHero` đã được nối vào hệ thống `/system/home-components` để bật/tắt create visibility, custom màu và custom font.
- Ở màn `create` và `edit`, component này đã đọc state màu/font từ hệ thống và lưu override đúng pattern chung.
- Font custom đã chạy tới runtime site vì `ComponentRenderer` bọc `font-active` cho `HomepageCategoryHero`.
- Nhưng dual brand color mới chỉ đi tới state/preview info, chưa đi tới UI runtime thực tế của `HomepageCategoryHeroSection`.
- Kết luận hiện tại: `ẩn hiện`, `custom color`, `custom font` = đã áp dụng; `dual brand color như các home-component khác` = mới áp dụng một phần, chưa hoàn tất parity.

## Audit Summary
### Observation
1. `HomepageCategoryHero` có mặt trong registry hệ thống home-components: `lib/home-components/componentTypes.ts`.
2. Trang `/system/home-components` quản lý `hiddenTypes`, `typeColorOverrides`, `typeFontOverrides`, và `globalFontOverride`; tất cả đều áp dụng cho type này vì `CUSTOM_SUPPORTED_TYPES` lấy từ `HOME_COMPONENT_TYPE_VALUES`: `app/system/home-components/page.tsx`, `app/admin/home-components/create/shared.tsx`, `convex/homeComponentSystemConfig.ts`.
3. Màn `create` dùng `useTypeColorOverrideState(... seedCustomFromSettingsWhenTypeEmpty: true)` và `useTypeFontOverrideState(... seedCustomFromSettingsWhenTypeEmpty: true)`, đồng thời submit qua `ComponentFormWrapper`: `app/admin/home-components/create/homepage-category-hero/page.tsx`.
4. Màn `edit` cũng load/save `setTypeColorOverride` và `setTypeFontOverride`, render `TypeColorOverrideCard` + `TypeFontOverrideCard`: `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`.
5. Runtime site bọc font override cho `HomepageCategoryHero` qua `ComponentRenderer` nên custom font thực sự có hiệu lực: `components/site/ComponentRenderer.tsx`.
6. Runtime site chỉ truyền `brandColor={resolvedColors.primary}` vào `HomepageCategoryHeroSection`, không truyền `secondary` hay `mode`: `components/site/ComponentRenderer.tsx`.
7. `HomepageCategoryHeroSection` hiện tại chỉ nhận `brandColor` và phần render đọc đúng một màu ở các điểm như active border, không thấy consume `secondary/mode`: `components/site/HomepageCategoryHeroSection.tsx`.
8. Preview admin cũng truyền `brandColor`, `secondary`, `mode`, nhưng section preview bên dưới vẫn chỉ nhận `brandColor`; `secondary/mode` chủ yếu dùng cho `ColorInfoPanel` và text info: `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`.

### Inference
- Hệ thống `/system/home-components` đã bao phủ `custom color`, `ẩn hiện`, `custom font` cho `HomepageCategoryHero` ở tầng config/admin.
- Font custom đã đi xuyên suốt tới site runtime.
- Dual brand color chưa có parity thực sự với các component khác vì màu phụ chưa được wiring vào section runtime và preview surface chính.

### Decision
- Nếu mục tiêu của anh là “đã áp dụng tốt như các home-component khác chưa?”, câu trả lời hiện tại là: **chưa hoàn toàn**.
- Chính xác hơn:
  - `Ẩn hiện create`: **Có**
  - `Custom color`: **Có ở config/state**, nhưng effect runtime hiện tại gần như chỉ dùng màu chính
  - `Custom font`: **Có**
  - `Dual brand color parity`: **Chưa đủ**

## Root Cause Confidence
**High** — vì evidence khớp xuyên suốt giữa system config, create/edit pages, Convex mutations và runtime renderer:
- Config có lưu cả `mode/primary/secondary`
- Hook có resolve dual/single đầy đủ
- Nhưng `ComponentRenderer` và `HomepageCategoryHeroSection` không truyền/nhận `secondary` + `mode`
- Nên dữ liệu dual-color tồn tại nhưng không được consume ở UI runtime

## Files Impacted
### UI
- `app/system/home-components/page.tsx` — Vai trò hiện tại: trang quản lý ẩn/hiện, custom màu, custom font theo type; Thay đổi: **Không cần sửa** nếu chỉ audit, vì wiring type đã đủ.
- `app/admin/home-components/create/homepage-category-hero/page.tsx` — Vai trò hiện tại: create page đã seed màu/font từ system; Thay đổi: **Có thể giữ nguyên** nếu chỉ cần fix runtime parity.
- `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx` — Vai trò hiện tại: edit page đã load/save custom màu/font; Thay đổi: **Có thể giữ nguyên** nếu chỉ cần fix runtime parity.
- `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx` — Vai trò hiện tại: preview wrapper truyền info màu/font; Thay đổi: **Sửa** để preview section nhận `secondary` + `mode` nếu muốn parity thật.
- `components/site/ComponentRenderer.tsx` — Vai trò hiện tại: resolve type override colors/fonts và render runtime component; Thay đổi: **Sửa** để truyền `secondary` + `mode` cho `HomepageCategoryHeroSection`.
- `components/site/HomepageCategoryHeroSection.tsx` — Vai trò hiện tại: render hero danh mục runtime nhưng mới dùng `brandColor`; Thay đổi: **Sửa** để consume `secondary/mode` vào token/states/accents thực tế.

## Execution Preview
1. Đọc lại pattern color token của vài home-component đã support dual-brand thật.
2. Mở rộng props `HomepageCategoryHeroSection` nhận `secondary` và `mode`.
3. Nối `ComponentRenderer` và `HomepageCategoryHeroPreview` để truyền đủ 3 giá trị `primary/secondary/mode`.
4. Áp dual-color vào các surface hợp lý của hero danh mục (accent, chip, hover, CTA, gradient, panel states) theo pattern sẵn có.
5. Static review lại typing, fallback single/dual, và tương thích dữ liệu cũ.

## Acceptance Criteria
- Ở `/system/home-components`, type `HomepageCategoryHero` vẫn ẩn/hiện được khỏi trang create.
- Khi bật custom font cho `HomepageCategoryHero`, preview admin và site runtime vẫn dùng font override đúng type.
- Khi bật custom màu `single`, section hiển thị nhất quán chỉ 1 màu.
- Khi bật custom màu `dual`, section runtime có ít nhất 2 surface trực quan tiêu thụ `primary` và `secondary`, không chỉ lưu state.
- Preview admin và site runtime không lệch logic single/dual.

## Verification Plan
- Typecheck: nếu user đồng ý triển khai, chạy duy nhất `bunx tsc --noEmit` trước khi commit theo guideline repo.
- Repro tĩnh:
  1. Đối chiếu `HomepageCategoryHero` trong `/system/home-components`.
  2. Xác nhận create/edit đang load/save override.
  3. Sau fix, rà code path preview/runtime xem `secondary` + `mode` được truyền và consume thật.
- Không chạy lint/test/build vì guideline repo cấm.

## Out of Scope
- Không đổi schema/settings của hệ thống vì backend hiện đã đủ dữ liệu.
- Không refactor lớn UI `HomepageCategoryHero` ngoài phần cần để dual-brand hoạt động thật.

## Risk / Rollback
- Rủi ro chính: áp màu phụ quá mạnh làm lệch UI hiện tại giữa các layout.
- Rollback đơn giản vì scope hẹp, chủ yếu ở `ComponentRenderer` và `HomepageCategoryHeroSection`.

Nếu anh muốn em triển khai tiếp, em sẽ sửa theo hướng tối thiểu: chỉ bổ sung parity dual-brand cho runtime/preview, giữ nguyên cơ chế `ẩn hiện`, `custom color`, `custom font` đang có.