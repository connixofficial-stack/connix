# Spec: Fix Auto-save khi kéo task sang cột khác - Kanban (Lần 2 - ROOT CAUSE thực sự)

## Root Cause Analysis (DARE Framework)

### Problem Graph
```
1. [MAIN] Kéo task sang cột khác không có auto-save/toast
   1.1 handleDragEnd có gọi scheduleDragSave không?
       ✓ CÓ gọi tại dòng 749-755
   1.2 Điều kiện nào khiến không vào block move cross-column?
       1.2.1 [ROOT] sourceColumnId === destinationColumnId
             → Vào block reorder (dòng 723) thay vì block move (dòng 747)
   1.3 Tại sao sourceColumnId === destinationColumnId?
       1.3.1 [ROOT CAUSE] findColumnIdByTask() tìm task ở cột MỚI
       1.3.2 handleDragOver đã patch task.columnId = cột MỚI trong state (dòng 662)
       1.3.3 handleDragEnd priority sai: dùng findColumnIdByTask() TRƯỚC
```

### Analysis (với WebSearch + Git history)

**Commit trước `02dcead` đã thử đảo priority:**
```typescript
// OLD - commit 02dcead
const sourceColumnId = findColumnIdByTask(activeTaskId)
  ?? (active.data.current?.columnId as Id<'kanbanColumns'> | undefined);
```

**NHƯNG vẫn sai vì:**
- `findColumnIdByTask()` search trong `tasksByColumn` state hiện tại
- `handleDragOver` (dòng 662) đã patch `task.columnId = destinationColumnId` trong state local
- Kết quả: `findColumnIdByTask(activeTaskId)` **TÌM THẤY task ở cột MỚI**, không phải cột CŨ

**active.data.current.columnId giữ nguyên giá trị cũ vì:**
- `useSortable` data được set trong render: `data: { type: 'task', columnId: task.columnId }` (line ~1280)
- Data này **KHÔNG UPDATE** khi state `tasksByColumn` thay đổi trong `handleDragOver`
- Chỉ có state local update, React **KHÔNG re-render** component trong lúc drag

## Giải pháp

### ĐẢO NGƯỢC priority trong handleDragEnd

**Dòng 707-708** (hiện tại):
```typescript
const sourceColumnId = findColumnIdByTask(activeTaskId)
  ?? (active.data.current?.columnId as Id<'kanbanColumns'> | undefined);
```

**→ FIX thành:**
```typescript
const sourceColumnId = (active.data.current?.columnId as Id<'kanbanColumns'> | undefined)
  ?? findColumnIdByTask(activeTaskId);
```

**Why this works:**
1. ✅ `active.data.current.columnId` = cột CŨ (set lúc render, không đổi khi drag)
2. ✅ Fallback `findColumnIdByTask()` cho edge case không có data
3. ✅ `destinationColumnId` vẫn tìm đúng vì logic khác
4. ✅ `sourceColumnId !== destinationColumnId` → vào block move cross-column (dòng 747)

## Implementation Steps

### 1. Sửa `handleDragEnd` trong `app/admin/kanban/page.tsx`

**Location:** Dòng 707-708

**Change:**
```typescript
// BEFORE
const sourceColumnId = findColumnIdByTask(activeTaskId)
  ?? (active.data.current?.columnId as Id<'kanbanColumns'> | undefined);

// AFTER
const sourceColumnId = (active.data.current?.columnId as Id<'kanbanColumns'> | undefined)
  ?? findColumnIdByTask(activeTaskId);
```

### 2. Revert fix trước đó (nếu cần)

File đã bị sửa sai ở commit trước, KHÔNG cần revert vì logic còn lại vẫn đúng. Chỉ cần fix dòng 707-708.

### 3. Test scenarios

Sau khi fix, test:
1. ✅ **Kéo task từ cột A → cột B**
   - Có toast "Đang lưu..." → "Đã chuyển cột và lưu"
   - Reload trang → task vẫn ở cột B (confirm DB saved)

2. ✅ **Kéo task trong cùng cột (reorder)**
   - Có toast "Đang lưu..." → "Đã lưu thay đổi"
   - Reload trang → order đúng

3. ✅ **Kéo task vào cột đạt WIP limit**
   - Toast error "Cột đích đã đạt WIP limit"
   - Task không move

4. ✅ **Kéo nhiều task nhanh**
   - Debounce 500ms hoạt động
   - Toast hiện đúng sequence

5. ✅ **Kéo cột (column reorder)**
   - Vẫn hoạt động bình thường (không ảnh hưởng)

## Why Previous Fix Failed

**Commit `789a38f` (fix vừa rồi):**
- Đơn giản hóa logic dùng `currentSourceTasks` từ `tasksByColumn[sourceColumnId]`
- NHƯNG `sourceColumnId` ĐÃ SAI từ đầu (vì `findColumnIdByTask()` tìm sai)
- Kết quả: `sourceColumnId === destinationColumnId` → không vào block move

**Commit `02dcead` (trước đó):**
- Đảo priority ĐÚNG HƯỚNG nhưng **NGƯỢC**
- Dùng `findColumnIdByTask()` trước thay vì sau

## Technical Details

### useSortable data không update real-time
- `data: { type: 'task', columnId: task.columnId }` set trong JSX render
- Data này **static** cho cả lifecycle drag
- Chỉ có `tasksByColumn` state được update trong `handleDragOver`

### findColumnIdByTask() logic
```typescript
const findColumnIdByTask = (taskId: Id<'kanbanTasks'>) => 
  Object.entries(tasksByColumn).find(([, tasks]) =>
    tasks.some(task => task._id === taskId)
  )?.[0] as Id<'kanbanColumns'> | undefined;
```
→ Search trong state **HIỆN TẠI**, không phải state lúc drag bắt đầu

## Git Commit Message

```
fix(kanban): use original columnId from drag data for cross-column move
```

## Notes

- Không cần sửa `handleDragOver` - logic đó đúng
- Không cần sửa Convex backend
- Không cần sửa `useSortable` data structure
- Chỉ cần đảo 1 dòng code trong `handleDragEnd`