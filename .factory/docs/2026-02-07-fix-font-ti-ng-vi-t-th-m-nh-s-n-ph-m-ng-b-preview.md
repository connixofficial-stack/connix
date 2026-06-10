## Phân tích vấn đề

### 1. Font chữ không hợp tiếng Việt
- **Hiện tại**: `globals.css` dùng `Arial, Helvetica, sans-serif` - không tối ưu cho tiếng Việt
- **Giải pháp**: Đổi sang font sans-serif hỗ trợ tiếng Việt tốt như **"Be Vietnam Pro"** hoặc dùng **Geist** đã có (thêm subset `vietnamese`)

### 2. Thiếu ảnh sản phẩm trong đơn hàng
- **Schema hiện tại**: `orders.items` chỉ có `productId, productName, quantity, price, variantId, variantTitle` - **KHÔNG có image**
- **Giải pháp**: Thêm trường `productImage` vào schema và lưu khi tạo đơn hàng

### 3. Preview không khớp UI thực
- Cards layout thiếu phần "Tổng thanh toán" dưới header
- Kích thước components khác nhau (preview nhỏ hơn - ok cho viewport nhỏ)

---

## Kế hoạch thực hiện

### Bước 1: Fix font tiếng Việt
**File**: `app/layout.tsx`
- Thêm `subsets: ["latin", "vietnamese"]` cho Geist font

**File**: `app/globals.css`
- Đổi `font-family: Arial...` thành `font-family: var(--font-geist-sans), sans-serif`

### Bước 2: Thêm ảnh sản phẩm vào orders
**File**: `convex/schema.ts`
- Thêm `productImage: v.optional(v.string())` vào `orders.items`

**File**: `convex/orders.ts`
- Cập nhật `orderItemValidator` thêm trường `productImage`
- Cập nhật `normalizeOrderItems()` để lấy ảnh từ product khi tạo order

### Bước 3: Hiển thị ảnh trên UI
**File**: `app/(site)/account/orders/page.tsx`
- Thay icon Package bằng ảnh sản phẩm thực (fallback về icon nếu không có ảnh)

**File**: `components/experiences/previews/AccountOrdersPreview.tsx`
- Cập nhật mock data có ảnh
- Hiển thị ảnh trong preview (giữ fallback icon)

### Bước 4: Đồng bộ layout Preview với UI thực
- Thêm phần "Tổng thanh toán" vào cards layout trong preview