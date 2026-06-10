## Problem Graph
1. [Main] Badge + Featured dùng màu thương hiệu làm nền item gây UI kém chuyên nghiệp khi user chọn màu gắt <- depends on 1.1, 1.2
   1.1 [Sub] Color tokens hiện tại map brand trực tiếp vào `itemBg`/`badgeBg`/`featuredCardBg`
      1.1.1 [ROOT CAUSE] Thiếu lớp neutral surface tách biệt với brand accent
   1.2 [Sub] Preview và render phải đồng bộ cùng logic màu

## Execution (with reflection)
1. Rà soát token màu Partners hiện tại
   - File chính: `app/admin/home-components/partners/_lib/colors.ts` và các shared components `PartnersBadgeShared.tsx`, `PartnersFeaturedShared.tsx`.
   - Reflection: xác định đúng token nào đang khiến item nền bị “brand flood”.

2. Thiết kế lại token theo hướng professional
   - Giữ brand cho accent (viền nhấn, badge nhỏ, title accent, hover ring) nhưng nền item chuyển neutral:
     - `itemBg`: trắng / slate rất nhạt (ổn định, sạch)
     - `badgeBg`: neutral elevated surface
     - `featuredCardBg`: neutral surface với depth nhẹ
   - Brand chỉ dùng ở:
     - `headingAccent`, `featuredBadgeBg`, `remaining*`, và border/hover subtle.
   - Reflection: giảm rủi ro “màu user xấu làm hỏng UI”, vẫn giữ nhận diện thương hiệu.

3. Áp dụng token mới cho Badge + Featured (shared)
   - `PartnersBadgeShared.tsx`: dùng token neutral cho nền item, giữ text/icon readable + border subtle.
   - `PartnersFeaturedShared.tsx`: nền card nổi bật và grid phụ chuyển neutral; badge NỔI BẬT giữ accent.
   - Không đổi logic layout/interaction để tránh side effects.
   - Reflection: KISS/YAGNI, chỉ chỉnh color mapping.

4. Đồng bộ preview/render
   - Vì cả preview/site dùng shared components, chỉnh tại shared để đồng bộ 1 lần.
   - Reflection: tránh drift lần sau.

5. Validate + commit
   - Chạy `bunx tsc --noEmit`.
   - Commit (không push): `refactor(partners): use neutral surfaces for badge and featured`

## Kết quả kỳ vọng
- Badge/Featured nhìn enterprise hơn, không bị phụ thuộc trực tiếp vào độ “đẹp/xấu” của màu user chọn.
- Vẫn có dấu ấn thương hiệu qua accent, nhưng nền item sạch và dễ đọc.
- Preview và render đồng nhất.