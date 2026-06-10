## Problem Graph
1. [Fix seed wizard và admin image regressions] <- depends on 1.1, 1.2, 1.3
   1.1 [Duplicate Super Admin do seed users + auth create/update] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `convex/seeders/users.seeder.ts` đang seed `superadmin@example.com` theo role, sau đó `components/data/SeedWizardDialog.tsx` lại luôn `createSuperAdmin/updateSuperAdmin` riêng
   1.2 [Ảnh seed 400 ở posts/services/products] <- depends on 1.2.1, 1.2.2
      1.2.1 [ROOT CAUSE] Nhiều template khai báo path `/seed_mau/...` nhưng file thật không tồn tại (ví dụ `lib/seed-templates/industries/seafood.ts` có `posts/post-1.webp`, `gallery/gallery-1.webp` nhưng thư mục thật thiếu file)
      1.2.2 [ROOT CAUSE] Seeder đang tin template asset “có string là dùng được”, không kiểm tra file tồn tại trước khi trả URL
   1.3 [Admin list/detail thiếu fallback đẹp khi ảnh lỗi] <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] `app/admin/posts|services|products` đang render `next/image` trực tiếp, chỉ fallback khi URL rỗng; không có `onError`/component bọc cho runtime 400

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Chỉ nên có 1 Super Admin do hệ thống auth quản lý; users seeder phải bỏ qua seed Super Admin hoàn toàn.
   - Action:
     - Sửa `convex/seeders/users.seeder.ts`:
       - bỏ `superadmin@example.com` khỏi `DEFAULT_USERS`.
       - đổi `pickRoleForIndex()` để không bao giờ chọn role `isSuperAdmin === true`; ưu tiên role không phải super admin, nếu không có thì throw rõ lỗi thay vì modulo vào Super Admin.
       - giữ logic stats nhưng không tạo user mang role Super Admin từ seed data.
     - Rà `convex/seed.ts` (legacy seed path) để nếu còn seed user mặc định có role Super Admin thì cũng bỏ luôn, tránh bug tái diễn khi ai đó dùng seed cũ.
   - Reflection: Cách này bền nhất vì root cause nằm ở nguồn seed; `SeedWizardDialog` vẫn giữ quyền create/update thông tin super admin hệ thống như hiện tại, không sinh bản ghi thứ hai nữa.

2. Solving 1.2.1 + 1.2.2...
   - Thought: Theo lựa chọn của anh, chiến lược đúng là “giữ `seed_mau` nếu file tồn tại, thiếu thì tự rơi về picsum”, không rollback mù về picsum toàn bộ.
   - Action:
     - Tạo helper mới trong `lib/utils/image.ts` (hoặc tách file nhỏ mới như `lib/utils/seed-image.ts`) để:
       - chuẩn hóa kiểm tra src hợp lệ;
       - nhận biết path nội bộ `/seed_mau/...`;
       - kiểm tra path đó có tồn tại file thật trong `public` bằng một manifest tĩnh sinh từ code (không dùng `fs` trong Convex runtime).
     - Cách triển khai an toàn cho Convex:
       - xây một manifest compile-time ở phía shared code bằng cách duyệt `INDUSTRY_TEMPLATES` và chỉ giữ những asset path đã được whitelist thực sự tồn tại.
       - Vì Convex không dùng `fs` runtime, mình sẽ harden ngay ở `lib/seed-templates/index.ts`: thêm utility lọc asset theo pattern “có trong template pool hợp lệ”, rồi với các template lỗi như `seafood` chỉnh trực tiếp các path sai/ảo.
     - Sửa `lib/seed-templates/industries/seafood.ts`:
       - thay `assets.posts` từ các path không tồn tại sang nguồn hợp lệ (ví dụ reuse ảnh `products`/`hero` đúng file thật, hoặc rút gọn mảng về rỗng để seeder tự fallback).
       - thay `assets.gallery` từ các path không tồn tại sang path có file thật, hoặc để rỗng nếu chưa có asset thật.
       - nếu phát hiện `logos/229.webp` hay tên bất thường nhưng file có tồn tại thì giữ; chỉ sửa path chết.
     - Sửa `convex/seeders/posts.seeder.ts`:
       - trước khi dùng `template.assets.posts/hero/products`, lọc qua helper “seed_mau path hợp lệ”; nếu không còn ảnh hợp lệ thì fallback `https://picsum.photos/...`.
       - giữ logic ưu tiên `posts -> hero -> products -> global pool -> picsum`, nhưng chỉ dùng path đã được xác nhận hợp lệ.
     - Sửa `convex/seeders/services.seeder.ts`:
       - thay logic hiện tại từ `template.assets.gallery?.length ? pickRandom(...) : picsum` thành dùng helper lấy “gallery hợp lệ”, nếu rỗng thì fallback `picsum`.
     - Sửa `convex/seeders/products.seeder.ts`:
       - tương tự, chỉ dùng `template.assets.products` nếu có ảnh hợp lệ; nếu mảng rỗng hoặc path lỗi thì fallback `picsum`.
     - Kiểm tra `lib/seed-templates/index.ts`:
       - nếu `getSeedMauAssetPool()` đang gom cả path chết, thêm bước filter bằng helper hợp lệ để pool toàn cục không phát tán path hỏng sang seeder khác.
   - Reflection: Đây là hướng tối ưu nhất vì sửa đúng nguồn sinh dữ liệu. Nó vừa giữ trải nghiệm “ảnh mẫu seed_mau” khi có asset thật, vừa tự quay về picsum như behavior cũ khi template thiếu asset.

