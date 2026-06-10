# DARE Analysis v3: Checkout Experience - TOÀN DIỆN

## Problem Graph (Complete)

```
1. [CHECKOUT EXPERIENCE] ← MAIN PROBLEM
   │
   ├── 1.1 [UI/UX MISMATCH] ← Priority 1
   │   ├── 1.1.1 [ROOT] flowStyle không được render theo config
   │   ├── 1.1.2 [ROOT] Thiếu ảnh sản phẩm
   │   ├── 1.1.3 [ROOT] Thiếu variant info cho fromCart flow
   │   └── 1.1.4 [ROOT] UI style khác biệt Preview vs Actual
   │
   ├── 1.2 [ĐỊA CHỈ - ADDRESS] ← Priority 2
   │   ├── 1.2.1 [ROOT] Không có cấu hình số cấp địa chỉ (2 vs 3 cấp)
   │   ├── 1.2.2 [ROOT] Không có data Tỉnh/Quận/Phường
   │   ├── 1.2.3 [ROOT] Không có cascade dropdown
   │   └── 1.2.4 [INFO] VN đổi hành chính 1/7/2025 (34 tỉnh, bỏ Quận)
   │
   ├── 1.3 [VẬN CHUYỂN - SHIPPING] ← Priority 3
   │   ├── 1.3.1 [ROOT] Set cứng phí ship: 15000 (standard), 30000 (fast)
   │   ├── 1.3.2 [ROOT] Set cứng thời gian: "2-4 ngày", "24h"
   │   ├── 1.3.3 [ROOT] Không có cấu hình tính phí theo vùng
   │   └── 1.3.4 [ROOT] Không tích hợp đơn vị vận chuyển
   │
   ├── 1.4 [THANH TOÁN - PAYMENT] ← Priority 3
   │   ├── 1.4.1 [ROOT] Chỉ có 2 options cứng: COD, BankTransfer
   │   ├── 1.4.2 [ROOT] Không có VietQR integration
   │   ├── 1.4.3 [ROOT] Không có cấu hình tài khoản ngân hàng
   │   └── 1.4.4 [ROOT] Không có EWallet, Credit Card options
   │
   └── 1.5 [KHUYẾN MÃI - PROMOTIONS] ← Priority 4
       ├── 1.5.1 [ROOT] Checkout KHÔNG tích hợp apply coupon
       ├── 1.5.2 [ROOT] Không có UI nhập mã giảm giá
       ├── 1.5.3 [OK] Module promotions có sẵn validateCode API
       └── 1.5.4 [OK] Có applicableTo: all/products/categories
```

---

## 1.1 UI/UX MISMATCH (Đã phân tích v2)

### ROOT CAUSE Summary:
| Issue | Preview | Actual | Status |
|-------|---------|--------|--------|
| flowStyle | 3 layouts | 1 layout cố định | ❌ BROKEN |
| Product image | Mock text | Không hiện dù có data | ❌ MISSING |
| Variant info | N/A | Có cho Buy Now, thiếu fromCart | ⚠️ PARTIAL |
| UI styling | Styled cards, icons | Plain basic | ⚠️ MISMATCH |

---

## 1.2 ĐỊA CHỈ - ADDRESS

### Phát hiện từ nghiên cứu:

**1. Việt Nam thay đổi hành chính 1/7/2025:**
- Giảm từ 63 → 34 tỉnh/thành phố
- BỎ cấp Quận/Huyện → Phường/Xã trực thuộc Tỉnh
- Format mới: [Số nhà + Đường] + [Phường/Xã] + [Tỉnh/TP] + [Mã bưu chính]

**2. Tham khảo dự án ThanShoes (3 cấp cũ):**
```php
// Có 3 dropdown cascade:
Province → District → Ward → Address Detail
// Data: provinces.json, districts.json, wards.json
// Livewire reactive: wire:model.live
```

**3. Tham khảo dự án vuphuc (2 cấp mới):**
```json
// vietnam_administrative_units_34provinces.json
// Cấu trúc: Province → Wards (bỏ District)
{
  "name": "Thành phố Hà Nội",
  "code": 1,
  "wards": [{ "name": "Phường Ba Đình", "code": 4 }, ...]
}
```

### ROOT CAUSE #1.2: Không có cấu hình địa chỉ

**Actual checkout:**
```tsx
// Chỉ có 1 input text đơn giản
<input placeholder="Địa chỉ giao hàng" value={shippingAddress} />
```

**Cần:**
- Setting chọn kiểu địa chỉ: `2-level` (mới), `3-level` (cũ), `text-only`
- Data tỉnh/huyện/xã (hoặc tỉnh/xã với format mới)
- Cascade dropdown components

---

## 1.3 VẬN CHUYỂN - SHIPPING

### ROOT CAUSE #1.3: Hardcoded shipping

**Actual code:**
```tsx
// ❌ SET CỨNG - Không thể cấu hình
const shippingFee = checkoutConfig.showShippingOptions
  ? (shippingMethod === 'fast' ? 30000 : 15000)  // ← HARDCODED
  : 0;

// ❌ SET CỨNG thời gian
<span>Giao tiêu chuẩn (2-4 ngày)</span>  // ← HARDCODED
<span>Giao nhanh (24h)</span>           // ← HARDCODED
```

**Tham khảo ThanShoes:**
```php
// Miễn phí ship toàn bộ
<span class="text-success-600 font-bold">Miễn phí</span>
<p class="text-xs">Áp dụng cho tất cả đơn hàng</p>
```

**Cần module Shipping config:**
```ts
shippingMethods: [
  { id: 'standard', name: 'Tiêu chuẩn', fee: 15000, estimateDays: '2-4 ngày' },
  { id: 'fast', name: 'Nhanh', fee: 30000, estimateDays: '24h' },
  { id: 'free', name: 'Miễn phí', fee: 0, minOrderAmount: 500000 },
]
// Hoặc tính phí theo vùng miền
```

