## Problem Analysis

Lỗi `Module not found` xảy ra trong mutation `toggleModuleWithCascade` khi `key` không tìm thấy record trong bảng `adminModules`. 

**Root cause**: Race condition - khi user mở cascade dialog (xác nhận tắt module + modules phụ thuộc), nếu DB bị clear/reset trong lúc dialog đang mở, mutation sẽ throw `Error("Module not found")` vì module không còn tồn tại.

## Fix Plan

### 1. File: `convex/admin/modules.ts` - `toggleModuleWithCascade` mutation (line ~183)

Thay vì `throw new Error("Module not found")`, return gracefully:

```ts
if (!moduleRecord) {
  return { disabledModules: [], success: false };
}
```

Tương tự, update return type để support `success: false`.

### 2. File: `app/system/modules/page.tsx` - `handleCascadeConfirm` (line ~580)

Xử lý trường hợp `success: false`:

```ts
const result = await toggleModuleWithCascade({...});
if (!result.success) {
  toast.error('Module không tồn tại hoặc đã bị xóa');
  return;
}
```

### Scope
- Chỉ sửa 2 files, không mở rộng tính năng
- Giữ nguyên logic cascade hiện tại
- Chỉ thêm graceful handling cho edge case module not found