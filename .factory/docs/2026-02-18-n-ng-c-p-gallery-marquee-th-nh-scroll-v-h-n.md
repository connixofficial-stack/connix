## Problem Graph
1. [Main] Nâng cấp layout marquee của Gallery thành scroll vô hạn mượt <- depends on 1.1, 1.2, 1.3, 1.4
   1.1 [Sub] Xác định đúng file render + preview cho layout marquee <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Marquee hiện tại chưa dùng cơ chế loop liên tục bằng track nhân đôi + translateX tuần hoàn
   1.2 [Sub] Thiết kế engine marquee vô hạn (clone list, animation tuyến tính, không giật)
   1.3 [Sub] Đồng bộ behavior giữa preview editor và site render
   1.4 [Sub] Validate TypeScript theo rule repo

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Bám route user đưa (`/admin/home-components/gallery/[id]/edit`) để truy ra component layout marquee đang dùng trong gallery edit/preview/render.
   - Action: Đọc các file route + component gallery liên quan, xác định đúng nhánh `layout === marquee`.
   - Reflection: ✓ Nếu tìm đúng entry point thì tránh sửa lan sang layout khác (đúng scope user yêu cầu).

2. Thiết kế marquee engine vô hạn cho **chỉ layout marquee**
   - Thought: Dùng pattern ổn định: container overflow-hidden + track gồm `items + items` để tạo vòng lặp vô hạn.
   - Action: 
     - Tạo track nhân đôi dữ liệu (không đổi dữ liệu gốc).
     - Animate `translateX` từ `0` đến `-50%` (vì track đã duplicate 2 lần).
     - `animation-timing-function: linear`, `animation-iteration-count: infinite` để chạy liên tục.
     - Pause on hover bằng `animation-play-state: paused`.
     - Tốc độ mặc định: mức **vừa (cân bằng)** theo lựa chọn của bạn.
   - Reflection: ✓ Cơ chế này loại bỏ hiện tượng “nhảy về đầu” bằng mắt, tạo cảm giác vô hạn.

3. Áp dụng đồng bộ preview + render
   - Thought: Tránh mismatch giữa editor preview và site render.
   - Action: Sửa đúng 2 nơi đang render marquee (preview và runtime render của gallery), cùng shared class/logic để behavior giống nhau.
   - Reflection: ✓ Scope chỉ chạm layout marquee, không ảnh hưởng các layout gallery khác.

4. Hardening edge cases
   - Thought: Marquee dễ lỗi khi số item ít/ảnh lỗi/loading.
   - Action:
     - Guard khi 0 item (fallback an toàn).
     - Với 1 item vẫn duplicate để đủ track loop.
     - Giữ key ổn định cho danh sách duplicate để tránh warning/render churn.
   - Reflection: ✓ Giảm rủi ro runtime warning và giật animation.

5. Validation bắt buộc theo AGENTS.md
   - Thought: Rule repo yêu cầu chỉ chạy TypeScript check trước commit.
   - Action: Chạy `bunx tsc --noEmit` sau khi sửa; fix hết lỗi phát sinh liên quan thay đổi.
   - Reflection: ✓ Đảm bảo pass type-check trước khi kết thúc.

6. Commit (không push)
   - Thought: AGENTS.md yêu cầu mọi thay đổi code phải commit.
   - Action: Review diff + status, commit message theo convention hiện tại (ví dụ: `fix(gallery): infinite marquee loop for marquee layout`).
   - Reflection: ✓ Hoàn thành trọn vẹn yêu cầu và giữ lịch sử sạch.

## Kết quả bạn sẽ nhận được
- Layout marquee của Gallery scroll vô hạn mượt, không giật khi loop.
- Pause khi hover.
- Tốc độ mặc định mức vừa.
- Chỉ tác động layout marquee, không đụng layout khác.
- Preview và render đồng bộ hành vi.
- Type-check pass và có commit local (không push).