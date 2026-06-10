## Problem Graph
1. Chuẩn hoá UX nút action cho Products theo Posts + CoC  
   <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Trang `products/[id]/edit` chưa có dirty-state snapshot nên luôn hiện “Lưu thay đổi” và luôn bấm được (trừ submit).
   1.2 Trang `products/[id]/edit` đã có nút `Hủy bỏ`, nhưng chưa đồng bộ hành vi save-state như Posts edit.
   1.3 Trang `products/create` hiện có thêm “Lưu nháp”; theo xác nhận của anh: **không áp dirty-state/Đã lưu cho create**.

## Execution (with reflection)
1. Solving 1.1.1 — thêm snapshot + dirty-state cho Product Edit  
   - Thought: Bám pattern đã chạy ổn ở `app/admin/posts/[id]/edit/page.tsx` (dùng `useRef(initialSnapshot)` + `useMemo(currentSnapshot)` + `hasChanges`).  
   - Action (file): `app/admin/products/[id]/edit/page.tsx`
     - Thêm `useRef` vào import React.
     - Tạo `initialSnapshotRef` chứa các field đang submit ở edit products (trim/normalize tương tự logic submit):
       - `name, slug, sku, price, salePrice, stock, affiliateLink, categoryId, description, metaTitle, metaDescription, image, status, hasVariants, selectedOptionIds, productType, digitalDeliveryType, digitalCredentialsTemplate, galleryImages`.
     - Tạo `currentSnapshot` bằng `useMemo` từ state hiện tại (chuẩn hoá dữ liệu trước khi so sánh: trim string, map galleryItems -> urls, sort `selectedOptionIds` để tránh false-positive do thứ tự).
     - Tạo `hasChanges` so sánh sâu giữa snapshot initial/current (dùng `JSON.stringify` cho object/array đã normalize, giữ KISS).
     - Khi `productData` load lần đầu và set state xong, set `initialSnapshotRef.current` tương ứng dữ liệu gốc.
     - Sau `updateProduct` thành công: cập nhật lại `initialSnapshotRef.current = currentSnapshot` để nút về trạng thái “Đã lưu”.
   - Reflection: Pattern reuse từ posts giúp giảm rủi ro và đúng DRY/CoC.

2. Solving 1.1.2 — chuẩn hoá action bar ở Product Edit  
   - Thought: Yêu cầu: "k cố thay đổi gì thì disable và là nút đã lưu thay vì nút lưu thay đổi" + giữ/đủ nút hủy bỏ.
   - Action (file): `app/admin/products/[id]/edit/page.tsx`
     - Giữ nút `Hủy bỏ` bên trái như hiện tại.
     - Đổi nút submit bên phải:
       - `disabled={isSubmitting || !hasChanges}`
       - label: `isSubmitting ? 'Đang lưu...' : (hasChanges ? 'Lưu thay đổi' : 'Đã lưu')`
     - Giữ spinner khi submitting.
   - Reflection: Đúng yêu cầu và đồng bộ đúng “bài viết edit”.

3. Solving 1.3 — xử lý trang Product Create theo quyết định user  
   - Thought: Anh đã chốt "Chỉ áp dụng dirty-state + Đã lưu cho Edit, Create giữ như hiện tại".
   - Action:
     - **Không thêm dirty-state/Đã lưu cho** `app/admin/products/create/page.tsx`.
     - Giữ logic create hiện tại (bao gồm nút `Hủy bỏ`) để tránh over-scope (YAGNI).
   - Reflection: Bám đúng phạm vi đã xác nhận, không mở rộng ngoài yêu cầu.

4. Verification & safety gates
   - Chạy kiểm tra type theo rule repo: `bunx tsc --noEmit`.
   - Manual smoke check nhanh:
     - `/admin/products/[id]/edit`: mở trang -> nút hiển thị “Đã lưu” và disabled.
     - chỉnh 1 field bất kỳ -> nút thành “Lưu thay đổi” và enabled.
     - bấm lưu thành công -> quay lại “Đã lưu” disabled.
     - nút `Hủy bỏ` điều hướng về `/admin/products` hoạt động bình thường.

5. Commit plan (sau khi implement xong)
   - Stage file code thay đổi + **kèm `.factory/docs` nếu có** theo rule.
   - Commit message đề xuất: `fix(products-edit): add dirty-state save button with saved state`
   - Không push.

## Checklist triển khai
- [ ] Product Edit có `initialSnapshotRef`, `currentSnapshot`, `hasChanges`
- [ ] Nút submit Product Edit disable khi không có thay đổi và hiện “Đã lưu”
- [ ] Nút `Hủy bỏ` giữ nguyên theo CoC
- [ ] Product Create không bị thêm dirty-state
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit local, không push