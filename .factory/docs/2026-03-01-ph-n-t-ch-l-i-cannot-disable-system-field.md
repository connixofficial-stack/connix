Nguyên nhân lỗi bạn gặp là **backend chặn việc tắt field hệ thống**.

- Error phát sinh từ `convex/admin/modules.ts` trong mutation `updateModuleField`:
  - Nếu field có `isSystem = true` và request gửi `enabled = false` thì throw: `Cannot disable system field`.
- Tức là ở UI `/system/modules/...` bạn vừa toggle OFF một field được đánh dấu system (ví dụ các field lõi như `title`, `status`, `priority` tùy module).

## Kết luận nhanh
Đây là lỗi nghiệp vụ có chủ đích (guard), **không phải crash ngẫu nhiên**.

## Spec xử lý đề xuất (không code ngay)
1. Ở UI cấu hình field, với field `isSystem=true`:
   - Disable switch `enabled` (không cho bấm).
   - Hiển thị tooltip/label: “Trường hệ thống, không thể tắt”.
2. Khi submit payload update field:
   - Không gửi `enabled=false` cho field system.
3. Nếu backend vẫn trả lỗi (edge case):
   - Bắt lỗi và toast tiếng Việt rõ nghĩa.

Nếu bạn duyệt spec này, mình sẽ implement ngay để hết tình trạng bấm là lỗi console.