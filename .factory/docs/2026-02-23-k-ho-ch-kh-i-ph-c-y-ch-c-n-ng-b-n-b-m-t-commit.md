## Problem Graph
1. Khôi phục đầy đủ chức năng map cho 3 route <- phụ thuộc 1.1, 1.2, 1.3
   1.1 Xác định mốc commit map mới nhất đầy đủ <- ROOT CAUSE
   1.2 Trích đúng diff cần khôi phục theo mốc đã chọn
   1.3 Áp lại diff vào HEAD hiện tại, xử lý conflict để giữ đúng hành vi

## Execution (with reflection)
1. Solving 1.1.1 (ROOT CAUSE) - Chọn commit nguồn
   - Thought: Theo yêu cầu của bạn, ưu tiên commit mới nhất có đủ 3 route.
   - Action: Dựa reflog, chọn mốc `9a53681` (`feat: integrate OpenStreetMap (Leaflet) for contact page - 100% free`) vì là mốc mới nhất liên quan map và nằm sau chuỗi fix map (`06aaf8c` -> `600157d`).
   - Reflection: ✓ Phù hợp tiêu chí bạn chọn.

2. Trích phạm vi thay đổi map từ commit nguồn
   - Action:
     - Liệt kê file thay đổi bởi `9a53681` và các commit map liền trước trong cụm map (`06aaf8c`, `b4fae5f`, `d5d7ce9`, `4608739`, `3e5d9e1`, `600157d`).
     - Gộp tập file liên quan trực tiếp 3 route:
       - `/admin/settings` (UI map picker, search address, lưu lat/lng)
       - `/system/experiences/contact` (editor/preview map config)
       - `/contact` (runtime render map thật)
       - các shared component/lib map (Leaflet dynamic import, marker icon fix, CSS loading an toàn SSR).
   - Reflection: ✓ Bảo đảm không bỏ sót các fix phụ trợ khiến map lỗi SSR/marker.

3. Áp patch thủ công từ diff (theo lựa chọn của bạn)
   - Action:
     - So sánh `HEAD` hiện tại với commit nguồn trên từng file map.
     - Áp từng hunk cần thiết (không cherry-pick whole commit), ưu tiên khôi phục “đúng 100% hành vi cũ”.
     - Nếu có conflict do code mới hơn, resolve theo nguyên tắc:
       1) giữ nguyên logic map từ commit nguồn,
       2) chỉ điều chỉnh import/type tối thiểu để compile trên HEAD.
   - Reflection: ✓ Đúng yêu cầu “giống commit cũ 100%” nhưng vẫn tương thích nhánh hiện tại.

4. Validate bắt buộc sau khi áp patch
   - Action: chạy `bunx tsc --noEmit` (theo rule repo) để xác nhận không vỡ type.
   - Reflection: chỉ pass khi không còn lỗi TS.

5. Commit khôi phục
   - Action:
     - Review `git status`, `git diff --cached` để chắc chắn chỉ gồm thay đổi map liên quan.
     - Commit local (không push) với message rõ phạm vi khôi phục map 3 route.
   - Reflection: ✓ Tuân thủ yêu cầu repo “mọi thay đổi code phải commit, không push”.

## Kết quả kỳ vọng sau khi implement
- `/admin/settings`: map OpenStreetMap hoạt động, chọn/search địa chỉ, marker/lat-lng hiển thị và lưu đúng.
- `/system/experiences/contact`: cấu hình map cho contact experience khôi phục đầy đủ.
- `/contact`: hiển thị map runtime đúng dữ liệu đã lưu, không lỗi SSR/icon.

Nếu bạn duyệt spec này, mình sẽ bắt đầu implement đúng theo các bước trên ngay.