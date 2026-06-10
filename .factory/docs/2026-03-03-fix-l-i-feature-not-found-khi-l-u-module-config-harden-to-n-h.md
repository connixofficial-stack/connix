## Problem Graph
1. [Main] Lưu config ở `/system/modules/*` bị crash `Feature not found` <- depends on 1.1, 1.2
   1.1 [Sub] `useModuleConfig.handleSave` gửi `toggleModuleFeature` cho mọi feature thay đổi theo config UI
   1.2 [ROOT CAUSE] DB thiếu record `moduleFeatures` tương ứng `moduleKey + featureKey`, mutation `toggleModuleFeature` đang throw cứng khi `.unique()` trả null

## Execution (with reflection)
1. Solving 1.2 (root cause) — làm mutation tự-heal feature thiếu
   - Thought: Fix ở backend là đúng nhất để harden toàn hệ, không chỉ analytics.
   - Action:
     - Sửa `convex/admin/modules.ts` tại `toggleModuleFeature`:
       - Nếu tìm thấy feature: patch như hiện tại.
       - Nếu **không tìm thấy**: `insert` mới vào `moduleFeatures` với tối thiểu:
         - `moduleKey: args.moduleKey`
         - `featureKey: args.featureKey`
         - `enabled: args.enabled`
         - `name`: derive từ `featureKey` (vd `enableTraffic` -> `Traffic`) để tránh rỗng.
       - Sau đó tiếp tục logic linked field (chỉ khi có `linkedFieldKey` trên record thực tế).
     - Không đổi API signature để không ảnh hưởng client hiện tại.
   - Reflection: ✓ Hết lỗi runtime ngay cả khi seed thiếu/DB lệch, tác động nhỏ, backward-compatible.

2. Đồng bộ/an toàn linked field khi record vừa được auto-create
   - Thought: Record auto-create chưa chắc có `linkedFieldKey`, nên không ép update field để tránh patch sai.
   - Action:
     - Giữ guard `if (feature.linkedFieldKey)` như hiện tại; với feature mới tạo thì skip phần đồng bộ field trong lần lưu đầu.
     - Lần lưu sau (hoặc seed fix) vẫn hoạt động bình thường.
   - Reflection: ✓ KISS, không đoán mapping ở backend, tránh side effect ngoài ý muốn.

3. (Optional harden nhẹ ở client) hiển thị thông báo dễ hiểu khi backend phải auto-create
   - Thought: Không bắt buộc để fix bug; có thể giữ minimal thay đổi.
   - Action:
     - Không cần đổi client trong lượt fix này để giữ YAGNI.
   - Reflection: ✓ Scope gọn, tập trung sửa lỗi chính.

4. Verify trước commit
   - Action:
     - Chạy duy nhất: `bunx tsc --noEmit` (theo rule repo).
     - Manual check nhanh:
       - Vào `/system/modules/analytics`.
       - Toggle “Báo cáo lượt truy cập” và Save.
       - Kỳ vọng: không còn `Feature not found`, save thành công.
   - Reflection: ✓ Đúng quy ước dự án, verify trực tiếp đúng case bạn report.

5. Commit
   - Action:
     - `git status` + `git diff --cached` kiểm tra thay đổi và scan secrets.
     - Commit message đề xuất: `fix(modules): auto-create missing feature in toggle mutation to prevent crash`
     - Add kèm `.factory/docs` nếu có thay đổi theo rule repo.
   - Reflection: ✓ Đúng policy local commit, không push.

## File thay đổi dự kiến
- `E:\NextJS\persional_project\system-dien-tran\convex\admin\modules.ts`
  - Chỉ chỉnh mutation `toggleModuleFeature` để tự tạo feature thiếu thay vì throw.

## Kết quả kỳ vọng
- `/system/modules/analytics` save ổn khi bật “Báo cáo lượt truy cập”.
- Các trang `/system/modules/*` khác cũng không còn crash nếu DB thiếu feature record.
- Không thay đổi contract API phía client.