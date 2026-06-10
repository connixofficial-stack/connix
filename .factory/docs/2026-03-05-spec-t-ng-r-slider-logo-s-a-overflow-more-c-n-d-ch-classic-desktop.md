## Problem Graph
1. [Main] Classic vẫn rớt vào More dù còn dư chỗ + 5 nấc logo tăng chưa đủ rõ
   1.1 [Sub] Mapping 5 nấc logo hiện tăng nhẹ, khó thấy khác biệt
      1.1.1 [ROOT CAUSE] Delta size giữa các nấc quá nhỏ so với mốc mặc định
   1.2 [Sub] Overflow đang bảo thủ nên cắt menu sớm
      1.2.1 [ROOT CAUSE] Cách tính available width đang trừ dự phòng lớn hơn cần thiết thay vì bám theo nav thực tế

## Execution (with reflection)
1. Chốt lại mapping logo theo yêu cầu đã xác nhận
   - Yêu cầu chốt: nấc 2 là mặc định; nấc 3-5 tăng rõ; mức tăng gấp đôi delta hiện tại.
   - Cách làm:
     - Cập nhật map size ở cả:
       - `components/site/Header.tsx`
       - `components/experiences/previews/HeaderMenuPreview.tsx`
     - Giữ nấc 2 bằng đúng size hiện tại từng layout.
     - Tăng mạnh nấc 3-5 theo “double delta”.
     - Nấc 1 giảm nhẹ để vẫn có lựa chọn nhỏ hơn.
   - Reflection: đảm bảo “mặc định làm mốc”, nhưng độ chênh nấc lớn đủ nhìn thấy ngay.

2. Sửa thuật toán overflow Classic desktop theo nav thực tế
   - Yêu cầu chốt: đo trực tiếp `navRef.clientWidth` + binary search, bỏ phần trừ bảo thủ gây hụt.
   - Cách làm (site + preview):
     - File `components/site/Header.tsx`
     - File `components/experiences/previews/HeaderMenuPreview.tsx`
     - Trong `useLayoutEffect` của Classic desktop:
       1) Lấy `availableNavWidth = navRef.clientWidth` (nguồn sự thật duy nhất).
       2) Đo `itemWidths[]` từ measurement layer + `moreWidth`.
       3) Dùng prefix-sum + binary search tìm `k` lớn nhất thỏa:
          - `sum(0..k-1) + gap*(k-1) + (k<n ? gap + moreWidth : 0) <= availableNavWidth`
       4) Chỉ show More khi `k < n`.
     - Giữ `ResizeObserver` nhưng theo dõi đúng các phần ảnh hưởng: `navRef`, measure items, moreMeasure, action group thay đổi trạng thái.
   - Reflection: loại bỏ tình trạng “còn dư nhưng vẫn rớt More”, vì quyết định dựa trực tiếp trên width vùng nav thật.

3. Giữ parity site thật và preview
   - Đồng bộ cùng công thức width + cùng mapping size + cùng điều kiện hiện More.
   - Reflection: tránh lệch behavior giữa editor preview và runtime.

4. Validation
   - Chạy `bunx tsc --noEmit`.
   - Test manual case Classic desktop (site + preview):
     - Nấc 2 (mặc định) so với nấc 3/4/5 phải thấy tăng rõ.
     - Trường hợp còn dư ngang thì item không bị đẩy vào More.
     - Toggle CTA/BrandName + đổi nấc logo liên tục, More cập nhật đúng.

5. Commit
   - Commit local theo convention, kèm `.factory/docs`.

## Checklist
- [ ] Nấc 2 giữ đúng mặc định hiện tại
- [ ] Nấc 3-5 tăng rõ theo double-delta
- [ ] Overflow Classic desktop dùng `navRef.clientWidth` + binary search
- [ ] Áp dụng cho cả site thật và preview
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit đầy đủ (kèm `.factory/docs`)