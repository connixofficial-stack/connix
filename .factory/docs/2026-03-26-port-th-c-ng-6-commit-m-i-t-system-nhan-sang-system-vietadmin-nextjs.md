## TL;DR kiểu Feynman
- Mình sẽ **port nhóm posts (scheduled publish + publish now + fix publishImmediately + skew tolerance)** từ repo `system-nhan` sang repo hiện tại.
- Commit `products/remove saleModeSetting` sẽ **skip nếu đã tương đương** (theo yêu cầu của bạn).
- Chỉ port **logic code**, **không port docs/markdown**.
- Tất cả thay đổi sẽ gom vào **1 commit tổng**.
- Cách làm: lấy diff theo từng commit nguồn, áp dụng thủ công vào file tương ứng ở target, rồi rà xung đột kiểu dữ liệu/flow.

## Audit Summary
**Observation (evidence):**
- 6 commit mới nhất source:
  1) `828f131e` fix(products): remove unused saleModeSetting  
  2) `1d69e744` fix(posts): add schedule skew tolerance  
  3) `d478cadf` fix(posts): avoid patching publishImmediately  
  4) `dff5d9bb` fix(posts): honor publishImmediately flag  
  5) `03aa9bb3` feat(posts): add publish now toggle  
  6) `54ee4343` feat(posts): support scheduled publish
- Target đã có commit gần đây `fix: remove unused sale mode query` ⇒ commit products có khả năng trùng.
- Grep target chưa thấy dấu vết rõ của `publishImmediately/scheduled publish` ⇒ nhóm posts nhiều khả năng chưa được port.

**Inference:**
- Phần giá trị cần port tập trung ở 5 commit posts; commit products có thể bỏ nếu tương đương.

**Decision (theo lựa chọn của bạn):**
- Port toàn bộ logic code, bỏ docs.
- Skip commit products nếu đã tương đương.
- Gộp 1 commit tổng khi hoàn tất.

## Root Cause Confidence
**High** — Chênh lệch chức năng giữa source và target đến từ việc target chưa nhận các commit posts mới (scheduled publish/publishNow/patch behavior/tolerance), trong khi commit products nhiều khả năng đã được xử lý tương đương ở target.

## Files Impacted
### UI
- **Sửa:** `app/admin/posts/create/page.tsx`  
  Vai trò hiện tại: form tạo post trong admin.  
  Thay đổi dự kiến: thêm/điều chỉnh toggle publish now + mapping payload phù hợp logic mới.
- **Sửa:** `app/admin/posts/[id]/edit/page.tsx`  
  Vai trò hiện tại: form sửa post trong admin.  
  Thay đổi dự kiến: xử lý chuyển đổi giữa scheduled và publish ngay, tránh patch field gây lỗi schema.
- **Sửa:** `app/(site)/posts/[slug]/layout.tsx`  
  Vai trò hiện tại: gate hiển thị/metadata wrapper cho trang post chi tiết.  
  Thay đổi dự kiến: bổ sung điều kiện schedule + skew tolerance khi quyết định publish visibility.
- **Sửa:** `app/(site)/posts/[slug]/page.tsx`  
  Vai trò hiện tại: render nội dung post public theo slug.  
  Thay đổi dự kiến: đồng bộ logic scheduled publish/tolerance với layout để tránh lệch trạng thái.

### server / schema
- **Sửa:** `convex/model/posts.ts`  
  Vai trò hiện tại: định nghĩa schema/model cho posts.  
  Thay đổi dự kiến: điều chỉnh trường liên quan publishImmediately/schedule để tương thích payload và mutation.
- **Sửa:** `convex/posts.ts`  
  Vai trò hiện tại: query/mutation nghiệp vụ posts.  
  Thay đổi dự kiến: cập nhật mutation logic để honor publishImmediately và tránh patch sai field.

## Execution Preview
1. Đọc diff chi tiết 5 commit posts ở source theo thứ tự nền tảng → UI → fix.
2. Áp dụng thay đổi vào `convex/model/posts.ts`, `convex/posts.ts` trước (đảm bảo hợp đồng dữ liệu).
3. Áp dụng thay đổi UI admin create/edit cho toggle publish now + payload mapping.
4. Đồng bộ logic site `layout.tsx` + `page.tsx` cho scheduled publish + skew tolerance.
5. Soát lại commit products: nếu target đã tương đương thì bỏ qua, không chỉnh file products.
6. Static review thủ công: typing, null-safety, backward compatibility.
7. (Theo rule repo) chạy `bunx tsc --noEmit` vì có thay đổi TS/code.
8. Tạo **1 commit tổng**.

## Acceptance Criteria
- Admin posts có thể chọn publish now/scheduled mà không phát sinh lỗi schema.
- Chuyển trạng thái từ scheduled → publish now hoạt động đúng, không patch field sai.
- Site posts chỉ hiển thị bài theo điều kiện publish mới (bao gồm skew tolerance như source).
- Không có thay đổi docs/markdown.
- Commit products được skip nếu xác nhận tương đương ở target.

## Verification Plan
- **Typecheck:** `bunx tsc --noEmit`.
- **Repro logic thủ công (không chạy test runtime):**
  1) Tạo post scheduled ở tương lai ⇒ chưa public.  
  2) Đổi sang publish now ⇒ public đúng theo logic mới.  
  3) Edit post giữ publishImmediately theo behavior source.  
  4) Kiểm tra tolerance ở ngưỡng lệch giờ nhỏ.

## Out of Scope
- Không port các file `.factory/docs/*.md` từ source.
- Không mở rộng sang feature khác ngoài 6 commit đã nêu.

## Risk / Rollback
- **Risk:** xung đột schema/mutation Convex nếu target đã có khác biệt nội bộ.
- **Rollback:** revert commit tổng duy nhất để quay lại trạng thái trước port nhanh chóng.