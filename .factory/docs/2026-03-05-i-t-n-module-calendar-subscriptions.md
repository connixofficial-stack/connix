
# Spec: Đổi tên module `calendar` → `subscriptions`

## Phạm vi thay đổi

### Lưu ý quan trọng về Convex schema
`calendarTasks` (tên bảng DB trong schema.ts) **KHÔNG đổi** — đổi tên bảng Convex là breaking change cần migration data. Chỉ đổi các tên hiển thị, key module, route, và tên file.

---

## Danh sách thay đổi từng file

### 1. Đổi tên thư mục / file (git mv)
```
app/admin/calendar/                       → app/admin/subscriptions/
app/system/modules/calendar/              → app/system/modules/subscriptions/
lib/modules/configs/calendar.config.ts   → lib/modules/configs/subscriptions.config.ts
convex/calendar.ts                       → convex/subscriptions.ts
convex/seeders/calendar.seeder.ts        → convex/seeders/subscriptions.seeder.ts
```

### 2. `lib/modules/configs/subscriptions.config.ts`
- `key: 'calendar'` → `key: 'subscriptions'`
- `name: 'Calendar'` → `name: 'Subscriptions'`
- Setting key `calendarPerPage` → `subscriptionsPerPage`
- `description`: cập nhật thành "Quản lý gia hạn subscription khách hàng"

### 3. `convex/subscriptions.ts` (đổi tên từ calendar.ts)
- Giữ nguyên tên table `calendarTasks` (không đổi DB)
- Rename export functions: `createCalendarTask` → `createSubscription`, `updateCalendarTask` → `updateSubscription`, `deleteCalendarTask` → `deleteSubscription`, v.v.
- Rename `renewCalendarTask` → `renewSubscription`
- Rename `markCalendarTaskContacted` → `markSubscriptionContacted`
- Rename `markCalendarTaskChurned` → `markSubscriptionChurned`
- Rename `deleteAllCalendarTasks` → `deleteAllSubscriptions`
- Rename `deleteOverdueCalendarTasks` → `deleteOverdueSubscriptions`
- Rename `listCalendarTasksRange` → `listSubscriptionsRange`
- Rename `listCalendarTasksPage` → `listSubscriptionsPage`
- Rename `listUpcomingTasks` → `listUpcomingSubscriptions`
- Rename `getCalendarTask` → `getSubscription`

### 4. `convex/schema.ts`
- Comment `// 19d. calendarTasks - Công việc dạng lịch` → `// 19d. calendarTasks - Subscription gia hạn`
- Giữ nguyên `calendarTasks` table name

### 5. `convex/seed.ts`
- `moduleKey: 'calendar'` → `moduleKey: 'subscriptions'`
- `settingKey: 'calendarPerPage'` → `settingKey: 'subscriptionsPerPage'`
- Xóa `settingKey: 'weekStartsOn'` (đã bỏ, nhưng vẫn còn trong seed.ts cũ)
- Đổi tên mutation export `seedCalendarModule` → `seedSubscriptionsModule`

### 6. `convex/seeders/subscriptions.seeder.ts` (đổi tên từ calendar.seeder.ts)
- Class `CalendarSeeder` → `SubscriptionsSeeder`
- `moduleName = 'calendar'` → `moduleName = 'subscriptions'`
- `moduleKey: 'calendar'` → `moduleKey: 'subscriptions'`
- `settingKey: 'calendarPerPage'` → `settingKey: 'subscriptionsPerPage'`

### 7. `convex/seeders/registry.ts`
- Import: `CalendarSeeder` → `SubscriptionsSeeder` từ `./subscriptions.seeder`
- Key: `calendar: CalendarSeeder` → `subscriptions: SubscriptionsSeeder`

### 8. `convex/seeders/index.ts`
- Export: `CalendarSeeder` → `SubscriptionsSeeder` từ `./subscriptions.seeder`

### 9. `convex/seeders/dependencies.ts`
- Key `calendar:` → `subscriptions:`

