## Thay đổi

Xóa trường input "Placeholder search" trong config panel tại `/system/experiences/menu/page.tsx`.

### File: `app/system/experiences/menu/page.tsx`

Xóa đoạn:
```tsx
<div className="space-y-1">
  <Label className="text-xs">Placeholder search</Label>
  <Input
    value={config.search.placeholder}
    onChange={(e) => updateSearch('placeholder', e.target.value)}
    className="h-8 text-sm"
    disabled={!config.search.show}
  />
</div>
```

### Kết quả

- Placeholder sẽ luôn dùng default: `"Tìm kiếm..."` (đã có trong DEFAULT_CONFIG)
- Giảm 1 field config, UI gọn hơn
- Tuân thủ CoC: convention > configuration