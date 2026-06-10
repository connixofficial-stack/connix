## Plan thực thi: Hoàn thành migration calendar → subscriptions

### Tình trạng hiện tại
- ✅ Đã git mv các file/thư mục
- ✅ Đã sửa một số file UI (Sidebar, permission-config, wizard-presets, ModuleConfigPage)
- ❌ Các file đã rename nhưng **nội dung bên trong chưa đổi**

### Các bước thực hiện (theo thứ tự dependency)

#### 1. Core config & schema (foundation layer)
**File: `lib/modules/configs/subscriptions.config.ts`**
- Đổi `key: 'calendar'` → `key: 'subscriptions'`
- Đổi `name: 'Calendar'` → `name: 'Subscriptions'`
- Đổi `description` → "Quản lý gia hạn subscription khách hàng"
- Đổi setting key `calendarPerPage` → `subscriptionsPerPage` (2 chỗ: trong settings array và defaultValue)

**File: `lib/modules/configs/index.ts`**
- Đổi export: `export { calendarModule } from './calendar.config'` → `export { subscriptionsModule } from './subscriptions.config'`
- Đổi tên biến trong file config: `export const calendarModule` → `export const subscriptionsModule`

**File: `convex/schema.ts`**
- Dòng comment `// 19d. calendarTasks - Công việc dạng lịch` → `// 19d. calendarTasks - Subscription gia hạn`
- Giữ nguyên table name `calendarTasks` (không đổi DB schema)

#### 2. Convex backend layer
**File: `convex/subscriptions.ts`**
Rename tất cả exported functions (giữ nguyên table `calendarTasks`):
- `createCalendarTask` → `createSubscription`
- `updateCalendarTask` → `updateSubscription`
- `deleteCalendarTask` → `deleteSubscription`
- `renewCalendarTask` → `renewSubscription`
- `markCalendarTaskContacted` → `markSubscriptionContacted`
- `markCalendarTaskChurned` → `markSubscriptionChurned`
- `deleteAllCalendarTasks` → `deleteAllSubscriptions`
- `deleteOverdueCalendarTasks` → `deleteOverdueSubscriptions`
- `listCalendarTasksRange` → `listSubscriptionsRange`
- `listCalendarTasksPage` → `listSubscriptionsPage`
- `listUpcomingTasks` → `listUpcomingSubscriptions`
- `getCalendarTask` → `getSubscription`

**File: `convex/seed.ts`**
- Đổi `moduleKey: 'calendar'` → `moduleKey: 'subscriptions'`
- Đổi `settingKey: 'calendarPerPage'` → `settingKey: 'subscriptionsPerPage'`
- Xóa dòng `settingKey: 'weekStartsOn'` nếu còn tồn tại
- Đổi mutation name: `seedCalendarModule` → `seedSubscriptionsModule`

**File: `convex/seeders/subscriptions.seeder.ts`**
- Đổi class name: `export class CalendarSeeder` → `export class SubscriptionsSeeder`
- Đổi `moduleName = 'calendar'` → `moduleName = 'subscriptions'`
- Đổi `moduleKey: 'calendar'` → `moduleKey: 'subscriptions'`
- Đổi `settingKey: 'calendarPerPage'` → `settingKey: 'subscriptionsPerPage'`

**File: `convex/seeders/registry.ts`**
- Đổi import: `import { CalendarSeeder } from './calendar.seeder'` → `import { SubscriptionsSeeder } from './subscriptions.seeder'`
- Đổi key trong registry: `calendar: CalendarSeeder` → `subscriptions: SubscriptionsSeeder`

**File: `convex/seeders/index.ts`**
- Đổi export: `export { CalendarSeeder } from './calendar.seeder'` → `export { SubscriptionsSeeder } from './subscriptions.seeder'`

**File: `convex/seeders/dependencies.ts`**
- Đổi key: `calendar: ['adminModules']` → `subscriptions: ['adminModules']`

