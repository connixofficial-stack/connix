
## Phân tích

- **X (Twitter mới)**: Lucide có sẵn icon tên `X` → dùng trực tiếp. Màu gốc: `#000000` nền đen, icon trắng.
- **Pinterest**: Lucide **không có** → cần custom SVG inline. Màu gốc: `#E60023` nền đỏ, icon trắng.

## Các file cần sửa (2 file)

---

### 1. `FooterPreview.tsx`

**Thêm import `X` từ lucide-react:**
```tsx
import { Globe, Facebook, Github, Instagram, Linkedin, Twitter, Youtube, X } from 'lucide-react';
```

**Thêm component `PinterestIcon` (custom SVG)** ngay sau `ZaloIcon`:
```tsx
const PinterestIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);
```

**Cập nhật `SocialIcon` switch** - thêm 2 case:
```tsx
case 'x': { return <X size={size} />; }
case 'pinterest': { return <PinterestIcon size={size} />; }
```

**Cập nhật `SOCIAL_ORIGINAL_COLORS`** - thêm 2 entry:
```tsx
x: { bg: '#000000', icon: '#ffffff' },
pinterest: { bg: '#E60023', icon: '#ffffff' },
```

---

### 2. `FooterForm.tsx`

**Thêm X và Pinterest vào `SOCIAL_PLATFORMS`:**
```tsx
const SOCIAL_PLATFORMS = [
  { icon: 'facebook', key: 'facebook', label: 'Facebook' },
  { icon: 'instagram', key: 'instagram', label: 'Instagram' },
  { icon: 'youtube', key: 'youtube', label: 'Youtube' },
  { icon: 'tiktok', key: 'tiktok', label: 'TikTok' },
  { icon: 'zalo', key: 'zalo', label: 'Zalo' },
  { icon: 'x', key: 'x', label: 'X (Twitter)' },
  { icon: 'pinterest', key: 'pinterest', label: 'Pinterest' },
];
```

---

## Checklist
- [ ] `FooterPreview.tsx`: import `X` từ lucide-react
- [ ] `FooterPreview.tsx`: thêm `PinterestIcon` SVG component
- [ ] `FooterPreview.tsx`: thêm 2 case vào `SocialIcon` switch
- [ ] `FooterPreview.tsx`: thêm 2 entry vào `SOCIAL_ORIGINAL_COLORS`
- [ ] `FooterForm.tsx`: thêm X + Pinterest vào `SOCIAL_PLATFORMS`
- [ ] Chạy `bunx tsc --noEmit` kiểm tra type
- [ ] Commit