3. Solving 1.3.1...
   - Thought: Fallback đẹp phải xử lý được cả trường hợp URL có nhưng load 400, không chỉ khi `undefined`.
   - Action:
     - Tạo 1 shared component admin, ví dụ `app/admin/components/AdminEntityImage.tsx`:
       - bọc `next/image` với state `hasError`.
       - chỉ render ảnh khi `isValidImageSrc(src)` và chưa error.
       - khi lỗi, render fallback có nền nhẹ + icon phù hợp + chữ ngắn, theo variant:
         - `post`: icon/file-text + label “Bài viết”
         - `service`: icon/briefcase hoặc wrench + label “Dịch vụ”
         - `product`: icon/package + label “Sản phẩm”
       - hỗ trợ kích thước nhỏ cho table và khung lớn hơn cho detail preview.
     - Refactor các list page dùng component này:
       - `app/admin/posts/page.tsx`
       - `app/admin/services/page.tsx`
       - `app/admin/products/page.tsx`
     - Refactor các trang detail/edit để preview ảnh hiện tại cũng có fallback đẹp, thay vì ô trống/ảnh lỗi của browser:
       - với posts/services: sửa bên trong `app/admin/components/ImageUploader.tsx` để preview hiện có `onError` + fallback overlay.
       - với products: sửa `app/admin/components/ImageUpload.tsx` và nếu cần `MultiImageUploader` (nếu component này đang preview gallery trực tiếp) để ảnh lỗi chuyển sang fallback thay vì icon ảnh vỡ mặc định.
     - Ưu tiên sửa ở shared uploader trước để toàn bộ trang detail/edit của posts/services/products hưởng lợi cùng lúc, không lặp code.
   - Reflection: Dùng 1 component chung sẽ DRY hơn, giữ UI nhất quán, và không phải vá từng chỗ bằng `onError` thủ công.

4. Verification plan trước khi commit...
   - Thought: Repo rule yêu cầu khi có đổi code/TS chỉ chạy `bunx tsc --noEmit` trước commit.
   - Action:
     - Chạy `bunx tsc --noEmit`.
     - Nếu cần xác nhận phạm vi ảnh, kiểm tra lại bằng đọc code và `git diff` sau khi sửa.
     - Commit tất cả thay đổi, nhớ kèm `.factory/docs` nếu phát sinh file trong đó.
     - Commit message dự kiến: `fix(seed): prevent duplicate super admin and harden image fallbacks`
   - Reflection: Không chạy lint/test nặng để đúng convention dự án; vẫn đảm bảo compile-level safety cho TypeScript.

## File-level checklist sẽ sửa
- `convex/seeders/users.seeder.ts`: bỏ seed Super Admin, chặn assign role super admin trong fake users
- `convex/seed.ts`: bỏ legacy default user Super Admin nếu còn
- `lib/seed-templates/industries/seafood.ts`: sửa/xóa các asset path chết
- `lib/seed-templates/index.ts`: lọc pool chỉ lấy asset hợp lệ
- `convex/seeders/posts.seeder.ts`: chỉ dùng seed_mau hợp lệ, thiếu thì fallback picsum
- `convex/seeders/services.seeder.ts`: chỉ dùng gallery hợp lệ, thiếu thì fallback picsum
- `convex/seeders/products.seeder.ts`: chỉ dùng products asset hợp lệ, thiếu thì fallback picsum
- `lib/utils/image.ts` (hoặc file util mới gần đó): thêm helper validate/fallback dùng chung
- `app/admin/components/AdminEntityImage.tsx` (mới): component ảnh có fallback đẹp
- `app/admin/posts/page.tsx`: thay render thumbnail sang shared fallback image
- `app/admin/services/page.tsx`: thay render thumbnail sang shared fallback image
- `app/admin/products/page.tsx`: thay render image sang shared fallback image
- `app/admin/components/ImageUploader.tsx`: preview ảnh có fallback khi load lỗi
- `app/admin/components/ImageUpload.tsx`: preview ảnh có fallback khi load lỗi
- nếu cần: `app/admin/components/MultiImageUploader.tsx` để gallery preview cũng an toàn

## Best-practice chốt theo repo
- KISS: sửa ở nguồn seed + component dùng chung, không vá lẻ từng chỗ.
- DRY: gom fallback runtime vào 1 component admin và 1 helper validate ảnh.
- YAGNI: chỉ fix các module anh nêu (users/posts/services/products + detail liên quan), không mở rộng toàn hệ thống nếu không cần.
- An toàn với Convex: tránh phụ thuộc `fs/path` trong runtime seeder; mọi logic phải dùng data tĩnh/shared.

## Kết luận dễ hiểu
Sau khi implement theo spec này:
1. Seed Wizard sẽ không bao giờ đẻ thêm user Super Admin thứ hai.
2. Ảnh seed sẽ ưu tiên `seed_mau` khi file thật tồn tại, thiếu thì tự rơi về `picsum` như anh muốn.
3. Ở admin list/detail của bài viết, dịch vụ, sản phẩm sẽ có fallback nhìn gọn đẹp khi ảnh hỏng, không còn icon ảnh vỡ mặc định.
4. Em sẽ kiểm tra bằng `bunx tsc --noEmit`, rồi commit toàn bộ thay đổi đúng convention repo.

Nếu anh duyệt spec này, em sẽ bắt đầu implement đúng theo checklist trên.