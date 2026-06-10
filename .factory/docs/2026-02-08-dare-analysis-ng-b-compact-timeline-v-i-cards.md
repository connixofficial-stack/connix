## DARE Analysis: Compact & Timeline vs Cards

---

## Problem Graph

```
1. [Main] Compact & Timeline không đạt chất lượng như Cards
   │
   ├── 1.1 [Filter] Thiếu bộ lọc trạng thái
   │   └── 1.1.1 [ROOT] Không render StatusFilterDropdown
   │   └── 1.1.2 [ROOT] Dùng mockOrders/ordersList trực tiếp, bỏ qua filteredOrders
   │
   ├── 1.2 [Stats] Thiếu block thống kê
   │   └── 1.2.1 [ROOT] showStats chỉ render trong Cards
   │
   ├── 1.3 [Pagination] Không có phân trang thực sự
   │   └── 1.3.1 [ROOT] Compact/Timeline không dùng visibleOrders
   │   └── 1.3.2 [ROOT] Pagination buttons trong Compact là dummy (onClick={() => {}})
   │   └── 1.3.3 [ROOT] Timeline không có pagination UI
   │
   ├── 1.4 [Empty State] Không hiển thị khi filter không khớp
   │   └── 1.4.1 [ROOT] Compact/Timeline không check visibleOrders.length === 0
   │
   ├── 1.5 [Toggle Coverage] Không tôn trọng đủ toggles
   │   └── 1.5.1 [ROOT] Compact không dùng: showOrderItems, showPaymentMethod, showShippingMethod, showShippingAddress, showTimeline
   │   └── 1.5.2 [ROOT] Timeline thiếu: showPaymentMethod, showShippingMethod, showShippingAddress
   │
   └── 1.6 [Actions] Thiếu/khác biệt actions
       └── 1.6.1 [ROOT] Compact không có nút "Mua lại" và "Hủy đơn"
```

---

## Chi tiết từng vấn đề

### 1.1 Filter - Thiếu bộ lọc trạng thái

| Aspect | Cards | Compact | Timeline |
|--------|-------|---------|----------|
| StatusFilterDropdown | ✅ Có | ❌ Không | ❌ Không |
| Dùng filteredOrders | ✅ Có | ❌ mockOrders | ❌ mockOrders |
| defaultStatusFilter | ✅ Áp dụng | ❌ Bỏ qua | ❌ Bỏ qua |

**Preview:** Line 371-384 chỉ render dropdown trong `layoutStyle === 'cards'`  
**Site:** Line 341-351 tương tự

---

### 1.2 Stats - Thiếu block thống kê

| Aspect | Cards | Compact | Timeline |
|--------|-------|---------|----------|
| StatCard grid | ✅ Có (4 cards) | ❌ Không | ❌ Không |

**Preview:** Line 387-399 `showStats && layoutStyle === 'cards'`  
**Site:** Line 354-382 tương tự

---

### 1.3 Pagination - Không phân trang thực sự

| Aspect | Cards | Compact | Timeline |
|--------|-------|---------|----------|
| Dùng visibleOrders | ✅ Có | ❌ mockOrders/ordersList | ❌ mockOrders/ordersList |
| Pagination buttons hoạt động | ✅ setCurrentPage | ❌ onClick={() => {}) | ❌ Không có |
| Infinite scroll indicator | ✅ Có | ❌ Không | ❌ Không |
| Hiển thị "Trang X / Y" | ✅ Có | ❌ Không động | ❌ Không |

**Preview Compact:** Line 527-532 map `mockOrders`, buttons dummy  
**Preview Timeline:** Line 606 map `mockOrders`, không pagination  
**Site Compact:** Line 584 map `ordersList`, không filter  
**Site Timeline:** Line 677 map `ordersList`, không filter/pagination

---

### 1.4 Empty State - Không hiển thị khi filter rỗng

| Aspect | Cards | Compact | Timeline |
|--------|-------|---------|----------|
| Empty state khi filter | ✅ "Không có đơn hàng phù hợp" | ❌ Không | ❌ Không |

**Preview Cards:** Line 467-470 check `visibleOrders.length === 0`  
**Preview Compact/Timeline:** Không có check tương tự

---

### 1.5 Toggle Coverage - Không tôn trọng đủ toggles

| Toggle | Cards | Compact | Timeline |
|--------|-------|---------|----------|
| showStats | ✅ | ❌ | ❌ |
| showOrderItems | ✅ | ❌ | ✅ |
| showPaymentMethod | ✅ | ❌ | ❌ |
| showShippingMethod | ✅ | ❌ | ❌ |
| showShippingAddress | ✅ | ❌ | ❌ |
| showTracking | ✅ | ❌ | ✅ |
| showTimeline | ✅ | ❌ | ✅ |

**Compact:** Chỉ hiển thị bảng cơ bản, không toggle nào được áp dụng  
**Timeline:** Áp dụng showTimeline, showOrderItems, showTracking; thiếu payment/shipping

---

### 1.6 Actions - Thiếu/khác biệt

| Action | Cards | Compact | Timeline |
|--------|-------|---------|----------|
| Mua lại | ✅ | ❌ | ❌ |
| Hủy đơn (allowCancel) | ✅ | ❌ | ✅ |
| Xem chi tiết | ✅ | ✅ | ✅ |

---

## Giải pháp đề xuất

### Preview (`AccountOrdersPreview.tsx`)

1. **Di chuyển StatusFilterDropdown ra ngoài điều kiện layout** - render cho cả 3 layouts
2. **Di chuyển Stats block ra ngoài** (optional, có thể giữ chỉ Cards nếu thiết kế Compact/Timeline không cần)
3. **Compact/Timeline dùng `visibleOrders` thay vì `mockOrders`**
4. **Thêm empty state cho Compact/Timeline**
5. **Compact:** Thêm pagination buttons hoạt động + toggle coverage (expand row hoặc tooltip)
6. **Timeline:** Thêm pagination/infinite scroll + toggle payment/shipping (nếu cần)

### Site (`/account/orders/page.tsx`)

1. **Di chuyển StatusFilterDropdown ra ngoài điều kiện Cards**
2. **Compact/Timeline dùng `filteredOrders → visibleOrders`**
3. **Thêm empty state cho Compact/Timeline**
4. **Compact:** Pagination buttons hoạt động với `safeCurrentPage/setCurrentPage`
5. **Timeline:** Thêm pagination UI

---

## Files cần sửa

| File | Scope |
|------|-------|
| `components/experiences/previews/AccountOrdersPreview.tsx` | Filter, Stats, Pagination, Empty state, Toggle coverage |
| `app/(site)/account/orders/page.tsx` | Filter, Pagination, Empty state, Toggle coverage |

---

## Ước lượng

- **Preview:** ~50-80 dòng thay đổi
- **Site:** ~40-60 dòng thay đổi
- **Tổng:** ~100-140 dòng

Bạn muốn mình triển khai luôn không?