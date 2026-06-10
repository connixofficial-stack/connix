## Phân tích Layout Mới (Corporate Contact)

Layout split 2 cột chuyên nghiệp:
```
┌─────────────────────────────────────────────────────┐
│  Dark Side (5/12)   │    Light Side (7/12)         │
│  ─────────────────  │    ─────────────────         │
│  • Tiêu đề          │    • Form Section            │
│  • Mô tả            │      - Họ tên | Email        │
│  • Phone info       │      - Phone | Subject       │
│  • Email info       │      - Message               │
│  • Address info     │      - Button                │
│  • Social icons     │    • Map placeholder         │
│  • Decorative blur  │                              │
└─────────────────────────────────────────────────────┘
```

## Kế hoạch thay thế

### 1. Files cần sửa:
| File | Thay đổi |
|------|----------|
| `ContactPreview.tsx` | Thay `form-only` layout bằng corporate split |
| `app/(site)/contact/page.tsx` | Sync frontend với layout mới |

### 2. Chi tiết layout mới (form-only → corporate):
- **Dark sidebar (5/12)**: Contact info + social + decorative blurs
- **Light content (7/12)**: Form + Map (nếu bật)
- Mobile: Stack vertical (dark trên, light dưới)

### 3. Điều chỉnh theo shared config:
- `showContactInfo` → Hiển thị dark sidebar
- `showMap` → Hiển thị map phía dưới form
- `showSocialLinks` → Hiển thị social trong sidebar

### 4. Responsive:
- Desktop: flex-row (5/12 + 7/12)
- Mobile: flex-col (stack)