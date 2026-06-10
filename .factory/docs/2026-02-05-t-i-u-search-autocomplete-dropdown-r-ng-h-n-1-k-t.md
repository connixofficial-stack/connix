## Vấn đề

1. **Dropdown quá hẹp**: `absolute left-0 right-0` khiến dropdown bị giới hạn bởi container (w-48 = 192px), text bị truncate
2. **Minimum 2 ký tự**: `debouncedQuery.length >= 2` yêu cầu phải gõ 2 ký tự mới search

## Giải pháp

**File:** `components/site/HeaderSearchAutocomplete.tsx`

### 1. Mở rộng dropdown width
```tsx
// Trước
<div className="absolute left-0 right-0 mt-2 ...">

// Sau - dropdown có min-width cố định, căn phải để không tràn ra ngoài màn hình
<div className="absolute right-0 mt-2 min-w-[320px] ...">
```

### 2. Giảm minimum xuống 1 ký tự
```tsx
// Trước
const shouldSearch = !disabled && debouncedQuery.length >= 2 && canSearch;

// Sau
const shouldSearch = !disabled && debouncedQuery.length >= 1 && canSearch;
```

**Lưu ý về performance:**
- 1 ký tự có thể tạo nhiều requests hơn, nhưng với debounce 300ms và limit 5 results thì vẫn ổn
- Convex có rate limiting nên không lo vấn đề tải server