## Root Cause

Bug **stale closure** trong `handleFileUpload`:
1. `handleMultipleFiles` tạo `newItems` và gọi `onChange(updatedItems)` 
2. Ngay sau đó gọi `handleFileUpload(newItems[i].id, file)`
3. Nhưng `handleFileUpload` vẫn giữ reference đến `items` cũ (từ closure)
4. Khi upload xong, `items.map()` không tìm thấy `itemId` mới tạo -> ảnh bị mất

## Fix

Sửa `handleFileUpload` để dùng **functional update** thay vì reference trực tiếp:

```typescript
// Trước (bug)
onChange(items.map(item => 
  item.id === itemId 
    ? { ...item, [imageKey]: result.url ?? '', storageId } as T
    : item
));

// Sau (fix) - dùng callback pattern
// Cần truyền updater function vào onChange
```

**Tuy nhiên**, `onChange` prop chỉ nhận `items: T[]`, không phải updater function. 

### Giải pháp thực tế

Sử dụng `useRef` để luôn có reference mới nhất của `items`:

**File:** `app/admin/components/MultiImageUploader.tsx`

```typescript
// Thêm ref để track items mới nhất
const itemsRef = useRef(items);
useEffect(() => {
  itemsRef.current = items;
}, [items]);

// Trong handleFileUpload, thay items bằng itemsRef.current
onChange(itemsRef.current.map(item => 
  item.id === itemId 
    ? { ...item, [imageKey]: result.url ?? '', storageId } as T
    : item
));
```

### Checklist
1. Thêm `itemsRef` và `useEffect` sync
2. Cập nhật `handleFileUpload` dùng `itemsRef.current`
3. Cập nhật `handleRemove` nếu cũng bị bug tương tự
4. Test upload ảnh trong /admin/products/create và /edit
