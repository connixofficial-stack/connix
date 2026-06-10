Đã rõ yêu cầu: **full parity 26 commit**, **copy đầy đủ `.factory/docs`**, **bám sát thứ tự commit gốc**, và **verify bằng `bunx tsc --noEmit`**.

Kế hoạch triển khai (1 lần, không chia phase):

1. **Chuẩn bị nguồn patch từ repo gốc**
   - Lấy đúng 26 commit gần nhất của `E:\NextJS\persional_project\system-dien-tran` theo thứ tự cũ → mới:
     `dfc1e91` → `8a407a6` → `4167247` → `47ca772` → `bdea691` → `e408d0d` → `08b0c74` → `f038f1d` → `d1cd02e` → `5eb89a3` → `5bd8af2` → `59e21ad` → `c46a118` → `a02bca0` → `5fb13b1` → `b3e3618` → `b4bbfb3` → `be8d752` → `a2c5ed0` → `c62295d` → `c207638` → `34ce51b` → `39907fa` → `433830a` → `6cbae69` → `0594140`.
   - Mục tiêu: replay đúng logic và lịch sử thay đổi vào repo hiện tại `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs`.

2. **Replay commit theo đúng thứ tự gốc (ưu tiên cherry-pick có giữ message)**
   - Áp từng commit; nếu conflict thì resolve theo nguyên tắc “state cuối cùng phải khớp repo nguồn”.
   - Các cụm file chính sẽ được đồng bộ theo commit:
     - **Seed/module hardening**: `components/data/SeedWizardDialog.tsx`, `convex/admin/modules.ts`, `lib/modules/hooks/useModuleConfig.ts`, `convex/seed.ts`.
     - **Products module/admin/variants**: 
       `app/admin/products/page.tsx`, `app/admin/products/create/page.tsx`,
       `app/admin/products/[id]/edit/page.tsx`,
       `app/admin/products/[id]/variants/page.tsx`,
       `app/admin/products/[id]/variants/create/page.tsx`,
       `app/admin/products/[id]/variants/[vid]/edit/page.tsx`,
       `app/admin/products/[id]/variants/components/VariantForm.tsx`,
       `convex/products.ts`, `convex/productVariants.ts`, `lib/modules/configs/products.config.ts`.
     - **Category hierarchy toggle**:
       `app/admin/categories/create/page.tsx`, `app/admin/categories/[id]/edit/page.tsx`, `convex/productCategories.ts`.
     - **Site products/product-detail + preview parity**:
       `app/(site)/products/page.tsx`, `app/(site)/products/[slug]/page.tsx`, `components/experiences/previews/ProductDetailPreview.tsx`.
     - **Docs parity theo rule commit**:
       copy toàn bộ file `.factory/docs/...` xuất hiện trong 26 commit nguồn.

3. **Đảm bảo parity nội dung cuối cùng**
   - So sánh lại checksum/`git diff --no-index` giữa 2 repo cho tập file trong 26 commit để chắc chắn state đích = state nguồn (trừ khác biệt không liên quan nếu có).

4. **Verify kỹ thuật trước commit**
   - Chạy đúng lệnh bạn chốt: `bunx tsc --noEmit`.
   - Nếu lỗi type do conflict/khác biệt nền code, fix ngay trong phạm vi parity mà không mở rộng tính năng.

5. **Commit tại repo hiện tại (không push)**
   - Vì bạn yêu cầu bám sát commit gốc: tạo commit tương ứng theo thứ tự (message giữ nguyên hoặc chuẩn hóa nhẹ nhưng vẫn cùng ý nghĩa).
   - Khi commit luôn bảo đảm có kèm `.factory/docs` liên quan.
   - Trước mỗi commit sẽ kiểm tra `git status` + `git diff --cached` để tránh sót file/sensitive data.

6. **Bàn giao**
   - Trả danh sách commit đã replay, file bị conflict (nếu có), kết quả `bunx tsc --noEmit`, và xác nhận chưa push.

Checklist cam kết:
- [x] Full parity 26 commit
- [x] Include `.factory/docs`
- [x] Theo đúng thứ tự commit gốc
- [x] Verify bằng `bunx tsc --noEmit`
- [x] Commit local only, không push