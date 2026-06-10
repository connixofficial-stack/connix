# I. Primer
## 1. TL;DR kiểu Feynman
- Preview Blog đúng vì nó luôn bọc renderer trong một `@container`, nên các class kiểu `@[600px]:grid-cols-3`, `@[900px]:grid-cols-4`, `@md:*`, `@lg:*` đều được kích hoạt đúng.
- Site thật đang sai vì `BlogSectionRuntime` của layout 1,2,3,5,6 dùng rất nhiều container query class, nhưng ở runtime site lại không có wrapper `@container` tương ứng.
- Kết quả là desktop site không “nâng cột” lên 3–4 cột, nên nhìn như mobile/tablet dù màn hình desktop rộng.
- Layout 4 ít bị lỗi hơn vì riêng `getOuterShellClassName(style)` chỉ gắn `@container` cho `layout4`.
- Root cause chính không phải do data, itemCount hay preview shell nữa; mà là contract responsive bị lệch giữa preview shell và site shell.

## 2. Elaboration & Self-Explanation
Vấn đề ở đây là Blog runtime đang viết responsive theo kiểu container queries, không phải chỉ theo viewport media queries thông thường.

Trong preview, `BlogPreview.tsx` bọc `BlogSectionRuntime` bằng một khối có class `@container`, nên các rule như `@[600px]:grid-cols-3` hoặc `@[900px]:grid-cols-4` hoạt động. Vì vậy preview desktop hiển thị đúng 4 cột.

Nhưng ở site thật, `components/site/BlogSection.tsx` render thẳng `BlogSectionRuntime` mà không thêm `@container`. Trong `BlogSectionRuntime.tsx`, hàm `getOuterShellClassName()` hiện chỉ thêm `@container` cho riêng `layout4`, còn layout 1,2,3,5,6 thì không có. Do đó các class container-query trong các layout này gần như không có “container context” để tính breakpoint, nên UI giữ ở trạng thái base/fallback giống mobile hơn.

Nói ngắn gọn: cùng một renderer, nhưng preview có môi trường responsive khác site. Vì thế preview đúng còn site sai.

## 3. Concrete Examples & Analogies
Ví dụ sát với repo:
- `layout5` trong ảnh preview đang ra 4 cột.
- Trong code `BlogSectionRuntime.tsx`, layout5 dùng grid: `grid-cols-2 ... @[600px]:grid-cols-3 @[900px]:grid-cols-4`.
- Nếu không có `@container`, browser chỉ giữ `grid-cols-2` base hoặc các mức không mong muốn, nên desktop site trông như đang ở breakpoint nhỏ.

Analogy đời thường:
- Giống như một cái thước đo cần có mốc chuẩn để đọc số.
- Preview có “mốc chuẩn” (`@container`), nên thước đo đúng.
- Site thiếu “mốc chuẩn”, nên cùng một công thức responsive nhưng đọc sai kích thước và xếp layout sai.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Ảnh preview desktop cho Blog layout5 đang đúng: 4 cột.
  - Ảnh site thật desktop chỉ ra 2 cột lớn, nhìn giống mobile/tablet.
- Observation:
  - `app/admin/home-components/blog/_components/BlogPreview.tsx` bọc vùng preview bằng `className="w-full flex-1 @container"`.
  - `components/site/BlogSection.tsx` không tạo wrapper `@container` nào trước khi render `BlogSectionRuntime`.
- Observation:
  - `app/admin/home-components/blog/_components/BlogSectionRuntime.tsx` dùng dày đặc container-query classes: `@[600px]:grid-cols-*`, `@[900px]:grid-cols-*`, `@md:*`, `@lg:*`.
  - `getOuterShellClassName(style)` chỉ trả về `... @container` cho riêng `layout4`.
- Observation:
  - Hero/Stats runtime không phụ thuộc container query kiểu này; chúng dùng trực tiếp `md:`/`lg:` theo viewport hoặc tự tách preview/runtime, nên không có drift cùng loại.
