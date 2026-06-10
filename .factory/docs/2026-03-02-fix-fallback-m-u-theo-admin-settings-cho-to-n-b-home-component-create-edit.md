## Problem Graph
1. [Main] Khi tắt Custom ở create/edit (ví dụ Stats), màu phải fallback đúng về màu trong `/admin/settings`, không lấy giá trị “lưu cũ” của override <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] `getTypeOverrideState` đang lấy `primary/secondary/mode` từ override kể cả khi `enabled=false`, làm state/card hiển thị lệch kỳ vọng fallback theo settings.
   1.2 `showCustomBlock` đang phụ thuộc `overrides?.[type]?.enabled`, khiến card/toggle theo trạng thái enabled thay vì theo khả năng component hỗ trợ custom, gây UX khó hiểu khi OFF.
   1.3 Nhiều trang create/edit dùng chung hook hiện tại nên bug lặp lại toàn bộ type.

## Mục tiêu chốt theo yêu cầu user
- Mỗi `home-component type` custom độc lập hoàn toàn (Hero không dính Stats).
- `Custom ON` => render theo custom của đúng type đó.
- `Custom OFF` => cả preview + card state fallback theo `/admin/settings`.
- Khi lưu OFF: vẫn giữ record override nhưng đồng bộ `primary/secondary/mode` theo system colors.

## Execution Plan
1. Chuẩn hoá resolver ở `_shared/lib/typeColorOverride.ts`
- Sửa `getTypeOverrideState`:
  - Nếu `override.enabled !== true` thì trả state dựa trên `systemColors` (enabled=false, mode/system primary/system secondary theo mode).
  - Chỉ dùng `override.primary/secondary/mode` khi `enabled=true`.
- Giữ `resolveTypeOverrideColors` logic ON/OFF nhất quán với trên.
- Kết quả: OFF luôn đọc màu từ settings, không “dính” màu custom cũ.

2. Chuẩn hoá hook ở `_shared/hooks/useTypeColorOverride.ts`
- `showCustomBlock` đổi từ `Boolean(overrides?.[type]?.enabled)` thành check theo khả năng hỗ trợ type (dùng source chuẩn `HOME_COMPONENT_TYPE_VALUES` hoặc helper `isSupportedType`).
- Trong `useTypeColorOverrideState`:
  - Khi `customState.enabled=false`, ép `customState.mode/primary/secondary` bám theo `systemColors` để card và preview cùng fallback.
  - Tránh loop bằng compare state trước khi set (giữ guard hiện có).

3. Chuẩn hoá persist OFF ở create wrapper `create/shared.tsx`
- Trong `ComponentFormWrapper` khi submit:
  - Nếu `customState.enabled=false`, gửi `setTypeColorOverride` với `mode/primary/secondary` lấy từ `systemColors` (không gửi màu custom cũ).
  - Nếu enabled=true, gửi màu custom như hiện tại.
- Vẫn giữ guard type hợp lệ đã thêm.

4. Chuẩn hoá persist OFF ở toàn bộ edit pages
- Vì edit pages đang gọi `setTypeColorOverride` thủ công theo `customState`, cần đổi cùng contract:
  - OFF => ghi system colors.
  - ON => ghi custom colors.
- Áp dụng toàn bộ `app/admin/home-components/**/[id]/edit/page.tsx` đang dùng `useTypeColorOverrideState`.

5. Đồng bộ create pages (bao gồm các file vừa bị thay đổi ngoài)
- Kiểm tra và đồng bộ lại các create pages:
  - `create/stats/page.tsx`
  - `create/clients/page.tsx`
  - `create/product-grid/page.tsx`
  - `create/services/page.tsx`
  - `create/speed-dial/page.tsx`
  - và các create pages còn lại dùng `useBrandColors('Type')`.
- Đảm bảo tất cả ăn cùng contract từ hook/wrapper, không có logic rẽ nhánh cục bộ gây lệch.

6. Verification matrix (không cần browser automation)
- Với mỗi type tiêu biểu (Hero, Stats, CTA):
  - ON: preview dùng custom của đúng type.
  - OFF: preview + card values về system colors.
  - Tắt custom ở A không ảnh hưởng B.
- Grep check:
  - Không còn chỗ nào lấy override primary/secondary khi `enabled=false`.
  - Mọi mutation OFF đều ghi system colors.

7. Validate & commit
- Chạy `bunx --no-install tsc --noEmit`.
- Commit kèm `.factory/docs` theo rule repo.

## Files chính dự kiến sửa
- `app/admin/home-components/_shared/lib/typeColorOverride.ts`
- `app/admin/home-components/_shared/hooks/useTypeColorOverride.ts`
- `app/admin/home-components/create/shared.tsx`
- `app/admin/home-components/**/[id]/edit/page.tsx` (nhóm file dùng `useTypeColorOverrideState`)
- `app/admin/home-components/create/*/page.tsx` (để xác nhận contract đồng bộ)

## Done criteria
- Ở `/admin/home-components/create/stats`: tắt custom thì màu hiển thị lập tức fallback về `/admin/settings`.
- ON/OFF đúng semantics như user chốt.
- Isolation per-type giữ nguyên, không liên kết chéo.
- Typecheck pass.