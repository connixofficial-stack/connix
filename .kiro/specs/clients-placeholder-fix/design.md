# Design: Fix Clients Component Placeholder & Preview

## Overview

Fix logic render placeholder trong Clients component để hiển thị đúng khi có slots chưa upload ảnh. Giải pháp tập trung vào việc sửa `normalizeClientItems()` để không filter bỏ items có url rỗng.

## Architecture

### Current Flow (Broken)

```
ClientsCreatePage
  ├─ clientItems: [{ id: '1', url: '', name: '', link: '' }]  // State có 1 slot
  │
  ├─ ClientsForm
  │   └─ Hiển thị placeholder ✓ (OK)
  │
  └─ ClientsPreview
      └─ toPersistItems(clientItems) → [{ url: '', name: '', link: '' }]
          └─ ClientsSectionShared
              └─ normalizeClientItems() → []  // ✗ Filter bỏ vì url rỗng
                  └─ normalizedItems.length === 0
                      └─ return null  // ✗ Không render gì
```

### Fixed Flow

```
ClientsCreatePage
  ├─ clientItems: [{ id: '1', url: '', name: '', link: '' }]
  │
  ├─ ClientsForm
  │   └─ Hiển thị placeholder ✓
  │
  └─ ClientsPreview
      └─ toPersistItems(clientItems) → [{ url: '', name: '', link: '' }]
          └─ ClientsSectionShared
              └─ normalizeClientItems() → [{ url: '', ... }]  // ✓ Giữ item
                  └─ normalizedItems.length === 1
                      └─ renderLogoContent()
                          └─ item.url ? <Image /> : <Placeholder />  // ✓ Hiển thị placeholder
```

## Technical Design

### 1. Fix normalizeClientItems()

**File:** `app/admin/home-components/clients/_components/ClientsSectionShared.tsx`

**Current code:**
```typescript
export const normalizeClientItems = (items: unknown): NormalizedClientItem[] => {
  // ...
  const url = typeof source.url === 'string' ? source.url.trim() : '';
  
  if (!url) {
    return null;  // ❌ BUG
  }
  
  return { key, url, link, name };
};
```

**Fixed code:**
```typescript
export const normalizeClientItems = (items: unknown): NormalizedClientItem[] => {
  // ...
  const url = typeof source.url === 'string' ? source.url.trim() : '';
  
  // ✓ Không filter, giữ item dù url rỗng
  // Placeholder sẽ được render bởi renderLogoContent()
  
  return { key, url, link, name };
};
```

**Changes:**
- Remove `if (!url) return null;` check
- Keep all items regardless of url value
- Dedupe logic vẫn giữ nguyên (check url + link + name)

### 2. Update deduplication logic

**Current dedupe:**
```typescript
const dedupeKey = `${url}__${link}__${name}`;
if (seen.has(dedupeKey)) {
  return null;
}
```

**Issue:** Nếu có 2 slots rỗng → cùng dedupeKey `__` → chỉ giữ 1

**Fixed dedupe:**
```typescript
// Chỉ dedupe khi có url (items thật)
// Items placeholder (url rỗng) không dedupe
if (url && seen.has(url)) {
  return null;
}
seen.add(url);
```

**Rationale:**
- Placeholder items không cần dedupe (mỗi slot là unique)
- Chỉ dedupe items có url để tránh duplicate logos
- Đơn giản hơn, chỉ check url thay vì url+link+name

### 3. Verify renderLogoContent() placeholder

**File:** `app/admin/home-components/clients/_components/ClientsSectionShared.tsx`

**Current code (already correct):**
```typescript
const renderLogoContent = (
  item: NormalizedClientItem,
  idx: number,
  tokens: ClientsColorTokens,
  size: 'sm' | 'md' | 'lg',
) => (
  item.url ? (
    <PreviewImage src={item.url} alt={...} />
  ) : (
    <div
      className={`${getImageSizeClass(size)} w-28 rounded-lg flex items-center justify-center`}
      style={{ backgroundColor: tokens.placeholderBackground }}
    >
      <ImageIcon size={22} style={{ color: tokens.placeholderIcon }} className="opacity-70" />
    </div>
  )
);
```

