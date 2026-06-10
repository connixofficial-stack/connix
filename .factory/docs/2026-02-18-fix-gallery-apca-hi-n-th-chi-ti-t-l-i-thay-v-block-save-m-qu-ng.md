## Vấn đề

Khi ấn lưu, error toast chỉ nói: `"APCA chưa đạt cho heading, subheading, badge"` — không có giá trị Lc cụ thể, không biết thiếu bao nhiêu, không biết pair nào fail nặng nhất.

## Root Cause

Trong `gallery/[id]/edit/page.tsx`, `handleSubmit`:

```ts
const failedPairs = accessibility.failing.map((item) => item.label ?? 'pair').join(', ');
toast.error(`Không thể lưu Gallery: APCA chưa đạt cho ${failedPairs}. Gợi ý...`);
```

`failing` objects có sẵn `lc` và `threshold` nhưng không được dùng để hiển thị.

## Fix Plan

### 1. Cải thiện error message trong toast (cả edit và create)

Thay vì chỉ liệt kê tên, hiển thị chi tiết mỗi failing pair:

```
heading: Lc=28.3 (cần ≥45)
badge: Lc=31.1 (cần ≥60)
```

**Files cần sửa:**
- `app/admin/home-components/gallery/[id]/edit/page.tsx` — `handleSubmit`
- `app/admin/home-components/create/gallery/page.tsx` — `handleSubmit`

Format toast mới:
```ts
const details = accessibility.failing
  .map((p) => `${p.label ?? 'pair'}: Lc=${p.lc.toFixed(1)} (cần ≥${p.threshold})`)
  .join(' • ');
toast.error(`Không thể lưu Gallery: ${details}. Gợi ý: ...`);
```

### 2. Thêm accessibility warning trong GalleryPreview (như CTA/FAQ)

Thêm inline warning box trong `GalleryPreview.tsx` (phần cuối return, dưới `PreviewWrapper`) để user thấy warning NGAY trong preview mà không cần ấn save:

```tsx
{accessibility.failing.length > 0 && (
  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
    <p className="font-semibold">Accessibility warning — sẽ bị chặn lưu</p>
    <p>{accessibility.failing.map(p => `${p.label}: Lc=${p.lc.toFixed(1)} (cần ≥${p.threshold})`).join(' • ')}</p>
  </div>
)}
```

Cần tính `accessibility` trong `GalleryPreview` từ `getGalleryValidationResult` (pass `primary`, `secondary`, `mode`).

### 3. Tương tự cho TrustBadgesPreview

Check xem `TrustBadgesPreview.tsx` có cùng validation pattern không và thêm warning nếu cần.

## Scope

- **Không** thay đổi logic validation (vẫn block save khi fail)
- **Không** thay đổi threshold
- **Chỉ** cải thiện UX: hiển thị chi tiết Lc và threshold trong toast + inline warning trong preview
