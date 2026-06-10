## Vấn đề hiện tại

Hiện tại `Classic background` có 3 options nhưng **không có sự khác biệt rõ ràng**:
- **White**: nền trắng thuần
- **Brand**: `linear-gradient(90deg, brandColor 8% opacity → white)` - quá nhẹ, gần như không thấy
- **Gradient**: `linear-gradient(180deg, brandColor 8% opacity → white)` - tương tự, không khác biệt

## Giải pháp: Thay bằng các Pattern phổ biến trong UI/UX

Dựa vào best practices từ Hero Patterns, MagicPattern, CSS-Tricks - các senior frontend thường dùng:

### Option A: Giữ nguyên số lượng (3 options)
| ID | Label | Mô tả | CSS Pattern |
|---|---|---|---|
| `white` | Solid | Nền trắng thuần (giữ nguyên) | `background: white` |
| `dots` | Dots | Chấm tròn nhỏ lặp lại - phổ biến nhất | `radial-gradient()` với brand color, opacity 10-15% |
| `stripes` | Stripes | Sọc chéo 45° - classic pattern | `repeating-linear-gradient(45deg)` |

### Option B: Mở rộng thêm (5-6 options)
| ID | Label | CSS Pattern |
|---|---|---|
| `white` | Solid | Nền trắng |
| `dots` | Dots | Chấm tròn nhỏ (polka dots) |
| `stripes` | Stripes | Sọc chéo 45° |
| `grid` | Grid | Lưới vuông nhẹ (graph paper style) |
| `zigzag` | Zigzag | Sóng răng cưa ngang |
| `noise` | Texture | Subtle noise/grain texture |

### Preview minh họa (CSS thuần, không cần image):

```css
/* Dots pattern */
background-image: radial-gradient(circle, ${brandColor}20 1px, transparent 1px);
background-size: 20px 20px;

/* Diagonal stripes */
background-image: repeating-linear-gradient(
  45deg,
  transparent,
  transparent 10px,
  ${brandColor}10 10px,
  ${brandColor}10 20px
);

/* Grid pattern */
background-image: 
  linear-gradient(${brandColor}08 1px, transparent 1px),
  linear-gradient(90deg, ${brandColor}08 1px, transparent 1px);
background-size: 24px 24px;
```

## Thay đổi cần làm

1. **Cập nhật `HeaderMenuConfig` type** - thay đổi `headerBackground` values
2. **Cập nhật `classicBackgroundStyle`** trong `HeaderMenuPreview.tsx` - implement CSS patterns thực sự
3. **Cập nhật UI selector** trong `page.tsx` - labels và options mới

## Files cần sửa
- `components/experiences/previews/HeaderMenuPreview.tsx`
- `app/system/experiences/menu/page.tsx`
