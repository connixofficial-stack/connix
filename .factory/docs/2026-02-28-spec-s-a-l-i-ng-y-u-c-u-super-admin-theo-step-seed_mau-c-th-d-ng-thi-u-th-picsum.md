Xin lỗi anh, anh nói đúng: em đã hiểu sai ở 2 điểm quan trọng.

## Problem Graph
1. [Seed Wizard phải luôn có đúng 1 Super Admin theo step] <- depends on 1.1
   1.1 [ROOT CAUSE] `SeedWizardDialog` đang rẽ nhánh theo `superAdmin` query lấy từ đầu màn hình (state cũ trước khi clear/seed), nên có case gọi nhầm `updateSuperAdmin` khi DB đã bị clear -> không tạo được Super Admin mới.
2. [Ảnh posts/services phải lấy seed_mau nếu file thật tồn tại, thiếu thì picsum] <- depends on 2.1, 2.2, 2.3
   2.1 [ROOT CAUSE] `posts.seeder.ts` hiện trả `undefined` ngay khi `useSeedMauImages === false` (đáng ra phải về picsum).
   2.2 [ROOT CAUSE] Nhiều template đang tham chiếu `/seed_mau/...` không có file thật (đã check ra nhiều path thiếu), nên vẫn sinh URL local lỗi 400.
   2.3 [ROOT CAUSE] Seeder chưa có lớp “kiểm tra path seed_mau có tồn tại thật” trước khi chọn ảnh.

## Execution (with reflection)
1. Solving 1.1 (Super Admin theo step, luôn đúng 1 tài khoản)
   - Thought: bỏ phụ thuộc vào state query cũ ở client, chuyển sang 1 mutation upsert phía server để atomic.
   - Action:
     - Thêm mutation mới trong `convex/auth.ts`: `ensureSuperAdminCredentials` (upsert).
       - Input: `{ email, password, name? }`.
       - Logic:
         1) đảm bảo role Super Admin tồn tại (tạo nếu thiếu),
         2) tìm user có role Super Admin,
         3) nếu có -> update email/password/name theo step,
         4) nếu chưa có -> create mới theo step,
         5) nếu email đang thuộc user thường khác -> patch user đó thành role Super Admin (để vẫn đảm bảo “luôn có 1 theo step”), đồng thời demote user super admin cũ (nếu có) về Admin role để không bao giờ có >1.
       - Kết quả cuối: luôn đúng 1 user role Super Admin.
     - Sửa `components/data/SeedWizardDialog.tsx`:
       - bỏ nhánh `if (superAdmin === null) create else update` hiện tại,
       - thay bằng 1 call duy nhất `ensureSuperAdminCredentials(...)` sau khi seed xong.
   - Reflection: xử lý ở server sẽ hết lệ thuộc timing/query stale và đúng ý “step này phải tạo/đảm bảo 1 super admin”.

2. Solving 2.1 (posts dùng picsum khi tắt seed_mau)
   - Thought: bug logic trực tiếp trong `posts.seeder`.
   - Action:
     - Sửa `convex/seeders/posts.seeder.ts`:
       - `if useSeedMauImages === false` => trả `https://picsum.photos/seed/${slug}/600/400` (không trả undefined).
   - Reflection: fix đúng hành vi user yêu cầu, không còn bài viết thiếu thumbnail khi tắt seed_mau.

3. Solving 2.2 + 2.3 (seed_mau path thật mới dùng)
   - Thought: cần guard runtime bằng manifest file-thật để không phụ thuộc template khai báo tay.
   - Action:
     - Tạo manifest tĩnh mới, ví dụ `lib/seed-templates/available-seed-mau-paths.ts`:
       - export `const AVAILABLE_SEED_MAU_PATHS = new Set<string>(...)` chứa path thực sự có trong `public/seed_mau`.
       - sinh bằng script nội bộ (node) từ filesystem và commit vào repo.
     - Thêm helper trong `lib/seed-templates/index.ts`:
       - `isAvailableSeedMauPath(path?: string): boolean`.
       - `pickAvailableSeedMau(items: string[]): string[]` để lọc mảng theo manifest.
       - cập nhật `getSeedMauAssetPool()` chỉ trả path có thật.
     - Sửa `convex/seeders/posts.seeder.ts` theo rule anh chốt:
       - chỉ lấy nhóm `posts` (template posts -> global posts pool),
       - nếu không có path hợp lệ thì fallback picsum,
       - không mượn hero/products cho posts nữa.
     - Sửa `convex/seeders/services.seeder.ts` theo rule anh chốt:
       - chỉ lấy `gallery` hợp lệ (template gallery -> global gallery pool),
       - nếu không có thì picsum.
   - Reflection: kể cả template còn sai path, seeder vẫn không phát URL lỗi 400 nữa vì luôn lọc theo file thật.

4. Verification & commit
   - Action:
     - chạy `bunx tsc --noEmit`.
     - kiểm tra `git diff --cached` + `git status` trước commit.
     - commit theo style repo, kèm `.factory/docs` nếu có thay đổi.
   - Reflection: giữ đúng convention project.

## File dự kiến chỉnh
- `convex/auth.ts` (thêm `ensureSuperAdminCredentials` upsert)
- `components/data/SeedWizardDialog.tsx` (gọi upsert thay create/update theo query stale)
- `convex/seeders/posts.seeder.ts` (fix fallback picsum + strict posts-only)
- `convex/seeders/services.seeder.ts` (strict gallery-only)
- `lib/seed-templates/index.ts` (helper lọc path tồn tại)
- `lib/seed-templates/available-seed-mau-paths.ts` (manifest path tồn tại thật)
- script generate manifest (ví dụ `scripts/generate_seed_mau_manifest.js`) nếu cần để tái tạo manifest khi bổ sung ảnh

## Kết quả sau khi làm xong
- Seed Wizard luôn đảm bảo có đúng 1 Super Admin theo step.
- User thường không bị gán Super Admin ngoài step.
- Ảnh posts/services: có seed_mau thật thì dùng, thiếu thì tự rơi picsum; không còn seed URL local chết gây 400.