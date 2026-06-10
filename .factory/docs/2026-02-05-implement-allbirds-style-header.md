## Implement Header Style "Allbirds" (thay thế Centered)

Dựa trên screenshot Allbirds.com, sẽ implement header với cấu trúc:

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [Announcement Bar - brandColor background, white text]      │
│ "Shop New Arrivals. Shop Men | Shop Women"                  │
├─────────────────────────────────────────────────────────────┤
│ [Logo]          [MEN | WOMEN | SALE]      [About] 🔍 👤 🛒  │
│                      ↓ hover                                │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ [Categories]  [Col 1]  [Col 2]  [Col 3]  [Images]     │   │
│ │ COLLECTION    SHOES    PICKS    ADD-ONS   [Featured]  │   │
│ │ ...           ...      ...      ...       [Photos]    │   │
│ └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Thay đổi cần làm

**1. Rename layout type:**
- `centered` → `allbirds` (hoặc `minimal`)

**2. HeaderMenuPreview.tsx:**
- Tạo `renderAllbirdsStyle()` với:
  - Topbar announcement (dùng brandColor)
  - Main header: Logo trái | Menu giữa | Actions phải
  - Mega menu dropdown khi hover (hiện categories + featured images)
  - Sticky header

**3. Header.tsx (frontend):**
- Tương tự preview, render Allbirds-style header
- Mega menu với sub-categories từ menu tree
- Responsive: mobile collapse thành hamburger menu

**4. page.tsx (config):**
- Đổi label "Centered" → "Allbirds" 
- Description: "Logo trái, menu giữa, mega menu khi hover"
- Giữ nguyên config options hiện có (topbar, search, cart, CTA...)

### Features chính:
- ✅ Announcement topbar (có thể bật/tắt)
- ✅ Logo bên trái
- ✅ Menu items giữa với mega menu dropdown
- ✅ Actions (search, account, cart) bên phải
- ✅ Sticky header
- ✅ Mobile responsive với hamburger menu

### Files cần sửa:
1. `components/experiences/previews/HeaderMenuPreview.tsx`
2. `components/site/Header.tsx`
3. `app/system/experiences/menu/page.tsx`