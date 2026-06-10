## Audit Summary
- **Observation**: `bunx convex dev` báo lỗi TypeScript: `Cannot find module '@/lib/seo'` tại `lib/posts/generator/assembler.ts:1`.
- **Evidence**:
  - `lib/seo.ts` **tồn tại** và export `stripHtml`, `truncateText`.
  - `tsconfig.json` (root) có `paths: { "@/*": ["./*"] }`.
  - `convex/tsconfig.json` **không có** `baseUrl/paths`, nên typecheck trong ngữ cảnh Convex không resolve được alias `@/...`.
  - `convex/posts.ts` import `../lib/posts/generator/assembler`, khiến file assembler bị kiểm tra dưới config Convex.
- **Inference**: lỗi không nằm ở thiếu file `lib/seo.ts`, mà nằm ở mismatch module resolution giữa root TS config và Convex TS config.
- **Decision (Recommend)**: đổi import trong `lib/posts/generator/assembler.ts` từ alias `@/lib/seo` sang relative path `../../seo` để tương thích cả root + Convex typecheck, thay đổi nhỏ và rollback dễ.

## Root Cause Confidence
- **High** — vì đã xác nhận đủ chuỗi nguyên nhân: file đích tồn tại, alias chỉ khai báo ở root tsconfig, Convex tsconfig không có alias, và chỉ `assembler.ts` dùng alias `@/` trong thư mục generator.

## TL;DR kiểu Feynman
- Convex đọc một bộ TS config riêng, bộ này không hiểu `@/...`.
- `assembler.ts` đang dùng `@/lib/seo`, nên Convex báo “không tìm thấy module”.
- Sửa an toàn nhất: đổi import sang đường dẫn tương đối.
- Không cần đụng kiến trúc SEO hay logic generator.
- Sau sửa, chạy lại typecheck để xác nhận hết lỗi rồi commit.

## Files Impacted
- **Sửa:** `lib/posts/generator/assembler.ts`
  - Vai trò hiện tại: lắp payload bài viết auto-generator cho posts module.
  - Thay đổi: đổi dòng import `stripHtml/truncateText` từ alias sang relative path để tương thích Convex typecheck.

## Execution Preview
1. Mở `lib/posts/generator/assembler.ts` và đổi `import { stripHtml, truncateText } from '@/lib/seo';` thành `from '../../seo';`.
2. Static review nhanh: kiểm tra không ảnh hưởng các import còn lại.
3. Chạy verify typecheck theo rule dự án (chỉ `bunx tsc --noEmit` vì có đổi TS).
4. Commit 1 thay đổi nhỏ, message rõ nguyên nhân tương thích Convex.

## Verification Plan
- Repro trước sửa: `bunx convex dev` báo TS2307 ở `assembler.ts:1`.
- Pass sau sửa:
  - `bunx tsc --noEmit` không còn TS2307 liên quan `@/lib/seo`.
  - `bunx convex dev` không còn lỗi import module này.
- Không chạy lint/unit test (tuân thủ guideline repo).

## Acceptance Criteria
- Không còn lỗi `Cannot find module '@/lib/seo'` trong luồng Convex typecheck.
- `lib/posts/generator/assembler.ts` vẫn dùng đúng `stripHtml`, `truncateText` từ `lib/seo.ts`.
- Diff chỉ gói gọn ở 1 file (thay đổi nhỏ, dễ rollback).

## Out of Scope
- Không chuẩn hóa toàn bộ alias `@/` trong codebase.
- Không chỉnh `convex/tsconfig.json` để thêm paths alias cho toàn hệ thống.

## Risk / Rollback
- **Risk thấp**: chỉ đổi đường dẫn import, không đổi logic runtime.
- **Rollback**: revert 1 commit hoặc 1 dòng import.