## Root Cause

Seed Wizard chạy `clearAll({ excludeSystem: false })` xoá sạch bảng `adminModules`, sau đó `syncModules(selectedModules)` chỉ sync lại những module có trong `selectedModules`. Nhưng `analytics` **không bao giờ** nằm trong `selectedModules` vì:
- Không có trong `CORE_MODULES`
- Không có trong `WEBSITE_TYPE_OPTIONS`  
- Không có trong `EXTRA_FEATURE_OPTIONS`

Kết quả: Module `analytics` không tồn tại trong DB -> `isModuleEnabled('analytics')` return `false` -> Dashboard hiện "Module đã bị tắt".

## Fix Approach

Có 2 hướng giải quyết:

### Option A: Thêm `analytics` vào CORE_MODULES (Recommended)
- Thêm `analytics` vào `CORE_MODULES` trong `wizard-presets.ts`
- `analytics` là module cung cấp Dashboard - trang chính của admin, nên nó xứng đáng là core module
- Đảm bảo `SCALE_QUANTITIES` không cần entry vì `adminModules.seeder` đã seed `analytics` với `enabled: true`

### Option B: Seed lại adminModules + systemPresets trong handleSeed
- Trong `handleSeed`, sau `clearAll` và trước `syncModules`, gọi `seedModule({ module: 'adminModules', quantity: 0 })` và `seedModule({ module: 'systemPresets', quantity: 0 })` để đảm bảo tất cả modules definition tồn tại
- Tương tự như logic đang có ở `/system/modules/page.tsx` (line 524-528)

### Recommend: Kết hợp cả 2
1. **`wizard-presets.ts`**: Thêm `'analytics'` vào `CORE_MODULES` để `syncModules` enable nó
2. **`SeedWizardDialog.tsx`**: Trong `handleSeed`, sau `clearAll` và trước `syncModules`, seed lại `adminModules` + `systemPresets` để đảm bảo module definitions tồn tại (vì `syncModules` cần `modules` data từ DB)

```ts
// wizard-presets.ts
const CORE_MODULES = ['settings', 'menus', 'homepage', 'media', 'users', 'roles', 'analytics'];

// SeedWizardDialog.tsx - handleSeed
if (state.clearBeforeSeed) {
  await clearAll({ excludeSystem: false });
}
// Re-seed system modules sau clearAll
await seedModuleMutation({ module: 'adminModules', quantity: 0 });
await seedModuleMutation({ module: 'systemPresets', quantity: 0 });

await syncModules(selectedModules);
```
