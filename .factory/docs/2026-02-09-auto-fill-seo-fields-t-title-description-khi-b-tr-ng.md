## Phân tích hiện trạng

**Preview SEO đã hoạt động đúng** - hiển thị fallback khi trống:
- Products: `metaTitle || name`, nhưng metaDescription không fallback về description
- Services/Posts: `metaTitle || title`, `metaDescription || excerpt` ✓

**Vấn đề:** Khi submit với SEO fields trống → gửi `undefined` → DB không lưu → cần auto-fill giá trị fallback trước khi gửi.

---

## Kế hoạch thực hiện

### 1. Tạo helper truncateText() trong `lib/seo.ts`
```typescript
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + '...';
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
```

### 2. Sửa handleSubmit() tại 6 trang

**Logic auto-fill khi submit:**
```typescript
// SEO Title: fallback về title/name (cắt ≤60 ký tự)
const finalMetaTitle = metaTitle.trim() || truncateText(title.trim(), 60);

// SEO Description: fallback về excerpt/description (cắt ≤160 ký tự)
const finalMetaDescription = metaDescription.trim() || truncateText(stripHtml(excerpt || description), 160);
```

**Các file cần sửa:**
- `app/admin/posts/create/page.tsx`
- `app/admin/posts/[id]/edit/page.tsx`
- `app/admin/services/create/page.tsx`
- `app/admin/services/[id]/edit/page.tsx`
- `app/admin/products/create/page.tsx`
- `app/admin/products/[id]/edit/page.tsx`

### 3. Cập nhật Preview để nhất quán
- Products: sửa fallback metaDescription từ hardcode → `description` (sau khi strip HTML)

---

## Lưu ý
- Không thay đổi backend/Convex
- SEO fields vẫn optional trong form UI
- Chỉ auto-fill khi submit, không thay đổi state trong form