## Kế hoạch Debug Sticky Header

### Bước 1: Thêm console.log vào `Header.tsx`

Thêm debug log ngay sau khi merge config (khoảng line 112):

```tsx
// DEBUG: Xóa sau khi test
console.log('[Header Debug]', {
  savedConfig: savedConfig,
  headerSticky: config.headerSticky,
  finalClass: (config.headerSticky ?? true) ? 'sticky' : 'relative',
  headerStyle: headerStyle,
});
```

### Bước 2: Kiểm tra ở F12 Console

Mở frontend → F12 → Console → Xem output:
- `savedConfig.headerSticky` = `false` hay `undefined`?
- `config.headerSticky` = giá trị cuối cùng?
- `finalClass` = `sticky` hay `relative`?

### Bước 3: Kết luận & Fix

| Kết quả debug | Nguyên nhân | Fix |
|---------------|-------------|-----|
| `headerSticky: undefined` | Config chưa có field này | Re-save từ admin |
| `headerSticky: true` (dù đã set false) | Save không thành công | Debug mutation |
| `headerSticky: false` + class đúng | CSS issue hoặc parent overflow | Check CSS |

### Bước 4: Xóa code debug

Sau khi xác nhận xong, xóa đoạn `console.log` đã thêm.