**File: `convex/seedManager.ts`**
- Đổi trong seed order array: `'calendar'` → `'subscriptions'`

**File: `convex/seeders/adminModules.seeder.ts`**
- Tìm và đổi mọi hardcode `'calendar'` → `'subscriptions'` (nếu có)

#### 3. Admin UI layer
**File: `app/admin/subscriptions/page.tsx`**
- Đổi `const MODULE_KEY = 'calendar'` → `const MODULE_KEY = 'subscriptions'`
- Đổi tất cả import từ `api.calendar.*` → `api.subscriptions.*`:
  - `api.calendar.listCalendarTasksPage` → `api.subscriptions.listSubscriptionsPage`
  - `api.calendar.deleteCalendarTask` → `api.subscriptions.deleteSubscription`
  - `api.calendar.deleteAllCalendarTasks` → `api.subscriptions.deleteAllSubscriptions`
  - `api.calendar.deleteOverdueCalendarTasks` → `api.subscriptions.deleteOverdueSubscriptions`
  - `api.calendar.renewCalendarTask` → `api.subscriptions.renewSubscription`
  - `api.calendar.markCalendarTaskContacted` → `api.subscriptions.markSubscriptionContacted`
  - `api.calendar.markCalendarTaskChurned` → `api.subscriptions.markSubscriptionChurned`
- Đổi setting key: `calendarPerPage` → `subscriptionsPerPage`
- Đổi type names (local types, không ảnh hưởng schema):
  - `CalendarStatus` → `SubscriptionStatus`
  - `CalendarView` → `SubscriptionView`
  - `CalendarRangeItem` → `SubscriptionRangeItem`
- Đổi heading: "Nhắc gia hạn" → "Quản lý gia hạn"

**File: `app/admin/subscriptions/_components/SubscriptionModal.tsx`**
- Đổi component name: `CalendarTaskModal` → `SubscriptionModal`
- Đổi import: `CalendarTaskForm` → `SubscriptionForm`
- Cập nhật api calls từ `api.calendar.*` → `api.subscriptions.*`

**File: `app/admin/subscriptions/_components/SubscriptionForm.tsx`**
- Đổi function name: `export function CalendarTaskForm` → `export function SubscriptionForm`
- Cập nhật api calls từ `api.calendar.*` → `api.subscriptions.*`

**File: `app/admin/subscriptions/create/page.tsx`**
- Cập nhật import nếu có reference đến Modal/Form

**File: `app/admin/subscriptions/[id]/edit/page.tsx`**
- Cập nhật import nếu có reference đến Modal/Form
- Cập nhật api calls từ `api.calendar.*` → `api.subscriptions.*`

#### 4. System module page
**File: `app/system/modules/subscriptions/page.tsx`**
- Đổi import: `import { calendarModule } from '@/lib/modules/configs/calendar.config'` → `import { subscriptionsModule } from '@/lib/modules/configs/subscriptions.config'`
- Đổi usage: `calendarModule` → `subscriptionsModule`

#### 5. Verification & commit
- Run `bunx tsc --noEmit` để verify không có lỗi TypeScript
- Fix nếu có lỗi
- Commit toàn bộ với message: `refactor: rename module calendar → subscriptions`
- Add `.factory/docs` vào commit

### Lưu ý quan trọng
- **KHÔNG đổi** tên table `calendarTasks` trong schema - chỉ đổi comment
- **KHÔNG đổi** tên field trong DB schema
- Chỉ đổi: module key, function names, component names, routes, labels
- File `convex/_generated/api.d.ts` sẽ tự động regenerate sau khi Convex detect changes

### Checklist cuối
- [ ] Tất cả file đã được sửa theo spec
- [ ] `bunx tsc --noEmit` pass
- [ ] Không còn reference nào đến `calendar` (trừ table name `calendarTasks`)
- [ ] Commit đã bao gồm `.factory/docs`