## Problem Graph
1. [Slug ở màn edit không tự cập nhật theo title] <- depends on 1.1, 1.2
   1.1 [Create có `handleNameChange` sinh slug, Edit không có logic tương đương] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `app/admin/categories/[id]/edit/page.tsx` đang `setName(...)` trực tiếp, không gọi hàm sinh slug khi đổi title
   1.2 [Cần chốt hành vi khi edit để tránh hiểu sai] (đã chốt: **Auto luôn** theo title)

## Execution (with reflection)
1. Solving 1.1.1 (thêm logic auto slug ở Edit)...
   - Thought: Tái dùng đúng thuật toán slug đang dùng ở Create để đảm bảo nhất quán dữ liệu.
   - Action:
     - Sửa file `app/admin/categories/[id]/edit/page.tsx`:
       - Tạo helper `generateSlugFromName(val: string)` (copy đúng regex/normalize từ trang create).
       - Thêm `handleNameChange`:
         - `setName(val)`
         - `setSlug(generateSlugFromName(val))`
       - Đổi input Tên danh mục từ `onChange={(e)=>setName(e.target.value)}` sang `onChange={handleNameChange}`.
   - Reflection: ✓ Valid vì bám đúng yêu cầu “edit phải tự gen lại slug theo title hiện tại”, không mở rộng scope.

2. Đồng bộ hành vi với form hiện có và submit...
   - Thought: Không đổi API/update mutation để tránh rủi ro không cần thiết.
   - Action: Giữ nguyên `handleSubmit` và payload hiện tại (`slug: slug.trim()`), chỉ thay nguồn cập nhật `slug` từ `onChange` title.
   - Reflection: ✓ Valid theo KISS/YAGNI, phạm vi sửa nhỏ, dễ review.

3. Verification + commit theo rule repo...
   - Thought: Repo yêu cầu chỉ chạy TypeScript check trước commit.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Manual check nhanh trên route edit category: đổi title => slug đổi ngay theo từng lần gõ.
     - Commit với message kiểu: `fix(categories): auto regenerate slug from title on edit`.
     - Khi commit nhớ add cả `.factory/docs` (nếu có thay đổi) theo rule.
   - Reflection: ✓ Đảm bảo yêu cầu kỹ thuật + quy trình dự án.

## Checklist nghiệm thu
- [ ] Ở `/admin/categories/[id]/edit`, đổi Tên danh mục thì Slug tự đổi ngay.
- [ ] Thuật toán slug giống hệt màn create (khử dấu, đ/Đ -> d, khoảng trắng -> `-`, loại ký tự đặc biệt).
- [ ] Không thay đổi API schema/mutation/query.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Có commit (không push).