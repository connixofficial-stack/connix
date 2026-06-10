
## Vấn đề

Khi admin tắt feature **"Quản lý kho"** (`enableStock` = false) tại `/system/modules/products`:
- `enabledFields.has('stock')` trả về `false` → `showStock = false`
- **NHƯNG:** các handlers `handleAddToCart`, `handleBuyNow`, `handlePrimaryAction` vẫn guard bằng `product.stock <= 0` → CTA bị disabled/block khi stock DB = 0
- Wishlist page không kiểm tra `showStock` gì cả → luôn guard bằng `product.stock === 0`
- `QuickAddVariantModal` không check `showStock` → `inStock = stockValue > 0` cứng
- `layout.tsx` của product detail truyền `inStock: product.stock > 0` vào structured data

**Rule chuẩn nghiệp vụ (Amazon/Shopee/Tiki):** Khi không quản lý kho = mặc định còn hàng vô hạn. Chỉ khi bật tồn kho mới kiểm tra.

---

## Các file cần sửa (6 file)

### 1. `app/(site)/products/page.tsx`
**3 handler functions** (~line 432, 460, 482):
```tsx
// TRƯỚC:
if (product.stock <= 0) { return; }

// SAU: bỏ hết 3 guard này
// (showStock đã false nên không cần check)
```
Thực tế hơn: đổi guard thành `if (showStock && product.stock <= 0) { return; }`

**`ProductCardActions` component** (~line 920):
```tsx
// TRƯỚC:
const isOutOfStock = product.stock <= 0;

// SAU:
const isOutOfStock = showStock && product.stock <= 0;
```
→ Cần truyền `showStock` prop vào `ProductCardActions` và dùng nó.

**`ProductList` component** – buttons disabled (~line 1090, 1100, 1102):
```tsx
// TRƯỚC: disabled={product.stock <= 0}
// SAU: disabled={showStock && product.stock <= 0}
```

### 2. `app/(site)/products/[slug]/page.tsx`
**3 style components** (ClassicStyle ~line 1020, ModernStyle ~line 1295, MinimalStyle ~line 1641):

`inStock` đã đúng: `const inStock = !showStock || stockValue > 0` ✅

Cần sửa phần **quantity tăng** và **quantity disabled**:
```tsx
// TRƯỚC:
onClick={() => setQuantity(q => Math.min(showStock ? stockValue : 99, q + 1))}
disabled={showStock && quantity >= stockValue}

// Đã đúng pattern, chỉ cần kiểm tra MinimalStyle line ~1641 có nhất quán không
```
→ **Sửa chính**: `requireStockForBuyNow` prop truyền từ root page — hiện nay `requireStockForBuyNow = saleMode === 'cart'` (không phụ thuộc `showStock`). Cần thêm:
```tsx
const requireStockForBuyNow = saleMode === 'cart' && showStock;
```

### 3. `app/(site)/products/[slug]/layout.tsx`
~line 122:
```tsx
// TRƯỚC:
inStock: product.stock > 0,

// SAU: cần biết enableStock. Layout này là server component nên:
// Fetch enableStock feature từ Convex, hoặc đơn giản hơn:
inStock: true, // default true khi không manage stock
```
Cách thực tế: fetch `listEnabledModuleFields` để check có 'stock' không.

### 4. `app/(site)/wishlist/page.tsx`
Wishlist page **không** có `showStock` logic. Cần thêm:
```tsx
const stockFeature = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableStock', moduleKey: 'products' });
const showStock = stockFeature?.enabled ?? true; // default true (safe)
```
Sau đó thay toàn bộ:
- `product.stock > 0` → `!showStock || product.stock > 0`
- `product.stock === 0` → `showStock && product.stock === 0`
- `disabled={product.stock === 0}` → `disabled={showStock && product.stock === 0}`
- Badge "Hết hàng"/"Sẵn hàng" → chỉ render khi `showStock`

### 5. `components/products/QuickAddVariantModal.tsx`
~line 182-183:
```tsx
// TRƯỚC:
const stockValue = selectedVariant?.stock ?? product.stock;
const inStock = stockValue > 0;

// SAU: thêm check enableStock
const enableStock = useQuery(api.admin.modules.getModuleFeature, { featureKey: 'enableStock', moduleKey: 'products' });
const showStock = enableStock?.enabled ?? true;
const stockValue = selectedVariant?.stock ?? product.stock;
const inStock = !showStock || stockValue > 0;
```
Và bỏ guard `disabled={!inStock || quantity >= stockValue}` → `disabled={showStock && quantity >= stockValue}`.
Badge "Còn hàng/Hết hàng" → chỉ render khi `showStock`.

### 6. `app/(site)/products/[slug]/page.tsx` — root handler
~line cuối:
```tsx
// TRƯỚC:
const requireStockForBuyNow = saleMode === 'cart';
// SAU:
const showStock = enabledFields.has('stock');
const requireStockForBuyNow = saleMode === 'cart' && showStock;
```

---

## Không cần sửa (backend đã đúng)

- `convex/cart.ts` — đã có `stockCheckEnabled` gate ✅
- `convex/orders.ts` — đã có `stockCheckEnabled` gate ✅
- `components/site/ProductListSection.tsx` (home-components) — chỉ link đến `/products/${slug}`, không có CTA add-to-cart → **không cần sửa**
- `/system/modules/products` config page — không liên quan

---

## Checklist Audit bổ sung (nên xem xét sau)

| # | Surface | Vấn đề tiềm ẩn |
|---|---------|----------------|
| 1 | `admin/orders/create/page.tsx` line 200 | Filter `p.stock > 0` khi tạo order trong admin → nên giữ nguyên (admin thấy tồn kho thực tế) |
| 2 | `convex/analytics.ts` line 207, 400 | Low-stock analytics vẫn tính kể cả khi tắt `enableStock` → nên gate by `enableStock` |
| 3 | `app/admin/dashboard/page.tsx` | Widget "Sắp hết hàng" hiển thị kể cả khi tắt `enableStock` → nên ẩn widget |
| 4 | `app/(site)/account/orders/page.tsx` | Đã có `stockEnabled` gate ✅ |
| 5 | `app/admin/categories/[id]/edit/page.tsx` | Hiện `stock < 10` màu đỏ → admin page, giữ nguyên |

---

## Tóm tắt thay đổi

**Rule mới:** `showStock = enabledFields.has('stock')` (hoặc `stockFeature.enabled`)  
**Khi `showStock = false`:** CTA luôn active, ẩn toàn bộ text "Hết hàng"/"Còn hàng", không giới hạn quantity bằng stock DB.

**6 file sửa:**
1. `app/(site)/products/page.tsx` — 3 handlers + `ProductCardActions` + `ProductList` disabled buttons
2. `app/(site)/products/[slug]/page.tsx` — `requireStockForBuyNow` thêm điều kiện `showStock`
3. `app/(site)/products/[slug]/layout.tsx` — `inStock` trong structured data
4. `app/(site)/wishlist/page.tsx` — thêm `showStock` query + áp dụng toàn page
5. `components/products/QuickAddVariantModal.tsx` — thêm `showStock` query + áp dụng
6. (bao gồm trong #2) `requireStockForBuyNow` logic

**Audit nên làm thêm:** Analytics widget "sắp hết hàng" trên admin dashboard + `convex/analytics.ts` nên gate by `enableStock`.
