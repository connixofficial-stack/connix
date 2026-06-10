
## Problem Graph
1. [Main] Auto-save Kanban <- depends on 1.1, 1.2
   1.1 [Debounce kéo thả] <- optimistic UI đã có, cần debounce mutation calls
   1.2 [Edit task dialog] <- chưa có UI edit task

---

## Thay đổi chi tiết

### 1. Debounce kéo thả (file: `app/admin/kanban/page.tsx`)

Hiện tại mỗi lần `handleDragEnd` gọi mutation ngay. Sẽ thêm debounce để batch:

- Tạo custom hook `useKanbanAutoSave()` hoặc dùng `useRef` + `setTimeout` ngay trong component:
  - Khi kéo thả xong, lưu pending changes vào ref (reorder/move)
  - Debounce 500ms trước khi gọi mutation thực sự
  - Nếu user kéo tiếp trong 500ms -> cancel timer cũ, ghi đè pending changes, reset timer
  - Hiển thị trạng thái "Đang lưu..." / "Đã lưu" nhỏ gọn ở góc (toast hoặc badge)
- Cụ thể cho `handleDragEnd`:
  - Thay vì `await reorderTasks(...)` / `await moveTask(...)` / `await reorderColumns(...)` trực tiếp, sẽ gọi qua debounced wrapper
  - Optimistic UI giữ nguyên (state update vẫn đồng bộ), chỉ mutation call bị debounce
  - Nếu mutation fail -> revert state bằng cách re-fetch từ `boardData` (Convex reactive query tự sync lại)

### 2. Edit task dialog (file: `app/admin/kanban/page.tsx`)

Thêm dialog edit task khi click vào task card:

- **State mới:**
  ```tsx
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  ```

- **KanbanTaskCard:** Thêm `onClick` trên card body (không phải trên nút delete/grip) -> `setEditTask(task)`

- **Dialog Edit Task:** Gồm 2 field: Title (Input) + Description (textarea)
  - Auto-save bằng debounce 800ms khi user ngừng gõ (dùng `useEffect` + `setTimeout`)
  - Gọi `updateTask` mutation (đã có sẵn trong `convex/kanban.ts`)
  - Hiển thị trạng thái: "Đang lưu..." / "Đã lưu" trong dialog
  - Không cần nút Save/Cancel - chỉ cần nút đóng (X)

- **Flow:**
  1. User click task card -> mở dialog với title + description hiện tại
  2. User sửa text -> debounce 800ms -> auto gọi `updateTask`
  3. Hiện icon/text "Đang lưu..." khi gọi mutation, "Đã lưu" khi xong
  4. User đóng dialog -> done

### 3. Save status indicator

- Thêm component `SaveStatus` nhỏ hiển thị 3 trạng thái: idle / saving / saved
- Dùng chung cho cả drag-drop debounce và edit dialog
- Vị trí: trong edit dialog (góc trên) + toast nhỏ khi drag-drop save xong

### Files thay đổi:
| File | Thay đổi |
|------|----------|
| `app/admin/kanban/page.tsx` | Thêm debounce wrapper cho drag mutations, thêm edit task dialog, thêm save status |

Không cần thay đổi backend (Convex) vì `updateTask` mutation đã có sẵn đầy đủ.
