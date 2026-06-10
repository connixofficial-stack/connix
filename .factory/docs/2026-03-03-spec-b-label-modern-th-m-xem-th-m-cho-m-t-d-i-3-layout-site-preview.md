## Problem Graph
1. [Main] Chuẩn hóa hiển thị mô tả cho Product Detail (site + preview) <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] Layout Modern còn label “Mô tả/Thông tin” gây rối UI
   1.2 [ROOT CAUSE] Chưa có cơ chế collapse mô tả dài nên dễ phá layout

## Execution (with reflection)
1. Cập nhật trang thật `app/(site)/products/[slug]/page.tsx`.
   - Action:
     - Layout Modern: bỏ hẳn 2 label text “Mô tả” và “Thông tin”.
     - Thêm helper dùng chung cho mô tả dài (ví dụ `ExpandableDescription`) với state mở/đóng, mặc định clamp `line-clamp-4 md:line-clamp-5`.
     - Áp dụng helper này cho **cả 3 layout** ở mọi chỗ render mô tả sản phẩm:
       - Classic: block “Mô tả sản phẩm”
       - Modern: block mô tả chi tiết phía dưới (sau khi bỏ 2 label)
       - Minimal: block mô tả trong cột phải
     - Chỉ hiện nút “Xem thêm/Thu gọn” khi nội dung thật sự vượt ngưỡng (đo overflow qua ref + resize observer/effect).
   - Reflection: đúng yêu cầu “3 layout có xem thêm khi mô tả dài”, không phá UI desktop/mobile.

2. Đồng bộ preview `components/experiences/previews/ProductDetailPreview.tsx`.
   - Action:
     - Không hiển thị label “Mô tả/Thông tin” cho Modern (nếu có).
     - Thêm preview block mô tả mẫu cho cả 3 layout và áp dụng cùng hành vi clamp + “Xem thêm/Thu gọn” (4 dòng mobile, 5 dòng desktop) để parity với site thật.
   - Reflection: preview và site thống nhất hành vi, tránh lệch kỳ vọng khi config trong system.

3. Verify và commit theo rule repo.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Review `git diff --cached` + `git status`.
     - Commit local (không push), kèm `.factory/docs` nếu có thay đổi file spec.

## Checklist chốt theo yêu cầu bạn đã chọn
- [x] Phạm vi: **cả trang thật + preview**
- [x] Modern: bỏ chữ “Mô tả” và “Thông tin”
- [x] 3 layout: mô tả dài sẽ có “Xem thêm”, bấm mới show full
- [x] Ngưỡng clamp: **4 dòng mobile / 5 dòng desktop**

Nếu bạn duyệt spec này, tôi sẽ implement ngay.