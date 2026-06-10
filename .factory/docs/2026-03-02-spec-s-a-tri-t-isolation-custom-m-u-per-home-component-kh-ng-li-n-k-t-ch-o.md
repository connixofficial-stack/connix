## Problem Graph
1. [Main] Sửa triệt để hiểu sai: custom màu của mỗi home-component phải độc lập tuyệt đối, không ảnh hưởng nhau, và fallback về system setting khi tắt custom <- depends on 1.1, 1.2, 1.3, 1.4, 1.5
   1.1 [ROOT CAUSE] Đã dùng abstraction mơ hồ `useBrandColors(type?)` trong create flow, làm contract khó kiểm soát và dễ hiểu nhầm liên kết chéo
   1.2 `ComponentFormWrapper` đang gánh persist custom màu chung, khiến logic per-type bị ẩn và khó audit
   1.3 Thiếu guard cứng chống ghi sai key type ở Convex/UI path
   1.4 Cần chuẩn hoá lại create pages theo contract tường minh per-page (`useTypeColorOverrideState(COMPONENT_TYPE)`)
   1.5 Cần verify lại full matrix để đảm bảo Hero custom xanh-đỏ không dính Stats tím-lục

## Execution (with reflection)
1. Solving 1.1.1 — Bỏ abstraction gây mơ hồ, trả về contract rõ ràng
- Thought: Muốn tránh hiểu sai lần nữa thì flow phải explicit ở từng page.
- Action:
  - Revert phần `useBrandColors(type?)` trong `app/admin/home-components/create/shared.tsx` về bản system-only.
  - Giữ `useSystemBrandColors` hoặc `useBrandColors` chỉ làm nhiệm vụ đọc settings global, không nhận type.
- Reflection: ✓ Valid — loại bỏ điểm mập mờ gây hiểu sai kiến trúc.

2. Solving 1.2 — Di chuyển logic persist custom khỏi wrapper, trả về từng page
- Thought: Wrapper không nên quyết định persistence per-type vì mất tính tường minh.
- Action:
  - Revert `ComponentFormWrapper` để chỉ render form khung như cũ.
  - Bỏ custom card khỏi wrapper.
  - Mỗi create page tự xử lý đúng contract:
    - `const COMPONENT_TYPE = 'X'`
    - `useTypeColorOverrideState(COMPONENT_TYPE)`
    - submit: chỉ khi bấm “Tạo component” mới gọi `setTypeColorOverride`.
- Reflection: ✓ Valid — đúng yêu cầu “chỉ lưu khi bấm Tạo component” và independent per-page.

3. Solving 1.3 — Áp dụng contract tường minh cho toàn bộ create pages
- Thought: Để chắc chắn isolation, mỗi page phải có state riêng theo type riêng.
- Action:
  - Chuẩn hoá toàn bộ `app/admin/home-components/create/*/page.tsx` (và shared create file nếu dùng chung) theo template:
    - import `TypeColorOverrideCard`, `useTypeColorOverrideState`, `resolveSecondaryByMode`
    - local state chỉ cho đúng `COMPONENT_TYPE`
    - preview dùng `effectiveColors` của chính page đó
    - submit lưu override của đúng type, sau đó mới create
  - Với file dùng chung như `create/product-list/_shared.tsx`: map cứng `type` prop -> state tương ứng và payload tương ứng, không dùng fallback mơ hồ.
- Reflection: ✓ Valid — mỗi component có state độc lập, không thể “dây chuyền”.

4. Solving 1.4 — Thêm guard cứng chống liên kết chéo ở Convex + UI
- Thought: Cần chặn cả sai logic từ client lẫn sai data path.
- Action:
  - `convex/homeComponentSystemConfig.ts`:
    - Giữ/siết `SUPPORTED_CUSTOM_TYPES` theo `HOME_COMPONENT_TYPE_VALUES`.
    - Bổ sung guard từ chối write khi `type` không hợp lệ hoặc rỗng.
    - Khi bulk/update chỉ update đúng keys được chỉ định, không mutate keys khác.
  - UI guard:
    - Trước khi submit custom: assert `COMPONENT_TYPE` nằm trong `HOME_COMPONENT_TYPE_VALUES`.
    - Không cho path nào ghi override không có type rõ ràng.
