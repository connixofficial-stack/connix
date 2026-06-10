## Mục tiêu
Fix **full phần render trang chủ** của home-component Gallery để **khớp preview 1:1** ở trang edit cho đủ 6 layouts, chỉ trong phạm vi render layout (không đổi schema/config).

## Problem Graph
1. [Main] Render Gallery ở trang chủ chưa khớp preview <- depends on 1.1, 1.2, 1.3
   1.1 [Sub] Lệch cấu trúc/layout giữa preview và renderer <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Preview và renderer dùng “xương” khác nhau cho từng layout
   1.2 [Sub] Lệch điều kiện hiển thị (title/desc/badge/cta/image/overlay)
   1.3 [Sub] Lệch class/style mapping theo layout + breakpoint

## Execution (with reflection)
1. So sánh preview vs renderer cho 6 layout
   - Đọc các file Gallery preview/render/shared liên quan.
   - Lập checklist parity theo từng layout: DOM structure, thứ tự block, điều kiện render, className chính.
   - Reflection: nếu layout nào không thể map trực tiếp thì tách shared helper nhỏ để đồng bộ.

2. Đồng bộ “xương layout” renderer theo preview
   - Với từng layout, sửa renderer để cùng structure/hierarchy như preview (container, section, item card, media/text blocks).
   - Không thêm tính năng mới, không đổi dữ liệu đầu vào.
   - Reflection: đảm bảo DRY/KISS, ưu tiên tái dùng shared section/function nếu đã có.

3. Đồng bộ điều kiện hiển thị 1:1
   - Áp cùng điều kiện cho các phần optional (title, subtitle, description, CTA, badge, trust-badge, meta).
   - Đồng bộ fallback và guard khi thiếu dữ liệu để hành vi giống preview.
   - Reflection: tránh thay đổi business logic ngoài Gallery render.

4. Đồng bộ style mapping theo layout + responsive
   - Căn chỉnh className layout-level (grid cols, gap, aspect, alignment, radius, shadow, overlay state).
   - Đồng bộ breakpoint behavior theo preview (mobile/tablet/desktop).
   - Reflection: chỉ chỉnh các class ảnh hưởng trực tiếp parity preview-render.

5. Tự kiểm tra parity 6 layout
   - Soát lại từng layout bằng checklist parity đã lập ở bước 1.
   - Xử lý chênh lệch cuối cùng cho đạt preview 1:1.

6. Validation bắt buộc
   - Chạy `bunx tsc --noEmit` theo rule repo.
   - Nếu fail: sửa lỗi và chạy lại đến khi pass.

7. Commit local
   - Review diff, đảm bảo chỉ chứa thay đổi thuộc Gallery render parity.
   - Commit local (không push) với message dạng: `fix(gallery): align homepage render with edit preview across 6 layouts`.