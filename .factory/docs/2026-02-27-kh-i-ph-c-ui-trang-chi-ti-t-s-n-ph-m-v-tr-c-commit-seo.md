## Problem Graph
1. `/products/[slug]` đang khác UI cũ rõ rệt <- depends on 1.1, 1.2, 1.3
   1.1 File page bị mở rộng từ bản đơn giản sang bản feature-heavy (variant, comment, sale mode, wishlist...) <- ROOT CAUSE
   1.2 Bổ sung token/hệ màu mới làm lệch visual cũ
   1.3 Các chỉnh hardcode gần đây tiếp tục thay đổi text/fallback

## Execution (with reflection)
1. Solving 1.1 (khôi phục cấu trúc UI cũ)
   - Mốc chuẩn: `3fa2e19^` (đúng theo bạn chọn “trước commit SEO”).
   - File mục tiêu chính: `app/(site)/products/[slug]/page.tsx`.
   - Cách làm:
     - Lấy snapshot UI từ `3fa2e19^:app/(site)/products/[slug]/page.tsx`.
     - Khôi phục gần như toàn bộ layout/markup của 3 style (`ClassicStyle`, `ModernStyle`, `MinimalStyle`) về bản cũ.
     - Giữ các sửa an toàn tối thiểu đã có sau này nếu không phá UI cũ (ví dụ import/type cần thiết để compile).
   - Reflection: diff hiện tại cho thấy file đã phình rất lớn (2205 dòng vs ~553 dòng cũ), nên rollback theo snapshot là cách chắc nhất để đưa giao diện về trạng thái trước SEO.

2. Solving 1.2 (khớp visual cũ)
   - File liên quan: `components/site/products/detail/_lib/colors.ts` (nếu cần), và các call-site trong page.
   - Cách làm:
     - Ưu tiên giữ màu theo cách cũ (`useBrandColor` + class cũ) thay vì token hệ mới cho trang detail.
     - Chỉ can thiệp những phần trực tiếp làm lệch giao diện cũ.
   - Reflection: mục tiêu là “khôi phục gần như toàn bộ UI cũ”, không phải giữ kiến trúc token mới.

3. Solving 1.3 (layout SEO file)
   - File: `app/(site)/products/[slug]/layout.tsx`.
   - Cách làm:
     - Kiểm tra file này có tồn tại ở `3fa2e19^` hay chưa.
     - Nếu chưa tồn tại trước mốc SEO thì loại bỏ/điều chỉnh để không tác động UI detail runtime.
     - Nếu vẫn giữ SEO metadata thì tách biệt, không để ảnh hưởng cấu trúc render trang.
   - Reflection: commit SEO thêm layout riêng cho slug; cần cô lập để giao diện không bị kéo theo logic mới.

4. Validation
   - Chạy: `bunx tsc --noEmit`.
   - Soát lại route thật: `http://localhost:3000/products/o-choi-tieu-chuan-48` theo checklist:
     - Bố cục/spacing/CTA giống pre-SEO.
     - Không còn các block feature-heavy mới chen vào UI chính.
     - Vẫn render ổn khi thiếu category/image.

5. Commit
   - Commit local sau khi pass typecheck.
   - Message đề xuất: `refactor(product-detail): restore pre-seo UI structure for product slug page`.
   - Không push.