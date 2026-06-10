## Phân tích hiện trạng

**Module hiện tại chỉ có:**
- Voucher/Coupon cơ bản (mã code, % hoặc cố định)
- Áp dụng cho: all/products/categories
- Giới hạn: thời gian, lượt dùng, đơn tối thiểu, giảm tối đa

---

## Đề xuất mở rộng FULL FEATURES

### 1. LOẠI KHUYẾN MÃI (Promotion Types)

| Type | Mô tả |
|------|-------|
| `coupon` | Mã giảm giá nhập tay |
| `campaign` | Chương trình tự động áp dụng |
| `flash_sale` | Flash sale theo thời gian |
| `bundle` | Combo sản phẩm |
| `loyalty` | Tích điểm đổi quà |

### 2. DISCOUNT TYPES mở rộng

| Type | Ví dụ |
|------|-------|
| `percent` | Giảm 20% |
| `fixed` | Giảm 50.000đ |
| `buy_x_get_y` | Mua 2 tặng 1 |
| `buy_a_get_b` | Mua A tặng B |
| `tiered` | Mua 2 giảm 10%, mua 5 giảm 20% |
| `free_shipping` | Miễn phí ship |
| `gift` | Tặng quà |

### 3. ĐIỀU KIỆN ÁP DỤNG (Conditions)

```
applicability:
├── target: all | products | categories | brands | tags
├── targetIds: [ids...]
├── excludeIds: [ids...] (loại trừ)
└── minQuantity: số lượng tối thiểu
```

**Customer conditions:**
```
customerConditions:
├── customerType: all | new | returning | vip
├── customerTierIds: [ids...] (theo level)
├── customerGroupIds: [ids...] (theo nhóm)
├── minOrderHistory: số đơn tối thiểu
└── minTotalSpent: tổng chi tối thiểu
```

### 4. GIỚI HẠN (Limits)

```
limits:
├── usageLimit: tổng lượt dùng
├── usagePerCustomer: lượt/khách
├── minOrderAmount: đơn tối thiểu
├── maxDiscountAmount: giảm tối đa
├── minQuantity: số lượng SP tối thiểu
└── budget: ngân sách tổng (stop khi hết)
```

### 5. THỜI GIAN

```
schedule:
├── startDate, endDate
├── scheduleType: always | dateRange | recurring
├── recurringDays: [0-6] (thứ trong tuần)
├── recurringHours: { from, to }
└── timezone
```

### 6. STACKING (Cộng dồn)

```
stacking:
├── stackable: boolean (có thể cộng với KM khác)
├── stackableWith: [promotionIds...]
├── priority: số (ưu tiên áp dụng)
└── exclusiveWith: [types...] (loại trừ)
```

---

## SCHEMA MỚI

### Table: `promotions` (mở rộng)

```ts
promotions: defineTable({
  // === BASIC ===
  name: v.string(),
  code: v.optional(v.string()), // null nếu là campaign tự động
  description: v.optional(v.string()),
  
  // === TYPE ===
  promotionType: v.union(
    v.literal("coupon"),
    v.literal("campaign"),
    v.literal("flash_sale"),
    v.literal("bundle"),
    v.literal("loyalty")
  ),
  
  // === DISCOUNT ===
  discountType: v.union(
    v.literal("percent"),
    v.literal("fixed"),
    v.literal("buy_x_get_y"),
    v.literal("buy_a_get_b"),
    v.literal("tiered"),
    v.literal("free_shipping"),
    v.literal("gift")
  ),
  discountValue: v.optional(v.number()),
  discountConfig: v.optional(v.any()), // Chi tiết cho từng type
  
  // === APPLICABILITY ===
  applicableTo: v.union(...),
  applicableIds: v.optional(v.array(v.string())),
  excludeIds: v.optional(v.array(v.string())),
  
  // === CUSTOMER CONDITIONS ===
  customerType: v.optional(v.union(...)),
  customerTierIds: v.optional(v.array(v.string())),
  minOrderHistory: v.optional(v.number()),
  minTotalSpent: v.optional(v.number()),
  
  // === LIMITS ===
  usageLimit: v.optional(v.number()),
  usagePerCustomer: v.optional(v.number()),
  minOrderAmount: v.optional(v.number()),
  maxDiscountAmount: v.optional(v.number()),
  minQuantity: v.optional(v.number()),
  budget: v.optional(v.number()),
  budgetUsed: v.optional(v.number()),
  
  // === SCHEDULE ===
  startDate: v.optional(v.number()),
  endDate: v.optional(v.number()),
  scheduleType: v.optional(v.union(...)),
  recurringDays: v.optional(v.array(v.number())),
  recurringHours: v.optional(v.object({from: v.number(), to: v.number()})),
  
  // === STACKING ===
  stackable: v.optional(v.boolean()),
  priority: v.optional(v.number()),
  
  // === STATUS ===
  status: v.union("Active", "Inactive", "Expired", "Scheduled"),
  usedCount: v.number(),
  order: v.number(),
  
  // === DISPLAY (cho public) ===
  thumbnail: v.optional(v.string()),
  displayOnPage: v.optional(v.boolean()), // Hiện trên trang KM
  featured: v.optional(v.boolean()), // Nổi bật
})
```

