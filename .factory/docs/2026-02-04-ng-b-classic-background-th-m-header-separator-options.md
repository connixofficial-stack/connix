## Vấn đề phát hiện

### 1. Frontend chưa đồng bộ pattern mới
`components/site/Header.tsx` vẫn dùng:
- Type cũ: `'white' | 'brand-subtle' | 'gradient-light'`
- Logic cũ trong `classicBackgroundStyle`

### 2. Thiếu Header Separator - phân định header với content
Cần thêm tùy chọn tạo ranh giới rõ ràng giữa header và phần còn lại.

---

## Giải pháp

### A. Đồng bộ Pattern mới trong Frontend
Cập nhật `components/site/Header.tsx`:
- Type: `'white' | 'dots' | 'stripes'`
- CSS patterns giống preview

### B. Thêm `headerSeparator` config với 4 options:

| ID | Label | CSS Effect |
|---|---|---|
| `none` | Không | Không có separator |
| `shadow` | Shadow | `box-shadow: 0 2px 8px rgba(0,0,0,0.08)` |
| `border` | Border | `border-bottom: 1px solid slate-200` |
| `gradient` | Gradient fade | Linear gradient fade to transparent |

### C. Files cần sửa

1. **`components/experiences/previews/HeaderMenuPreview.tsx`**
   - Thêm `headerSeparator` vào type `HeaderMenuConfig`
   - Áp dụng separator style trong preview

2. **`app/system/experiences/menu/page.tsx`**
   - Thêm UI selector cho `headerSeparator`
   - Default value trong `DEFAULT_CONFIG`

3. **`components/site/Header.tsx`** (QUAN TRỌNG)
   - Đồng bộ type `headerBackground` mới
   - Đồng bộ CSS patterns (dots, stripes)
   - Thêm logic `headerSeparator`
   - Áp dụng styles thực tế cho end-user

---

## Preview thay đổi

```tsx
// HeaderMenuConfig type
headerBackground: 'white' | 'dots' | 'stripes';
headerSeparator: 'none' | 'shadow' | 'border' | 'gradient';

// CSS implementation
const separatorStyle = {
  none: {},
  shadow: { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  border: { borderBottom: '1px solid #e2e8f0' },
  gradient: { /* pseudo-element gradient fade */ }
};
```