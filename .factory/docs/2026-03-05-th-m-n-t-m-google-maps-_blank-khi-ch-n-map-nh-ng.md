## Problem Graph
1. [Main] Khi chọn Google Maps nhúng ở `/admin/settings`, thêm nút mở Google Maps tab mới (_blank) cho tiện <- depends on 1.1, 1.2
   1.1 [Parse link] Trích `src` từ iframe đã dán, xác định hợp lệ/không hợp lệ
   1.2 [UI/UX] Hiển thị nút luôn luôn, disable khi iframe lỗi

## Execution (with reflection)
1. Solving 1.1 (parse link từ iframe)
   - Thought: Không thêm field mới, dùng trực tiếp `contact_google_map_embed_iframe` để giữ KISS/YAGNI.
   - Action:
     - Ở `app/admin/settings/page.tsx` (nhánh render `contact_address`), thêm helper local:
       - `extractGoogleMapSrc(iframe: string): string` dùng regex lấy giá trị `src="..."` hoặc `src='...'`.
       - Chỉ chấp nhận `http/https`; nếu không có thì trả rỗng.
     - Tính:
       - `const googleMapSrc = extractGoogleMapSrc(googleIframe)`
       - `const canOpenGoogleMap = Boolean(googleMapSrc)`
   - Reflection: ✓ Không đụng backend/data model, chỉ xử lý UI-side.

2. Solving 1.2 (UI nút mở _blank)
   - Thought: Theo yêu cầu, nút luôn hiện nhưng disabled khi iframe lỗi.
   - Action:
     - Trong block đang hiển thị textarea Google iframe (khi `mapProvider === 'google_embed'`), thêm 1 hàng action:
       - Nút `Mở Google Maps` (variant outline hoặc ghost theo style hiện tại).
       - `disabled={!canOpenGoogleMap}`.
       - `onClick={() => window.open(googleMapSrc, '_blank', 'noopener,noreferrer')}` khi hợp lệ.
     - Thêm text helper ngay dưới nút:
       - Nếu hợp lệ: “Đã sẵn sàng mở Google Maps ở tab mới”.
       - Nếu không hợp lệ: “Iframe chưa hợp lệ nên chưa mở được”.
   - Reflection: ✓ UX rõ ràng, thao tác nhanh đúng mục tiêu “cho tiện”.

3. Validation
   - Chạy `bunx tsc --noEmit`.
   - Test tay nhanh tại `/admin/settings` tab Liên hệ:
     - Chọn Google Maps nhúng, chưa dán iframe -> nút disable.
     - Dán iframe hợp lệ -> nút enable, bấm mở tab mới đúng link `src`.

4. Commit
   - Commit theo style repo, ví dụ: `feat(settings): add open-google-map shortcut for embed mode`.
   - Bao gồm `.factory/docs` nếu có thay đổi file spec.

## Checklist scope
- [x] Nút mở Google Maps chỉ áp dụng khi chọn chế độ nhúng
- [x] Link mở lấy từ `src` trong iframe đã dán
- [x] Nút luôn hiển thị, disable khi iframe lỗi
- [x] Không thêm key/settings mới