- Observation:
  - Contact shared component có logic `context/device` riêng để site tự có contract responsive của nó; không phụ thuộc vào preview wrapper để site desktop đúng.

Trả lời nhanh theo Audit & Root Cause Protocol:
1. Triệu chứng: preview đúng 4 cột, site desktop co như mobile/tablet.
2. Phạm vi: Blog home-component, ảnh hưởng cả 6 layout nhưng nặng nhất ở 1,2,3,5,6.
3. Tái hiện: ổn định; chỉ cần mở preview desktop và site desktop cùng config.
4. Mốc thay đổi gần nhất: Blog vừa refactor sang `BlogSectionRuntime`, nhưng drift hiện tại là contract responsive giữa preview/site.
5. Dữ liệu còn thiếu: chưa có ảnh của đủ cả 6 layout, nhưng evidence trong code đã đủ mạnh để kết luận root cause class-level.
6. Giả thuyết thay thế chưa bị loại trừ hoàn toàn: CSS global/plugin cho container queries có thể tác động thêm; tuy nhiên vì preview cùng app vẫn chạy đúng nên khả năng này thấp.
7. Rủi ro nếu fix sai nguyên nhân: có thể tiếp tục chỉnh itemCount/shell/data mà site vẫn lệch desktop.
8. Pass/fail: site desktop phải lên đúng số cột tương ứng preview cho từng layout.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## Root Cause Confidence (Độ tin cậy nguyên nhân gốc)
- High.
- Lý do:
  - Preview có `@container`, site không có.
  - Blog runtime dùng container-query classes ở nhiều layout.
  - Chỉ layout4 được gắn `@container` trong runtime helper.
  - Triệu chứng khớp chính xác với hành vi “container query không có container context”.

## Counter-Hypothesis (Giả thuyết đối chứng)
- Giả thuyết A: do site lấy ít/nhiều bài hơn preview.
  - Đã không khớp với triệu chứng “cỡ như mobile”; item count ảnh hưởng số item, không trực tiếp làm desktop co thành 2 cột lớn như ảnh.
- Giả thuyết B: do ảnh thumbnail hoặc content dài làm vỡ grid.
  - Không đủ giải thích việc toàn bộ layout 1,2,3,5,6 cùng lệch breakpoint.
- Giả thuyết C: do `BrowserFrame` của preview thêm padding/shell đẹp hơn.
  - Shell có thể ảnh hưởng bề ngang hiển thị, nhưng evidence mạnh hơn là preview có `@container` còn site không có.

```mermaid
flowchart TD
  A[BlogPreview] --> B[@container wrapper]
  B --> C[BlogSectionRuntime]
  C --> D[Container queries active]
  D --> E[Preview desktop đúng 3-4 cột]

  F[Site BlogSection] --> G[Không có @container wrapper]
  G --> C
  C --> H[Container queries không kích hoạt đúng]
  H --> I[Site desktop co như mobile/tablet]
```

# IV. Proposal (Đề xuất)
- Đề xuất 1 (Recommend) — Confidence 92%:
  - Chuẩn hóa Blog runtime-first bằng cách bảo đảm site runtime cũng có `@container` contract giống preview cho tất cả layout đang dùng container queries.
  - Cách làm nhỏ, đúng gốc, dễ rollback: sửa `BlogSectionRuntime` để `outer shell` luôn có `@container` cho toàn bộ layout blog, không chỉ layout4.
  - Đồng thời review lại các điểm dùng `@md/@lg/@[600px]/@[900px]` để bảo đảm tất cả đều đang bám cùng một container source-of-truth.
- Đề xuất 2 — Confidence 70%:
  - Bỏ container query trong Blog, chuyển toàn bộ sang viewport media queries (`md:`, `lg:` thuần Tailwind) như Stats/Hero runtime.
  - Chỉ phù hợp nếu muốn refactor rộng và dứt điểm pattern cũ; tradeoff là scope lớn hơn, diff rộng hơn.

