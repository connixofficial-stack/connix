# DARE Analysis: E-commerce Orders Workflow Optimization

## Problem Graph

```
1. [MAIN] Workflow đặt hàng không hoàn chỉnh
   ├── 1.1 [ROOT CAUSE] Cart không được xóa sau khi đặt hàng thành công
   │   └── checkout/page.tsx: createOrder() không gọi cart.remove()
   │
   ├── 1.2 [ROOT CAUSE] Không có trang chi tiết đơn hàng cho khách hàng
   │   └── Thiếu route /account/orders/[id] hoặc accordion component
   │
   ├── 1.3 [SUB] Thiếu experiences cho Account section
   │   ├── 1.3.1 Không có experience config cho Orders List
   │   ├── 1.3.2 Không có experience config cho Profile
   │   └── 1.3.3 Không có experience config cho Wishlist
   │
   └── 1.4 [SUB] Trang /orders/tracking không hoạt động
       └── Form tracking không thực sự query DB
```

## Execution Plan (10 Tasks)

### Phase 1: Fix Critical Bugs (ROOT CAUSES)

**Task 1: Clear cart sau khi đặt hàng thành công**
- File: `app/(site)/checkout/page.tsx`
- Action: Sau `createOrder()`, gọi `api.cart.remove({ id: cart._id })`
- Best Practice: Xóa hoàn toàn cart record khỏi DB (user choice)

**Task 2: Thêm Cancel Order mutation**
- File: `convex/orders.ts`
- Action: Thêm mutation `cancelOrder` với validation status === "Pending"

### Phase 2: Account Orders Enhancement

**Task 3: Refactor trang /account/orders với Accordion**
- File: `app/(site)/account/orders/page.tsx`
- Action: Thêm expandable accordion cho mỗi order
- Content: Items, Total, Status, Address, Payment Method, Shipping Method, Tracking, Timeline

**Task 4: Thêm Order Statistics cho khách hàng**
- File: `app/(site)/account/orders/page.tsx`
- Action: Hiển thị stats (total orders, total spent, pending orders, etc.)

### Phase 3: Create Account Experiences

**Task 5: Tạo experience cho Orders**
- Files: 
  - `app/system/experiences/orders/page.tsx`
  - `lib/experiences/index.ts` (thêm config)
- Features: Layout style, show/hide sections, color scheme

**Task 6: Tạo experience cho Profile**
- Files:
  - `app/system/experiences/profile/page.tsx`
  - `lib/experiences/index.ts`
- Features: Editable fields, avatar upload, password change

**Task 7: Tạo experience cho Wishlist**
- Files:
  - `app/system/experiences/wishlist-page/page.tsx` (đổi tên từ wishlist)
  - `lib/experiences/index.ts`
- Features: Grid/list view, add to cart quick action

### Phase 4: Cleanup

**Task 8: Xóa trang /orders/tracking**
- Action: Xóa file `app/(site)/orders/tracking/page.tsx`
- Cleanup: Xóa folder `app/(site)/orders` nếu rỗng

**Task 9: Update navigation/menu nếu có link tới tracking**
- Check và remove any links to /orders/tracking

### Phase 5: Testing & Verification

**Task 10: Test toàn bộ flow**
- Add to cart → Checkout → Verify cart cleared
- View orders → Expand accordion → Verify details
- Cancel order (if Pending) → Verify status change

---

## Technical Details

### Cart Cleanup Code (Task 1)
```typescript
// Sau createOrder() thành công
if (fromCart && cart?._id) {
  await removeMutation({ id: cart._id });
}
```

### Cancel Order Mutation (Task 2)
```typescript
export const cancel = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");
    if (order.status !== "Pending") {
      throw new Error("Chỉ có thể hủy đơn hàng đang chờ xử lý");
    }
    await ctx.db.patch(args.id, { status: "Cancelled" });
    return null;
  },
});
```

### Order Timeline Data
Schema đã có `_creationTime`, cần thêm tracking timeline nếu muốn chi tiết hơn.

---

## Estimated Effort
- Phase 1: ~2h (critical bugs)
- Phase 2: ~3h (account enhancement)
- Phase 3: ~4h (3 experiences)
- Phase 4: ~30m (cleanup)
- Phase 5: ~1h (testing)

**Total: ~10.5 hours**

---

Xác nhận để tôi bắt đầu implementation?