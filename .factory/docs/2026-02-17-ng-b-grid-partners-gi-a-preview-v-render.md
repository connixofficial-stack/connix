## Problem Graph
1. [Main] Grid Partners chưa đồng bộ giữa preview và render thật <- depends on 1.1, 1.2
   1.1 [Sub] Preview đang có rule riêng (slot `+N`) nhưng render path chưa áp dụng giống hệt
      1.1.1 [ROOT CAUSE] Duplicate logic layout ở 2 nơi, không dùng chung 1 shared renderer
   1.2 [Sub] Số item hiển thị và breakpoint mapping khác nhau giữa admin preview/site

## Execution (with reflection)
1. Rà soát 2 đường render Grid
   - Đọc `app/admin/home-components/partners/_components/PartnersPreview.tsx` và `components/site/*` phần render type Partners/Gallery để xác định nhánh Grid hiện tại ở site.
   - Reflection: khóa chính xác file render thật đang dùng, tránh sửa nhầm component.

2. Tạo shared contract cho Grid Partners
   - Mục tiêu: 1 hàm/1 component dùng chung cho cả preview và site với cùng input: `items`, `device/breakpoint`, `maxVisible`, `showRemainingSlot`.
   - Rule đồng bộ:
     - Mobile max 4 ô; Desktop max 8 ô.
     - Nếu vượt ngưỡng: hiển thị `maxVisible - 1` item + 1 ô `+N`.
     - Không vượt số cột quy định theo breakpoint để tránh rớt dòng bất ngờ.
   - Reflection: KISS/YAGNI, chỉ tách phần Grid, không đụng các style khác (marquee/badge/carousel/featured).

3. Áp dụng shared Grid vào preview + render
   - Preview: thay nhánh grid local bằng shared renderer.
   - Render site: nhánh Grid của Partners cũng gọi shared renderer cùng props.
   - Đảm bảo class tailwind đồng nhất (`grid-cols-*`, `gap`, `item container`, `image sizing`) để hành vi 1:1.
   - Reflection: loại bỏ drift lâu dài giữa 2 nơi.

4. Validate
   - Chạy `bunx tsc --noEmit`.
   - So sánh nhanh tại route edit user báo và render thật: nhiều item phải giữ layout ổn định, `+N` đúng count.
   - Reflection: chỉ pass khi preview/render khớp.

5. Commit (không push)
   - Commit message dự kiến: `fix(partners): sync grid behavior between preview and render`
   - Chỉ commit file liên quan Partners Grid + wiring cần thiết.

## Kết quả kỳ vọng
- Grid Partners hiển thị giống nhau giữa preview và render thật.
- Không còn tình trạng preview đúng nhưng render lệch/rớt dòng khi item nhiều.
- Logic `+N` nhất quán trên mọi breakpoint.