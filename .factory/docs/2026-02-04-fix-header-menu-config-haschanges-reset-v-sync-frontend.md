## Root Cause Analysis

### 1. Nút Lưu không chuyển xám sau khi save
**Nguyên nhân:** Hook `useExperienceConfig` không reset `draftConfig` về `null` sau khi save thành công. Khi Convex cập nhật `serverConfig`, hook vẫn giữ `draftConfig` cũ → so sánh khác nhau → `hasChanges = true`.

**Fix:** Thêm effect để reset `draftConfig` khi `serverConfig` thay đổi (tức là sau khi save).

### 2. Config không áp dụng ở frontend  
**Nguyên nhân:** File `components/site/Header.tsx` vẫn dùng **interface cũ** với các fields đã bị loại bỏ:
- `cart.url`, `wishlist.url`, `login.url`, `cta.url`
- `topbar.trackOrderUrl`, `topbar.storeSystemUrl`

Đồng thời thiếu các fields mới:
- `headerBackground`, `showBrandAccent`

---

## Giải pháp

### A. Fix useExperienceConfig hook
```tsx
// Reset draft khi serverConfig thay đổi (sau save)
useEffect(() => {
  setDraftConfig(null);
}, [serverConfig]);
```

### B. Sync Header.tsx với type mới

**1. Cập nhật interface:**
```ts
interface HeaderConfig {
  brandName?: string;
  headerBackground?: 'white' | 'brand-subtle' | 'gradient-light';
  showBrandAccent?: boolean;
  cart?: { show?: boolean };  // Bỏ url
  wishlist?: { show?: boolean };  // Bỏ url
  login?: { show?: boolean; text?: string };  // Bỏ url
  cta?: { show?: boolean; text?: string };  // Bỏ url
  topbar?: TopbarConfig;  // Bỏ trackOrderUrl, storeSystemUrl
  search?: SearchConfig;
}
```

**2. Hardcode default URLs (CoC):**
```ts
const DEFAULT_LINKS = {
  cart: '/cart',
  wishlist: '/wishlist',
  login: '/login',
  cta: '/contact',
  trackOrder: '/orders/tracking',
  storeSystem: '/stores',
};
```

**3. Implement headerBackground cho Classic style:**
```tsx
// Trong Classic style
const classicBgStyle = useMemo(() => {
  if (config.headerBackground === 'brand-subtle') {
    return { backgroundImage: `linear-gradient(90deg, ${brandRgba(0.08)} 0%, #fff 70%)` };
  }
  if (config.headerBackground === 'gradient-light') {
    return { backgroundImage: `linear-gradient(180deg, ${brandRgba(0.08)} 0%, #fff 60%)` };
  }
  return { backgroundColor: '#ffffff' };
}, [config.headerBackground, brandColor]);
```

---

## Files cần thay đổi

| File | Thay đổi |
|------|----------|
| `lib/experiences/useExperienceConfig.ts` | Thêm useEffect reset draftConfig |
| `components/site/Header.tsx` | Sync interface + implement background styles |

---

## Ước lượng

- ~5 lines thêm vào hook
- ~40 lines sửa trong Header.tsx (interface + implementation)