Đã rõ nguyên nhân: `new Array<number>(bLen + 1)` bị rule `eslint-plugin-unicorn(no-new-array)` cảnh báo.

Kế hoạch sửa tối thiểu (không đổi logic):
1. File: `convex/lib/search.ts`
2. Trong hàm `levenshteinDistance`, thay:
   - `const curr = new Array<number>(bLen + 1);`
   bằng
   - `const curr = Array.from({ length: bLen + 1 }, () => 0);`
3. Giữ nguyên toàn bộ thuật toán, chỉ đổi cách khởi tạo mảng để pass rule lint.
4. Verify:
   - chạy lại `bunx oxlint --type-aware --type-check --fix`
   - chạy `bunx tsc --noEmit`
5. Commit local (không push), kèm `.factory/docs` nếu có theo rule repo.

Đây là fix nhỏ, an toàn, không ảnh hưởng behavior fuzzy/ranking.