## Audit Summary

### TL;DR kiểu Feynman
- Hiện `homepage-category-hero` mới có đúng 1 layout vì contract `style` chỉ cho phép `'sidebar'` và toàn bộ create/edit/preview/runtime đều đang hard-code về layout này.
- Source trong `C:\Users\VTOS\Downloads\zip\app\page.tsx` đã có sẵn 6 layout mẫu `Style1..Style6`; trong đó `Style4Dark` là layout tối cần bỏ.
- Yêu cầu phù hợp nhất là giữ nguyên data/logic hiện tại của component, chỉ mở rộng lớp trình bày để thêm 5 layout mới: tổng cộng 6 layout sáng.
- Muốn làm đúng phải nối đủ pipeline: type → constants → create/edit state → preview selector → runtime renderer.
- Dữ liệu cũ không có `style` vẫn phải fallback về layout hiện tại để an toàn rollback.

### Observation / Inference / Decision
- Observation:
  - `app/admin/home-components/homepage-category-hero/_types/index.ts` hiện `HomepageCategoryHeroStyle = 'sidebar'`.
  - `app/admin/home-components/homepage-category-hero/_lib/constants.ts` hiện `HOMEPAGE_CATEGORY_HERO_STYLES` chỉ có `{ id: 'sidebar', label: 'Sidebar' }`.
  - `HomepageCategoryHeroPreview.tsx`, create page, edit page đều hard-code `previewStyle` / `style` thành `'sidebar'`.
  - `components/site/HomepageCategoryHeroSection.tsx` chỉ render 1 cấu trúc sidebar + banner + mega menu.
  - Source zip có 6 style trong `C:\Users\VTOS\Downloads\zip\app\page.tsx`: `Style1Classic`, `Style2Flush`, `Style3Minimal`, `Style4Dark`, `Style5Soft`, `Style6TopNav`.
- Inference:
  - Đây là thiếu hụt kiến trúc đa-layout, không phải chỉ thiếu UI chọn layout.
  - Có thể tái sử dụng skeleton UI từ zip nhưng nên map lại vào data model hiện tại, không bê nguyên logic demo.
- Decision:
  - Triển khai 5 layout mới theo pattern hiện có của component, bỏ `Style4Dark`, giữ layout cũ làm style mặc định/fallback.

### Audit câu hỏi bắt buộc
1. Triệu chứng: expected là create/edit có đủ 6 layout để chọn; actual là chỉ có 1 layout `Sidebar`.
2. Phạm vi: admin create/edit + preview + runtime site của `HomepageCategoryHero`.
3. Tái hiện: ổn định; vào route user đưa là thấy chỉ có 1 layout.
4. Mốc thay đổi gần nhất: code hiện tại đã refactor component này nhưng chưa có pipeline đa-layout; evidence nằm ngay trong type/constants/preview/runtime.
5. Dữ liệu còn thiếu: chưa thấy blocker nào; source zip đã đủ để lấy visual direction.
6. Giả thuyết thay thế: chỉ preview thiếu selector; đã loại trừ vì create/edit/runtime cũng hard-code 1 style.
7. Rủi ro nếu fix sai nguyên nhân: thêm selector mà site vẫn 1 layout, preview ≠ runtime.
8. Pass/fail: chọn được 6 layout, lưu được `config.style`, preview/site khớp nhau, dữ liệu cũ vẫn chạy.

## Root Cause Confidence
**High** — evidence xuyên suốt từ type, constants, create/edit, preview đến runtime đều xác nhận component chưa có style pipeline đầy đủ.

## Proposal

### Option A (Recommend) — Confidence 92%
Mở rộng `HomepageCategoryHero` thành 6 style đầy đủ và port 5 layout sáng từ zip, bỏ dark layout.
- Vì sao tốt nhất: khớp đúng yêu cầu “thêm 5 layout nữa”, giữ parity preview/site, ít nợ kỹ thuật.
- Tradeoff: phải sửa cả admin lẫn runtime section.

### Mapping layout đề xuất
Giữ tổng cộng 6 layout như sau:
1. `sidebar` — layout hiện tại.
2. `flush` — từ `Style2Flush`.
3. `minimal` — từ `Style3Minimal`.
4. `soft` — từ `Style5Soft`.
5. `top-nav` — từ `Style6TopNav`.
6. `classic` — từ `Style1Classic`.

Loại bỏ:
- `dark-industrial` — từ `Style4Dark` vì user yêu cầu bỏ layout dark.

Lý do giữ `sidebar` làm default thay vì thay bằng layout zip khác:
- an toàn cho dữ liệu cũ,
- đúng hành vi hiện tại,
- dễ rollback,
- giảm rủi ro preview/site mismatch trên các component đã lưu trước đó.

## Files Impacted

### UI / admin
- `Sửa: app/admin/home-components/homepage-category-hero/_types/index.ts`
  - Vai trò hiện tại: contract config cho component.
  - Thay đổi: mở rộng `HomepageCategoryHeroStyle` từ 1 giá trị thành 6 giá trị, vẫn giữ fallback về `sidebar`.

