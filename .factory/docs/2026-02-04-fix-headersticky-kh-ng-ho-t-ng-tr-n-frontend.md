## Vấn đề phát hiện

Sau khi xem code, logic merge config đã đúng:
```tsx
const config: HeaderConfig = {
  ...DEFAULT_CONFIG,
  ...savedConfig, // headerSticky sẽ được override từ đây
  // nested objects được merge riêng
};
```

**Nguyên nhân khả năng cao**: Giá trị `headerSticky` trong DB có thể là `undefined` (vì config cũ chưa có field này), nên `config.headerSticky` fallback về `undefined` thay vì `true`.

## Giải pháp

Thêm fallback rõ ràng khi đọc `headerSticky`:

```tsx
const classicPositionClass = (config.headerSticky ?? true) 
  ? 'sticky top-0 z-50' 
  : 'relative z-50';
```

Hoặc đảm bảo merge đúng với default:

```tsx
const config: HeaderConfig = {
  ...DEFAULT_CONFIG,
  ...savedConfig,
  headerSticky: savedConfig.headerSticky ?? DEFAULT_CONFIG.headerSticky,
  // ...other fields
};
```

## Files cần sửa

- `components/site/Header.tsx` - thêm nullish coalescing fallback cho `headerSticky`