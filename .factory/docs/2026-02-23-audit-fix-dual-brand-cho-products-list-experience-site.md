## Plan ngắn gọn (đúng scope products-list)

1. **Audit toàn diện products-list (Experience + Site)**
   - Quét `app/system/experiences/products-list/page.tsx` và `app/(site)/products/page.tsx` để liệt kê đầy đủ lỗi theo skill: hardcode màu (`text-slate-*`, `bg-red-500`, `focus:border-orange-500`...), opacity decor (`${brandColor}15`, `bg-white/90`), thiếu token, thiếu sync secondary/mode, dùng `useBrandColor` thay vì `useBrandColors`.

2. **Tạo single source of truth token màu `getProductsListColors`**
   - Tạo `_lib/colors.ts` cho products-list (dùng `culori` + `apca-w3`) với:
     - parse/guard màu an toàn,
     - `resolveSecondaryForMode(primary, secondary, mode)` chuẩn single/dual,
     - sinh semantic tokens cho mọi phần tử products-list (heading, text/meta, card, input, search icon/focus, category badge, price, promo badge, wishlist, add-to-cart, buy-now, pagination, empty-state, infinite-scroll).
   - Đảm bảo APCA guard cho text trên solid, không no-op, không truyền hex trực tiếp vào APCA.

3. **Refactor Experience `/system/experiences/products-list` theo convention 6.1**
   - Đổi sang `useBrandColors()` và state đủ 3 giá trị: `brandColor`, `secondaryColor`, `colorMode`.
   - Sync cả 3 giá trị bằng `useEffect`.
   - Thêm `ColorConfigCard` để override realtime (single/dual + 2 color pickers).
   - Tạo `tokens = getProductsListColors(brandColor, secondaryColor, colorMode)` và truyền vào preview.
   - Thay các accent cứng `#10b981` trong controls/tabs/example link bằng token phù hợp.

4. **Refactor Site `/products` dùng tokens 100% (rule 6.2)**
   - Đổi `useBrandColor()` thành `useBrandColors()`.
   - Sinh `tokens` bằng `getProductsListColors(primary, secondary, mode)`.
   - Truyền `tokens` vào toàn bộ layout/component con (`ProductGrid`, `ProductList`, `CatalogLayout`, `ListLayout`, `EmptyState`, pagination node).
   - Thay toàn bộ inline/hardcode màu và opacity decor bằng semantic tokens.
   - Đồng bộ Preview/Site: cùng helper, cùng mode single/dual, cùng fallback secondary.

5. **Tự-audit sau sửa + fix nốt tồn đọng**
   - Quét lại file products-list để đảm bảo không còn: `${brandColor}XX`, `focus:*orange*`, `bg-red-500`, màu hardcode không qua token ở các phần tử semantic.

6. **Validation + commit theo rule repo**
   - Chạy `bunx tsc --noEmit`.
   - Commit toàn bộ thay đổi code liên quan products-list (không push), message theo style hiện tại.

Nếu bạn duyệt plan này, mình sẽ triển khai ngay end-to-end đúng các bước trên.