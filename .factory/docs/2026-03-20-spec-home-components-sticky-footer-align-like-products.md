## Audit Summary
- Observation: create/edit của nhiều home-component đang dùng chung `HomeComponentStickyFooter`. Evidence: `app/admin/home-components/_shared/components/HomeComponentStickyFooter.tsx` được import rộng rãi ở `create/shared.tsx` và hầu hết `...[id]/edit/page.tsx`.
- Observation: footer shared hiện đang dùng `fixed bottom-0 left-0 lg:left-[280px] right-0 ... p-4 ... z-10`, bên trong lại bó `max-w-5xl` nên nút chưa sát 2 mép như user muốn. Evidence: `app/admin/home-components/_shared/components/HomeComponentStickyFooter.tsx`.
- Observation: `/admin/products/create` và `/admin/products/[id]/edit` đang là chuẩn tham chiếu user muốn “bê sang”: footer full-width trong vùng content, `justify-between`, nút hủy sát trái, CTA sát phải, offset desktop `lg:left-[280px]`. Evidence: `app/admin/products/create/page.tsx`, `app/admin/products/[id]/edit/page.tsx`.
- Observation: create home-components hiện còn dùng `align="end"`, nên cả cụm nút dồn về phải, không giống pattern products/create mà user yêu cầu học theo. Evidence: `app/admin/home-components/create/shared.tsx`.

## Root Cause Confidence
**High** — Lệch UX đến từ chính shared footer component và cách create page truyền `align="end"`, không phải do từng home-component riêng lẻ. Chỉ cần chuẩn hóa `HomeComponentStickyFooter` theo pattern products và bỏ max-width bó layout là sẽ lan ra toàn bộ create/edit đang dùng shared footer.

## TL;DR kiểu Feynman
- Footer lưu hiện có dùng chung cho gần như toàn bộ home-components.
- Nó đang bị bó vào khung giữa và z-index thấp nên nhìn không “sát mép” như anh muốn.
- Mình sẽ cho footer này học đúng bố cục của `/admin/products/create` và `/admin/products/edit`.
- Nút Hủy sẽ sát trái, nút Lưu/Tạo sát phải, spacing giảm tối đa.
- Vẫn giữ safe offset desktop để sidebar không đè lên footer khi toggle.

## Files Impacted
### Shared UI
- `Sửa: app/admin/home-components/_shared/components/HomeComponentStickyFooter.tsx`
  - Vai trò hiện tại: footer save dùng chung cho create/edit home-components.
  - Thay đổi: bỏ `max-w-5xl`, tăng z-index, giảm padding/gap theo hướng gọn hơn, chuyển layout mặc định sang canh 2 đầu giống products, và giữ offset desktop an toàn để không bị sidebar che.

### Wiring create
- `Sửa: app/admin/home-components/create/shared.tsx`
  - Vai trò hiện tại: wrapper create dùng `HomeComponentStickyFooter` với `align="end"`.
  - Thay đổi: bỏ `align="end"` để create pages cũng theo pattern products/create: hủy trái, CTA phải; vẫn giữ label riêng kiểu “Tạo Component” như user yêu cầu học theo products/create chứ không đổi text hàng loạt.

### Edit pages
- `Có thể giữ nguyên: app/admin/home-components/**/[id]/edit/page.tsx`
  - Vai trò hiện tại: hầu hết edit pages chỉ gọi shared footer với props cơ bản.
  - Thay đổi: dự kiến không cần sửa từng file vì hiệu ứng sẽ lan từ shared component.

