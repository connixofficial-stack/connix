
## Problem Graph
1. [Main] Kéo thả Kanban không mượt
   1.1 [Không có DragOverlay] <- item gốc bị transform tại chỗ, không có "bóng" bay theo chuột
   1.2 [Thiếu onDragOver] <- khi kéo task qua cột khác, task chưa di chuyển real-time (chỉ move khi thả)
   1.3 [Thiếu TouchSensor] <- trên mobile/tablet không hỗ trợ touch
   1.4 [closestCenter không tối ưu] <- collision detection không phù hợp cho kanban multi-column

## Giải pháp

### Bước 1: Thêm DragOverlay + activeItem state
- Thêm `onDragStart` handler để lưu `activeTask` / `activeColumn` đang kéo
- Render `<DragOverlay>` bên ngoài grid, hiển thị bản sao (clone) của task/column đang kéo
- Item gốc chỉ hiện placeholder (opacity thấp hoặc border dashed)

### Bước 2: Thêm onDragOver handler
- Khi kéo task qua cột khác, di chuyển task sang cột mới **ngay lập tức** (optimistic UI) thay vì đợi thả
- `onDragEnd` chỉ gọi API persist, `onDragOver` xử lý visual movement real-time
- Tránh gọi setState quá nhiều bằng cách check nếu task đã ở đúng cột thì skip

### Bước 3: Cải thiện sensors + collision detection
- Thêm `TouchSensor` (import từ `@dnd-kit/core`) cho mobile support
- Đổi `closestCenter` thành `closestCorners` - phù hợp hơn cho kanban board layout
- Thêm `activationConstraint: { delay: 200, tolerance: 5 }` cho TouchSensor để phân biệt scroll vs drag

### Bước 4: Cải thiện visual feedback
- Task đang kéo: `opacity-30` + `border-dashed` (placeholder)
- DragOverlay: `shadow-lg` + `rotate-[3deg]` + `scale-105` để thấy rõ đang kéo
- Transition mượt hơn với `dropAnimation` config cho DragOverlay

### Files thay đổi
- `app/admin/kanban/page.tsx` - toàn bộ thay đổi nằm trong 1 file này

### Tóm tắt thay đổi chính trong code:
```tsx
// 1. Import thêm
import { DragOverlay, TouchSensor, closestCorners, type DragStartEvent, type DragOverEvent } from '@dnd-kit/core';

// 2. State mới
const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);

// 3. Sensors cải tiến
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

// 4. DragOverlay ở cuối DndContext
<DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
  {activeTask && <TaskOverlayCard task={activeTask} ... />}
  {activeColumn && <ColumnOverlayCard column={activeColumn} ... />}
</DragOverlay>
```