### 10. `convex/seedManager.ts`
- `'calendar'` → `'subscriptions'` trong mảng seed order

### 11. `app/admin/subscriptions/page.tsx`
- `MODULE_KEY = 'calendar'` → `MODULE_KEY = 'subscriptions'`
- Import từ `api.calendar.*` → `api.subscriptions.*`
- Setting key `calendarPerPage` → `subscriptionsPerPage`
- Tên type `CalendarStatus`, `CalendarView`, `CalendarRangeItem` → `SubscriptionStatus`, `SubscriptionView`, `SubscriptionRangeItem` (chỉ đổi type local, không ảnh hưởng schema)
- Label heading "Nhắc gia hạn" → "Quản lý gia hạn"

### 12. `app/admin/subscriptions/_components/CalendarTaskModal.tsx` (giữ tên file nội bộ hoặc đổi)
- Đổi tên file → `SubscriptionModal.tsx`
- Import trong `page.tsx` cập nhật

### 13. `app/admin/subscriptions/_components/CalendarTaskForm.tsx`
- Đổi tên file → `SubscriptionForm.tsx`
- Function name `CalendarTaskForm` → `SubscriptionForm`
- Import trong Modal cập nhật

### 14. `app/admin/subscriptions/create/page.tsx` và `[id]/edit/page.tsx`
- Cập nhật import nếu có

### 15. `app/system/modules/subscriptions/page.tsx`
- Import `calendarModule` → `subscriptionsModule` từ `@/lib/modules/configs/subscriptions.config`

### 16. `app/admin/components/Sidebar.tsx`
- `isModuleEnabled('calendar')` → `isModuleEnabled('subscriptions')`
- `label="Calendar"` → `label="Subscriptions"` (hoặc "Gia hạn")
- `href="/admin/calendar"` → `href="/admin/subscriptions"`
- `isActive('/admin/calendar')` → `isActive('/admin/subscriptions')`

### 17. `app/admin/roles/permission-config.ts`
- `calendar: ['view', 'create', 'edit', 'delete']` → `subscriptions: ['view', 'create', 'edit', 'delete']`

### 18. `components/data/seed-wizard/wizard-presets.ts`
- `key: 'calendar'`, `modules: ['calendar']`, `label: 'Calendar nội bộ'` → `key: 'subscriptions'`, `modules: ['subscriptions']`, `label: 'Quản lý gia hạn'`
- Tất cả `calendar: 8/14/20` trong `SCALE_QUANTITIES` → `subscriptions: 8/14/20`
- `{ key: 'calendar', label: 'Calendar' }` trong `SCALE_SUMMARY_ITEMS` → `{ key: 'subscriptions', label: 'Gia hạn' }`

### 19. `convex/seeders/adminModules.seeder.ts`
- Kiểm tra có hardcode `'calendar'` không (cần xem)

---

## Checklist
- [ ] git mv các file/thư mục (5 mục)
- [ ] `lib/modules/configs/subscriptions.config.ts` — đổi key/name/setting key
- [ ] `convex/subscriptions.ts` — rename exports (giữ table `calendarTasks`)
- [ ] `convex/schema.ts` — chỉ update comment
- [ ] `convex/seed.ts` — moduleKey, settingKey, mutation name
- [ ] `convex/seeders/subscriptions.seeder.ts` — class name, moduleKey, settingKey
- [ ] `convex/seeders/registry.ts`, `index.ts`, `dependencies.ts`, `seedManager.ts`
- [ ] `app/admin/subscriptions/page.tsx` — MODULE_KEY, api calls, setting key
- [ ] `app/admin/subscriptions/_components/` — đổi tên file + function
- [ ] `app/system/modules/subscriptions/page.tsx`
- [ ] `app/admin/components/Sidebar.tsx`
- [ ] `app/admin/roles/permission-config.ts`
- [ ] `components/data/seed-wizard/wizard-presets.ts`
- [ ] `bunx tsc --noEmit` pass
- [ ] Commit
