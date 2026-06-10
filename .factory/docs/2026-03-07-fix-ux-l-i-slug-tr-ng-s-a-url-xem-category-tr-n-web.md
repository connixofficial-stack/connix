## Audit Summary
### Pre-Audit
- **Evidence đã có**
  - Backend `convex/products.ts` đang ném lỗi tiếng Anh khi trùng slug:
    - `throw new Error("Slug already exists")` tại create (khoảng dòng 1163)
    - `throw new Error("Slug already exists")` tại update (khoảng dòng 1293)
  - UI create product đã có `try/catch` và `toast.error(error.message)` ở `app/admin/products/create/page.tsx` (khoảng 209–245), nên message backend đang bị show nguyên văn tiếng Anh.
  - UI edit product cũng tương tự ở `app/admin/products/[id]/edit/page.tsx` (khoảng 298–335).
  - Admin categories đang mở sai URL:
    - `app/admin/categories/page.tsx` dùng `window.open(`/category/${slug}`...)` (khoảng dòng 208–209)
    - `app/admin/categories/[id]/edit/page.tsx` cũng dùng `/category/${slug}` (khoảng dòng 112)
  - Public site không có route `/category/[slug]`; category product đang đi qua `/products?category=<slug>` (evidence từ `app/(site)/products/[slug]/page.tsx` và `app/(site)/products/page.tsx`).
- **Gap đã được lấp**
  - Đã hỏi và chốt kỳ vọng URL với anh: dùng **`/products?category=<slug>`**.

### Audit Questions (đã trả lời tối thiểu 5/8, gồm #1 #3 #6 #8)
1. **Triệu chứng**: expected báo lỗi tiếng Việt bằng Sonner; actual hiện “Slug already exists” tiếng Anh. URL category expected mở trang lọc products; actual mở `/category/...` sai route.
2. **Phạm vi ảnh hưởng**: admin products create/edit; admin categories list/edit với nút “Xem trên web”.
3. **Tái hiện**: có, ổn định khi nhập slug trùng hoặc bấm nút xem web category.
4. **Mốc thay đổi gần nhất**: chưa cần commit history để kết luận vì đã có code-path trực tiếp gây lỗi.
5. **Dữ liệu thiếu**: không còn thiếu cho scope fix hiện tại.
6. **Giả thuyết thay thế**: lỗi có thể do frontend hardcode sai toast; đã loại trừ vì frontend đang hiển thị đúng `error.message` từ backend.
7. **Rủi ro fix sai**: đổi message backend có thể ảnh hưởng nơi khác nếu đang phụ thuộc exact string tiếng Anh.
8. **Pass/fail**: trùng slug phải hiện toast tiếng Việt rõ nghĩa; nút xem web category phải mở `/products?category=<slug>`.

### Root Cause
1. **Root cause #1**: backend `products.create/update` ném lỗi tiếng Anh (`Slug already exists`) nên frontend toast cũng tiếng Anh.
2. **Root cause #2**: admin categories đang dùng URL pattern cũ `/category/${slug}` không khớp kiến trúc route hiện tại của site.

### Counter-Hypothesis Check
- **Đối chứng**: có thể route `/category/[slug]` tồn tại nhưng chưa index được.
- **Loại trừ**: đã rà `app/(site)` không có route này; luồng category hiện hữu là query param trên `/products`.

### Post-Audit (blast radius / regression risk / complexity)
- **Blast radius**: thấp, chỉ đụng thông điệp lỗi và URL mở tab mới ở 4 điểm cụ thể.
- **Regression risk**: thấp-trung bình (nếu có nơi khác so khớp message tiếng Anh).
- **KISS/YAGNI/DRY**: ưu tiên map lỗi tại frontend để không đổi semantics backend quá rộng; chỉ sửa URL đúng flow hiện tại, không tạo route mới.

## Root Cause Confidence
**High** — vì đã có evidence trực tiếp từ code path create/edit + admin categories và đã đối chiếu route public thực tế.

## Problem Graph
1. [Main] UX lỗi slug + sai URL category admin <- depends on 1.1, 1.2
   1.1 [Slug duplicate báo tiếng Anh] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Backend ném message tiếng Anh, frontend show nguyên message
   1.2 [Xem trên web mở sai route] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] Hardcode `/category/${slug}` không khớp route site

## Execution (with reflection)
1. Solving 1.1.1
   - Thought: Không nên phụ thuộc literal message backend tại UI; cần chuẩn hóa map lỗi để luôn tiếng Việt.
   - Action:
     - Sửa `app/admin/products/create/page.tsx`:
       - Thêm helper local `getProductMutationErrorMessage(error, fallback)` (hoặc util dùng chung nếu đã có pattern tương tự trong repo).
       - Map các message:
         - `Slug already exists` -> `Slug đã tồn tại, vui lòng chọn slug khác`
         - `SKU already exists` -> `Mã SKU đã tồn tại`
         - giữ fallback `Không thể tạo sản phẩm`.
       - Trong `catch`, thay `toast.error(error.message)` bằng helper.
     - Sửa `app/admin/products/[id]/edit/page.tsx` tương tự, fallback `Không thể cập nhật sản phẩm`.
   - Reflection: ✓ Valid (đáp ứng đúng yêu cầu “sonner noti tiếng Việt”, không tăng scope backend).

2. Solving 1.2.1
   - Thought: user đã chốt URL đúng là `/products?category=<slug>`.
   - Action:
     - Sửa `app/admin/categories/page.tsx`: `openFrontend(slug)` mở `window.open(`/products?category=${encodeURIComponent(slug)}`, '_blank')`.
     - Sửa `app/admin/categories/[id]/edit/page.tsx`: nút “Xem trên web” mở cùng URL chuẩn hóa trên.
   - Reflection: ✓ Valid (khớp route hiện có, tránh 404/sai trang).

3. Verification
   - Thought: theo rule dự án, chỉ chạy typecheck trước commit.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Repro manual:
       1) Vào `/admin/products/create`, tạo slug trùng -> thấy toast tiếng Việt đúng.
       2) Vào `/admin/products/[id]/edit`, đổi slug trùng -> thấy toast tiếng Việt đúng.
       3) Vào `/admin/categories`, bấm icon “Xem trên web” -> mở `/products?category=<slug>`.
       4) Vào `/admin/categories/[id]/edit`, bấm “Xem trên web” -> mở `/products?category=<slug>`.
   - Reflection: ✓ Nếu pass đủ 4 bước + typecheck xanh thì kết luận done.

## Verification Plan
- **Typecheck**: `bunx tsc --noEmit`
- **Test/Repro chính**:
  - Duplicate slug create/edit product -> Sonner tiếng Việt đúng nội dung.
  - Nút “Xem trên web” ở categories list/edit -> URL `/products?category=<slug>`.
- **Regression quick check**:
  - Tạo/cập nhật product không trùng slug vẫn success toast bình thường.
  - URL mở tab mới vẫn hoạt động với slug có ký tự đặc biệt (nhờ `encodeURIComponent`).

## Checklist chốt để implement 1 lần
- [ ] Thêm map lỗi tiếng Việt cho catch ở product create
- [ ] Thêm map lỗi tiếng Việt cho catch ở product edit
- [ ] Sửa URL xem web category tại categories list
- [ ] Sửa URL xem web category tại category edit
- [ ] Chạy `bunx tsc --noEmit`
- [ ] Manual repro 4 bước ở trên
- [ ] Commit (kèm `.factory/docs` nếu có thay đổi trong đó)