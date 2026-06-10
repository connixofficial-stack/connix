## Yêu cầu

Thêm tùy chọn cho phép bật/tắt sticky header (header dính khi scroll).

## Hiện trạng

- **Classic**: `sticky top-0 z-50` - luôn sticky
- **Topbar**: `sticky top-0 z-50` - luôn sticky  
- **Transparent**: `absolute top-0` - không sticky (do overlay trên hero)

## Giải pháp

Thêm `headerSticky: boolean` vào config, áp dụng cho **Classic** và **Topbar** styles.

### Config mới
```tsx
headerSticky: boolean; // default: true
```

### Logic
```tsx
// Classic/Topbar
const positionClass = config.headerSticky 
  ? 'sticky top-0 z-50' 
  : 'relative z-50';
```

### UI Selector
Thêm ToggleRow "Sticky header" trong phần cấu hình Classic (bên cạnh các options background/separator).

## Files cần sửa

1. **`HeaderMenuPreview.tsx`** - thêm type + logic position
2. **`page.tsx`** - thêm default + ToggleRow
3. **`Header.tsx`** - đồng bộ logic position