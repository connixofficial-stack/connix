# I. Primer
## 1. TL;DR kiểu Feynman
- Bạn muốn 3 khối `Cấu hình template`, `Nội dung đầu mô tả sản phẩm`, `FAQ bổ sung` thành dạng collapse/accordion để màn hình gọn hơn.
- Khi **chưa chọn template nào**, mặc định **ẩn hết** các khối này.
- Khi **chọn 1 template có sẵn**, vẫn **ẩn hết**, user tự mở cái cần chỉnh.
- Riêng khi bấm **Mới**, sẽ **mở cả 3 khối** để nhập nhanh.

## 2. Elaboration & Self-Explanation
Hiện tại trang settings đang render thẳng 4 card lớn liên tiếp: cấu hình, nội dung đầu, FAQ, nội dung cuối. UI vì vậy khá dài, nhất là khi người dùng chủ yếu đang duyệt danh sách template hoặc chỉ muốn chọn nhanh một template để xem.

Yêu cầu mới thực chất là thêm một tầng điều hướng nhỏ trong chính form edit/create:
- mỗi khối trở thành một “panel” có header click để mở/đóng,
- trạng thái mở/đóng phụ thuộc mode hiện tại (`selectedTemplateId` hay create new),
- khi chưa có template đang chọn thì ẩn phần form để giảm nhiễu.

Mình sẽ bám đúng scope bạn nêu: ít nhất 3 khối `Cấu hình template`, `Nội dung đầu mô tả sản phẩm`, `FAQ bổ sung` thành collapse. Vì hiện đang còn `Nội dung cuối mô tả sản phẩm`, để UI nhất quán mình sẽ đưa khối này vào cùng pattern collapse luôn, nhưng vẫn giữ cùng logic mặc định như 3 khối kia.

## 3. Concrete Examples & Analogies
- Trạng thái sau khi vào trang lần đầu:
  - thấy danh sách template
  - không thấy các form dài bên dưới
- Khi click 1 template:
  - form edit xuất hiện dưới dạng 4 header collapse
  - tất cả đang đóng
- Khi bấm `Mới`:
  - cả 4 panel mở ra để nhập nhanh

Analogy: giống như ngăn kéo hồ sơ; lúc chưa cần thì đóng hết cho bàn làm việc gọn, khi tạo mới thì kéo hết ra để thao tác liên tục.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `ProductSupplementalContentManager.tsx` đang render card form theo kiểu always-visible.
  - Các khối hiện tại gồm: `Cấu hình template`, `Nội dung đầu mô tả sản phẩm`, `FAQ bổ sung`, `Nội dung cuối mô tả sản phẩm`.
  - `handleCreateNew()` đang reset form về trạng thái tạo mới.
- Evidence:
  - Sau card `Templates` là 4 block render liên tiếp, không có state collapse.
  - `selectedTemplateId` đang là tín hiệu phân biệt edit existing vs new draft.
- Decision:
  - Dùng local UI state để điều khiển panel open/close, không đụng backend.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root cause (High): form editor luôn hiển thị toàn phần, làm màn hình dài và gây nhiễu khi chưa thật sự cần chỉnh.
- Counter-hypothesis 1: Chỉ cần giảm spacing là đủ.
  - Loại trừ: kể cả giảm spacing thì 4 card lớn vẫn chiếm nhiều vertical space.
- Counter-hypothesis 2: Chỉ cần ẩn form khi chưa chọn template.
  - Loại trừ: vẫn chưa giải quyết yêu cầu collapse khi đã chọn template hoặc khi tạo mới.

# IV. Proposal (Đề xuất)
- Option A (Recommend) — Confidence 94%
  - Tạo panel collapse cho 4 khối form.
  - Mode `none selected`: ẩn hết form.
  - Mode `selected existing`: hiện 4 panel nhưng mặc định đóng hết.
  - Mode `create new`: mở sẵn cả 4 panel.
  - Tradeoff: thêm vài state UI nhưng đổi lại UX gọn và kiểm soát tốt hơn.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/settings/_components/ProductSupplementalContentManager.tsx`
  - Vai trò hiện tại: quản lý CRUD UI cho supplemental content templates.
  - Thay đổi: thêm state panel collapse, điều chỉnh render form theo mode `none / selected / new`, và bọc các section vào panel có thể mở/đóng.

# VI. Execution Preview (Xem trước thực thi)
1. Tạo helper/pattern collapse section trong file manager.
2. Thêm state để track panel nào đang mở.
3. Khi `selectedTemplateId` thay đổi sang template có sẵn: set các panel về đóng.
4. Khi bấm `Mới`: mở toàn bộ panel.
5. Khi không có template được chọn: ẩn toàn bộ phần form editor để UI gọn.
6. Rà static để không ảnh hưởng flow save/delete/cancel hiện tại.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Verification tĩnh:
  - Check 3 khối yêu cầu (`Cấu hình template`, `Nội dung đầu`, `FAQ`) đã là collapse.
  - Check `Nội dung cuối` dùng cùng pattern để không lệch UI.
  - Check khi `selectedTemplateId = null` và chưa ở create mode thì form không render lộ ra.
  - Check khi `handleCreateNew()` được gọi thì các panel mở sẵn.
- Repro thủ công cho tester:
  1. Vào trang settings lần đầu -> chỉ thấy list template, form ẩn/gọn.
  2. Chọn 1 template -> thấy các panel nhưng đang đóng.
  3. Click từng header -> mở/đóng đúng panel.
  4. Bấm `Mới` -> tất cả panel mở sẵn.
  5. Save/Delete/Hủy vẫn dùng được như trước.

# VIII. Todo
- [ ] Thêm collapse panel cho các section form.
- [ ] Thiết lập mặc định ẩn hết khi chưa chọn template.
- [ ] Thiết lập mặc định đóng hết khi chọn template có sẵn.
- [ ] Thiết lập mặc định mở hết khi bấm `Mới`.
- [ ] Review tĩnh flow create/edit/delete/cancel.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- `Cấu hình template`, `Nội dung đầu mô tả sản phẩm`, `FAQ bổ sung` là các khối collapse.
- Khi chưa chọn template, form editor được ẩn gọn.
- Khi chọn template có sẵn, các panel hiện nhưng mặc định đóng hết.
- Khi bấm `Mới`, các panel mở sẵn để nhập nhanh.
- Không làm hỏng luồng lưu/xóa/hủy hiện có.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp-trung bình: chủ yếu là logic state UI, dễ rollback.
- Rollback: revert commit là quay về UI cũ.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi backend/schema.
- Không đổi logic template selection hay validation overlap.
- Không redesign list template ngoài phạm vi collapse form.