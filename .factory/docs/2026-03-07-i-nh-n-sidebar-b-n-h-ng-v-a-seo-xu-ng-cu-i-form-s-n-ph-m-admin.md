## Audit Summary
- Evidence 1: `app/admin/components/Sidebar.tsx` đang hard-code nhãn nhóm bán hàng là `E-Commerce` ở cả `activeMenu`, `label`, `isExpanded`, `handleMenuToggle`.
- Evidence 2: `app/admin/products/create/page.tsx` đang render card `SEO` trước card `Giá & Kho hàng`.
- Evidence 3: `app/admin/products/[id]/edit/page.tsx` cũng render `SEO` trước `Giá & Kho hàng`.
- Expected vs actual: user muốn ngôn ngữ sidebar nhìn là hiểu ngay bằng tiếng Việt, và SEO là tác vụ ít chỉnh nên nên nằm cuối form thay vì đứng trước phần giá/kho.
- Phạm vi ảnh hưởng: chỉ UI admin sidebar + 2 form sản phẩm create/edit, không ảnh hưởng data/model/backend.
- Repro: vào `/admin/products/create` hoặc `/admin/products/[id]/edit` thấy SEO nằm trước `Giá & Kho hàng`; mở sidebar admin thấy label `E-Commerce`.
- Counter-hypothesis check: không phải do config module hay translation layer vì chuỗi đang hard-code trực tiếp trong component.

## Root Cause Confidence
- High — vì đã xác định đúng code path render chuỗi sidebar và thứ tự card trong 2 page, đều là JSX hard-code, không phụ thuộc dữ liệu runtime.

## Proposal
1. Sửa `app/admin/components/Sidebar.tsx`
   - Đổi toàn bộ chuỗi điều hướng nhóm bán hàng từ `E-Commerce` sang `Bán hàng & sản phẩm`.
   - Cập nhật đồng bộ ở 4 chỗ: `activeMenu` return value, `label`, `isExpanded`, `handleMenuToggle` để tránh mismatch expand state.
2. Sửa `app/admin/products/create/page.tsx`
   - Giữ nguyên toàn bộ logic SEO.
   - Chỉ di chuyển block card `SEO` xuống sau các section nghiệp vụ chính trong cột trái, cụ thể đặt sau `Giá & Kho hàng` và sau các section conditional khác (`Loại sản phẩm`, `Phiên bản sản phẩm`) để đúng ý “để cuối”.
3. Sửa `app/admin/products/[id]/edit/page.tsx`
   - Làm tương tự trang create: di chuyển nguyên block `SEO` xuống cuối cột trái, sau `Giá & Kho hàng` và các section conditional.
4. Verify
   - Chạy `bunx tsc --noEmit` theo rule repo.
   - Kiểm tra nhanh UI routes `/admin/products/create` và `/admin/products/[id]/edit`: card SEO nằm cuối cột nội dung chính.
   - Kiểm tra sidebar admin: label mới hiển thị đúng và expand/active hoạt động bình thường.
5. Commit
   - Commit local theo rule repo sau khi verify pass, không push.
   - Nếu có `.factory/docs` liên quan thì add kèm trước commit theo guideline.

## Verification Plan
- Typecheck: `bunx tsc --noEmit`
- Repro UI:
  - `/admin/products/create` → xác nhận thứ tự: Thông tin cơ bản → Giá & Kho hàng / các block liên quan → SEO ở cuối.
  - `/admin/products/[id]/edit` → xác nhận thứ tự tương tự.
  - Sidebar admin → xác nhận `Bán hàng & sản phẩm` active/expand đúng cho products, categories, orders...
- Regression check:
  - Không đổi props, state hay validation logic của form.
  - Không đổi route/href submenu nên blast radius thấp.

Checklist chốt cho anh/chị:
- [x] Đổi `E-Commerce` thành `Bán hàng & sản phẩm`
- [x] Đưa section SEO xuống cuối ở create product
- [x] Đưa section SEO xuống cuối ở edit product
- [x] Verify bằng typecheck + kiểm tra UI + commit local