## TL;DR kiểu Feynman
- `HomepageCategoryHero` hiện chỉ có bật/tắt ảnh danh mục, chưa có chọn kích thước và chưa có chế độ icon.
- Anh muốn 2 thứ mới: preset size cho avatar danh mục và mode icon riêng, khi bật thì chỉ dùng icon thay vì ảnh.
- Em sẽ thêm config vào schema + create/edit form + preview/runtime để dữ liệu lưu một lần và render giống nhau.
- Icon picker sẽ là grid có search, dùng danh sách khoảng 100 icon Lucide để chọn nhanh.
- Không redesign component; chỉ mở rộng đúng luồng đang có của home-component này.

## Audit Summary
### Observation
1. `HomepageCategoryHeroConfig` hiện mới có `showCategoryImage: boolean`, chưa có field nào cho:
   - kích thước avatar danh mục
   - chế độ hiển thị `image` vs `icon`
   - icon key cho từng category item
2. `HomepageCategoryHeroCategoryItem` hiện mới có:
   - `categoryId`
   - `groups`
   - `imageOverride`
   - `ctaLabel`
   chưa có `iconName` hoặc field tương đương.
3. `HomepageCategoryHeroForm.tsx` hiện chỉ cho chọn danh mục gốc + nhóm menu; chưa có UI cho:
   - preset size ảnh đại diện
   - switch mode ảnh/icon
   - icon picker grid có search
4. `HomepageCategoryHeroSection.tsx` hiện render thumb bằng `renderCategoryThumb()` với size hardcode `h-6 w-6` và logic ảnh/fallback chữ cái; chưa có abstraction theo size preset hoặc icon mode.
5. Create page và Edit page đều pass config trực tiếp vào preview/runtime theo cùng pattern, nên nếu chỉ sửa 1 nơi sẽ bị lệch parity.
6. Yêu cầu user đã chốt rõ:
   - preset size: `rất nhỏ / nhỏ / vừa (hiện tại) / lớn / rất lớn / cực đại`
   - nếu bật chế độ icon thì chỉ dùng icon, còn chế độ ảnh thì như hiện tại
   - icon picker UI: `grid icon có search`

### Inference
- Đây là bài mở rộng config + render contract, không phải chỉ sửa giao diện tạm thời.
- Cần thêm field ở type/default/normalize để create, edit, preview, runtime cùng hiểu chung.
- Nên giữ logic mode ở mức component-level (`image` | `icon`) để không làm form quá phức tạp; còn icon cụ thể nằm ở từng category item.

