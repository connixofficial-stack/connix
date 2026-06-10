## Problem Graph
1. [Main] Cần giữ cơ chế URL khi import Excel nhưng hỗ trợ nhiều ảnh trong cùng cột `Ảnh đại diện (URL)` <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Luồng import hiện chỉ đọc 1 string `image`, chưa parse danh sách URL
   1.2 [UX gap] Template/guide chưa nói rõ format `url1;url2;url3` (ảnh đầu là đại diện)

## Execution (with reflection)
1. Cập nhật parser import ở admin products page
   - File: `app/admin/products/page.tsx`
   - Khi đọc `values.image`, parse theo `;`:
     - tách chuỗi, trim từng phần, loại rỗng
     - ảnh đầu -> `image`
     - phần còn lại -> `images` (kèm ảnh đầu luôn để đồng bộ gallery: `[first, ...rest]`)
   - Gửi thêm `images` vào payload `importProducts`.
   - Reflection: giữ nguyên 1 cột như anh yêu cầu, không đổi UI import.

2. Mở rộng contract import ở backend
   - File: `convex/products.ts`
   - `importRowDoc`: thêm field optional `images: v.optional(v.array(v.string()))`.
   - Trong `importFromExcelRows`, khi insert product:
     - `image` lấy từ payload (ảnh đầu)
     - `images` lưu mảng URL nếu có; nếu không có thì để `undefined`.
   - Reflection: không tải file vào dự án, chỉ lưu URL đúng yêu cầu.

3. Cập nhật kiểu dữ liệu client import
   - File: `app/admin/products/page.tsx` (type payload local của `payloadRows`)
   - Thêm `images?: string[]` để khớp mutation mới.
   - Reflection: tránh lỗi TS khi truyền field mới.

4. Cập nhật hướng dẫn/template để user nhập đúng format
   - File: `lib/products/excel-styles.ts`
   - `buildGuideSheet`: bổ sung rule rõ ràng: cột ảnh cho phép nhiều URL, ngăn cách `;`, ảnh đầu là ảnh đại diện.
   - Không thêm cột mới; vẫn dùng cột `Ảnh đại diện (URL)`.
   - Reflection: đúng KISS/YAGNI, không thay đổi cấu trúc Excel hiện có.

5. Kiểm thử tối thiểu
   - Cập nhật test liên quan import parsing (nếu có) hoặc thêm test unit nhỏ cho hàm parse ảnh từ chuỗi `;` (đặt gần module products).
   - Case cần cover:
     - `url1` -> `image=url1`, `images=[url1]`
     - `url1;url2;url3` -> `image=url1`, `images=[url1,url2,url3]`
     - `url1; ;url2` -> bỏ phần rỗng
   - Reflection: khóa behavior mong muốn, tránh regress.

6. Validate & commit
   - Chạy `bunx tsc --noEmit`.
   - Rà `git diff --cached` + `git status` trước commit.
   - Commit message đề xuất: `feat(products): support semicolon-separated gallery urls in excel import`.

Nếu anh duyệt spec này, em triển khai luôn đúng phạm vi trên.