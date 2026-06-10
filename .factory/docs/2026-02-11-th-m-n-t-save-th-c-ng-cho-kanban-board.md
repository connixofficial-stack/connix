# Spec: Thêm nút Save cho /admin/kanban

## 📋 Tóm tắt
Thêm nút **"Lưu thay đổi"** ở header trang kanban để user có thể lưu thủ công ngay lập tức, bổ sung cho cơ chế auto-save hiện tại.

---

## 🎯 Logic hiện tại
1. **Auto-save kéo thả** (columns/tasks): debounce 500ms → `dragSaveStatus` (idle/saving/saved)
2. **Auto-save edit dialog**: debounce 800ms → `editSaveStatus` (idle/saving/saved)
3. Có timer `dragSaveTimerRef` và `editSaveTimerRef` quản lý debounce
4. Có ref `dragSaveActionRef` lưu pending action

---

## ✅ Giải pháp đề xuất

### 1. Thêm nút Save vào header (bên cạnh SaveStatus)
**Vị trí:** Dòng này (line ~734):
```tsx
<div className="flex items-center gap-2">
  <p className="text-sm text-slate-500">Theo dõi tiến độ công việc nội bộ.</p>
  <SaveStatus status={dragSaveStatus} />
  {/* 👉 THÊM NÚT Ở ĐÂY */}
</div>
```

### 2. Logic nút Save
- **Hiển thị khi:** `dragSaveStatus === 'saving'` HOẶC `editSaveStatus === 'saving'`
- **Disabled khi:** Đang submit (`isSubmitting`)
- **Khi click:**
  1. Clear cả 2 timers (`dragSaveTimerRef`, `editSaveTimerRef`)
  2. Execute ngay pending actions:
     - `dragSaveActionRef.current?.()` (nếu có)
     - `updateTask` cho edit dialog (nếu có changes)
  3. Set status → `saving` → `saved`
  4. Toast success

### 3. Code cụ thể
```tsx
// Thêm handler (sau line ~575, trước handleCreateBoard)
const handleManualSave = async () => {
  const hasDragChanges = dragSaveActionRef.current !== null;
  const hasEditChanges = editTask && (
    editTitle.trim() !== editTask.title.trim() ||
    (editDescription.trim() || '') !== (editTask.description?.trim() || '')
  );

  if (!hasDragChanges && !hasEditChanges) {
    toast.info('Không có thay đổi cần lưu');
    return;
  }

  setIsSubmitting(true);
  
  try {
    const promises: Promise<unknown>[] = [];

    // Clear timers
    if (dragSaveTimerRef.current) {
      clearTimeout(dragSaveTimerRef.current);
      dragSaveTimerRef.current = null;
    }
    if (editSaveTimerRef.current) {
      clearTimeout(editSaveTimerRef.current);
      editSaveTimerRef.current = null;
    }

    // Save drag changes
    if (hasDragChanges && dragSaveActionRef.current) {
      setDragSaveStatus('saving');
      promises.push(dragSaveActionRef.current());
      dragSaveActionRef.current = null;
    }

    // Save edit changes
    if (hasEditChanges && editTask) {
      setEditSaveStatus('saving');
      promises.push(
        updateTask({
          id: editTask._id,
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
        }).then(() => {
          setEditTask(prev => prev ? {
            ...prev,
            title: editTitle.trim(),
            description: editDescription.trim() || undefined,
          } : prev);
        })
      );
    }

    await Promise.all(promises);

    if (hasDragChanges) setDragSaveStatus('saved');
    if (hasEditChanges) setEditSaveStatus('saved');
    
    toast.success('Đã lưu tất cả thay đổi');
  } catch (error) {
    console.error(error);
    setDragSaveStatus('idle');
    setEditSaveStatus('idle');
    toast.error('Lưu thất bại');
  } finally {
    setIsSubmitting(false);
  }
};

// Thêm nút vào JSX (line ~738, sau SaveStatus)
<Button
  variant="outline"
  size="sm"
  onClick={handleManualSave}
  disabled={isSubmitting || (dragSaveStatus !== 'saving' && editSaveStatus !== 'saving')}
  className="gap-2"
>
  <CheckCircle2 size={14} />
  Lưu ngay
</Button>
```

---

## 📝 Chi tiết implement

### File: `app/admin/kanban/page.tsx`

#### Bước 1: Thêm handler `handleManualSave` (sau line ~575)
- Clear cả 2 timers
- Execute pending drag action nếu có
- Execute pending edit update nếu có changes
- Promise.all để save song song
- Toast + set status

#### Bước 2: Thêm nút vào JSX (line ~738)
- Đặt sau `<SaveStatus status={dragSaveStatus} />`
- Disabled khi: `isSubmitting` hoặc cả 2 status đều không phải `saving`
- Icon: `CheckCircle2`
- Text: "Lưu ngay"

---

## ✨ UX Flow
1. User kéo thả → thấy "Đang lưu..." → có thể click **"Lưu ngay"** để force save
2. User edit task → thấy "Đang lưu..." → có thể click **"Lưu ngay"** để save ngay không chờ
3. Nút disabled khi không có thay đổi hoặc đang submit

---

## 🧪 Test cases
- ✅ Kéo task → click "Lưu ngay" → check DB + toast
- ✅ Edit task → click "Lưu ngay" trong lúc gõ → check DB + toast
- ✅ Vừa kéo vừa edit → click "Lưu ngay" → check cả 2 save song song
- ✅ Nút disabled đúng lúc (idle, hoặc đang submit)
- ✅ Clear timers đúng → không duplicate save