## Phân tích vấn đề

### 1. Header Background - Quá đơn điệu
**Root Cause:** Classic style chỉ có `bg-white` cứng, không có tùy chọn cấu hình. Topbar/Transparent có gradient effects nhưng Classic thì không.

**Best Practice (Websearch):**
- Gradient backgrounds 2025-2026 trend: subtle gradient tăng visual interest
- Light background + accent color combination là standard
- Không nên quá rườm rà, KISS principle

### 2. Cart, Wishlist, Login, CTA - Không có ý nghĩa với preview/frontend
**Root Cause:** Các toggle ON/OFF nhưng:
- URL inputs (`/cart`, `/wishlist`, `/login`, `/contact`) là **thừa** vì đã có các routes chuẩn
- Không liên kết logic với modules đã có (Cart Module, Wishlist Module)
- Preview không phản ánh được trạng thái modules

**Best Practice (Baymard UX):**
- Cart/Wishlist visibility nên **auto-bind** với module enabled status
- "Convention over Configuration" - không cần user nhập URL thủ công

### 3. Topbar & Search - Không hợp lý  
**Root Cause:**
- Hotline/Email nhập thủ công khi đã có Contact Settings
- Search placeholder và options không quan trọng với admin config
- `showTrackOrder`, `showStoreSystem` là URLs thừa - cần xác định module nào handle

### 4. Liên kết & Brand - Cần CoC
**Root Cause:** User phải tự nhập `/cart`, `/wishlist`, `/login`, `/contact` trong khi đã có:
- Cart Experience (`/cart`) 
- Wishlist Experience (`/wishlist`)
- Contact Experience (`/contact`)
- Auth routes built-in (`/login`)

---

## Giải pháp đề xuất

### A. Simplify Config - Áp dụng CoC

#### Loại bỏ các URL inputs không cần thiết:
```diff
- cart.url: '/cart'        // Hardcode trong code
- wishlist.url: '/wishlist'
- login.url: '/login'  
- cta.url: '/contact'      // Liên kết với Contact Experience
- topbar.trackOrderUrl
- topbar.storeSystemUrl
```

#### Auto-bind với Module status:
```tsx
// Cart toggle chỉ enabled khi cartModule.enabled = true
// Wishlist toggle chỉ enabled khi wishlistModule.enabled = true
// Đã có sẵn trong code, chỉ cần bỏ URL inputs
```

### B. Cải thiện Classic Preview - Header Background

Thêm config options cho Classic style:
```ts
type ClassicHeaderStyle = {
  headerBg: 'white' | 'brand-subtle' | 'gradient-light';
  showBrandAccent: boolean; // Show thin brand color line at top
};
```

| Option | Visual |
|--------|--------|
| `white` | Background trắng hiện tại |
| `brand-subtle` | White + brand color 5% opacity |
| `gradient-light` | Subtle gradient từ white → brand 3% |

### C. Restructure Config Panels

**Trước (4 panels phức tạp):**
1. Hiển thị (6 toggles + module deps)
2. Topbar & Search (nhiều inputs)
3. Liên kết & Brand (7 inputs thừa)
4. Module liên quan

**Sau (3 panels gọn gàng):**

1. **Hiển thị** (giữ nguyên)
   - Topbar, Search, Cart, Wishlist, Login, CTA toggles
   - Disabled state khi module chưa bật
   
2. **Cấu hình chi tiết** 
   - Brand name
   - Topbar: "Dùng settings liên hệ" toggle (đã có)
   - CTA text (chỉ text, URL auto = /contact)
   - Login text (chỉ text, URL auto = /login)
   - Header style (cho Classic): white/brand-subtle/gradient-light

3. **Module & Experience liên quan** 
   - Links đến: Cart, Wishlist, Products, Posts modules
   - Links đến: Contact, Checkout experiences (mới)

### D. Preview Enhancement cho Classic

```tsx
// Thêm visual cho Classic style
const renderClassicStyle = () => (
  <div className={cn(
    "dark:bg-slate-900",
    config.headerStyle === 'white' && "bg-white",
    config.headerStyle === 'brand-subtle' && "bg-gradient-to-r from-white to-[brandColor/5]",
    config.headerStyle === 'gradient-light' && "bg-gradient-to-b from-[brandColor/3] to-white"
  )}>
    {/* Optional: thin brand accent line at top */}
    {config.showBrandAccent && (
      <div className="h-0.5" style={{ backgroundColor: brandColor }} />
    )}
    ...
  </div>
)
```

---

## Các files cần thay đổi

1. **`app/system/experiences/menu/page.tsx`**
   - Loại bỏ URL inputs thừa
   - Thêm headerStyle config cho Classic
   - Restructure ConfigPanel cards
   - Thêm ExperienceModuleLink cho Contact, Checkout experiences

2. **`components/experiences/previews/HeaderMenuPreview.tsx`**
   - Cập nhật `HeaderMenuConfig` type
   - Implement Classic header background variations
   - Optional brand accent line

3. **`components/experiences/ExperienceModuleLink.tsx`** (nhỏ)
   - Thêm colorScheme 'blue' cho Contact link (nếu chưa có)

---

## Ước lượng thay đổi

| File | Additions | Deletions | Impact |
|------|-----------|-----------|--------|
| menu/page.tsx | ~30 | ~80 | Giảm complexity |
| HeaderMenuPreview.tsx | ~25 | ~5 | Thêm visual options |
| ExperienceModuleLink.tsx | ~5 | 0 | Nhỏ |

**Tổng:** Giảm ~30 lines code, UI cleaner, UX better theo CoC principle.