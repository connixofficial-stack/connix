## Vấn đề
14/15 admin list pages mất pageSize khi F5 vì chỉ lưu trong React state, không persist localStorage.

## Solution: localStorage per-page (bám pattern visibleColumns)

### 1. Tạo reusable hook
**File:** `app/admin/components/usePersistedPageSize.ts`
```typescript
export function usePersistedPageSize(storageKey: string, defaultValue: number) {
  const [pageSize, setPageSize] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(storageKey);
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    if (pageSize !== null) {
      localStorage.setItem(storageKey, String(pageSize));
    }
  }, [pageSize, storageKey]);

  return [pageSize ?? defaultValue, setPageSize] as const;
}
```

### 2. Refactor 14 pages
Replace:
```typescript
// Before
const [pageSizeOverride, setPageSizeOverride] = useState<number | null>(null);
const resolvedPageSize = pageSizeOverride ?? 20;

// After
const [resolvedPageSize, setPageSizeOverride] = usePersistedPageSize('admin_X_page_size', 20);
```

**Files:** categories, product-categories, products, orders, customers, posts, comments, reviews, promotions, services, users, wishlist, notifications (13 files)

### 3. Verify
- Manual: đổi pageSize → F5 → check persist
- Typecheck: `bunx tsc --noEmit`
- Commit: `fix: persist pageSize across F5 for all admin list pages`

## Tradeoff
✅ Đơn giản, bám pattern có sẵn
✅ Mỗi page pageSize riêng (UX tốt)
✅ Không cần backend change