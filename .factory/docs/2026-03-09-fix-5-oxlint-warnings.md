## Fix 5 oxlint warnings

### 1. `MAP_HEIGHT_COMPACT` unused — `ContactSectionShared.tsx:95`
**Fix:** Xóa dòng `const MAP_HEIGHT_COMPACT = 'min-h-[200px] md:min-h-[220px]';`

### 2 & 3. `getComplementary` + `getTriadic` unused — `faq/_lib/colors.ts:201,206`
**Fix:** Xóa cả 2 hàm (15 dòng). `getAutoSecondary` chỉ dùng `getAnalogous`, không phụ thuộc 2 hàm này.

### 4. `no-base-to-string` — `lib/contact/getContactMapData.ts:18`
`String(value ?? '')` bị cảnh báo vì `value` có thể là object. Fix:
```ts
const parsed = Number.parseFloat(
  typeof value === 'string' || typeof value === 'number' ? String(value) : ''
);
```

### 5. `no-floating-promises` — `app/admin/contact-inbox/page.tsx:184`
**Fix:** Thêm `void` trước promise call:
```tsx
onChange={(event) => { void handleStatusChange(inquiry._id, event.target.value as 'new' | 'in_progress' | 'resolved' | 'spam'); }}
```

---
**Files thay đổi:**
- `app/admin/home-components/contact/_components/ContactSectionShared.tsx` — xóa 1 dòng
- `app/admin/home-components/faq/_lib/colors.ts` — xóa 2 hàm (~15 dòng)
- `lib/contact/getContactMapData.ts` — sửa 1 dòng
- `app/admin/contact-inbox/page.tsx` — thêm `void` 1 chỗ
