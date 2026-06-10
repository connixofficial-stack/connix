## 🎯 Mục tiêu
Cải thiện UX trang Kanban bằng cách loại bỏ nút "Lưu ngay", giữ lại auto-save và hiển thị toast thông báo rõ ràng sau mỗi lần lưu thành công.

---

## 📋 Problem Analysis (DARE)

### Decompose
1. **[Main]** Không thấy feedback lưu tại `/admin/kanban`
   - 1.1 **[Sub]** Nút "Lưu ngay" chỉ hiện khi có pending save
   - 1.2 **[Sub]** Toast thông báo bị tắt (không gọi trong flow auto-save)
   - **1.3 [ROOT CAUSE]** Logic `scheduleDragSave()` có tham số `successMessage` nhưng đang gọi `toast.success()` sau 500ms debounce → user không thấy ngay lập tức

### Analyze
- **Current state**: Nút "Lưu ngay" chỉ hiện khi `hasPendingSave` = true (dòng 746-754)
- **Issue**: User không nhận biết được hệ thống đang tự lưu
- **Expected behavior**: Auto-save + toast rõ ràng sau mỗi thao tác

---

## ✅ Solution

### Thay đổi code tại `app/admin/kanban/page.tsx`:

#### **Bước 1**: Bỏ nút "Lưu ngay" + logic liên quan
- Xóa dòng 746-754 (button "Lưu ngay" trong header)
- Xóa hàm `handleManualSave()` (dòng 370-438)
- Giữ lại `SaveStatus` component (hiển thị "Đang lưu..." / "Đã lưu")

#### **Bước 2**: Đảm bảo toast hiện sau mỗi lần auto-save
- **Drag-drop save**: Giữ nguyên logic `scheduleDragSave()` (đã có `toast.success(successMessage)` sau 500ms)
- **Edit task save**: Trong `useEffect` (dòng 243-279), thêm `toast.success('Đã lưu task')` sau khi `updateTask` thành công

#### **Bước 3**: Kiểm tra và test
- Kéo task → đợi 500ms → toast "Đã lưu thay đổi" / "Đã chuyển cột và lưu"
- Edit task title/description → ngừng gõ 800ms → toast "Đã lưu task"
- Lỗi → toast "Tự lưu thất bại"

---

## 📁 Files thay đổi

| File | Thay đổi |
|------|----------|
| `app/admin/kanban/page.tsx` | - Xóa button "Lưu ngay" (dòng 746-754)<br>- Xóa hàm `handleManualSave()` (dòng 370-438)<br>- Thêm `toast.success('Đã lưu task')` vào edit task auto-save (dòng ~265) |

---

## 🧪 Acceptance Criteria
- ✅ Không còn nút "Lưu ngay" trong header
- ✅ Kéo task/column → đợi 500ms → toast "Đã lưu thay đổi"
- ✅ Edit task → ngừng gõ 800ms → toast "Đã lưu task"
- ✅ SaveStatus component vẫn hiển thị "Đang lưu..." / "Đã lưu"
- ✅ Toast hiện rõ ràng, dễ nhận biết

---

## 🔄 Implementation Steps
1. Xóa nút "Lưu ngay" và logic `handleManualSave()`
2. Thêm toast vào edit task auto-save
3. Test thủ công: kéo task, edit task → check toast
4. Run `bunx oxlint --type-aware --type-check --fix`
5. Commit với message: `feat(kanban): remove manual save button, show toast after auto-save`