---

## 1.4 THANH TOÁN - PAYMENT

### ROOT CAUSE #1.4: Hardcoded payment methods

**Actual code:**
```tsx
// ❌ SET CỨNG - Chỉ 2 options
const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BankTransfer'>('COD');

// ❌ Không có VietQR, không có bank info
<span>COD - Thanh toán khi nhận hàng</span>
<span>Chuyển khoản ngân hàng</span>
```

**Tham khảo ThanShoes (VietQR):**
```html
<!-- Hiện QR khi chọn chuyển khoản -->
<div x-show="showQR">
  <p>Ngân hàng: {{ $bankCode }}</p>
  <p>Số tài khoản: {{ $accountNumber }}</p>
  <p>Chủ tài khoản: {{ $accountHolder }}</p>
  
  <img src="https://img.vietqr.io/image/{{ $bankCode }}-{{ $accountNumber }}-compact2.jpg
    ?amount={{ $total }}
    &addInfo=Thanh%20toan%20don%20hang
    &accountName={{ urlencode($accountHolder) }}" />
</div>
```

**Cần module Payment config:**
```ts
paymentMethods: [
  { id: 'cod', name: 'COD', enabled: true, description: 'Thanh toán khi nhận hàng' },
  { id: 'bank', name: 'Chuyển khoản', enabled: true, 
    bankCode: 'VCB', accountNumber: '123456789', accountHolder: 'CONG TY ABC',
    showQR: true },
  { id: 'momo', name: 'MoMo', enabled: false },
  { id: 'vnpay', name: 'VNPay', enabled: false },
]
```

---

## 1.5 KHUYẾN MÃI - PROMOTIONS

### ROOT CAUSE #1.5: Checkout không tích hợp coupon

**Module Promotions có sẵn:**
```ts
// ✅ API đã có validateCode
export const validateCode = query({
  args: { code: v.string(), orderAmount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // Validate: exists, active, date range, usage limit, min order
    return { valid, discountAmount, message, promotion };
  }
});

// ✅ Có applicableTo: all | products | categories
// ✅ Có minOrderAmount, maxDiscountAmount, usageLimit
// ✅ Có startDate, endDate scheduling
```

**Actual checkout:**
```tsx
// ❌ KHÔNG có UI nhập coupon
// ❌ KHÔNG gọi validateCode
// ❌ KHÔNG hiện discount
```

**Tham khảo ThanShoes:**
```html
@include('components.checkout.discount-info')
<!-- Hiện thông tin giảm giá nếu có -->
```

---

## Execution Plan (DARE Framework)

### Phase 0: Solve ROOT CAUSES Bottom-Up

```
Dependency Order:
1. Module Configs (Settings tables) ← Foundation
2. Address System ← Depends on admin data
3. Shipping Config ← Depends on settings
4. Payment Config ← Depends on settings
5. Coupon Integration ← Uses existing promotions
6. UI Sync (Preview ↔ Actual) ← Uses all above
```

### Phase 1: Module Settings Infrastructure

**Add to Orders module config:**
```ts
// lib/modules/configs/orders.config.ts
settings: [
  // Address
  { key: 'addressFormat', label: 'Định dạng địa chỉ', type: 'select',
    options: [
      { value: '2-level', label: '2 cấp (Tỉnh → Phường)' },
      { value: '3-level', label: '3 cấp (Tỉnh → Quận → Phường)' },
      { value: 'text', label: 'Nhập tự do' },
    ], default: 'text' },
  
  // Shipping methods (JSON array)
  { key: 'shippingMethods', label: 'Phương thức vận chuyển', type: 'json' },
  
  // Payment methods (JSON array)  
  { key: 'paymentMethods', label: 'Phương thức thanh toán', type: 'json' },
  
  // Bank info for transfer
  { key: 'bankCode', label: 'Mã ngân hàng', type: 'text' },
  { key: 'bankAccountNumber', label: 'Số tài khoản', type: 'text' },
  { key: 'bankAccountHolder', label: 'Chủ tài khoản', type: 'text' },
]
```

### Phase 2: Address System

1. Thêm JSON data (provinces/wards) vào `public/data/`
2. Tạo hooks `useAddressSelector(format: '2-level' | '3-level')`
3. Tạo components `AddressCascade` với dropdown chaining

### Phase 3: Shipping Config

1. Đọc `shippingMethods` từ moduleSettings
2. Render dynamic radio options
3. Tính phí ship theo method selected

### Phase 4: Payment Config

1. Đọc `paymentMethods` từ moduleSettings
2. Render dynamic options
3. Hiện VietQR khi chọn bank transfer
4. Format: `https://img.vietqr.io/image/{bankCode}-{account}-compact2.jpg?amount={total}&addInfo=...`

### Phase 5: Coupon Integration

1. Thêm input "Mã giảm giá" vào checkout
2. Call `api.promotions.validateCode` on blur/button
3. Hiện discount amount, update total
4. Pass `promotionId` vào `createOrder`

### Phase 6: UI Sync

1. Actual page render theo `flowStyle` config
2. Thêm ảnh sản phẩm + variant info
3. Match styling với Preview

---

## Summary: 16 ROOT CAUSES

| Category | Count | Critical |
|----------|-------|----------|
| UI/UX Mismatch | 4 | flowStyle, image |
| Address | 4 | No config, no data |
| Shipping | 4 | All hardcoded |
| Payment | 4 | No VietQR, no config |
| Promotions | 2 | Not integrated |

**Estimate: 3-4 ngày để fix toàn bộ**