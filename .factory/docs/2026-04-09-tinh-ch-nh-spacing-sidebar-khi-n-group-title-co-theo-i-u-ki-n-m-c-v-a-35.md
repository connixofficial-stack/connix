## TL;DR kiểu Feynman
- Khi title group bị ẩn, khoảng trống giữa các khối vẫn giữ theo `space-y-6` nên nhìn còn thưa.
- Theo lựa chọn của bạn: chỉ co spacing ở các group bị ẩn title, không đụng group còn title.
- Mức co áp dụng là “vừa” (~35%), để sidebar gọn hơn mà vẫn đọc được.
- Không đổi logic hiển thị menu/module, chỉ đổi khoảng cách render.

## Audit Summary
### Observation
1. Container sidebar đang dùng `space-y-6` cố định cho toàn bộ section.
2. Mỗi section wrapper dùng `space-y-1`; title có `mb-2`.
3. Khi title ẩn, section vẫn chiếm khoảng cách như section có title.

### Inference
- Root cause là spacing đang đặt theo “global section gap”, không phụ thuộc trạng thái title hiển thị/ẩn.

### Decision
- Áp dụng gap theo điều kiện từng section: section nào ẩn title thì giảm spacing riêng của section đó và giảm khoảng cách tách section kế tiếp theo mức ~35%.

## Root Cause Confidence
**High** — vì khoảng trắng thừa xuất phát trực tiếp từ class gap cố định (`space-y-6`) và margin title.

## Elaboration & Self-Explanation
Hiện tại sidebar đang dùng 1 khoảng cách dọc chung cho tất cả section. Cách này đơn giản nhưng có nhược điểm: khi title không hiện, mắt vẫn thấy “khoảng đệm như có title”, nên bố cục trông lãng phí chiều cao.

Cách xử lý phù hợp là: section nào không có title thì cho nó dùng spacing nhỏ hơn một chút. Section còn title vẫn giữ spacing hiện tại để giữ phân nhóm rõ ràng.

## Concrete Examples & Analogies
- Ví dụ: `Nội dung` chỉ còn 1 mục nên title ẩn → khoảng cách trước/sau block `Quản lý bài viết` sẽ co lại khoảng 35%.
- `Hệ thống` có nhiều mục và còn title → spacing giữ nguyên để dễ scan.
- Analogy: giống danh sách mục lục, nếu bỏ heading thì ta cũng kéo các dòng lại gần để không bị “hẫng”.

## Files Impacted
- **Sửa:** `app/admin/components/Sidebar.tsx`
  - Vai trò hiện tại: render toàn bộ section sidebar.
  - Thay đổi: thêm class/biến spacing theo trạng thái `shouldShowGroupTitle(...)`; section ẩn title dùng gap nhỏ hơn (~35%).

## Execution Preview
1. Tạo helper nhỏ để xác định class spacing section theo `showTitle`.
2. Áp helper cho các section wrappers (analytics/content/commerce/media/marketing/system).
3. Giữ nguyên section có title; co section không title theo mức “vừa”.
4. Static self-review để chắc không ảnh hưởng logic active/expand/subitems.

## Acceptance Criteria
- Section ẩn title sẽ dính sát hơn rõ rệt (mức vừa ~35%).
- Section còn title giữ cảm giác phân nhóm như hiện tại.
- Không thay đổi route/menu/module visibility và hành vi expand/collapse.

## Verification Plan
- Không chạy lint/test/build theo AGENTS.md.
- Verify tĩnh tại chỗ:
  - Soát class spacing đã tách theo điều kiện title.
  - Soát không đổi logic `shouldShowGroupTitle` và active state.
  - Soát không phát sinh ảnh hưởng footer/toggle/sidebar scroll.

## Out of Scope
- Không đổi màu, typography, icon, hay thứ tự menu.
- Không refactor sidebar sang data-driven config.

## Risk / Rollback
- Risk thấp: co quá tay có thể làm nhìn chật.
- Rollback nhanh: revert riêng phần class spacing trong `Sidebar.tsx`.