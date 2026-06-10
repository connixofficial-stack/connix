## Problem Graph
1. [Main] Public routes vẫn hiện icon chữ dù đã có favicon trong settings <- depends on 1.1, 1.2
   1.1 [Sub] URL favicon trong DB có thể là relative URL, `/api/favicon` redirect lỗi rồi rơi vào fallback chữ V <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `NextResponse.redirect(faviconUrl)` chưa normalize URL (absolute/relative), nên khi URL không hợp lệ sẽ throw và vào `catch` trả SVG chữ V (status 200)
   1.2 [Sub] Browser cache favicon khá “lì” nên đổi favicon xong vẫn giữ icon cũ <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] metadata icon đang cố định `'/api/favicon'`, chưa có cache-busting theo setting mới nhất

## Execution (with reflection)
1. Solving 1.1.1 — làm `/api/favicon` redirect an toàn
   - File: `app/api/favicon/route.ts`
   - Thay đổi:
     - Giữ `trim()` như hiện tại.
     - Thêm hàm normalize URL:
       - Nếu `site_favicon` là absolute (`http/https`) => redirect như cũ.
       - Nếu là relative path (`/storage/...`, `/api/...`) => convert sang absolute bằng `new URL(faviconUrl, request.url)`.
     - Đổi `GET()` nhận `request: Request` để có base URL.
     - Nếu normalize thất bại mới fallback SVG chữ V.
   - Reflection: ✓ xử lý đúng case user gặp (API đang trả chữ V), không đổi hành vi business khác.

2. Solving 1.2.1 — cache-busting favicon theo setting mới nhất (đúng option bạn chọn)
   - File: `app/(site)/layout.tsx`
   - Thay đổi:
     - Trong `generateMetadata`, đổi:
       - từ `icons: { icon: '/api/favicon' }`
       - thành `icons: { icon: `/api/favicon?v=${encodeURIComponent(site.site_favicon || '')}` }`
     - Mục tiêu: mỗi lần đổi favicon URL trong settings thì icon URL đổi theo => browser fetch lại.
   - Reflection: ✓ đúng yêu cầu “Cache-busting URL favicon theo setting mới nhất”, KISS/YAGNI.

3. Verify sau khi implement
   - `/admin/settings`: set favicon bằng “Dùng logo hiện tại”, bấm Lưu.
   - Mở `http://localhost:3000/api/favicon`:
     - kỳ vọng redirect ra URL ảnh (không còn chữ V).
   - Mở route public (`/`, `/products`...) và hard refresh:
     - kỳ vọng favicon cập nhật ngay.
   - Kiểm tra Network request favicon có query `?v=...`.

4. Quality gate + commit
   - Chạy `bunx tsc --noEmit`.
   - Commit local 1 commit (không push), ví dụ:
     - `fix(favicon): normalize redirect url and add metadata cache-busting`