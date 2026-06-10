# Spec: Fix Auto-save khi kéo task sang cột khác trong Kanban

## Root Cause
Sau khi phân tích bằng DARE framework và websearch, tìm thấy bug:

**handleDragEnd logic có vấn đề:**
- Dòng 831-856: Logic phức tạp với check `!destinationHasActive` để quyết định có splice task hay không
- Vấn đề: State `tasksByColumn` đã được đồng bộ ĐÚNG trong `handleDragOver`, nhưng `handleDragEnd` lại tính lại và có thể tạo data SAI
- Dòng 858-864: Gọi `scheduleDragSave(() => moveTask(...))` với `nextSourceTasks` và `nextDestinationTasks` được tính từ logic phức tạp trên
- Kết quả: Mutation `moveTask` có thể nhận data không khớp với state thực tế → SILENT FAIL hoặc update SAI

**Git commit trước chưa đủ:**
- Commit `02dcead` chỉ fix priority check `sourceColumnId` nhưng không fix logic splice và update

## Giải pháp

### Đơn giản hóa logic `handleDragEnd` (KISS principle)

Thay vì re-calculate `nextSourceTasks` và `nextDestinationTasks`, **dùng trực tiếp state `tasksByColumn` hiện tại** (đã sync đúng trong `handleDragOver`):

```typescript
// BEFORE (dòng 831-864) - Logic phức tạp với re-calculate
const destinationHasActive = destinationTasks.some(task => task._id === activeTaskId);
let nextSourceTasks = sourceTasks;
let nextDestinationTasks = destinationTasks;

if (!destinationHasActive) {
  // ... splice logic ...
  nextSourceTasks = sourceTasks;
  nextDestinationTasks = [...destinationTasks];
  nextDestinationTasks.splice(insertIndex, 0, { ...movedTask, columnId: destinationColumnId });
  
  setTasksByColumn(prev => ({
    ...prev,
    [sourceColumnId]: nextSourceTasks,
    [destinationColumnId]: nextDestinationTasks,
  }));
}

scheduleDragSave(() => moveTask({
  destinationOrderIds: nextDestinationTasks.map(task => task._id),
  fromColumnId: sourceColumnId,
  sourceOrderIds: nextSourceTasks.map(task => task._id),
  taskId: activeTaskId,
  toColumnId: destinationColumnId,
}), 'Đã chuyển cột và lưu');

// AFTER - Đơn giản, dùng state hiện tại
// State đã được sync đúng trong handleDragOver
const currentSourceTasks = tasksByColumn[sourceColumnId] ?? [];
const currentDestinationTasks = tasksByColumn[destinationColumnId] ?? [];

scheduleDragSave(() => moveTask({
  destinationOrderIds: currentDestinationTasks.map(task => task._id),
  fromColumnId: sourceColumnId,
  sourceOrderIds: currentSourceTasks.map(task => task._id),
  taskId: activeTaskId,
  toColumnId: destinationColumnId,
}), 'Đã chuyển cột và lưu');
```

## Implementation Steps

### 1. Sửa `handleDragEnd` trong `app/admin/kanban/page.tsx`

**Location:** Dòng 828-864 (block xử lý move task sang cột khác)

**Changes:**
1. **Xóa logic re-calculate** `!destinationHasActive` check và splice (dòng 831-856)
2. **Đơn giản hóa:** Dùng `tasksByColumn[sourceColumnId]` và `tasksByColumn[destinationColumnId]` trực tiếp
3. **Giữ nguyên:** `isWipLimitReached` check và toast error (dòng 828-830)
4. **Giữ nguyên:** `scheduleDragSave` call với `moveTask` mutation

**Code cụ thể:**

```typescript
// Dòng 828-864: REPLACE toàn bộ block này
if (isWipLimitReached(destinationColumnId, 1)) {
  toast.error('Cột đích đã đạt WIP limit');
  return;
}

// State đã được đồng bộ chính xác trong handleDragOver
// Không cần re-calculate, dùng trực tiếp state hiện tại
const currentSourceTasks = tasksByColumn[sourceColumnId] ?? [];
const currentDestinationTasks = tasksByColumn[destinationColumnId] ?? [];

scheduleDragSave(() => moveTask({
  destinationOrderIds: currentDestinationTasks.map(task => task._id),
  fromColumnId: sourceColumnId,
  sourceOrderIds: currentSourceTasks.map(task => task._id),
  taskId: activeTaskId,
  toColumnId: destinationColumnId,
}), 'Đã chuyển cột và lưu');
```

### 2. Cleanup code không dùng

- Xóa các variable không dùng: `destinationHasActive`, `nextSourceTasks`, `nextDestinationTasks`, `movedTask`, `insertIndex`
- Xóa logic splice (dòng 833-856)

### 3. Test scenarios

Sau khi fix, test các case:
1. ✅ Kéo task từ cột A → cột B → có toast "Đã chuyển cột và lưu"
2. ✅ Reload trang → task vẫn ở cột B (confirm DB đã lưu)
3. ✅ Kéo task vào cột đã đạt WIP limit → toast error, task không move
4. ✅ Kéo task trong cùng cột (reorder) → vẫn hoạt động bình thường
5. ✅ Kéo nhiều task liên tiếp nhanh → debounce 500ms, queue đúng thứ tự

## Why this works

1. **KISS principle:** Logic đơn giản hơn, ít bug hơn
2. **State sync đúng:** `handleDragOver` đã update `tasksByColumn` chính xác real-time
3. **Avoid re-calculate:** Không cần tính lại state, tránh data mismatch
4. **Convex mutation nhận data đúng:** `moveTask` nhận đúng `orderedIds` từ state hiện tại

## Notes

- **Không cần sửa Convex backend** (`convex/kanban.ts`) - mutation `moveTask` đã đúng
- **Không cần sửa `handleDragOver`** - logic sync state đã OK
- **Git commit message:** `fix(kanban): simplify handleDragEnd to use current state for move task mutation`
