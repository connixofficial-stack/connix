
## Problem Graph (DARE)

```
1. [Main] Tạo module Kanban cho admin
   1.1 [Backend] Schema + Queries/Mutations cho Convex
      1.1.1 [ROOT] Thiết kế DB schema (kanbanBoards, kanbanColumns, kanbanTasks)
      1.1.2 Convex queries/mutations CRUD
   1.2 [System Config] Đăng ký module kanban vào hệ thống
      1.2.1 System module config page (/system/modules/kanban)
      1.2.2 Seed data cho adminModules
      1.2.3 Module definition config
   1.3 [Admin UI] Trang Kanban cho admin (/admin/kanban)
      1.3.1 Kanban Board page (drag-drop UI học từ zenith-kanban)
      1.3.2 Sidebar integration
      1.3.3 Permission config
```

---

## Chi tiết Implementation

### 1. Database Schema (`convex/schema.ts`)

**3 tables mới:**

```ts
// kanbanBoards - Quản lý nhiều board
kanbanBoards: defineTable({
  name: v.string(),           // "Sprint 1", "Marketing Q1"
  description: v.optional(v.string()),
  createdBy: v.id("users"),
  order: v.number(),
})
  .index("by_order", ["order"]),

// kanbanColumns - Cột trong board
kanbanColumns: defineTable({
  boardId: v.id("kanbanBoards"),
  title: v.string(),          // "Chưa làm", "Đang làm", "Review", "Xong"
  icon: v.string(),           // lucide icon name
  color: v.optional(v.string()),  // "slate" | "blue" | "amber" | "emerald"
  order: v.number(),
  wipLimit: v.optional(v.number()), // WIP limit (best practice)
})
  .index("by_board_order", ["boardId", "order"]),

// kanbanTasks - Task cards
kanbanTasks: defineTable({
  boardId: v.id("kanbanBoards"),
  columnId: v.id("kanbanColumns"),
  title: v.string(),
  description: v.optional(v.string()),
  priority: v.union(v.literal("LOW"), v.literal("MEDIUM"), v.literal("HIGH")),
  assigneeId: v.optional(v.id("users")),
  dueDate: v.optional(v.number()),
  order: v.number(),          // thứ tự trong cột
  createdBy: v.id("users"),
})
  .index("by_board", ["boardId"])
  .index("by_column_order", ["columnId", "order"])
  .index("by_assignee", ["assigneeId"]),
```

### 2. Convex Backend (`convex/kanban.ts`)

**Queries:**
- `listBoards` - Lấy tất cả boards
- `getBoard` - Lấy 1 board + columns + tasks (batch load)
- `listTasksByColumn` - Tasks theo column

**Mutations:**
- `createBoard` - Tạo board + 3 default columns (Chưa làm, Đang làm, Xong)
- `updateBoard` / `deleteBoard`
- `createColumn` / `updateColumn` / `deleteColumn` - Thêm/sửa/xóa cột
- `reorderColumns` - Sắp xếp lại cột
- `createTask` / `updateTask` / `deleteTask`
- `moveTask` - Chuyển task sang cột khác (cập nhật columnId + order)
- `reorderTasks` - Sắp xếp tasks trong 1 cột

### 3. System Module Registration

**a. `convex/seeders/adminModules.seeder.ts`** - Thêm entry:
```ts
{ category: 'system', description: 'Bảng Kanban quản lý công việc', 
  enabled: true, icon: 'LayoutGrid', isCore: false, key: 'kanban', 
  name: 'Kanban Board', order: 18 },
```

**b. `lib/modules/configs/kanban.config.ts`** - Module definition mới

**c. `lib/modules/configs/index.ts`** - Export kanbanModule

**d. `app/system/modules/kanban/page.tsx`** - System config page (dùng `ModuleConfigPage`)

**e. `lib/modules/seed-registry.ts`** - Thêm metadata

**f. `app/system/modules/page.tsx`** - Thêm route vào `moduleConfigRoutes`

### 4. Admin UI (`app/admin/kanban/page.tsx`)

**Giao diện học từ zenith-kanban:**
- Toolbar compact: search + board selector dropdown + nút "Thêm task"
- Grid 4 cột responsive (1 col mobile, 2 col md, 4 col lg)
- Mỗi cột: header với icon + title + task count badge + nút "+" thêm task + nút "..." (edit/delete column)
- TaskCard: priority badge (Cao/Vừa/Thấp), title, description snippet, assignee avatar, due date
- Drag & Drop bằng **@dnd-kit** (đã cài sẵn trong dự án) thay vì HTML5 drag API
- Dialog tạo/sửa task: fields title, description, status (dropdown chọn column), priority (3 toggle buttons), assignee (dropdown users), due date
- Dialog quản lý columns: thêm/sửa tên cột, đặt WIP limit, xóa cột (chuyển tasks sang cột khác)
- Board management: dropdown chọn board, tạo board mới, xóa board
- Empty state khi cột trống (border dashed + text "Trống")
- Toast notifications dùng `sonner` (đã cài sẵn)

**Nút thêm cột:** nằm bên phải board, hiện dialog nhập tên cột + icon

### 5. Sidebar Integration (`app/admin/components/Sidebar.tsx`)

- Thêm Kanban vào section "Hệ thống" hoặc tạo section "Công cụ" mới
- Icon: `Columns3` từ lucide-react
- Route: `/admin/kanban`
- Module guard: `kanban`

### 6. Permission Config (`app/admin/roles/permission-config.ts`)

- Thêm `kanban` vào permission system với actions: view, create, edit, delete

### 7. Validators (`convex/lib/validators.ts`)

- Thêm `kanbanPriority` validator

---

## Files sẽ tạo/sửa

**Tạo mới (7 files):**
1. `convex/kanban.ts` - Backend queries/mutations
2. `lib/modules/configs/kanban.config.ts` - Module definition
3. `app/system/modules/kanban/page.tsx` - System config page
4. `app/admin/kanban/page.tsx` - Main Kanban UI

**Sửa (7 files):**
1. `convex/schema.ts` - Thêm 3 tables
2. `convex/lib/validators.ts` - Thêm priority validator
3. `convex/seeders/adminModules.seeder.ts` - Thêm kanban module entry
4. `lib/modules/configs/index.ts` - Export kanbanModule
5. `lib/modules/seed-registry.ts` - Thêm metadata
6. `app/system/modules/page.tsx` - Thêm moduleConfigRoutes
7. `app/admin/components/Sidebar.tsx` - Thêm menu item
8. `app/admin/roles/permission-config.ts` - Thêm kanban permissions
