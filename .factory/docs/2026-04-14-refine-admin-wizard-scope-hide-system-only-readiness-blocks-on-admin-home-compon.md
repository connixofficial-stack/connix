# I. Primer
## 1. TL;DR kiểu Feynman
- Ở `/admin/home-components`, wizard sẽ **không hiển thị**:
  - `Component chưa khả dụng`
  - `Experience cần kiểm tra`
- Wizard chỉ giữ các thông tin **liên quan thao tác tầng admin** (ví dụ blocker/warning dữ liệu để tạo homepage component).
- Logic scan system vẫn giữ ở backend, nhưng UI admin sẽ lọc để tránh nhiễu.

## 2. Elaboration & Self-Explanation
Hiện wizard ở admin đang show thêm thông tin thiên tầng system (`module availability`, `experience alignment`). Anh muốn đúng vai trò: vào admin thì chỉ tập trung tạo/chỉnh homepage component, không cần thấy cảnh báo “chưa khả dụng” hay “experience cần kiểm tra”.

Giải pháp an toàn nhất là đổi ở **render layer** của wizard trong admin:
- Không render 2 block đó.
- Không đổi contract dữ liệu backend để tránh ảnh hưởng các màn khác.

## 3. Concrete Examples & Analogies
- Trước: vào admin thấy cả cảnh báo về experience/module.
- Sau: vào admin chỉ thấy blocker/warning phục vụ tạo component và nút thao tác admin.
- Analogy: cùng một dữ liệu backend, nhưng dashboard cho editor chỉ hiện phần editor cần, không hiện panel vận hành hệ thống.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  1. `HomepageSmartWizardDialog` đang render cả block `Component chưa khả dụng` và `Experience cần kiểm tra` trong step readiness.
  2. Wizard đã đặt đúng tại `/admin/home-components` và có toggle ở `/system/modules/homepage`.
- Inference:
  - Chỉ cần tinh chỉnh UI condition ở dialog là đạt yêu cầu.
- Decision:
  - Ẩn hoàn toàn 2 block system-facing ở admin wizard.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause Confidence: **High**
  - Vấn đề nằm ở hiện trạng render quá rộng scope trong UI admin.
- Counter-hypothesis:
  - Xóa dữ liệu `unavailableComponents/experienceWarnings` từ backend.
  - Bác bỏ: dễ ảnh hưởng nơi khác và làm mất dữ liệu hữu ích cho tầng system.

# IV. Proposal (Đề xuất)
1. Cập nhật `HomepageSmartWizardDialog`:
   - Gỡ render block `Component chưa khả dụng`.
   - Gỡ render block `Experience cần kiểm tra`.
2. Giữ nguyên `buildReadinessReport` và `getHomepageWizardReality` để không phá contract.
3. Nếu cần sau này mở lại cho tầng system, dùng prop `scope='admin' | 'system'` (mặc định `admin`).

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `components/modules/homepage/HomepageSmartWizardDialog.tsx`
  - Vai trò hiện tại: render đầy đủ readiness info.
  - Thay đổi: chỉ render readiness phù hợp admin; ẩn 2 khối system-facing.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại readiness section trong dialog.
2. Xóa phần JSX của `unavailableComponents` và `experienceWarnings`.
3. Rà nhanh import/biến không dùng.
4. Typecheck `bunx tsc --noEmit`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Mở `/admin/home-components` → mở wizard:
  - Không còn thấy `Component chưa khả dụng`.
  - Không còn thấy `Experience cần kiểm tra`.
  - Các blocker/warning admin-relevant vẫn hoạt động.
- Chạy: `bunx tsc --noEmit`.

# VIII. Todo
1. Ẩn khối `unavailableComponents` ở admin wizard.
2. Ẩn khối `experienceWarnings` ở admin wizard.
3. Dọn import/state không dùng.
4. Typecheck và chốt.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Wizard ở `/admin/home-components` chỉ hiển thị thông tin liên quan tầng admin.
- Không hiển thị 2 block system-facing như user yêu cầu.
- Không làm hỏng flow câu hỏi/apply hiện tại.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: có thể thiếu context debug cho một số case hiếm.
- Giảm thiểu: giữ dữ liệu backend, chỉ ẩn ở UI.
- Rollback: revert 1 file dialog.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi logic readiness backend.
- Không thay đổi vị trí wizard hay toggle module.

# XII. Open Questions (Câu hỏi mở)
- Không có ambiguity; yêu cầu đã rõ và có thể triển khai trực tiếp.