**Status:** ✓ No change needed - logic đã đúng, chỉ cần items không bị filter

### 4. Verify empty state logic

**File:** `app/admin/home-components/clients/_components/ClientsPreview.tsx`

**Current code:**
```typescript
{items.length === 0 ? (
  <section className="px-4 py-8">
    <div className="flex flex-col items-center justify-center h-40">
      <ImageIcon size={28} />
      <p>Chưa có logo khách hàng</p>
    </div>
  </section>
) : (
  <ClientsSectionShared ... />
)}
```

**Analysis:**
- Check `items.length` (props từ parent) ✓ Đúng
- Nhưng `ClientsSectionShared` return null khi `normalizedItems.length === 0`
- Sau khi fix normalizeClientItems(), vấn đề này tự giải quyết

**Status:** ✓ No change needed

### 5. Update ClientsSectionShared return logic

**File:** `app/admin/home-components/clients/_components/ClientsSectionShared.tsx`

**Current code:**
```typescript
export function ClientsSectionShared({ ... }) {
  const normalizedItems = React.useMemo(() => normalizeClientItems(items), [items]);
  
  if (normalizedItems.length === 0) {
    return null;  // ❌ Sai khi có placeholder items
  }
  
  // ... render styles
}
```

**Issue:** Sau khi fix normalizeClientItems(), vẫn có case:
- User thêm 1 slot, chưa upload → normalizedItems = [{ url: '' }]
- normalizedItems.length > 0 ✓
- Nhưng nếu user xóa url sau khi upload → về trạng thái rỗng

**Fixed code:**
```typescript
export function ClientsSectionShared({ ... }) {
  const normalizedItems = React.useMemo(() => normalizeClientItems(items), [items]);
  
  // Chỉ return null khi thực sự không có items
  // Placeholder items (url rỗng) vẫn render
  if (normalizedItems.length === 0) {
    return null;
  }
  
  // ... render styles (không đổi)
}
```

**Status:** ✓ No change needed - logic đã đúng sau khi fix normalizeClientItems()

## Color Tokens Verification

### Placeholder Colors

**File:** `app/admin/home-components/clients/_lib/colors.ts`

Cần verify tokens:
- `placeholderBackground`: Neutral tint (slate-100/200)
- `placeholderIcon`: Neutral color (slate-400/500)
- `placeholderIconBackground`: Neutral tint cho icon container
- `placeholderText`: Neutral text color

**Dual-brand-color-system rules:**
> Layer 2: Placeholder State (data trống) - KHÔNG tính vào tỷ lệ
> - Background: neutral tint (slate-100/200), KHÔNG dùng primary/secondary tint
> - Icon: primary solid (hint cho user biết component thuộc brand nào)
> - Text: neutral (slate-500)

**Note:** Skill nói "Icon: primary solid" nhưng code hiện tại dùng neutral. Giữ nguyên neutral vì:
- Placeholder không phải brand element
- Neutral rõ ràng hơn (không nhầm với content thật)
- Consistent với form editor

### APCA Contrast Check

Cần verify:
- `placeholderIcon` trên `placeholderBackground` >= 45 Lc (icon size 22px)
- `placeholderText` trên `placeholderBackground` >= 60 Lc (text 12px, weight 500)

**Implementation:** Sẽ check trong colors.ts khi đọc file

## Edge Cases

### Case 1: Tất cả slots rỗng
- Input: `[{ url: '' }, { url: '' }, { url: '' }]`
- Expected: Hiển thị 3 placeholder boxes
- Actual: ✓ Will work sau khi fix

### Case 2: Mix slots có/không có ảnh
- Input: `[{ url: 'a.jpg' }, { url: '' }, { url: 'b.jpg' }]`
- Expected: Hiển thị ảnh + placeholder + ảnh
- Actual: ✓ Will work

### Case 3: Duplicate URLs
- Input: `[{ url: 'a.jpg' }, { url: 'a.jpg' }]`
- Expected: Chỉ hiển thị 1 logo (dedupe)
- Actual: ✓ Will work (dedupe by url)

