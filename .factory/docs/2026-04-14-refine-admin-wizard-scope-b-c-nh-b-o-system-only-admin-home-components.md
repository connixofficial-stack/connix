# I. Primer
## 1. TL;DR kiểu Feynman
- Wizard ở `/admin/home-components` đang hiển thị cả cảnh báo thuộc scope hệ thống (`/system/modules/...`), gây sai ngữ cảnh admin.
- Em sẽ giới hạn UI readiness của wizard theo scope admin: bỏ các quick-action kiểu “Mở module ...” trỏ sang `/system`.
- Không đụng backend/report contract để tránh side effect.
- Thay đổi nhỏ, 1 file chính, rollback dễ.

## 2. Elaboration & Self-Explanation
Vấn đề không nằm ở dữ liệu quét readiness, mà nằm ở cách render trong `HomepageSmartWizardDialog`: hiện đang show blocker/warning có quick-action sang `/system/modules/...` ngay trong trang admin. Với user ở `/admin/home-components`, điều này là nhiễu và trái kỳ vọng vận hành. 

Cách xử lý an toàn nhất là lọc ở lớp UI của dialog theo ngữ cảnh admin: chỉ hiển thị cảnh báo phục vụ thao tác admin trực tiếp, ẩn các issue system-only (đặc biệt issue có action `/system/...` hoặc label “Mở module ...”).

## 3. Concrete Examples & Analogies
- Trước: trong admin wizard thấy `Mở module products` (link `/system/modules/products`).
- Sau: trong admin wizard chỉ còn action liên quan admin như `/admin/products`, `/admin/services`, `/admin/settings`.
- Analogy: cùng 1 kho dữ liệu cảnh báo, nhưng mỗi “màn hình vai trò” chỉ nên hiện đúng phần việc của vai trò đó.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `components/modules/homepage/wizard/readiness.ts` tạo quickActions gồm cả `/system/modules/${key}` + `/admin/...`.
  - `components/modules/homepage/HomepageSmartWizardDialog.tsx` render trực tiếp toàn bộ blockers/warnings nên kéo theo CTA system ở admin.
- Inference:
  - Root cause ở presentation layer (dialog), không phải ở scanner/query.
- Decision:
  - Lọc hiển thị quickActions/issue theo admin scope tại dialog.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause Confidence: **High**.
- Root cause: Dialog admin render nguyên trạng readiness issues có chứa system actions.
- Counter-hypothesis đã cân nhắc:
  - Sửa `buildReadinessReport` để không sinh action system nữa.
  - Không chọn vì có thể ảnh hưởng màn khác dùng chung report.

# IV. Proposal (Đề xuất)
1. Trong `HomepageSmartWizardDialog.tsx`, thêm bước chuẩn hóa issue cho admin:
   - Lọc `quickActions` chỉ giữ link bắt đầu bằng `/admin/`.
   - Nếu issue chỉ còn action system và không còn admin action thì ẩn issue đó khỏi admin readiness list.
2. Giữ nguyên `buildReadinessReport` và data contract hiện tại.
3. Dọn import/biến không dùng nếu phát sinh.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `components/modules/homepage/HomepageSmartWizardDialog.tsx`
  - Vai trò hiện tại: render readiness gate của Smart Wizard.
  - Thay đổi: lọc/ẩn issue system-only trong context admin.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc readiness render path trong dialog.
2. Thêm selector/filter issue theo admin actions.
3. Cập nhật logic `canProceed()` nếu cần để bám list blocker sau lọc.
4. Rà static typing/null safety.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Repro tại `http://localhost:3000/admin/home-components`:
  - Mở Smart Wizard, step Readiness.
  - Confirm không còn CTA “Mở module products” hoặc link `/system/modules/...`.
  - Confirm vẫn thấy cảnh báo/blocker có action `/admin/...` (nếu dữ liệu thiếu).
- Static check sau sửa code TS: `bunx tsc --noEmit`.

# VIII. Todo
1. Lọc quickActions chỉ giữ `/admin/*` trong `HomepageSmartWizardDialog`.
2. Ẩn issue system-only sau khi lọc.
3. Đảm bảo gate `canProceed` dùng danh sách blocker đã lọc đúng ngữ cảnh admin.
4. Chạy `bunx tsc --noEmit`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Ở `/admin/home-components`, không còn cảnh báo/action yêu cầu mở module trong `/system`.
- Không xuất hiện CTA “Mở module products” trong admin wizard.
- Wizard flow (next/back/apply) vẫn hoạt động bình thường.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: ẩn quá tay có thể làm thiếu cảnh báo hữu ích.
- Giảm thiểu: chỉ ẩn issue không còn action admin sau lọc.
- Rollback: revert 1 file dialog.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi logic readiness backend.
- Không đổi route hoặc permission giữa `/admin` và `/system`.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity đáng kể cho scope hiện tại.