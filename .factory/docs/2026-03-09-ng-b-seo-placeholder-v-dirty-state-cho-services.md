
## Audit Summary

| File | Vấn đề |
|---|---|
| `posts/create/page.tsx` | SEO placeholder thiếu hint "để trống lấy gì" |
| `services/create/page.tsx` | SEO placeholder thiếu hint (giống posts) |
| `services/[id]/edit/page.tsx` | Thiếu dirty state — nút "Cập nhật" luôn active |

Pattern chuẩn (products): `"Lấy theo tên sản phẩm nếu để trống"` / `"Lấy theo mô tả sản phẩm nếu bạn để trống"`.

## Root Cause Confidence: High

Cả 3 file đều copy pattern từ posts ban đầu (trước khi products được nâng cấp) — chưa được đồng bộ lại.

---

## Thay đổi cụ thể

### 1. `app/admin/posts/create/page.tsx`
Đổi 2 placeholder trong SEO card:
- `placeholder="Tiêu đề hiển thị trên Google"` → `placeholder="Lấy theo tiêu đề bài viết nếu để trống"`
- `placeholder="Mô tả ngắn cho kết quả tìm kiếm"` → `placeholder="Lấy theo mô tả ngắn/nội dung nếu để trống"`

### 2. `app/admin/services/create/page.tsx`
Đổi 2 placeholder trong SEO card (hiện giống posts):
- `placeholder="Tiêu đề hiển thị trên Google"` → `placeholder="Lấy theo tiêu đề dịch vụ nếu để trống"`
- `placeholder="Mô tả ngắn cho kết quả tìm kiếm"` → `placeholder="Lấy theo mô tả ngắn/nội dung nếu để trống"`

### 3. `app/admin/services/[id]/edit/page.tsx`
Thêm dirty state theo pattern của posts/edit:

**a. Thêm import `useRef`** (đã có rồi — file đã import `use, useCallback, useEffect, useMemo, useState`)  
→ Thêm `useRef` vào import.

**b. Thêm `initialSnapshotRef`:**
```ts
const initialSnapshotRef = useRef<{
  title: string; slug: string; content: string; excerpt: string;
  metaTitle: string; metaDescription: string; thumbnail: string;
  categoryId: string; price: number | undefined; duration: string;
  featured: boolean; status: 'Draft' | 'Published' | 'Archived';
} | null>(null);
```

**c. Thêm `currentSnapshot` useMemo** (toàn bộ field).

**d. Thêm `hasChanges` useMemo** (JSON.stringify compare).

**e. Trong `useEffect` populate serviceData**, set `initialSnapshotRef.current` sau khi setState.

**f. Trong `handleSubmit`** sau `await updateService(...)` thành công, reset: `initialSnapshotRef.current = currentSnapshot;`

**g. Đổi footer button** từ luôn enabled sang:
```tsx
<Button
  type="submit"
  variant="accent"
  disabled={isSubmitting || !hasChanges}
  className={!hasChanges && !isSubmitting ? 'bg-teal-600 hover:bg-teal-600 opacity-60' : 'bg-teal-600 hover:bg-teal-500'}
  title="Lưu (Ctrl+S)"
>
  {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
  {isSubmitting ? 'Đang lưu...' : (hasChanges ? 'Cập nhật' : 'Đã lưu')}
</Button>
```

---

## Verification Plan
- Typecheck: `bunx tsc --noEmit` sau khi sửa
- Repro thủ công: mở services/edit → không chạm field → nút "Đã lưu" bị disable; sửa field → nút "Cập nhật" active; submit → về "Đã lưu"
- SEO placeholder hiển thị đúng hint trên cả posts/create và services/create
