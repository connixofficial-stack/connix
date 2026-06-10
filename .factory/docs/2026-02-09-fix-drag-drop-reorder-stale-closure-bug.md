## Root Cause

Tương tự bug upload, `handleItemDrop` cũng dùng `items` từ closure:

```typescript
// Line 404-405
const dragIndex = items.findIndex(item => item.id === draggedItemId);
const dropIndex = items.findIndex(item => item.id === targetId);
```

Khi user upload ảnh xong rồi kéo thả, `items` trong closure vẫn là state cũ -> `findIndex` trả về -1 -> không thể reorder.

## Fix

Sửa `handleItemDrop` dùng `itemsRef.current` thay vì `items`:

**File:** `app/admin/components/MultiImageUploader.tsx`

```typescript
// Line 404-408
const handleItemDrop = useCallback((e: React.DragEvent, targetId: string | number) => {
  // ...
  const dragIndex = itemsRef.current.findIndex(item => item.id === draggedItemId);
  const dropIndex = itemsRef.current.findIndex(item => item.id === targetId);
  
  if (dragIndex === -1 || dropIndex === -1) {return;}

  const newItems = [...itemsRef.current];
  // ...
}, [draggedItemId, onChange]); // Bỏ items khỏi deps
```

### Checklist
1. Cập nhật `handleItemDrop` dùng `itemsRef.current`
2. Bỏ `items` khỏi dependency array
3. Chạy oxlint
4. Test kéo thả đổi vị trí ảnh