- Reflection: ✓ Valid — có “hàng rào cứng” data-level chống cross-type pollution.

5. Solving 1.5 — Đồng bộ list/create/system route mapping theo source chung
- Thought: Drift route/type cũng gây lỗi áp sai type.
- Action:
  - Giữ và dùng `lib/home-components/componentTypes.ts` + `app/admin/home-components/_shared/lib/componentRoutes.ts` làm source duy nhất.
  - `app/admin/home-components/page.tsx` và `app/admin/home-components/[id]/edit/page.tsx` dùng helper route chung.
  - `app/system/home-components/page.tsx` giữ toast + actions per-row/bulk rõ ràng theo type.
- Reflection: ✓ Valid — route/type nhất quán giúp custom write/read đúng key.

## File-level changes chi tiết
1) `app/admin/home-components/create/shared.tsx`
- Revert các phần mới gây mơ hồ:
  - bỏ `useBrandColors(type?)`
  - bỏ custom-color persist trong `ComponentFormWrapper`
  - bỏ custom card ở wrapper
- Giữ wrapper đúng vai trò UI shell.

2) `app/admin/home-components/create/*/page.tsx`
- Với mỗi page create:
  - thêm `COMPONENT_TYPE` constant
  - thêm `useTypeColorOverrideState(COMPONENT_TYPE)`
  - thêm `setTypeColorOverride` trong submit
  - preview đọc `effectiveColors`
  - chỉ persist custom khi bấm submit

3) `app/admin/home-components/create/product-list/_shared.tsx`
- Chuẩn hoá explicit theo `type` prop (ProductList/ServiceList/Blog)
- Persist custom đúng type tại submit.

4) `convex/homeComponentSystemConfig.ts`
- Siết guard cứng validate type trước write.
- Đảm bảo update không đụng keys không liên quan.

5) `app/admin/home-components/page.tsx`
- Giữ source type/route chung, không hardcode list riêng.

6) `app/admin/home-components/[id]/edit/page.tsx`
- Giữ redirect theo helper route source chung.

7) `app/system/home-components/page.tsx`
- Giữ per-row/bulk hành vi theo type, toast đầy đủ, không side-effect chéo type.

## Verification Matrix (logic + mapping, không chạy browser)
1) Mỗi create page phải có:
- `useTypeColorOverrideState(COMPONENT_TYPE)`
- `setTypeColorOverride({ type: COMPONENT_TYPE, ... })` trong submit
- preview props lấy từ `effectiveColors`

2) Cross-type isolation checks:
- Không có code path nào đọc custom state type A để render type B.
- Không có mutation call thiếu `type` hoặc dùng type động không validate.

3) Fallback checks:
- Khi `enabled=false` => `resolveTypeOverrideColors` trả về system setting.
- single mode => `secondary=primary`.

4) Route/type mapping checks:
- `/system/home-components`, `/admin/home-components`, `/admin/home-components/create` cùng nguồn type.
- edit redirect dùng helper chung.

## Done Criteria
- Hero custom xanh-đỏ không ảnh hưởng Stats custom tím-lục (và ngược lại).
- Tắt custom ở bất kỳ type nào thì type đó fallback về system colors.
- Create flow chỉ persist custom khi bấm “Tạo component”.
- Không còn abstraction gây hiểu nhầm liên kết chéo.
- Type guard cứng ở Convex + UI đã bật.

## Commit plan
- Commit 1: revert abstraction mơ hồ + khôi phục contract wrapper.
- Commit 2: rollout explicit per-page create contract + shared create file.
- Commit 3: add guard cứng Convex/UI + verify matrix + finalize.