Khuyến nghị chọn Đề xuất 1 vì đúng root cause, thay đổi nhỏ hơn, giữ nguyên phần lớn JSX/layout hiện tại.

# V. Files Impacted (Tệp bị ảnh hưởng)
## UI / shared
- `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\admin\home-components\blog\_components\BlogSectionRuntime.tsx`
  - Vai trò hiện tại: renderer source-of-truth cho preview và site của Blog.
  - Sửa: chuẩn hóa responsive container contract để site và preview cùng có context desktop/tablet/mobile đúng.
- `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\components\site\BlogSection.tsx`
  - Vai trò hiện tại: runtime site adapter, load posts rồi truyền vào `BlogSectionRuntime`.
  - Có thể không cần sửa; chỉ re-check nếu cần wrapper site-level rõ nghĩa hơn.
- `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\admin\home-components\blog\_components\BlogPreview.tsx`
  - Vai trò hiện tại: preview shell cho admin create/edit.
  - Có thể không cần sửa; chỉ giữ làm đối chiếu contract với site.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại `BlogSectionRuntime.tsx` và xác định toàn bộ layout nào đang phụ thuộc container query.
2. Chuẩn hóa `outer shell` để site runtime có `@container` giống preview cho các layout liên quan.
3. Rà các grid/flex breakpoint trong 6 layout để chắc không còn layout nào vô tình bám preview-only context.
4. Review tĩnh diff để bảo đảm không chạm logic data/order/item limit ngoài phạm vi responsive.
5. Commit cục bộ kèm spec docs theo rule repo.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static review:
  - Xác nhận `BlogSectionRuntime` có một responsive source-of-truth thống nhất giữa preview/site.
  - Xác nhận không còn chỗ nào mà preview có `@container` còn site thiếu cho cùng layout contract.
- Repro cần tester/runtime:
  - Mở `/admin/home-components/blog/js7fa5apx4p1dbvmb0j2tsq0rd85ftt2/edit` ở desktop và so với site thật.
  - Kiểm từng layout:
    - layout1: desktop lên 4 cột
    - layout2: desktop lên 4 cột
    - layout3: featured + list side đúng desktop split
    - layout4: giữ nguyên đúng
    - layout5: desktop lên 4 cột
    - layout6: desktop lên 3 cột
- Typecheck:
  - Sau khi được duyệt và code xong, theo rule repo chỉ chạy `bunx tsc --noEmit` vì có thay đổi TS.

# VIII. Todo
- Xác nhận root cause là thiếu `@container` contract ở site runtime cho Blog.
- Sửa runtime shell theo hướng tối thiểu, không mở rộng scope.
- Review tĩnh các breakpoint/layout Blog 1..6.
- Commit cục bộ kèm `.factory/docs` sau khi hoàn tất.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Site desktop của Blog không còn hiển thị như mobile/tablet khi layout config là desktop.
- Layout 1,2,3,5,6 trên site có số cột/cấu trúc desktop khớp preview desktop.
- Layout4 không bị regress.
- Không đổi logic chọn bài, sort, manual selection, item cap ngoài phạm vi responsive.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro chính:
  - Khi bật `@container` rộng hơn, một số spacing/text clamp có thể đổi nhẹ ở desktop/tablet vì container queries bắt đầu hoạt động đúng.
- Rollback:
  - Hoàn tác riêng thay đổi ở `BlogSectionRuntime.tsx` là đủ, vì fix dự kiến tập trung ở đây.

# XI. Out of Scope (Ngoài phạm vi)
- Không refactor toàn bộ Blog sang kiến trúc mới ngoài phần cần để fix responsive desktop parity.
- Không sửa data query, itemCount business logic, manual order, route detail.
- Không đụng các home-component khác như Hero/Stats/Contact ngoài việc dùng làm reference pattern.

Nếu user duyệt spec này, bước implement hợp lý nhất là sửa tối thiểu trong `BlogSectionRuntime.tsx` để site runtime có cùng container context với preview.