### Table: `promotionUsage` (tracking chi tiết)

```ts
promotionUsage: defineTable({
  promotionId: v.id("promotions"),
  customerId: v.id("customers"),
  orderId: v.id("orders"),
  discountAmount: v.number(),
  usedAt: v.number(),
})
```

---

## EXPERIENCE: Trang Khuyến mãi Public

### Route: `/system/experiences/promotions-list`

**Config options:**
- `layoutStyle`: grid | list | banner
- `showCountdown`: boolean (đếm ngược)
- `showProgress`: boolean (% đã dùng)
- `showConditions`: boolean (điều kiện)
- `groupByType`: boolean (nhóm theo loại)

**Preview blocks:**
- Banner featured promotions
- Grid/List active coupons
- Flash sale countdown
- Copy code button

---

## KẾ HOẠCH IMPLEMENTATION

### Phase 1: Schema & Backend (2-3 ngày)
1. Cập nhật `convex/schema.ts` - mở rộng promotions
2. Thêm table `promotionUsage`
3. Cập nhật `convex/promotions.ts`:
   - Mutations: create, update với fields mới
   - Queries: filter theo type, customer conditions
   - `validatePromotion()` - logic phức tạp
   - `applyPromotion()` - tính discount
4. Seed data mẫu

### Phase 2: Admin UI (2-3 ngày)
1. `/admin/promotions/create` - form đầy đủ
   - Wizard steps: Basic → Discount → Conditions → Limits → Schedule
   - Dynamic form theo promotionType/discountType
2. `/admin/promotions/[id]/edit` - edit full
3. `/admin/promotions` - list với filters mới
4. Component: `DiscountConfigEditor` cho các loại discount

### Phase 3: System Module Config (1 ngày)
1. `promotions.config.ts` - thêm features mới
2. `PromotionsDataTab.tsx` - stats đầy đủ

### Phase 4: Experience Public (2 ngày)
1. `/system/experiences/promotions-list/page.tsx`
2. `PromotionsListPreview.tsx`
3. API cho frontend: `listPublicPromotions`

### Phase 5: Integration (1 ngày)
1. Checkout flow: áp dụng multi-promotions
2. Product card: hiện badge khuyến mãi
3. Cart: validate & apply promotions

---

## Files cần tạo/sửa

| Action | File |
|--------|------|
| UPDATE | `convex/schema.ts` |
| UPDATE | `convex/promotions.ts` |
| CREATE | `convex/promotionUsage.ts` |
| UPDATE | `app/admin/promotions/create/page.tsx` |
| UPDATE | `app/admin/promotions/[id]/edit/page.tsx` |
| CREATE | `components/admin/promotions/PromotionFormWizard.tsx` |
| CREATE | `components/admin/promotions/DiscountConfigEditor.tsx` |
| UPDATE | `lib/modules/configs/promotions.config.ts` |
| UPDATE | `components/modules/promotions/PromotionsDataTab.tsx` |
| CREATE | `app/system/experiences/promotions-list/page.tsx` |
| CREATE | `components/experiences/previews/PromotionsListPreview.tsx` |

---

**Tổng thời gian ước tính: 8-10 ngày**