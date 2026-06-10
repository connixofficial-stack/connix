## Problem Graph
1. [Main] Layout Featured còn dư khoảng trắng, logo/icon chưa đủ nổi bật, hover không phù hợp mobile
   1.1 [ROOT CAUSE] Token spacing/padding hiện đang rộng cho style enterprise cũ
   1.2 [Sub] Kích thước logo trong featured/others đang thấp hơn kỳ vọng
   1.3 [Sub] Featured còn hover shadow/scale không cần thiết

## Execution (with reflection)
1. Chỉnh compact spacing cho Featured (giảm mạnh)
   - File: `app/admin/home-components/partners/_components/PartnersFeaturedShared.tsx`
   - Đổi cụ thể:
     - Section `py-12/py-10` -> `py-7` (desktop/mobile đồng bộ compact)
     - Container `space-y-8/space-y-6` -> `space-y-4`
     - Grid gap `gap-5` -> `gap-3`, grid phụ `gap-3` -> `gap-2`
     - Card padding featured `p-8` -> `p-5`
     - Card padding others `p-4` -> `p-2.5`
     - Trường hợp <=2 items: `py-10`, `gap-6`, `px-6 py-5` -> compact tương ứng (`py-7`, `gap-3`, `px-4 py-3`)
   - Reflection: ✓ giảm whitespace rõ rệt nhưng vẫn đọc tốt.

2. Tăng kích thước logo/icon mức vừa
   - File: `app/admin/home-components/partners/_components/PartnersFeaturedShared.tsx`
   - Đổi cụ thể:
     - Featured logo `max-h-28` -> `max-h-32`
     - Other logos `h-10` -> `h-12`
     - Placeholder icon featured `56` -> `64`
     - Placeholder icon others `30` -> `34`
   - Reflection: ✓ tăng độ nhận diện logo mà không phá bố cục compact.

3. Bỏ hover trong riêng Featured
   - File: `app/admin/home-components/partners/_components/PartnersFeaturedShared.tsx`
   - Gỡ toàn bộ class hover/transition chỉ trong Featured:
     - bỏ `hover:shadow-lg`, `hover:shadow-md`
     - bỏ `group-hover:scale-105`, `transition-*` liên quan
     - giữ trạng thái tĩnh, nhất quán mobile/desktop
   - Reflection: ✓ đúng yêu cầu, không đụng các style partners khác.

4. Đảm bảo đồng bộ preview và site render
   - Vì preview/site đang dùng chung `PartnersFeaturedShared`, chỉ cần chỉnh 1 file là đồng bộ 100%.
   - Reflection: ✓ không drift giữa 2 nơi.

5. Validation + commit
   - Chạy `bunx tsc --noEmit`.
   - Commit chỉ các file liên quan Featured, không đụng file ngoài phạm vi.
   - Commit message đề xuất: `refactor(partners): compact featured spacing and remove hover interactions`

## Phạm vi thay đổi
- Chỉ thay đổi style `featured` của Partners.
- Không đổi schema/config data, giữ tương thích 100%.
- Không ảnh hưởng marquee/badge/carousel/grid.