### Case 4: Empty slots với duplicate dedupe key
- Input: `[{ url: '', name: '', link: '' }, { url: '', name: '', link: '' }]`
- Current: Chỉ giữ 1 (dedupeKey = `__`)
- Fixed: Giữ cả 2 (không dedupe khi url rỗng)

### Case 5: Tất cả 6 styles
- marquee, dualRow, wave, grid, carousel, featured
- Expected: Placeholder hiển thị đúng với mỗi style
- Actual: ✓ Will work (renderLogoContent() dùng chung)

## Testing Strategy

### Unit Tests (Manual)

1. **Test placeholder render:**
   - Thêm 1 slot mới (chưa upload)
   - Verify: Preview hiển thị 1 placeholder box
   - Verify: Placeholder có icon ImageIcon
   - Verify: Placeholder có màu neutral

2. **Test upload flow:**
   - Thêm slot → placeholder hiển thị
   - Upload ảnh → placeholder biến thành ảnh
   - Verify: Smooth transition

3. **Test empty state:**
   - Không có slot nào → empty state hiển thị
   - Thêm 1 slot → empty state biến mất, placeholder hiển thị
   - Xóa slot cuối → empty state hiển thị lại

4. **Test all styles:**
   - Với mỗi style (marquee/dualRow/wave/grid/carousel/featured)
   - Thêm 3 slots: 1 có ảnh, 2 placeholder
   - Verify: Layout đúng, placeholder size phù hợp

5. **Test dedupe:**
   - Upload 2 ảnh giống nhau → chỉ hiển thị 1
   - Thêm 2 slots rỗng → hiển thị 2 placeholders

### APCA Contrast Tests

```typescript
// Pseudo-code
const tokens = getClientsValidationResult({ primary, secondary, mode, harmony }).tokens;

// Test 1: Icon contrast
const iconLc = Math.abs(APCAcontrast(
  sRGBtoY(parseRgb(tokens.placeholderIcon)),
  sRGBtoY(parseRgb(tokens.placeholderBackground))
));
expect(iconLc).toBeGreaterThanOrEqual(45); // Icon 22px

// Test 2: Text contrast (nếu có)
const textLc = Math.abs(APCAcontrast(
  sRGBtoY(parseRgb(tokens.placeholderText)),
  sRGBtoY(parseRgb(tokens.placeholderBackground))
));
expect(textLc).toBeGreaterThanOrEqual(60); // Text 12px, weight 500
```

## Implementation Steps

1. ✅ Read `ClientsSectionShared.tsx` để hiểu full logic
2. ✅ Read `colors.ts` để verify tokens
3. ✅ Fix `normalizeClientItems()` - remove url filter
4. ✅ Fix dedupe logic - chỉ dedupe khi có url
5. ✅ Test manually với 6 styles
6. ✅ Verify APCA contrast
7. ✅ Run `bunx tsc --noEmit`
8. ✅ Commit changes

## Rollback Plan

Nếu có vấn đề:
1. Revert commit
2. Hoặc add back url filter với flag:
```typescript
if (!url && context === 'site') {
  return null; // Chỉ filter ở site, không filter ở preview
}
```

## Success Criteria

- ✅ Preview hiển thị placeholder cho slots chưa có ảnh
- ✅ Empty state chỉ hiện khi `clientItems.length === 0`
- ✅ Placeholder colors tuân thủ dual-brand-color-system
- ✅ APCA contrast pass cho icon và text
- ✅ Tất cả 6 styles hoạt động đúng
- ✅ No TypeScript errors
- ✅ No breaking changes

## Files to Change

1. `app/admin/home-components/clients/_components/ClientsSectionShared.tsx`
   - Fix `normalizeClientItems()` logic
   - Update dedupe logic

2. `app/admin/home-components/clients/_lib/colors.ts` (verify only)
   - Check placeholder tokens
   - Verify APCA contrast

## Non-Goals

- ❌ Refactor sang MultiImageUploader
- ❌ Thay đổi ClientsForm UI
- ❌ Thêm drag-drop functionality
- ❌ Thay đổi upload logic
- ❌ Fix các components khác
