## Problem Graph
1. [Main] Build lỗi ở `app/admin/home-components/partners/[id]/edit/page.tsx` <- depends on 1.1, 1.2
   1.1 [Sub] File đang dùng React client hooks (`useEffect`, `useState`, `useRouter`, Convex hooks) nhưng chưa khai báo Client Component
      1.1.1 [ROOT CAUSE] Thiếu directive `"use client"` ở đầu file
   1.2 [Sub] Import `use` từ React để đọc `params: Promise<{id:string}>` đang là pattern client-only trong Next 16, nên càng bắt buộc file là client

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Next.js App Router mặc định là Server Component; khi có `useEffect` phải có `"use client"`.
   - Action: Đề xuất thêm `"use client";` lên dòng đầu file `app/admin/home-components/partners/[id]/edit/page.tsx`.
   - Reflection: ✓ Khớp chính xác với thông báo lỗi Turbopack.
2. Verify side effects...
   - Thought: File đã dùng hooks client (`useRouter`, `useMutation/useQuery`) nên chuyển sang client là đúng ngữ nghĩa, không phát sinh mismatch kiến trúc.
   - Action: Sau khi sửa sẽ chạy `bunx tsc --noEmit` theo AGENTS.md.
   - Reflection: ✓ Đúng convention repo, check nhanh và đủ cho thay đổi TS/React.

## Kết luận root cause
- **Root cause trực tiếp:** thiếu `"use client"` ở đầu file `partners/[id]/edit/page.tsx`.
- **Bối cảnh gây lỗi:** file đang dùng các hook chỉ chạy ở Client Component (`useEffect`, `useState`, `useRouter`, Convex React hooks).

## Kế hoạch implement (khi bạn duyệt)
1. Thêm `"use client";` ở dòng 1 file `app/admin/home-components/partners/[id]/edit/page.tsx`.
2. Chạy `bunx tsc --noEmit` để xác nhận không còn lỗi type/build liên quan.
3. Báo kết quả và (nếu bạn muốn) mình sẽ commit theo rule project.