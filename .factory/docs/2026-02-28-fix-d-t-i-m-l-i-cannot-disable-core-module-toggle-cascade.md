## Problem Graph
1. [Main] Vẫn còn Console Error `Cannot disable core module` khi thao tác module <- depends on 1.1, 1.2
   1.1 [ROOT CAUSE] `convex/admin/modules.ts` còn `throw new Error("Cannot disable core module")` trong mutation `toggleModule` (non-cascade).
   1.2 [Flow inconsistency] `toggleModuleWithCascade` đã trả `result code`, nhưng `toggleModule` vẫn throw => hệ thống chưa đồng bộ contract xử lý lỗi nghiệp vụ.

## Execution (with reflection)
1. Chuẩn hoá `toggleModule` theo cùng contract với `toggleModuleWithCascade`
   - File: `convex/admin/modules.ts`
   - Đổi `toggleModule` từ `returns: v.null()` sang `returns` object:
     - `success: boolean`
     - `code: 'OK' | 'MODULE_NOT_FOUND' | 'CORE_LOCKED' | 'DEPENDENCY_MISSING'`
     - `message?: string`
   - Logic:
     - Module không tồn tại => `MODULE_NOT_FOUND` (không throw)
     - Disable core (trừ roles) => `CORE_LOCKED`
     - Thiếu dependency khi enable => `DEPENDENCY_MISSING`
     - Thành công => `OK`
   - Reflection: loại bỏ nguồn throw business-error còn sót, nhất quán backend contract.

2. Đồng bộ helper/result type để tránh lặp code
   - File: `convex/admin/modules.ts`
   - Tái sử dụng pattern typed result đang có (KISS/DRY): thêm helper tạo `toggle` result cho mutation thường, hoặc mở rộng helper hiện tại để dùng chung.
   - Reflection: tránh hai chuẩn khác nhau giữa toggle thường và cascade.

3. Rà soát caller hiện tại và future-proof
   - Theo grep hiện tại chưa thấy caller frontend dùng `api.admin.modules.toggleModule`, nhưng vẫn chuẩn hoá để ngăn lỗi từ luồng tương lai hoặc tool nội bộ.
   - Nếu có caller tiềm ẩn trong generated hooks/legacy, contract mới vẫn an toàn vì đã typed rõ.

4. Verify bắt buộc
   - Chạy: `bunx tsc --noEmit`
   - Mục tiêu verify:
     - Không còn throw business-error trong toggle core path.
     - Type an toàn cho both `toggleModule` và `toggleModuleWithCascade`.

5. Commit theo convention repo
   - Stage các file code + `.factory/docs`.
   - Review `git diff --cached` + `git status` trước commit.
   - Commit message ngắn theo style hiện tại.

## Vì sao lỗi vẫn xuất hiện dù đã fix trước đó
- Bản fix trước đã xử lý tốt ở `toggleModuleWithCascade`, nhưng file vẫn còn guard throw ở `toggleModule` line ~207.
- Nếu runtime/luồng nào gọi mutation thường (hoặc code cũ/chưa deploy đồng bộ), lỗi đỏ vẫn xuất hiện đúng message cũ.

## Checklist
- [ ] `toggleModule` không còn throw cho lỗi nghiệp vụ core/dependency.
- [ ] `toggleModuleWithCascade` giữ contract result code như hiện tại.
- [ ] `bunx tsc --noEmit` pass.
- [ ] Commit đầy đủ kèm `.factory/docs`.