## Mục tiêu cập nhật skill
Cập nhật `/.factory/skills/apply-home-component-custom-colors/SKILL.md` để phản ánh đúng contract mới đã chốt từ Hero, đồng thời chuẩn hóa template dùng chung cho mọi type và loại bỏ hoàn toàn nội dung sai/legacy.

## Problem Graph
1. [Main] Skill hiện tại chứa contract cũ, dễ gây implement sai cho Hero và các type khác.
   1.1 [ROOT CAUSE] Chưa tách rõ 2 cờ `systemEnabled` và `enabled` trong mô tả + template.
   1.2 [ROOT CAUSE] Template create/edit/system còn pattern cũ (đặc biệt create tự `setTypeColorOverride`, show/hide panel dựa sai cờ).
   1.3 [ROOT CAUSE] Verification matrix chưa kiểm thử rõ hành vi panel luôn hiện khi system bật nhưng preview fallback khi runtime OFF.

## Kế hoạch chỉnh sửa chi tiết (1 lần, không chia phase)
1) **Viết lại phần “Parity Contract” trong SKILL**
- Thêm contract bắt buộc:
  - `systemEnabled` quyết định panel custom có hiển thị hay không.
  - `enabled` quyết định runtime có dùng màu custom hay fallback system.
  - OFF runtime không được làm biến mất panel nếu system vẫn bật.
- Giữ nguyên tinh thần parity create/edit/preview/site nhưng update câu chữ theo 2-cờ.

2) **Xóa toàn bộ template sai khỏi skill**
- Xóa các đoạn/pattern sau trong SKILL:
  - `showCustomBlock` phụ thuộc `enabled`.
  - Create page tự gọi `setTypeColorOverride` trước/ngoài wrapper submit.
  - System toggle ghi trực tiếp `enabled` như cờ hiển thị panel.
- Không để lại deprecated notes (theo yêu cầu của bạn: xóa hẳn).

3) **Thay bằng template chuẩn mới (áp dụng chung all types, Hero-first)**
- **Template System page**:
  - per-row/bulk chỉ cập nhật `systemEnabled`.
- **Template hook (`useTypeColorOverride`)**:
  - `showCustomBlock = isSupportedType && systemEnabled`.
  - `effectiveColors` dùng `enabled` để quyết định custom/fallback.
- **Template Create/Edit pages**:
  - Dùng `ComponentFormWrapper` + `useTypeColorOverrideState` làm nguồn state duy nhất.
  - Không render card custom trùng lặp ngoài wrapper (tránh double source).
  - Edit `hasChanges` phải include custom-state diff theo `enabled/mode/primary/secondary`.
- **Template Convex**:
  - schema/mutation normalize có cả `systemEnabled` và `enabled`.
  - `setTypeColorOverride` hỗ trợ partial update an toàn.

4) **Nâng cấp Verification Matrix trong SKILL**
- Bổ sung case bắt buộc:
  - system ON + runtime OFF => panel vẫn hiện, preview/site fallback system.
  - system ON + runtime ON => preview/site dùng custom.
  - system OFF => panel ẩn ở create/edit.
- Giữ đầy đủ check parity create/edit/preview/site cho all types.

5) **Tinh gọn và làm rõ “Failure Catalog”**
- Thêm lỗi đặc thù 2-cờ:
  - Panel biến mất do bind nhầm `enabled` thay vì `systemEnabled`.
  - Preview/site lệch do đọc raw system color bỏ qua `effectiveColors`.
- Đưa fix recipe ngắn gọn, đúng code-path.

6) **Chuẩn hóa Output format của skill**
- Bắt buộc báo cáo thêm:
  - Contract checks theo 2 cờ (pass/fail).
  - Type nào đã xác nhận Hero-contract parity.

## Kết quả mong đợi sau cập nhật skill
- Skill trở thành playbook đúng cho Hero và mở rộng all types.
- Không còn hướng dẫn sai gây lệch panel/toggle.
- Dev đọc skill có thể triển khai đúng ngay mà không lặp lại bug cũ.