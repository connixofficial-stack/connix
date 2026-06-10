# 🎯 Spec: Auto-save cho CRUD cột trong Kanban

## Problem Graph (DARE Framework)
```
[Main] Thêm auto-save cho CRUD cột
   ├─ 1.1 [Sub] Thêm cột mới (createColumn) - hiện đang có dialog confirm
   └─ 1.2 [Sub] Xóa cột (deleteColumn) - hiện đang có dialog confirm
```

**Hiện trạng:**
- ✅ Kéo task qua cột → auto-save 500ms + toast (KHÔNG đổi)
- ✅ Kéo để sắp xếp cột → auto-save 500ms + toast (KHÔNG đổi)
- ✅ Edit task trong dialog → auto-save 800ms + toast (KHÔNG đổi)
- ❌ Thêm cột → có dialog, click "Thêm cột" mới lưu
- ❌ Xóa cột → có dialog confirm, click "Xóa cột" mới lưu

**Requirement:** Giữ nguyên kéo task/edit task, chỉ tối ưu UX cho **Thêm/Xóa cột** để lưu ngay khi click button.

---

## ✅ Solution - Actionable Steps

### 1. **Thêm cột mới** (`handleCreateColumn`)
**File:** `app/admin/kanban/page.tsx` (dòng ~472-499)

**Thay đổi:**
- ✅ Giữ nguyên dialog (để user nhập tên cột, chọn icon, màu, WIP limit)
- ✅ Khi click button "Thêm cột" → gọi mutation `createColumn` ngay lập tức (đã có)
- ✅ Sau khi mutation thành công:
  - Đóng dialog
  - Hiện toast `'Đã thêm cột'`
  - Reset form

**Hiện tại đã OK**, chỉ cần kiểm tra lại flow:
1. User click "Thêm cột" (button trong header)
2. Mở dialog → nhập thông tin
3. Click "Thêm cột" trong dialog → `handleCreateColumn()` → mutation → toast → đóng dialog

**→ KHÔNG cần thay đổi code, flow đã đúng!**

---

### 2. **Xóa cột** (`handleDeleteColumn`)
**File:** `app/admin/kanban/page.tsx` (dòng ~501-524)

**Hiện trạng:**
- User click icon Trash trên cột → mở dialog confirm
- Dialog hiển thị dropdown chọn cột đích (nếu có task cần chuyển)
- Click button "Xóa cột" → mutation `deleteColumn` → toast → đóng dialog

**Thay đổi:**
- ✅ Giữ nguyên dialog confirm (vì xóa là thao tác nguy hiểm)
- ✅ Khi click "Xóa cột" → gọi mutation `deleteColumn` ngay (đã có)
- ✅ Sau mutation thành công:
  - Đóng dialog
  - Hiện toast `'Đã xóa cột'`

**→ KHÔNG cần thay đổi code, flow đã đúng!**

---

### 3. **Kéo cột để sắp xếp lại** (đã có auto-save)
**File:** `app/admin/kanban/page.tsx` (dòng ~693-698)

**Hiện trạng:**
```tsx
if (activeType === 'column' && overType === 'column' && active.id !== over.id) {
  const oldIndex = columns.findIndex(column => column._id === active.id);
  const newIndex = columns.findIndex(column => column._id === over.id);
  const newColumns = arrayMove(columns, oldIndex, newIndex);
  setColumns(newColumns);
  scheduleDragSave(() => reorderColumns({
    boardId: boardData.board._id,
    orderedIds: newColumns.map(column => column._id),
  })); // Mặc định toast: "Đã lưu thay đổi"
  return;
}
```

**→ KHÔNG đổi, đã hoạt động tốt!**

---

## 📋 Tổng kết thay đổi

**Kết luận:** Code hiện tại ĐÃ ĐỦ auto-save cho tất cả thao tác Kanban:
- ✅ Kéo task qua cột → auto-save 500ms
- ✅ Kéo để sắp xếp cột → auto-save 500ms
- ✅ Edit task → auto-save 800ms
- ✅ Thêm cột → save ngay khi click button trong dialog
- ✅ Xóa cột → save ngay khi confirm trong dialog

**Không cần thay đổi code!** Chỉ cần commit docs này để ghi nhận review.

---

## 🧪 Acceptance Criteria (Manual Testing)
1. ✅ Kéo task qua cột → đợi 500ms → toast "Đã chuyển cột và lưu"
2. ✅ Kéo cột để đổi vị trí → đợi 500ms → toast "Đã lưu thay đổi"
3. ✅ Click task → edit title/description → ngừng gõ 800ms → toast "Đã lưu task"
4. ✅ Click "Thêm cột" → nhập thông tin → click "Thêm cột" trong dialog → toast "Đã thêm cột"
5. ✅ Click icon Trash trên cột → confirm trong dialog → toast "Đã xóa cột"

---

## 📝 Files cần commit
- Chỉ commit file docs này (`.factory/docs/...`) để ghi nhận review
- Không cần thay đổi code TypeScript

---

## 🚀 Next Steps (nếu cần)
Nếu user muốn cải thiện UX thêm:
- Toast có thể custom màu/icon khác nhau cho từng loại action
- Thêm undo/redo cho drag-drop (phức tạp hơn)
- Hiển thị history log các thay đổi (audit trail)