## Root Cause / Counter-Hypothesis
1. Triệu chứng: footer save của home-components chưa sát 2 mép, spacing còn rộng, có nguy cơ bị lớp khác đè vì `z-10` thấp.
2. Phạm vi: toàn bộ create/edit home-components đang dùng `HomeComponentStickyFooter`, bao gồm cả `homepage-category-hero`.
3. Tái hiện: ổn định vì layout đang hard-code trong shared footer.
4. Mốc thay đổi gần nhất: repo đã có sticky footer shared cho home-components, nhưng pattern hiện khác products pages là chuẩn user muốn.
5. Dữ liệu thiếu: chưa cần thêm screenshot vì user đã chỉ rõ canonical reference là `/admin/products/create` và `/admin/products/edit`.
6. Giả thuyết thay thế đã loại trừ: không cần sửa từng edit page; core issue nằm ở shared footer + create wiring.
7. Rủi ro nếu fix sai nguyên nhân: nếu chỉ tăng z-index mà không bỏ `max-w-5xl`/đổi alignment thì nút vẫn không sát mép như yêu cầu.
8. Tiêu chí pass/fail: create/edit home-components hiển thị footer bám pattern products, hủy trái sát mép content, lưu phải sát mép content, không bị sidebar đè.

## Proposal
1. Chuẩn hóa `HomeComponentStickyFooter` theo pattern products:
   - vẫn `fixed bottom-0 left-0 lg:left-[280px] right-0`,
   - tăng `z-index` cao hơn `z-10` để nổi ổn định,
   - giảm `p-4` xuống spacing gọn hơn nếu vẫn đủ touch target,
   - bỏ wrapper `mx-auto max-w-5xl` để action bar bám full content width,
   - giữ `justify-between` làm mặc định.
2. Cấu trúc actions:
   - nút `Hủy bỏ` đứng sát trái,
   - CTA chính đứng sát phải,
   - nếu có nhiều CTA phụ trong tương lai thì nhóm về phải như products/create.
3. Với create home-components, bỏ `align="end"` trong `create/shared.tsx` để dùng đúng layout chuẩn products/create.
4. Không thay đổi label nút; create vẫn giữ label riêng theo từng flow, chỉ đổi layout/footer behavior.

## Execution Preview
1. Đọc/chỉnh `HomeComponentStickyFooter.tsx` để đồng bộ class với products pages.
2. Gỡ phần bó `max-w-5xl` và hạ spacing xuống mức gọn nhất vẫn usable.
3. Tăng z-index footer để tránh bị lớp khác đè.
4. Cập nhật `create/shared.tsx` bỏ `align="end"`.
5. Review tĩnh các call-site để chắc không có màn nào phụ thuộc layout cũ.

## Acceptance Criteria
- Ở `homepage-category-hero` edit và create, footer save nổi cao hơn, không bị chìm/đè.
- Nút `Hủy bỏ` nằm sát mép trái vùng content, nút `Lưu thay đổi`/`Tạo Component` nằm sát mép phải vùng content.
- Spacing của footer được giảm tối đa nhưng vẫn dùng tốt.
- Desktop vẫn tránh bị sidebar đè nhờ offset theo pattern products.
- Thay đổi tự áp cho phần lớn create/edit home-components dùng shared footer.

## Verification Plan
- Static review: rà lại `HomeComponentStickyFooter.tsx` và `create/shared.tsx` để bảo đảm default layout không phá các call-site hiện có.
- Typecheck: sau khi user duyệt spec và implement, chạy `bunx tsc --noEmit` theo rule thực thi hiện tại.
- Repro thủ công cho tester:
  1. mở `/admin/home-components/homepage-category-hero/.../edit`,
  2. mở một create page home-component bất kỳ,
  3. so footer với `/admin/products/create` và `/admin/products/[id]/edit`,
  4. toggle sidebar desktop để xác nhận footer không bị đè.

## Out of Scope
- Không đổi business logic submit/cancel.
- Không refactor toàn bộ admin ngoài nhóm home-components.
- Không đổi label CTA hàng loạt trừ khi call-site đã tự truyền sẵn.

## Risk / Rollback
- Risk: một số màn create từng chủ đích dùng `align="end"`; sau khi chuẩn hóa sẽ đổi UX theo hướng mới trên diện rộng.
- Rollback: revert tập trung ở `HomeComponentStickyFooter.tsx` và `create/shared.tsx`, rất gọn.

## Open Questions
- Không còn ambiguity chính: user đã chốt lấy `/admin/products/create` và `/admin/products/edit` làm chuẩn tham chiếu.