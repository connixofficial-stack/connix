## Vấn đề hiện tại
Ở cả `posts/edit` và `services/edit`, logic SEO description auto-fill:
```typescript
const resolvedMetaDescription = truncateText(stripHtml(excerpt || content || ''), 160);
```
Luôn ưu tiên `excerpt` (mô tả ngắn) trước, không kiểm tra field đó có được bật trong module settings hay không.

## Giải pháp
Sửa logic `resolvedMetaDescription` để kiểm tra `enabledFields.has('excerpt')`:

### File 1: `app/admin/posts/[id]/edit/page.tsx`
```typescript
// Trước
const resolvedMetaDescription = truncateText(stripHtml(excerpt || content || ''), 160);

// Sau  
const resolvedMetaDescription = truncateText(
  stripHtml(enabledFields.has('excerpt') && excerpt ? excerpt : content || ''), 
  160
);
```

### File 2: `app/admin/services/[id]/edit/page.tsx`
Tương tự như trên.

## Logic mới
- Nếu "Mô tả ngắn" được bật (`excerpt` field enabled) VÀ có giá trị → dùng `excerpt`
- Còn lại → dùng `content` lấy 160 ký tự đầu