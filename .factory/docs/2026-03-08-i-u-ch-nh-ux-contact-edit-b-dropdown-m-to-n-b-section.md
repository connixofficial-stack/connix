## Audit Summary
### Observation
- Bạn đã chốt thêm một ràng buộc mới: **không dùng dropdown/accordion, tất cả section phải mở sẵn**.
- Điều này thay đổi phần proposal trước ở `ConfigEditor.tsx`: phần grouping vẫn đúng, nhưng cơ chế collapse không còn phù hợp.
- Vấn đề gốc vẫn giữ nguyên: trang dài dòng, khó scan, nhưng cần giải quyết bằng **hierarchy tĩnh rõ ràng** thay vì progressive disclosure.

### Root-cause update
1. Triệu chứng: UI dài và khó hiểu, nhưng accordion cũng tạo thêm thao tác ẩn/hiện không hợp ý bạn.  
2. Phạm vi: chỉ trang `/admin/home-components/contact/[id]/edit`.  
3. Tái hiện: ổn định.  
4. Giả thuyết thay thế: accordion giảm chiều dài nhưng làm mất khả năng nhìn tổng quan ngay; với yêu cầu của bạn thì giả thuyết này được xác nhận là không phù hợp.  
5. Pass criteria mới: vẫn gọn và rõ hơn hiện tại, nhưng **mọi nội dung luôn hiển thị**.

## Root Cause Confidence
**High** — Requirement mới rất rõ: vấn đề không chỉ là chiều dài, mà còn là cách ẩn nội dung khiến UX không hợp mong muốn sử dụng.

## Proposal cập nhật
### 1) Giữ layout 2 cột của trang edit
- File: `app/admin/home-components/contact/[id]/edit/page.tsx`
- Vẫn giữ hướng tối ưu đúng trước đó:
  - Trái: toàn bộ form.
  - Phải sticky: preview + màu custom + cảnh báo + action.
- Thêm quick summary ngắn ở mobile nếu cần, vì phần này không xung đột với yêu cầu mới.

### 2) Bỏ accordion/dropdown hoàn toàn, thay bằng section tĩnh rõ hierarchy
- File: `app/admin/home-components/contact/_components/ConfigEditor.tsx`
- Không dùng collapse nữa.
- Chia lại UI thành 3 khối mở sẵn, có tiêu đề phụ và mô tả ngắn:
  1. **Thông tin chính**: bản đồ + địa chỉ + điện thoại + email + giờ làm việc  
  2. **Form liên hệ**: bật/tắt form + chọn field + nội dung form  
  3. **Nội dung mở rộng**: social links + tùy chỉnh văn bản
- Mỗi khối dùng `Card` hoặc section block riêng, nhưng giảm khoảng trắng thừa và tránh lặp style title quá nhiều.

### 3) Tối ưu để “mở hết nhưng vẫn không rối”
- Dùng divider/section header rõ ràng thay vì card rời rạc quá nhiều.
- Gom những field liên quan gần nhau theo 2 cột ở desktop nếu phù hợp, ví dụ:
  - `phone` + `email`
  - `formTitle` + `submitButtonText`
- Text ngắn lại theo text economy:
  - `Hiển thị form liên hệ` → `Bật form liên hệ`
  - `Cập nhật bản đồ trong Settings →` → `Mở Settings để cập nhật →`
- Validation message giữ nguyên nhưng canh layout sát field.

### 4) Chuẩn hóa toggle nhưng không đổi behavior
- Đổi toggle sang control semantic/a11y tốt hơn.
- Không đổi state, payload, validation, save flow.

### 5) Không đổi feature / data contract
- Không đổi business logic, field, payload, preview, style, custom colors.
- Chỉ đổi presentation và information architecture.

## Verification Plan
1. **Typecheck**: `bunx tsc --noEmit`.  
2. **Repro route user gửi**: xác nhận toàn bộ section đều mở sẵn, không còn dropdown/accordion.  
3. **UX check**:
   - Scan nhanh hơn nhờ grouping rõ.
   - Không phải click mở section nào.
   - Desktop ít cảm giác dài hơn nhờ 2 cột + grouping hợp lý.  
4. **Functional parity**:
   - Save/update như cũ.
   - Preview/custom color/style hoạt động như cũ.
   - Validation phone/email vẫn đúng.

Nếu bạn duyệt spec này, mình sẽ triển khai theo đúng hướng: bỏ dropdown hoàn toàn và làm giao diện mở hết nhưng gọn, rõ hơn.