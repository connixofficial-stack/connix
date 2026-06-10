## TL;DR kiểu Feynman
- Lỗi không phải do `useCart` hỏng, mà do ta gọi nó **sớm hơn lúc provider được tạo**.
- `SiteShell` đang `useCart()` ở cùng component bọc `SiteProviders`, nên hook chạy trước `CartProvider`.
- Fix hẹp, ít rủi ro nhất là **tách phần shell bên trong provider** rồi mới gọi `useCart()`.
- Không đổi behavior, chỉ sửa thứ tự mount đúng của React context.

## Audit Summary
### Observation
- Runtime error: `useCart must be used within CartProvider`.
- Stack trace trỏ thẳng tới `SiteShell (components/site/SiteShell.tsx:14:35)`.
- `SiteShell.tsx` hiện `import { useCart } from '@/lib/cart'` và gọi `const { isDrawerOpen } = useCart();` trước khi render `<SiteProviders>`.
- `SiteProviders.tsx` mới là nơi mount `<CartProvider>`.

### Inference
- Hook context đang bị gọi ngoài phạm vi provider do sai cấu trúc component tree.
- Đây là lỗi wiring do thay đổi tối ưu homepage ở pha trước, không phải lỗi business logic cart.

## Root Cause Confidence
- **High** — evidence trực tiếp từ stack trace + code hiện tại:
  - `components/site/SiteShell.tsx`: gọi `useCart()` ở top-level component.
  - `components/site/SiteProviders.tsx`: `CartProvider` chỉ xuất hiện bên trong JSX được render sau đó.

## Root-cause protocol
1. **Triệu chứng**  
   Expected: homepage render bình thường.  
   Actual: crash runtime với lỗi `useCart must be used within CartProvider`.
2. **Phạm vi ảnh hưởng**  
   Public site shell, đặc biệt homepage vì `SiteShell` dùng ở `app/(site)/layout.tsx`.
3. **Có tái hiện ổn định không**  
   Có, vì cấu trúc component hiện tại luôn gọi hook trước provider.
4. **Mốc thay đổi gần nhất**  
   Xuất hiện sau refactor `SiteShell` để lazy mount `CartDrawer` theo homepage.
5. **Dữ liệu còn thiếu**  
   Không thiếu để kết luận root cause.
6. **Giả thuyết thay thế chưa loại trừ**  
   Thấp; stack trace và code tree đã đủ xác nhận.
7. **Rủi ro nếu fix sai nguyên nhân**  
   Có thể che lỗi tạm nhưng vẫn crash ở route public.
8. **Tiêu chí pass/fail**  
   `SiteShell` không còn crash; `CartDrawer` vẫn chỉ mount khi cần trên homepage; typecheck pass.

## Files Impacted
- **Sửa:** `components/site/SiteShell.tsx`  
  Vai trò hiện tại: bọc `SiteProviders`, render Header, CartDrawer, main, footer.  
  Thay đổi: tách một component con nằm **bên trong** `SiteProviders` để mới được dùng `useCart()` an toàn.

## Execution Preview
1. Tách `SiteShell` thành wrapper ngoài + inner shell trong provider.
2. Chuyển `usePathname()` / `useCart()` / logic `enableCartDrawer` vào inner component.
3. Giữ nguyên behavior `deferInteractive={isHomepage}` và lazy mount `CartDrawer`.
4. Static review + `bunx tsc --noEmit`.
5. Commit fix hẹp.

## Acceptance Criteria
- Hết runtime error `useCart must be used within CartProvider`.
- Homepage vẫn giữ tối ưu vừa làm: only enable `CartDrawer` when needed trên homepage.
- Không đổi UI/UX nhìn thấy.
- `bunx tsc --noEmit` pass.

## Out of Scope
- Không refactor thêm cart system.
- Không đổi logic `CartProvider` / `useCart`.
- Không mở rộng cleanup ngoài `SiteShell`.

## Risk / Rollback
- **Risk:** rất thấp, chỉ là reorder component boundary.
- **Rollback:** revert một file `SiteShell.tsx` là đủ.

## Đề xuất thực thi
Tôi sẽ fix hẹp đúng lỗi: chỉ sửa `SiteShell.tsx` để phần gọi `useCart()` nằm bên trong `SiteProviders`, sau đó chạy typecheck và commit.