## Phân tích Bug

**Vấn đề:** Trang `/admin/products` hiển thị "12 sản phẩm/trang" nhưng chỉ hiển thị 3 sản phẩm (1-3 / 209).

### Nguyên nhân gốc

Trong `convex/products.ts` - query `listAdminWithOffset`:

```javascript
// Dòng 56-67
const queryBuilder = args.categoryId && args.status
  ? ctx.db.query("products").withIndex("by_category_status", ...)
  : args.categoryId
    ? ctx.db.query("products").withIndex("by_category_status", ...)
    : args.status
      ? ctx.db.query("products").withIndex("by_status_order", ...)
      : ctx.db.query("products");  // ❌ KHÔNG CÓ INDEX!

let products = await queryBuilder.order("desc").take(fetchLimit);
```

**Bug:** Khi **không có filter** (không category, không status):
1. Query chạy **không có index**, chỉ dùng `order("desc")` trên internal `_creationTime`
2. Convex **không đảm bảo thứ tự nhất quán** khi không có index
3. `take(fetchLimit)` có thể bị giới hạn không như mong đợi

### Giải pháp

Sửa query `listAdminWithOffset` để **luôn dùng index** khi không có filter:

```javascript
// BEFORE (sai)
: ctx.db.query("products");

// AFTER (đúng) - dùng index by_status_order cho TẤT CẢ status
: ctx.db.query("products").withIndex("by_status_order");
```

**Lưu ý:** Index `by_status_order: ["status", "order"]` - khi không filter status, Convex sẽ scan full index nhưng **theo thứ tự order**.

### Thay đổi cần thực hiện

**File:** `convex/products.ts`

**Dòng 56-67:** Sửa `listAdminWithOffset`:
```javascript
const queryBuilder = args.categoryId && args.status
  ? ctx.db.query("products").withIndex("by_category_status", (q) =>
      q.eq("categoryId", args.categoryId!).eq("status", args.status!)
    )
  : args.categoryId
    ? ctx.db.query("products").withIndex("by_category_status", (q) =>
        q.eq("categoryId", args.categoryId!)
      )
    : args.status
      ? ctx.db.query("products").withIndex("by_status_order", (q) => q.eq("status", args.status!))
      : ctx.db.query("products").withIndex("by_status_order"); // ✅ Thêm index
```

### Impact
- Fix pagination để luôn trả đủ số lượng sản phẩm theo `limit`
- Không ảnh hưởng tới performance vì đã dùng index có sẵn
- Đảm bảo thứ tự nhất quán giữa các lần query