## Problem Graph
1. [Main] `bunx convex dev` fail khi bundle seeders <- depends on 1.1, 1.2
   1.1 [Sub] `convex/seeders/posts.seeder.ts` import `node:fs`, `node:path`
      1.1.1 [ROOT CAUSE] Seeder đang chạy Convex runtime mặc định, không hỗ trợ Node built-ins nếu không tách file `"use node"`
   1.2 [Sub] Logic validate file ảnh local đang phụ thuộc Node FS

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Chỉ có `posts.seeder.ts` đang dùng Node built-ins; các seeder khác không bị.
   - Action: Sửa `convex/seeders/posts.seeder.ts` để loại bỏ import `existsSync` và `path`.
   - Reflection: ✓ Valid — đúng với option A bạn chọn, ít rủi ro, KISS.

2. Solving 1.2...
   - Thought: Mục tiêu chính là hết lỗi bundling; không cần Node runtime riêng (YAGNI).
   - Action: Trong `getPostThumbnail`, thay `isValidSeedMauPath`:
     - Giữ rule đơn giản: string hợp lệ nếu có giá trị (không check file tồn tại bằng FS).
     - Vẫn giữ toàn bộ chuỗi fallback hiện có (`assets.posts` -> `hero` -> `products` -> pool -> picsum).
   - Reflection: ✓ Valid — vẫn đảm bảo luôn trả thumbnail, loại bỏ phụ thuộc Node API.

3. Verify compile/runtime contract
   - Action: chạy `bunx tsc --noEmit` (theo rule repo trước khi commit khi có đổi TS).
   - Action: chạy `bunx convex dev` để xác nhận hết lỗi `Could not resolve "node:fs"`/`"node:path"`.
   - Reflection: Nếu còn lỗi khác ngoài scope, chỉ xử lý lỗi cản trở trực tiếp lệnh này.

4. Commit theo quy ước repo
   - Action: kiểm tra `git status` + `git diff --cached` để chắc không có secret.
   - Action: commit message đề xuất: `fix(seeders): remove node built-ins from posts seeder runtime`
   - Action: đảm bảo add cả `.factory/docs` nếu có thay đổi trong thư mục đó (theo AGENTS.md).

## File thay đổi dự kiến
- `convex/seeders/posts.seeder.ts`
  - Xóa import:
    - `import { existsSync } from 'node:fs'`
    - `import path from 'node:path'`
  - Refactor helper `isValidSeedMauPath` để không dùng filesystem check.

## Kết quả kỳ vọng
- `bunx convex dev` không còn lỗi bundling Node built-ins từ seeder.
- Luồng seed posts vẫn chạy với cơ chế fallback thumbnail hiện tại.
- Không phát sinh thay đổi kiến trúc runtime (không cần tách `"use node"` action).