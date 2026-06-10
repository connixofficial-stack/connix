## Audit Summary
### Observation (evidence)
- `Tùy chỉnh văn bản` map vào `config.texts` (không phải dữ liệu liên hệ thật):
  - key/label nằm ở `app/admin/home-components/contact/_lib/constants.ts` (`TEXT_FIELDS`, `DEFAULT_CONTACT_TEXTS`).
- Dữ liệu liên hệ thật nằm ở các field riêng trong config:
  - `address`, `phone`, `email`, `workingHours` (`_types/index.ts`, `_components/ConfigEditor.tsx`).
- Khi render, `ContactSectionShared` tách rõ 2 nhóm:
  - **texts** (label/heading/badge): `badge`, `heading`, `addressLabel`, `contactLabel`, `hoursLabel`, ...
  - **values** (giá trị thật): `address`, `phone`, `email`, `workingHours`.
  (evidence: `app/admin/home-components/contact/_components/ContactSectionShared.tsx` đoạn `buildContactInfo` và các chỗ render `info.texts.*` vs `info.address/phone/email/workingHours`).
- Preview và site dùng cùng shared component:
  - Preview: `ContactPreview.tsx` -> `ContactSectionShared context="preview"`.
  - Site: `components/site/ContactSection.tsx` -> `ContactSectionShared context="site"`.
  => Hành vi text/value là nhất quán giữa preview và site.

### Trả lời câu hỏi của bạn (ý nghĩa và liên hệ)
- **Text badge / Tiêu đề chính / Label ...**: chỉ đổi chữ hiển thị (UI copy), không đổi dữ liệu liên hệ.
- **Địa chỉ / SĐT / Email / Giờ làm việc** (ở phần thông tin liên hệ): là dữ liệu thật để hiển thị nội dung.
- **“Giờ làm việc” có tác dụng gì?**
  - Đây là giá trị `workingHours` được render ở block thông tin liên hệ (và nhiều style đều dùng).
  - Không tự suy ra từ địa chỉ; nó độc lập.
- **Có liên hệ với nhau không?**
  - Có theo kiểu **label ↔ value**:
    - `hoursLabel` (text tùy chỉnh) là nhãn.
    - `workingHours` là giá trị.
  - Tương tự `addressLabel` ↔ `address`, `phoneLabel/contactLabel` ↔ `phone/email` (tùy style).
- **Có liên hệ với preview không?**
  - Có, trực tiếp. Preview đọc cùng config và render cùng component shared, nên đổi ở edit sẽ thấy ngay trên preview.

## Root Cause Confidence
**High** — mapping được xác nhận trực tiếp từ constants + normalize + shared renderer + preview/site wrapper; không phải suy đoán.

## Verification Plan
1. Tại route bạn gửi, đổi `Label giờ làm việc` (ví dụ: “Thời gian mở cửa”) và giữ `Giờ làm việc` cũ -> preview chỉ đổi nhãn, giá trị không đổi.
2. Đổi `Giờ làm việc` (ví dụ: “08:30–18:00”) -> preview đổi giá trị tương ứng.
3. Đổi `Label địa chỉ` và `Địa chỉ` tương tự để thấy mô hình label/value lặp lại.

Nếu bạn muốn, bước tiếp theo mình sẽ đề xuất spec tách UI rõ hơn thành cặp “Nhãn hiển thị” và “Giá trị dữ liệu” để khỏi nhầm khi nhập.