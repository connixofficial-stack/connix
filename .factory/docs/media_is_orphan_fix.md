# I. Primer
## 1. TL;DR kiểu Feynman
- Hệ thống có 2 cách kiểm tra ảnh có đang được dùng hay không: một cách là "quét mọi ngóc ngách" (tìm trong toàn bộ các bảng dữ liệu) và một cách là "xem sổ đăng ký" (bảng `fileReferences` - nơi chính thức ghi nhận ảnh nào đang dùng ở đâu).
- Chức năng "Kiểm tra file chưa dùng" trên giao diện hiện tại chỉ dùng cách "quét mọi ngóc ngách" mà quên kiểm tra "sổ đăng ký".
- Do đó, nếu một ảnh có ghi trong sổ đăng ký nhưng không tìm thấy khi quét (có thể do record đó thuộc về một bảng mới hoặc được lưu theo một format mới), nó sẽ bị đánh giá sai là "Cô đơn".
- Nhưng khi người dùng bấm Xóa, hệ thống lại làm đúng: kiểm tra cả "sổ đăng ký", thấy có dùng nên chặn lại và báo lỗi "Không xóa vì file vẫn đang được sử dụng".
- Giải pháp: Cập nhật hàm quét tổng (`resolveMediaUsageMap`) để nó cũng đọc "sổ đăng ký" (`fileReferences`) trước khi kết luận.

## 2. Elaboration & Self-Explanation
Chức năng "Kiểm tra file chưa dùng" gọi hàm `resolveMediaUsageMap` để quét các bảng (như `users`, `products`, `settings`...) tìm xem `url` hoặc `storageId` của ảnh có nằm trong nội dung các bảng đó không. Tuy nhiên, hệ thống backend đã có thêm một bảng là `fileReferences` dùng để quản lý vòng đời (tracking chính xác mối liên hệ giữa một record và file). 

Hàm xóa `bulkRemoveOnlyOrphans` cẩn thận gọi `listFileUsagesByStorageId` (đọc bảng `fileReferences`) để chặn việc xóa nếu file còn tham chiếu. Vì hàm quét lấy trạng thái cho giao diện UI (`resolveMediaUsageMap`) không đọc bảng này, dẫn đến sự bất đồng nhất (discrepancy) giữa trạng thái hiển thị (Cô đơn) và trạng thái khi xóa (Bị chặn do đang sử dụng). 

Cập nhật hàm `resolveMediaUsageMap` bằng cách gộp thêm cả dữ liệu query từ `fileReferences` sẽ giúp giao diện hiển thị đúng số lượt dùng thực tế, từ đó khắc phục lỗi không thể xóa ảnh.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng thư viện media là một "nhà kho". Hệ thống cũ đếm đồ đạc bằng cách đi từng phòng (users, products) tìm xem có món đồ nào giống thế không (đại diện cho việc quét toàn bộ database). Gần đây, hệ thống mới có thêm một "cuốn sổ cái" (`fileReferences`) ghi rõ món đồ nào đang cho ai mượn.

Giao diện quản lý nhà kho chỉ đi từng phòng tìm, không thấy thì báo đồ này "Cô đơn" (Orphan - không ai dùng). Nhưng khi nhân viên định vứt món đồ đi, người quản lý mở "cuốn sổ cái" ra thấy món đồ vẫn đang được mượn, nên không cho vứt (báo lỗi). 
Cách giải quyết triệt để là: Nhân viên khi kiểm tra đồ đạc cũng phải mở "cuốn sổ cái" ra đọc.

