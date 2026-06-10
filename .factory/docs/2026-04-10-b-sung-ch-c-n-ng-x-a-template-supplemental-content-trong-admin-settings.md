# I. Primer
## 1. TL;DR kiểu Feynman
- Trang `/admin/settings/product-supplemental-content` hiện tạo/sửa được nhưng chưa xóa được vì **thiếu điểm bấm xóa trong UI**.
- Backend đã có mutation `removeTemplate` và frontend đã có `handleDelete()`, chỉ là chưa được nối vào nút nào.
- Theo lựa chọn của bạn, mình sẽ thêm **nút Xóa cạnh nút Lưu** và có **hộp xác nhận** trước khi xóa.
- Scope chỉ chạm UI + wiring gọi hàm xóa, không đổi schema/backend logic.

## 2. Elaboration & Self-Explanation
Audit cho thấy flow xóa đã có sẵn gần như đầy đủ:
- `removeTemplate = useMutation(api.productSupplementalContents.removeTemplate)` có tồn tại.
- `handleDelete()` đã gọi mutation, reset form, toast success/error.
- Convex `removeTemplate` trong `convex/productSupplementalContents.ts` đã delete theo id.

Vấn đề nằm ở lớp giao diện: footer sticky hiện chỉ có nút `Lưu template` và `Hủy`, không có nút nào gọi `handleDelete()`. Do đó người dùng không thể thao tác xóa dù logic xóa tồn tại.

Giải pháp phù hợp nhất là thêm nút `Xóa` kế bên `Lưu`, bật khi đang chọn một template (`selectedTemplateId` có giá trị), và bọc bằng confirm dialog để tránh xóa nhầm.

## 3. Concrete Examples & Analogies
- Hiện tại giống như xe có phanh nhưng không có bàn đạp phanh: cơ chế có, người lái không bấm được.
- Sau sửa:
  - Chọn 1 template từ list
  - Bấm `Xóa`
  - Dialog hỏi xác nhận
  - Đồng ý -> gọi `handleDelete()` -> xóa + toast + form reset

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Có `handleDelete()` trong `ProductSupplementalContentManager.tsx`.
  - Có Convex mutation `removeTemplate` hoạt động trực tiếp `ctx.db.delete(args.id)`.
  - Footer action chưa render nút xóa.
- Evidence:
  - Trong file manager: chỉ thấy `Hủy` + `Lưu template`.
  - Trong file Convex: `export const removeTemplate` đã có.
- Decision:
  - Bổ sung UI trigger xóa + confirm dialog theo đúng UX bạn chọn.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root cause (High): Missing UI action wiring — hàm xóa tồn tại nhưng không có button gọi.
- Counter-hypothesis 1: Backend mutation lỗi nên không xóa được.
  - Loại trừ: mutation có và đơn giản, không thấy guard chặn xóa.
- Counter-hypothesis 2: Quyền `canEdit` chặn toàn bộ.
  - Loại trừ: nếu quyền chặn thì cả lưu cũng ảnh hưởng; user báo chỉ “chưa xóa được” phù hợp với thiếu UI trigger hơn.

# IV. Proposal (Đề xuất)
- Option A (Recommend) — Confidence 96%
  - Thêm nút `Xóa` cạnh `Lưu template` trong sticky footer + dialog xác nhận.
  - Nút chỉ enable khi `canEdit && selectedTemplateId`.
  - Khi đang xóa: disable nút, tránh double-submit.
  - Tradeoff: thêm vài state UI nhưng ít rủi ro và đúng UX an toàn.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/settings/_components/ProductSupplementalContentManager.tsx`
  - Vai trò hiện tại: CRUD UI cho template supplemental content.
  - Thay đổi: thêm nút `Xóa` ở footer, thêm confirm dialog, nối gọi `handleDelete()`.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm state UI cho dialog xác nhận xóa (open/close, deleting nếu cần).
2. Render nút `Xóa` cạnh `Lưu template` ở sticky footer.
3. Disable/enable nút theo `selectedTemplateId` và `canEdit`.
4. Khi confirm: gọi `handleDelete()`, đóng dialog sau khi hoàn tất.
5. Rà static để đảm bảo không ảnh hưởng flow `Mới / Hủy / Lưu`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Verification tĩnh:
  - Check có nút `Xóa` trong footer.
  - Check nút xóa disable khi chưa chọn template.
  - Check confirm dialog xuất hiện trước khi gọi xóa.
  - Check `handleDelete()` vẫn là luồng thực thi duy nhất khi confirm.
- Repro thủ công cho tester:
  1. Vào `/admin/settings/product-supplemental-content`.
  2. Chọn 1 template đã có.
  3. Bấm `Xóa` -> thấy dialog confirm.
  4. Confirm -> template biến mất khỏi list, toast success, form reset.
  5. Thử khi chưa chọn template -> nút xóa bị disable.

# VIII. Todo
- [ ] Thêm nút Xóa cạnh nút Lưu trong footer.
- [ ] Thêm hộp xác nhận trước khi xóa.
- [ ] Nối confirm với `handleDelete()` và trạng thái disable phù hợp.
- [ ] Review tĩnh flow tạo/sửa/xóa.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Có nút `Xóa` cạnh `Lưu template`.
- Bấm xóa luôn có confirm dialog.
- Confirm xóa thành công thì template bị xóa khỏi danh sách và form reset.
- Không phá vỡ luồng tạo mới/lưu/hủy hiện có.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp: thay đổi UI layer 1 file.
- Rollback: revert commit là về trạng thái cũ ngay.

# XI. Out of Scope (Ngoài phạm vi)
- Không thêm bulk delete.
- Không đổi backend `removeTemplate`.
- Không chỉnh layout phần khác ngoài action footer.