- `Sửa: app/admin/home-components/homepage-category-hero/_lib/constants.ts`
  - Vai trò hiện tại: default config + normalize style.
  - Thay đổi: thêm danh sách 6 style labels, cập nhật normalize helper và default style.

- `Sửa: app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx`
  - Vai trò hiện tại: preview editor nhưng đang hard-code `sidebar`.
  - Thay đổi: nhận `config.style` thật, bật selector 6 layout trong `PreviewWrapper`, preview đổi theo style đã chọn.

- `Sửa: app/admin/home-components/create/homepage-category-hero/page.tsx`
  - Vai trò hiện tại: tạo component mới.
  - Thay đổi: thêm state `style`, submit `style`, truyền vào preview config.

- `Sửa: app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx`
  - Vai trò hiện tại: sửa component.
  - Thay đổi: load/save `style`, thêm dirty-check cho `style`, preview bám theo style đang chọn.

### Runtime / site
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render layout duy nhất.
  - Thay đổi: tách phần render thành các nhánh layout hoặc sub-renderers theo 6 style; giữ nguyên source data resolved categories / banner / mega menu logic, chỉ thay khung giao diện.

- `Sửa: components/site/ComponentRenderer.tsx`
  - Vai trò hiện tại: render component type.
  - Thay đổi dự kiến rất nhỏ hoặc không cần nếu section tự xử lý `config.style`; sẽ kiểm tra và chỉ sửa nếu cần đồng bộ typing.

## Execution Preview
1. Đọc kỹ `HomepageCategoryHeroSection.tsx` để tách phần data-resolving khỏi phần view.
2. Mở rộng style contract trong `_types` và `_lib/constants`.
3. Nối state/load/save style vào create/edit.
4. Cập nhật preview để selector 6 layout dùng chung constants.
5. Port 5 layout sáng từ source zip vào runtime section, nhưng map vào data hiện có của repo:
   - dùng `visibleCategories`, `heroSlides`, `groups`, `resolveMenuItem`, `brandColor`,
   - không thay auto-generate/config/data shape.
6. Review tĩnh backward compatibility cho config cũ không có `style`.
7. Nếu user duyệt và sau khi code xong, chỉ chạy `bunx tsc --noEmit` theo rule repo trước khi commit.

## Cách tôi sẽ port 5 layout mà vẫn giữ chức năng hiện tại
- Không copy nguyên file demo zip vào repo.
- Giữ nguyên các hàm xử lý đang có:
  - `resolveCategoryLink`
  - `resolveMenuItem`
  - `renderCategoryThumb`
  - auto-generate / hide empty / product/category linking
  - device behavior desktop/tablet/mobile.
- Chỉ thay lớp presentation:
  - vị trí menu,
  - kiểu panel mega menu,
  - độ bo góc / spacing,
  - style hero container,
  - top-nav vs sidebar arrangement.
- Layout `top-nav` sẽ cần đặc biệt hóa navigation ngang ở desktop, còn tablet/mobile vẫn fallback về accordion/drawer pattern tương tự để tránh vỡ chức năng.

## Acceptance Criteria
- Create và edit của `HomepageCategoryHero` hiển thị đủ 6 layout options.
- Layout dark không xuất hiện trong editor.
- Đổi layout làm preview thay đổi ngay.
- Save xong, reload lại edit page vẫn giữ đúng layout đã chọn.
- Runtime site render đúng layout theo `config.style`.
- Dữ liệu cũ không có `style` vẫn hiển thị bằng `sidebar` như hiện tại.
- Logic danh mục, auto-generate, hide-empty, link category/product, banner slider vẫn giữ nguyên behavior.

## Verification Plan
- Typecheck: `bunx tsc --noEmit` sau khi code xong vì có thay đổi TS/code.
- Static review:
  - kiểm tra union type/style constants khớp nhau,
  - create/edit submit và load đúng `style`,
  - preview không còn hard-code `sidebar`,
  - runtime fallback an toàn cho dữ liệu cũ.
- Repro cho tester:
  1. Mở create route của component.
  2. Chọn lần lượt 6 layout, kiểm tra preview.
  3. Lưu từng layout mẫu, mở lại edit route kiểm tra persisted style.
  4. Xem ngoài site để đối chiếu preview/site parity.

## Risk / Rollback
- Risk chính: layout mới có thể lệch behavior hover/accordion giữa desktop và mobile nếu port quá sát demo zip.
- Giảm rủi ro: tái dùng logic dữ liệu/interaction hiện có, chỉ đổi frame UI.
- Rollback: revert nhóm file của `homepage-category-hero`; vì thay đổi tập trung nên rollback tương đối gọn.

## Out of Scope
- Không đổi schema dữ liệu business.
- Không thêm chức năng mới ngoài chọn layout.
- Không port dark layout.
- Không tối ưu animation/performance ngoài mức cần để layout hoạt động đúng.

Nếu bạn duyệt spec này, tôi sẽ bắt đầu code theo Option A và sau đó commit lại đúng rule repo.