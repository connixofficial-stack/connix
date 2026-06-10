## Problem Graph (DARE Framework)

```
1. [Main] Skeleton hiển thị mãi trên /services
   ├── 1.1 [Sub] isLoadingServices = true mãi mãi
   │   └── 1.1.1 [ROOT CAUSE] Logic thiếu kiểm tra infiniteStatus === 'Exhausted'
   └── 1.2 [Sub] Không liên quan đến ảnh
```

---

## Root Cause Analysis

**Vị trí bug:** `app/(site)/services/page.tsx` dòng 233-236

```tsx
const isLoadingServices = listConfig.paginationType === 'pagination' && (
  useCursorPagination
    ? infiniteStatus === 'LoadingFirstPage' || infiniteResults.length < requiredCount
    : paginatedServices === undefined
);
```

**Vấn đề:**
- Khi `useCursorPagination = true` và tổng services trong DB < `requiredCount` (= page * postsPerPage)
- Ví dụ: có 9 services, postsPerPage = 12 → `requiredCount = 12`
- `infiniteResults.length = 9 < 12` → điều kiện **LUÔN TRUE**
- `infiniteStatus = 'Exhausted'` (đã load hết) nhưng **KHÔNG được kiểm tra**
- → **Skeleton hiển thị mãi mãi!**

**Xác nhận từ F12:**
- Log `[Intervention] Images loaded lazily` và LCP warning chứng tỏ page đã render
- Skeleton chỉ hiển thị lâu, không phải do ảnh lỗi

---

## Giải pháp

Thêm điều kiện kiểm tra `infiniteStatus !== 'Exhausted'`:

```tsx
const isLoadingServices = listConfig.paginationType === 'pagination' && (
  useCursorPagination
    ? infiniteStatus === 'LoadingFirstPage' || 
      (infiniteStatus !== 'Exhausted' && infiniteResults.length < requiredCount)
    : paginatedServices === undefined
);
```

**Logic mới:**
- Nếu `infiniteStatus === 'Exhausted'` → đã load hết data → **không loading nữa**
- Chỉ loading khi còn data để load VÀ chưa đủ `requiredCount`

---

## Files cần sửa

1. `app/(site)/services/page.tsx` - dòng 233-236

**Bonus:** Kiểm tra và fix tương tự cho:
- `app/(site)/products/page.tsx` 
- `app/(site)/posts/page.tsx`
(Có cùng pattern bug)