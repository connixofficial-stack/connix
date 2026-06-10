## Phase 6: Frontend Experience - Variant Selector

### Tổng quan
Triển khai UI chọn variant trên trang chi tiết sản phẩm và hiển thị variant trong giỏ hàng/checkout.

### Công việc cần làm

#### 1. Tạo VariantSelector Component
**File:** `components/products/VariantSelector.tsx`
- Hiển thị options (Color, Size, v.v.) dưới dạng button group/chips
- Hỗ trợ color swatch cho option type "color" 
- Tự động chọn variant dựa trên tổ hợp options
- Hiển thị stock/price của variant được chọn
- Disable options nếu không có variant khả dụng

#### 2. Cập nhật Product Detail Page
**File:** `app/(site)/products/[slug]/page.tsx`
- Query `productVariants.listByProductActive` nếu product.hasVariants
- Query `productOptions` + `productOptionValues` để build selector
- Truyền selectedVariantId vào handleAddToCart/handleBuyNow
- Cập nhật price/stock display theo variant được chọn
- Validate phải chọn variant trước khi thêm giỏ

#### 3. Cập nhật CartContext
**File:** `lib/cart/CartContext.tsx`
- Mở rộng `addItem(productId, quantity, variantId?)` 
- Truyền variantId vào mutation addItemMutation

#### 4. Cập nhật Cart Page UI
**File:** `app/(site)/cart/page.tsx`
- Hiển thị variant info (nếu có) dưới tên sản phẩm
- Query variant title từ optionValues (hoặc sử dụng cached title)

#### 5. Cập nhật Experience Preview (nếu cần)
**File:** `components/experiences/previews/ProductDetailPreview.tsx`
- Thêm mock variant selector vào preview

#### 6. Kiểm tra tích hợp
- Lint với `bunx oxlint --type-aware --type-check --fix`
- Commit: "feat: add variant selector to product detail"

### Phạm vi KHÔNG làm
- Không thay đổi admin pages (đã done Phase 4)
- Không thay đổi Convex backend (đã done Phase 5)
- Không thêm variant filtering trên product list page

### Ước tính
- ~5-7 files thay đổi
- Chủ yếu là frontend React components