### Decision
- Em đề xuất thêm 2 lớp config:
  1. `categoryVisualMode: 'image' | 'icon'`
  2. `categoryImageSize: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- Đồng thời thêm `iconName?: string` vào từng `HomepageCategoryHeroCategoryItem`.
- Khi mode = `icon`: runtime chỉ render icon đã chọn; nếu item chưa chọn icon thì fallback chữ cái tên danh mục.
- Khi mode = `image`: hành vi giữ nguyên như hiện tại, gồm `imageOverride` và fallback chữ cái.

## Root Cause Confidence
**High** — vì code hiện tại chưa có bất kỳ field/type/UI/render path nào cho size preset hoặc icon mode; thiếu từ schema đến consumer nên không thể đáp ứng yêu cầu nếu không mở rộng contract.

## Files Impacted
### Shared / schema
- `app/admin/home-components/homepage-category-hero/_types/index.ts` — Vai trò hiện tại: định nghĩa config/category item; Thay đổi: **Sửa** thêm enum/field cho `categoryVisualMode`, `categoryImageSize`, `iconName`.
- `app/admin/home-components/homepage-category-hero/_lib/constants.ts` — Vai trò hiện tại: default config + normalize categories; Thay đổi: **Sửa** để default/normalize các field mới và map size preset.

### Admin create/edit
- `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroForm.tsx` — Vai trò hiện tại: form cấu hình chính; Thay đổi: **Sửa** thêm card cấu hình hiển thị danh mục (mode ảnh/icon, preset size) và icon picker grid có search cho từng category item.
- `app/admin/home-components/homepage-category-hero/[id]/edit/page.tsx` — Vai trò hiện tại: edit state + dirty-state + submit; Thay đổi: **Sửa** thêm state, hydrate initialData, dirty snapshot, save payload cho field mới.
- `app/admin/home-components/create/homepage-category-hero/page.tsx` — Vai trò hiện tại: create state + submit + preview; Thay đổi: **Sửa** thêm state/payload cho field mới.

### Preview / runtime
- `components/site/HomepageCategoryHeroSection.tsx` — Vai trò hiện tại: render thumb ảnh/fallback chữ cái với size cứng; Thay đổi: **Sửa** để render theo mode (`image`/`icon`) và size preset, dùng map kích thước thống nhất.
- `app/admin/home-components/homepage-category-hero/_components/HomepageCategoryHeroPreview.tsx` — Vai trò hiện tại: preview component; Thay đổi: **Sửa** để nhận config mới và giữ parity với runtime.

### Shared helper mới
- `app/admin/home-components/homepage-category-hero/_lib/icon-options.ts` — Vai trò hiện tại: chưa có; Thay đổi: **Thêm** danh sách khoảng 100 Lucide icons + label + lookup map để form và runtime dùng chung.

## Execution Preview
1. Mở rộng types/default config/normalize cho visual mode, image size, iconName.
2. Tạo helper icon options dùng chung:
   - danh sách 100 icon Lucide
   - search label
   - map `iconName -> LucideIcon`
3. Update form:
   - thêm section chọn mode ảnh/icon
   - thêm section chọn size preset
   - ở mỗi category item, khi mode = icon thì hiện picker grid có search + preview icon đang chọn
4. Update create/edit pages:
   - thêm state mới
   - hydrate từ config cũ với fallback safe
   - nối payload submit + dirty-state parity
5. Update runtime/preview:
   - thay `renderCategoryThumb()` để dùng size map và visual mode
   - image mode giữ logic cũ
   - icon mode render Lucide icon, fallback chữ cái nếu chưa chọn icon
6. Review tĩnh lại backward compatibility với dữ liệu cũ không có field mới.

## Acceptance Criteria
- Create và Edit đều có tuỳ chọn `Ảnh` / `Icon` cho hiển thị danh mục.
- Create và Edit đều có preset size gồm: `Rất nhỏ / Nhỏ / Vừa / Lớn / Rất lớn / Cực đại`.
- Khi chọn mode `Icon`, mỗi category item có icon picker dạng grid + search.
- Khi mode `Icon`, preview/runtime chỉ hiển thị icon; không dùng ảnh.
- Khi mode `Ảnh`, hành vi giữ nguyên như hiện tại.
- Preview và site runtime hiển thị cùng mode và cùng kích thước.
- Dữ liệu cũ không có field mới vẫn render an toàn theo default hiện tại (`image` + `vừa`).

## Verification Plan
- Audit tĩnh:
  1. rà tất cả payload create/edit có field mới
  2. rà normalize/default fallback cho dữ liệu cũ
  3. rà `renderCategoryThumb()` không còn hardcode size đơn lẻ
  4. rà preview/runtime cùng dùng một contract config
- Typecheck: `bunx tsc --noEmit`
- Không chạy lint/build/test theo guideline repo.

## Out of Scope
- Không thêm upload icon custom ngoài Lucide.
- Không đổi dữ liệu category gốc trong database products/categories.
- Không thêm icon mode cho home-component khác.

## Risk / Rollback
- Bundle có thể tăng nếu import icon không tối ưu; em sẽ gom danh sách icon vào helper dùng lookup rõ ràng để kiểm soát phạm vi.
- Icon picker grid nếu nhồi quá nhiều logic trong form có thể nặng; sẽ giữ state search cục bộ, chỉ render danh sách cần thiết.
- Rollback đơn giản vì chỉ thêm config fields + UI render path, không đụng schema DB lõi.

## Open Questions
- Không còn ambiguity quan trọng: user đã chốt preset size, mode hoạt động và kiểu icon picker.

## Post-Audit Note
Đây là mở rộng hợp lý theo pattern sẵn có của `HomepageCategoryHero`: config mới sẽ đi xuyên suốt từ create/edit → preview → runtime, tránh lệch hành vi giữa admin và site.