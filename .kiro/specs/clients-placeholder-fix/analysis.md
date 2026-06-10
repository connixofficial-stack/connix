# Analysis: Clients Component Issues

## Problem Graph

```
1. [MAIN] Clients preview/render lỗi khi chưa có ảnh
   ├─ 1.1 [SUB] Preview không hiển thị placeholder khi items có url rỗng
   │   └─ 1.1.1 [ROOT CAUSE] normalizeClientItems() filter bỏ items có url rỗng
   ├─ 1.2 [SUB] Empty state logic sai
   │   └─ 1.2.1 Check normalizedItems.length thay vì clientItems.length
   └─ 1.3 [SUB] Inconsistency với Stats/Hero pattern
       └─ 1.3.1 Stats/Hero có placeholder tốt hơn
```

## Detailed Analysis

### Issue 1: normalizeClientItems() filter quá aggressive

**File:** `app/admin/home-components/clients/_components/ClientsSectionShared.tsx`

**Code hiện tại (lines 50-60):**
```typescript
const url = typeof source.url === 'string' ? source.url.trim() : '';
const link = typeof source.link === 'string' ? source.link.trim() : '';
const name = typeof source.name === 'string' ? source.name.trim() : '';

if (!url) {
  return null;  // ❌ BUG: Loại bỏ item hoàn toàn
}
```

**Vấn đề:**
- Khi user thêm slot mới nhưng chưa upload → `url = ''`
- `normalizeClientItems()` return `null` → item bị filter bỏ
- `normalizedItems.length === 0` → hiển thị empty state
- User không thấy placeholder cho slot đã thêm

**Impact:**
- UX confusing: thêm slot nhưng preview không thay đổi
- Không biết có bao nhiêu slots đang chờ upload
- Khác biệt với form editor (form có placeholder rõ ràng)

### Issue 2: Empty state logic sai

**File:** `app/admin/home-components/clients/_components/ClientsPreview.tsx`

**Code hiện tại (lines 90-100):**
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

**Vấn đề:**
- Check `items.length` (từ props) là đúng
- Nhưng `ClientsSectionShared` nhận `normalizedItems` đã bị filter
- Nếu có 3 slots nhưng chưa upload → `normalizedItems.length = 0` → render null

**Impact:**
- Preview trống hoàn toàn
- Không có feedback visual nào

### Issue 3: renderLogoContent() không handle url rỗng

**File:** `app/admin/home-components/clients/_components/ClientsSectionShared.tsx`

**Code hiện tại (lines 80-95):**
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
    <div style={{ backgroundColor: tokens.placeholderBackground }}>
      <ImageIcon style={{ color: tokens.placeholderIcon }} />
    </div>
  )
);
```

**Vấn đề:**
- Logic placeholder đã có (✓)
- Nhưng không bao giờ chạy vì item có `url = ''` đã bị filter ở `normalizeClientItems()`

**Impact:**
- Dead code: placeholder logic không bao giờ được execute

## Comparison với Stats/Hero

### Stats Pattern (Simple, Working)

**File:** `app/admin/home-components/create/stats/page.tsx`

```typescript
const [statsItems, setStatsItems] = useState([
  { id: 1, label: 'Khách hàng', value: '1000+' },
  // ...
]);

// Preview luôn hiển thị items, không filter
<StatsPreview items={statsItems} ... />
```

**Ưu điểm:**
- Không filter items
- Preview luôn sync với state
- Placeholder tự nhiên (empty value = empty display)

### Hero Pattern (MultiImageUploader, Working)

**File:** `app/admin/home-components/create/hero/page.tsx`

```typescript
const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([
  { id: 'slide-1', image: '', link: '', url: '' }
]);

<MultiImageUploader
  items={heroSlides}
  onChange={handleSlidesChange}
  // Có placeholder built-in
/>
```

**Ưu điểm:**
- MultiImageUploader handle placeholder internally
- Consistent UX across all states
- Drag-drop, reorder built-in

### Clients Pattern (Custom, Broken)

**File:** `app/admin/home-components/create/clients/page.tsx`

```typescript
const [clientItems, setClientItems] = useState<ClientEditorItem[]>(
  toEditorItems(DEFAULT_CLIENTS_CONFIG.items)
);

// Form có placeholder tốt ✓
<ClientsForm items={clientItems} ... />

// Preview filter items → broken ✗
<ClientsPreview items={toPersistItems(clientItems)} ... />
```

**Vấn đề:**
- Custom implementation
- Filter logic ở preview layer (sai)
- Form và preview không sync

## Root Cause Summary

1. **normalizeClientItems() quá strict**: Filter bỏ items có url rỗng
2. **Placeholder logic unreachable**: Code đã có nhưng không chạy
3. **Empty state check sai layer**: Check sau khi filter thay vì check raw items

## Dual-Brand-Color-System Compliance

### Current Status

**File:** `app/admin/home-components/clients/_lib/colors.ts`

Cần kiểm tra:
- ✓ Placeholder background: neutral tint (không dùng primary/secondary)
- ✓ Placeholder icon: neutral color
- ? APCA contrast: cần verify

### Rules áp dụng

**Content-Aware Color Distribution (Layer 2: Placeholder State):**
> Background: neutral tint (slate-100/200), KHÔNG dùng primary/secondary tint
> Icon: primary solid (hint cho user biết component thuộc brand nào)
> Text: neutral (slate-500)

**Lưu ý:** Skill nói "Icon: primary solid" nhưng trong code hiện tại dùng `placeholderIcon` (neutral). Cần clarify với user.

## Proposed Solution

### Option 1: Keep items với url rỗng (RECOMMENDED)

**Changes:**
1. `normalizeClientItems()`: Không filter items có url rỗng
2. `renderLogoContent()`: Giữ nguyên placeholder logic (đã có)
3. Empty state: Check `items.length` thay vì `normalizedItems.length`

**Pros:**
- Minimal code change
- Placeholder logic đã có sẵn
- Consistent với form editor

**Cons:**
- Cần update type `NormalizedClientItem` để url có thể rỗng

### Option 2: Refactor sang MultiImageUploader

**Changes:**
1. Replace ClientsForm với MultiImageUploader
2. Remove custom upload logic
3. Sync với Hero pattern

**Pros:**
- Consistent với Hero
- Reuse component
- Better UX (drag-drop, etc.)

**Cons:**
- Scope lớn (out of scope theo requirements)
- Breaking change
- Cần test kỹ

## Recommendation

**Chọn Option 1** vì:
- Scope nhỏ, risk thấp
- Fix đúng root cause
- Không breaking change
- Tuân thủ requirements (không refactor sang MultiImageUploader)

## Next Steps

1. Update `normalizeClientItems()` để keep items có url rỗng
2. Update type `NormalizedClientItem` để url optional
3. Verify placeholder colors theo dual-brand-color-system
4. Test tất cả 6 styles (marquee/dualRow/wave/grid/carousel/featured)
5. Verify APCA contrast cho placeholder
