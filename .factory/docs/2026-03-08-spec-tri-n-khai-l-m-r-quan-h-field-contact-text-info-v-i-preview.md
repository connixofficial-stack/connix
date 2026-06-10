## Audit Summary
### Observation
- Spec nguồn tại `E:\NextJS\persional_project\system-nhan\.factory\docs\2026-03-08-gi-i-th-ch-quan-h-field-contact-text-info-v-i-preview.md` đã xác nhận root cause chính là **UI hiện tại chưa làm rõ ranh giới giữa text hiển thị và dữ liệu thật**.
- `config.texts` đang chứa các field microcopy như `badge`, `heading`, `addressLabel`, `contactLabel`, `hoursLabel`.
- `address`, `phone`, `email`, `workingHours` là dữ liệu thật và được render song song trong cùng block thông tin liên hệ.
- Preview và site dùng chung `ContactSectionShared`, nên nếu người dùng hiểu sai ở editor thì sẽ hiểu sai cả preview/site behavior.

### Root Cause Confidence
**High** — Evidence đã có sẵn trong spec nguồn và mapping code hiện tại rất rõ: vấn đề nằm ở information architecture của form edit, không phải logic render.

## Proposal
### 1) Làm rõ ngay trong editor rằng có 2 nhóm field khác nhau
- File chính: `app/admin/home-components/contact/_components/ConfigEditor.tsx`
- Chuyển cách trình bày thành 2 cụm rõ ràng:
  - **Nhãn hiển thị**: các field trong `config.texts`
  - **Dữ liệu liên hệ**: `address`, `phone`, `email`, `workingHours`
- Mục tiêu: chỉ nhìn layout là hiểu field nào đổi label, field nào đổi value.

### 2) Đổi microcopy để giảm nhầm lẫn
- Với nhóm `config.texts`, thêm naming rõ hơn trong UI, ví dụ:
  - `Label giờ làm việc` → `Nhãn giờ làm việc`
  - `Tiêu đề chính` giữ nguyên hoặc đổi thành `Heading hiển thị`
- Với nhóm dữ liệu thật, title nên rõ kiểu:
  - `Thông tin liên hệ thực tế`
  - hoặc `Giá trị hiển thị`
- Không đổi key dữ liệu, chỉ đổi label hiển thị trong admin.

### 3) Thêm helper text ngắn ngay tại chỗ
- Trong `ConfigEditor.tsx`, thêm mô tả rất ngắn dưới section title:
  - Nhóm text: “Chỉ đổi chữ hiển thị, không đổi dữ liệu liên hệ.”
  - Nhóm data: “Đây là nội dung thật sẽ hiện trên preview/site.”
- Giữ text economy, tránh dài dòng.

### 4) Nếu cần, sắp cặp label ↔ value gần nhau để dễ hiểu
- Ví dụ trong layout desktop:
  - `Nhãn giờ làm việc` gần `Giờ làm việc`
  - `Nhãn địa chỉ` gần `Địa chỉ`
- Nhưng vẫn không đổi contract hay behavior; chỉ tối ưu vị trí hiển thị.

### 5) Không đổi logic render / preview / payload
- Không đổi:
  - `TEXT_FIELDS`, `DEFAULT_CONTACT_TEXTS`
  - `normalizeContactConfig`
  - `ContactSectionShared`
  - `ContactPreview`, `ContactSection`
- Chỉ đổi editor UX để mapping label/value rõ ràng hơn.

## Verification Plan
1. **Typecheck**: `bunx tsc --noEmit`.
2. **Route check** tại trang user đưa:
   - người dùng phân biệt được nhóm “Nhãn hiển thị” và “Dữ liệu liên hệ”.
3. **Behavior parity**:
   - sửa `Nhãn giờ làm việc` chỉ đổi label trên preview.
   - sửa `Giờ làm việc` chỉ đổi giá trị trên preview.
4. **Pass criteria**:
   - Không còn cảm giác nhập field mà không biết nó ảnh hưởng label hay value.
   - Không đổi feature, không đổi payload, không đổi preview logic.

Nếu bạn duyệt, mình sẽ triển khai đúng spec này từ nội dung file docs bạn chỉ định, chỉ tập trung làm rõ UX editor cho phần Contact.