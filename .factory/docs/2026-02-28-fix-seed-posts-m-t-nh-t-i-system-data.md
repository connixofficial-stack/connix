## Problem Graph
1. [Main] Seed posts tại `/system/data` bị mất ảnh <- depends on 1.1, 1.2
   1.1 [Sub] `PostSeeder` chọn `thumbnail` từ pool `assets.posts` trước
      1.1.1 [ROOT CAUSE] Nhiều URL trong `assets.posts` trỏ tới `/seed_mau/*/posts/post-*.webp` nhưng file thực tế không tồn tại (thư mục posts chủ yếu chỉ `.gitkeep`)
   1.2 [Sub] `ServiceSeeder` vẫn có ảnh vì lấy `assets.gallery` (có file thật) + fallback `picsum`

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: So sánh trực tiếp luồng seed posts/services và đối chiếu file thực trong `public/seed_mau`.
   - Action: Đọc `convex/seeders/posts.seeder.ts`, `convex/seeders/services.seeder.ts`, `lib/seed-templates/industries/*.ts`, và quét asset trong `public/seed_mau`.
   - Reflection: ✓ Xác nhận đúng root cause: posts pool ưu tiên path không tồn tại.

2. Thiết kế fix theo lựa chọn của bạn (Option A)
   - Thought: Giữ ưu tiên chất lượng ảnh theo ngành nhưng phải tự động tránh URL lỗi.
   - Action: Bổ sung cơ chế validate URL local trước khi trả thumbnail; nếu lỗi thì fallback tuần tự `hero -> products -> global posts/hero/products -> picsum`.
   - Reflection: ✓ Đáp ứng KISS, không phụ thuộc seed data thủ công.

## Kế hoạch implement chi tiết
1. **Cập nhật `convex/seeders/posts.seeder.ts`**
   - Thêm helper nội bộ để kiểm tra candidate hợp lệ:
     - Nếu URL bắt đầu `/seed_mau/` thì kiểm tra file tương ứng tồn tại trong `public` (dùng Node `fs.existsSync` + `path.resolve(process.cwd(), 'public', ...)`).
     - Nếu là URL ngoài (`http/https`) thì coi là hợp lệ.
   - Refactor `getPostThumbnail(...)`:
     - Thử lần lượt: `template.assets.posts` -> `template.assets.hero` -> `template.assets.products` -> global pool `posts` -> `hero` -> `products`.
     - Mỗi bước phải lọc candidate hợp lệ trước khi random.
     - Nếu không còn candidate hợp lệ: fallback `https://picsum.photos/seed/${slug}/600/400`.
   - Giữ nguyên behavior `useSeedMauImages === false` => trả `undefined` (đúng theo config wizard).

2. **Không sửa `services.seeder.ts`**
   - Vì luồng hiện tại đã ổn định (gallery có file thật + fallback picsum), tránh over-change (YAGNI).

3. **Kiểm thử sau sửa (không chạy lint theo rule repo)**
   - Chạy `bunx tsc --noEmit` để đảm bảo type-safe.
   - Test thủ công luồng `/system/data`:
     - Seed Wizard với website có posts + useSeedMauImages bật.
     - Kiểm tra danh sách `/admin/posts` và trang public posts đều render ảnh.
     - Kiểm tra service vẫn bình thường (regression check nhanh).

4. **Git workflow sau khi implement (theo rule repo)**
   - Commit local, không push.
   - Khi commit nhớ include `.factory/docs` nếu có thay đổi liên quan.

## Kết luận ngắn gọn
- Root cause không nằm ở UI hay query posts, mà ở **đường dẫn ảnh seed posts không tồn tại** trong `public/seed_mau`.
- Fix đã chốt theo lựa chọn của bạn: **fallback thông minh + validate file tồn tại**, chỉ áp dụng cho seed mới, không đụng dữ liệu cũ.