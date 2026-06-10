# Spec: Bổ sung trường Mã số thuế vào Module Settings

## Root Cause
Không có field `contact_tax_id` trong:
- Convex seeder (`settings.seeder.ts`)
- Type definitions (`ContactMapData`, `ContactData`)
- UI components (admin/site/preview)

**Confidence: High (95%)** - Grep không tìm thấy pattern liên quan, seeder thiếu entry, moduleFields thiếu definition.

## Giải pháp

### 1. Convex Seeder
File: `convex/seeders/settings.seeder.ts`
- Thêm `{ group: 'contact', key: 'contact_tax_id', value: '' }` vào `settingsData` array
- Thêm field definition vào `moduleFields`:
  ```ts
  { 
    enabled: true, 
    fieldKey: 'contact_tax_id', 
    group: 'contact', 
    linkedFeature: 'enableContact', 
    name: 'Mã số thuế', 
    order: 9, 
    type: 'text' 
  }
  ```

### 2. Type Definitions
File: `lib/contact/getContactMapData.ts`
- Thêm `taxId?: string` vào `ContactMapData` type
- Parse trong `getContactMapDataFromSettings`: `taxId: coerceString(map.contact_tax_id)`

### 3. Hook
File: `components/site/useContactPageData.ts`
- Thêm `taxId: string` vào `ContactData` type
- Parse: `taxId: (settingsMap.contact_tax_id as string) || ''`

### 4. UI Components
- `app/(site)/contact/page.tsx`: Thêm hiển thị mã số thuế trong `ContactInfoCard` và `CorporateSidebar` (conditional render khi có giá trị)
- `components/experiences/previews/ContactPreview.tsx`: Thêm prop `taxId` và render trong preview
- `app/system/experiences/contact/page.tsx`: Pass `taxId` từ `contactSettings` vào `ContactPreview`
- `app/admin/settings/page.tsx`: Không cần sửa (render động từ `moduleFields`)

### 5. Guard Logic
- Khi `enableContact` tắt → field tự động ẩn (logic `linkedFeature` có sẵn)
- Khi field disabled → không xuất hiện trong admin form
- Field rỗng → không hiển thị ở site (conditional render)

## Verification

**Typecheck:**
```bash
bunx tsc --noEmit
```

**Manual Tests:**
1. Seed data → verify field trong DB
2. `/system/modules/settings` → toggle field → verify admin UI
3. `/admin/settings` → nhập mã số thuế → lưu → verify DB
4. `/system/experiences/contact` → verify preview
5. `/contact` → verify site hiển thị
6. Toggle `enableContact` off → verify không crash

**Edge Cases:**
- Field rỗng → không hiển thị
- Feature tắt → field ẩn
- Field disabled → không trong form