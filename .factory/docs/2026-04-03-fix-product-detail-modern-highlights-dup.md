Xin lỗi, lúc nãy mình hiểu sai ý. Mình đã audit lại theo ảnh bạn gửi và root cause đã rõ.

## Audit Summary
- Observation: Ở layout `modern`, khi `heroStyle === 'split'` đang có **2 cụm highlights** khác nhau cùng xuất hiện.
- Evidence 1: `app/(site)/products/[slug]/page.tsx` có một block hardcode trong nhánh `heroStyle === 'split'` với tiêu đề `Điểm nổi bật` và 3 bullet tĩnh (`Thiết kế cao cấp...`, `Công nghệ mới nhất...`, `Bảo hành chính hãng...`) quanh vùng line ~1915–1961.
- Evidence 2: Ngay bên dưới cùng layout `modern`, file này còn render block highlights dùng chung: `showHighlights && <HighlightsGrid ... />` quanh line ~2152.
- Evidence 3: Ảnh bạn gửi thể hiện đúng hiện tượng này: một hàng highlight nằm trong hero split, và một hàng highlight khác bên dưới bị lặp.
- Decision: Fix tối thiểu là **giữ 1 nguồn hiển thị highlights duy nhất** cho modern, và bỏ block hardcode trong hero split.

## Root Cause Confidence
**High** — lỗi không nằm ở config dùng chung, mà ở `modern/split hero` đang render thêm một danh sách “Điểm nổi bật” hardcode, trong khi layout modern đã có highlights grid chuẩn ở phía dưới. Vì vậy khi bật highlights sẽ bị duplicate.

## TL;DR kiểu Feynman
- Modern đang có 1 khối highlights thật và 1 khối highlights giả viết cứng.
- Hai khối này cùng hiện ra nên bạn thấy bị lặp.
- Sửa đúng nhất là xóa khối viết cứng trong hero split.
- Sau đó modern vẫn còn 1 khối highlights chuẩn, lấy từ config hiện tại.
- Scope sửa nhỏ, không cần đổi schema hay data.

## Files Impacted
- **Sửa:** `app/(site)/products/[slug]/page.tsx`
  - Vai trò hiện tại: runtime product detail page, render 3 layout classic/modern/minimal.
  - Thay đổi: bỏ block `Điểm nổi bật` hardcode trong nhánh `modern` + `heroStyle === 'split'` để không render trùng với `HighlightsGrid` dùng chung.

- **Có thể rà thêm, không nhất thiết sửa:** `components/experiences/previews/ProductDetailPreview.tsx`
  - Vai trò hiện tại: preview của experience editor cho product-detail.
  - Nếu preview cũng đang có cùng block hardcode ở modern split thì cần mirror fix để preview khớp site runtime; nếu không thì không chạm.

## Execution Preview
1. Đọc nhánh render `layoutStyle === 'modern'` trong `app/(site)/products/[slug]/page.tsx`.
2. Xóa riêng block `Điểm nổi bật` hardcode nằm trong `heroStyle === 'split'`.
3. Giữ nguyên `showHighlights && <HighlightsGrid ... />` phía dưới làm nguồn hiển thị duy nhất.
4. Đối chiếu `components/experiences/previews/ProductDetailPreview.tsx`; nếu preview có cùng pattern duplicate thì bỏ block hardcode tương tự để parity preview = site.
5. Static review: kiểm tra `modern/full`, `modern/minimal`, `classic`, `minimal` không bị ảnh hưởng.
6. Sau khi code: chạy `bunx tsc --noEmit`, rồi commit local theo rule repo.

## Acceptance Criteria
- Layout `modern` không còn hiển thị 2 cụm highlights cùng lúc.
- Khi bật highlights, modern chỉ còn **1** block highlights chuẩn.
- `heroStyle = split` không còn danh sách `Điểm nổi bật` hardcode trong hero.
- Classic và minimal giữ nguyên behavior hiện tại.
- Nếu preview editor có modern split, preview và site phải khớp nhau sau khi sửa.

## Verification Plan
- **Static review:** xác nhận đã bỏ đúng block hardcode trong modern split, vẫn giữ `HighlightsGrid` dùng chung.
- **Typecheck:** `bunx tsc --noEmit` sau khi sửa vì có thay đổi TS/TSX.
- **Manual repro cho tester:** vào `/system/experiences/product-detail`, chọn layout modern + hero split + bật highlights; preview/site chỉ còn 1 cụm highlights, không bị lặp như ảnh.

## Audit theo 8 câu bắt buộc
1. Triệu chứng: expected là modern có 1 khối highlights; actual là modern split hiện 2 khối.
2. Phạm vi: product-detail experience, cụ thể layout modern.
3. Tái hiện: có, ổn định; chọn modern và dùng hero split khi highlights bật.
4. Mốc thay đổi gần nhất: chưa cần truy commit vì evidence code hiện tại đã đủ rõ từ 2 render path song song.
5. Dữ liệu thiếu: không thiếu gì để fix tối thiểu.
6. Giả thuyết thay thế đã loại trừ: không phải do config dùng chung cho 3 layout; duplicate đến từ 1 block hardcode bổ sung riêng trong modern split.
7. Rủi ro nếu fix sai nguyên nhân: có thể làm mất toàn bộ highlights ở modern hoặc preview/site lệch nhau.
8. Pass/fail: pass khi modern split chỉ còn 1 block highlights quan sát được.

## Out of Scope
- Không tách highlights thành config riêng cho từng layout.
- Không đổi wording editor.
- Không refactor kiến trúc highlights toàn module nếu chưa cần.

## Risk / Rollback
- Rủi ro thấp vì scope chỉ là bỏ 1 block UI hardcode.
- Rollback dễ: revert file runtime tương ứng; nếu có sửa preview thì revert thêm file preview.