# II. Audit Summary (Tóm tắt kiểm tra)
- Triệu chứng quan sát được: Chức năng "Kiểm tra file chưa dùng" đánh dấu một số file là `isOrphan: true` (Cô đơn), nhưng thao tác xóa file đó lại báo lỗi toast "Không xóa vì file vẫn đang được sử dụng".
- Phạm vi ảnh hưởng: Tính năng quản lý Media tại `/admin/media` trên môi trường hiện tại.
- Có tái hiện ổn định không: Có, lỗi tái hiện ổn định với các file có tham chiếu lưu trong `fileReferences` nhưng không nằm trực tiếp dưới dạng url/storageId khi quét chuỗi trong bảng.
- Mốc thay đổi gần nhất: Không có thay đổi gần, nhưng có thể do kiến trúc thêm bảng `fileReferences` (đóng vai trò Source of Truth) vào hệ thống sau khi hàm `resolveMediaUsageMap` đã được viết.
- Rủi ro nếu fix sai: Đánh dấu nhầm file đang dùng thành file chưa dùng, dẫn đến mất file nếu user bấm xóa. (Lưu ý: rủi ro thực tế rất thấp do Convex mutation xóa đã có lớp bảo vệ thứ 2 ở hàm remove).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Độ tin cậy: High
- Nguyên nhân: Hàm `resolveMediaUsageMap` trong tệp `convex/media.ts` không query bảng `fileReferences`. Hàm này quyết định trạng thái `isOrphan` của ảnh trên giao diện. Tuy nhiên, mutation xóa `bulkRemoveOnlyOrphans` lại kiểm tra bảng `fileReferences`. Sự chênh lệch này dẫn đến conflict.
- Giả thuyết đối chứng: Có thể `bulkRemoveOnlyOrphans` truyền sai id file? Không, đã kiểm tra code, mutation xóa luôn nhận id chính xác từ giao diện gửi xuống và đối chiếu bằng `storageId` chuẩn. Vấn đề chắc chắn nằm ở logic tính `isOrphan` bị thiếu.

# IV. Proposal (Đề xuất)
- Bổ sung logic vào hàm `resolveMediaUsageMap` trong tệp `convex/media.ts`.
- Cụ thể: Sau khi khởi tạo mảng `candidates`, thêm một vòng lặp truy vấn bảng `fileReferences` theo `storageId` của từng ứng viên (candidate).
- Ghi nhận (push) các tham chiếu tìm được vào `usageMap`. Các references này sẽ đại diện cho usage "hiện đại", giúp giao diện nhận biết file đang được sử dụng và không còn gắn nhãn "Cô đơn" sai lệch nữa.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `convex/media.ts`: Thêm logic đọc bảng `fileReferences` vào hàm `resolveMediaUsageMap` để tính toán số lần sử dụng chính xác.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm thuộc tính `rawStorageId: media.storageId` khi map danh sách `candidates` trong hàm `resolveMediaUsageMap`.
2. Tạo vòng lặp duyệt qua `candidates`.
3. Trong vòng lặp, query `fileReferences` bằng index `by_storageId`.
4. Lặp qua các kết quả lấy được và push object đại diện usage vào mảng tương ứng của file đó trong `usageMap`.
5. Đảm bảo luồng quét cũ (raw scan) vẫn chạy ngay sau đó để bảo toàn khả năng tương thích với dữ liệu cũ chưa migrate sang `fileReferences`.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Mở URL `http://localhost:3000/admin/media`.
- Bấm nút "Kiểm tra file chưa dùng".
- Quan sát các ảnh trước đó báo "Cô đơn" (như `ruou-vang-phap-chateau...` hay `chong-nang-anh-image...`) nay sẽ bị mất nhãn "Cô đơn" và hiển thị đúng số lượng dùng (Ví dụ: `1 dùng`).
- Do các ảnh này không còn bị gán nhãn "Cô đơn", chúng ta không thể chọn chúng để xóa nhầm (ngăn chặn triệt để lỗi báo từ UI).

# VIII. Todo
- [x] Chỉnh sửa file `convex/media.ts`.
- [x] Chạy lệnh `bunx tsc --noEmit` để chắc chắn không gây ra lỗi TypeScript.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Giao diện thư viện Media hiển thị chính xác các ảnh đang dùng (không còn gắn nhãn Cô đơn sai cho các file có trong fileReferences).
- Chỉ những file nào thực sự không được dùng ở đâu (cả trong các bảng raw và `fileReferences`) mới được gắn nhãn "Cô đơn".
- Không còn gặp lại lỗi "Không xóa vì file vẫn đang được sử dụng" khi thao tác xóa trên file đã hiển thị là Cô đơn.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro rất thấp vì thay đổi chỉ nằm ở khâu đọc dữ liệu bổ sung để hiển thị (Read operation), không hề thay đổi cấu trúc dữ liệu thực tế hay logic ghi (Write operation).
- Rollback: Xóa đoạn vòng lặp query `fileReferences` khỏi `resolveMediaUsageMap`.

# XI. Out of Scope (Ngoài phạm vi)
- Việc gỡ bỏ hệ thống quét cũ (raw scan các bảng `users`, `products`...) nằm ngoài phạm vi công việc. Vẫn cần giữ lại các luồng quét cũ vì hệ thống có thể cần fallback cho dữ liệu legacy chưa kịp migrate sang bảng `fileReferences`.
