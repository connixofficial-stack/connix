# I. Primer
## 1. TL;DR kiểu Feynman
- Trang Media trước đây có cách lấy dữ liệu là "lấy 1 lần 100 món rồi thôi" (hardcode limit 100).
- Hệ quả: Chỉ thấy được 100 ảnh, không có cách nào xem tiếp các ảnh cũ hơn, và không biết tổng số ảnh là bao nhiêu.
- Giải pháp: Đổi sang cách lấy dữ liệu kiểu "cuộn đến đâu lấy đến đó" (Phân trang/Load More). Khi kéo xuống dưới, sẽ có nút "Tải thêm" để lấy tiếp 50 ảnh. Đồng thời, lấy số "tổng tồn kho" từ cục thống kê (Stats) để hiện lên cho người dùng biết.

## 2. Elaboration & Self-Explanation
Code trước đây sử dụng hàm `useQuery` gọi mutation `listWithUrlsAndUsage` với tham số `limit: 100`. Cách tiếp cận này giúp trang load nhanh lúc đầu nhưng không cho phép truy xuất các file nằm ngoài top 100.
Convex có hỗ trợ Hook `usePaginatedQuery` sinh ra để giải quyết chính xác bài toán này. Tuy nhiên, API query hiện tại chưa hỗ trợ định dạng trả về của Pagination.
Tôi đã tạo một API mới tên là `listWithUrlsAndUsagePaginated` trong `convex/media.ts` có trả về dạng Pagination (có property `page`), sau đó cập nhật màn hình `app/admin/media/page.tsx` dùng `usePaginatedQuery` với nút "Tải thêm". 
Bên cạnh đó, việc lấy tổng số lượng ảnh đã được bổ sung ở Footer bằng cách dùng dữ liệu từ `statsData?.totalCount` có sẵn.

## 3. Concrete Examples & Analogies
Tưởng tượng bạn lật một cuốn danh bạ điện thoại: 
- Cách cũ: Bạn xé đúng 10 trang đầu ra xem, xong vứt cuốn danh bạ đi. Nếu không tìm thấy tên người quen ở 10 trang đó, bạn chịu thua.
- Cách mới: Bạn vẫn xem 10 trang đầu. Xem xong, bạn lật tiếp (bấm nút Tải thêm) để xem trang 11, trang 12. Hơn nữa, ngoài bìa sách có ghi rõ "Danh bạ có tổng cộng 500 người", nên bạn biết chắc mình đã lật bao nhiêu phần của cuốn sách.

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng quan sát được: Trang Media chỉ hiển thị tối đa 100 file. Không có chức năng lật trang hay xem tiếp, tổng số lượng không hiển thị đủ.
- Phạm vi ảnh hưởng: Màn hình `/admin/media`.
- Có tái hiện ổn định không: Có, đây là thiết kế tĩnh (hardcode) limit 100 của hệ thống.
- Tiêu chí sửa chữa: Phải phân trang được (Load More) mà không làm hỏng tính năng "Kiểm tra file chưa dùng" hay các bộ lọc client-side.
- Rủi ro nếu fix sai: Mất khả năng tải ảnh trên giao diện nếu query pagination lỗi.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Độ tin cậy: High
- Nguyên nhân: API lấy dữ liệu dùng cấu trúc `limit: 100` đơn giản qua `useQuery`, thay vì dùng `usePaginatedQuery` với `paginationOpts`.
- Giả thuyết đối chứng: Có thể API có phân trang mà UI quên gọi? Không, API `listWithUrlsAndUsage` hiện tại không trả về object dạng `page` như chuẩn Pagination của Convex. Bắt buộc phải viết thêm một API chuyên dùng cho phân trang.

# IV. Proposal (Đề xuất)
- Backend: Tạo query mới `listWithUrlsAndUsagePaginated` trong `convex/media.ts` để handle logic map usage và url nhưng trả về object có cấu trúc phân trang.
- Frontend: Đổi `useQuery` thành `usePaginatedQuery` trong `app/admin/media/page.tsx`. Bổ sung giao diện Footer hiển thị Tổng số file và nút "Tải thêm".

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `convex/media.ts`: Thêm `listWithUrlsAndUsagePaginated`.
- Sửa: `app/admin/media/page.tsx`: Cập nhật Hook gọi data và phần Footer.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm `listWithUrlsAndUsagePaginated` vào cuối `convex/media.ts` (giữ nguyên logic check usage như đã fix ở task trước, nhưng lồng vào `.paginate()`).
2. Trong `page.tsx`, thêm nút "Tải thêm 50 files" ở Footer, gọi hàm `loadMore(50)`.
3. Cập nhật câu text hiển thị ở dưới cùng thành "Hiển thị X / Y files đã tải (Tổng hệ thống: Z files)".

# VII. Verification Plan (Kế hoạch kiểm chứng)
- User truy cập `/admin/media`.
- Cuộn xuống dưới cùng danh sách ảnh.
- Sẽ thấy dòng chữ ví dụ: "Hiển thị 50 / 50 files đã tải (Tổng hệ thống: 120 files)".
- Bấm nút "Tải thêm", 50 file tiếp theo sẽ được append vào danh sách.

# VIII. Todo
- [x] Tạo `listWithUrlsAndUsagePaginated` trong API Convex.
- [x] Đổi code React sang `usePaginatedQuery` kèm UI Load More.
- [x] Chạy test tĩnh `tsc --noEmit`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Hiển thị đúng tổng số file (vd: 120 files) thông qua `statsData`.
- Xem được tất cả các file trong hệ thống bằng cách bấm tải thêm.
- Các chức năng search/filter của giao diện vẫn hoạt động bình thường trên tập dữ liệu ĐÃ tải xuống.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: Thấp.
- Hoàn tác: Quay lại dùng `useQuery` và `limit: 100` như cũ trong git commit.

# XI. Out of Scope (Ngoài phạm vi)
- Việc phân trang phía Server kết hợp với Search/Filter phía Server. Hiện tại thiết kế trang này là load partial và search trên client. Việc đập đi làm lại toàn bộ hệ thống Search/Filter chuyển sang Server-Side sẽ vượt ngoài phạm vi fix nhanh lỗi hiển thị phân trang này.
