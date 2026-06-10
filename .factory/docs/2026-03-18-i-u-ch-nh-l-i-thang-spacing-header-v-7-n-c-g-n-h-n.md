## Audit Summary
- Observation: spacing header hiện tại đã có `headerSpacingLevel` với thang 7 nấc, clamp `1..7`, default `4`.
- Observation: mapping hiện tại vẫn giữ 3 nấc lớn về phía `Thoáng`/`Rất thoáng`, trong khi nhu cầu mới là dồn scale về nhỏ hơn.
- Observation: bạn đã chốt hướng: giữ 7 nấc và bỏ 3 nấc lớn để thay bằng 3 nấc nhỏ hơn.
- Decision: không mở rộng lên 10 nấc; giữ UI editor gọn với 7 nấc, nhưng remap lại toàn bộ scale theo hướng compact hơn.

## Root Cause Confidence
- High — vấn đề nằm ở phân bố scale hiện tại đang thiên về tăng độ thoáng, không khớp nhu cầu “nhỏ hơn rất gọn”. Evidence:
  - `app/system/experiences/menu/page.tsx`: options hiện là 7 nấc từ `Rất gọn` đến `Rất thoáng`
  - `components/experiences/previews/HeaderMenuPreview.tsx` và `components/site/Header.tsx`: `headerSpacingMap` đang tăng dần đến các mức lớn
- Counter-hypothesis đã loại trừ: không cần thêm field mới hay đổi scope; chỉ cần chỉnh labels + map spacing hiện có.

## Proposal
1. Giữ nguyên schema 7 nấc
   - Không đổi type `headerSpacingLevel?: 1 | 2 | 3 | 4 | 5 | 6 | 7`
   - Không đổi logic save/load và clamp `1..7`
   - Không đổi vị trí control trong editor

2. Remap lại labels theo hướng gọn hơn
   - File `app/system/experiences/menu/page.tsx`
   - Đổi 7 label để 3 nấc cuối không còn là `Thoáng` lớn, ví dụ theo tinh thần:
     1. Siêu gọn
     2. Rất gọn
     3. Gọn
     4. Hơi gọn
     5. Cân bằng
     6. Hơi thoáng
     7. Mặc định cũ / Trung bình
   - Mục tiêu: toàn thang đo nghiêng về compact, nhưng vẫn còn 1-2 nấc không quá chật.

3. Remap lại padding Y cho cả 3 layout
   - File `components/experiences/previews/HeaderMenuPreview.tsx`
   - File `components/site/Header.tsx`
   - Thay `headerSpacingMap` hiện tại bằng dải nhỏ hơn, ví dụ quanh mốc cũ nhưng dịch xuống:
     - `classic`: từ rất nhỏ lên vừa phải, không còn 2-3 mức quá thoáng
     - `topbar`: scale nhỏ hơn nữa vì base vốn thấp hơn
     - `allbirds`: cùng logic với classic
   - Giữ parity preview = site.

4. Default giữ an toàn
   - Vì câu trả lời thứ 2 không còn áp dụng sau khi bạn chọn phương án 7 nấc, tôi sẽ giữ default ở mức trung tính an toàn gần hiện trạng nhưng hơi gọn hơn, để tránh lệch UI quá mạnh.
   - Nếu cần, có thể đặt default ở mức 5 hoặc 6 trong thang mới, miễn là visual gần mức đang dùng nhất.

5. Scope giữ nguyên
   - Chỉ hàng header chính
   - Cả 3 layout
   - Không đụng topbar/mobile menu/dropdown
   - Không đổi horizontal spacing

## Post-Audit Notes
- Pass criteria:
  1. Editor vẫn là 7 nấc, nhưng labels nghiêng về compact hơn
  2. 3 nấc lớn cũ không còn nữa
  3. Preview/site đều cho ra header thấp hơn ở toàn bộ scale
  4. Mức mặc định không làm vỡ UI cũ

## Verification Plan
- Static review:
  - kiểm tra editor vẫn hiển thị đúng 7 nấc
  - kiểm tra `headerSpacingMap` preview/site giống nhau
  - kiểm tra topbar/mobile menu không bị ảnh hưởng
  - kiểm tra default mới không gây mismatch với config cũ
- Theo rule repo, không chạy lint/test runtime/build.
- Nếu được duyệt implement, tôi sẽ self-review tĩnh và chạy `bunx tsc --noEmit`.