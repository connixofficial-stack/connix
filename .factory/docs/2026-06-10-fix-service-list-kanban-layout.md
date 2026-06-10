# Sửa lỗi rớt chữ "Liên hệ" trong layout Kanban của Service List

Dưới đây là kế hoạch chi tiết để sửa lỗi hiển thị chữ "Liên hệ" (giá tiền) bị tràn ra ngoài card trong layout Kanban của component Danh sách dịch vụ (`service-list`).

# I. Primer

## 1. TL;DR kiểu Feynman
* **Hiện tượng:** Chữ "Liên hệ" (giá tiền) ở chân card trong giao diện Kanban của danh sách dịch vụ bị trôi xuống dưới, nằm ngoài khung viền của card.
* **Nguyên nhân:** Lập trình viên trước đã áp đặt một công thức tính chiều cao cứng nhắc `h-[calc(100%-165px)]` cho phần nội dung văn bản dưới ảnh. Khi card bị thay đổi chiều rộng, ảnh (vốn có tỉ lệ `aspect-[16/10]` dynamic) sẽ tự động thay đổi chiều cao. Nếu ảnh cao lên, khoảng trống còn lại cho phần chữ sẽ nhỏ hơn kết quả của phép tính cứng nhắc kia, khiến nội dung bị tràn ra ngoài.
* **Giải pháp:** Bỏ công thức tính chiều cao cứng nhắc kia đi. Thay vào đó, thiết lập cho toàn bộ card là một chiếc hộp xếp dọc tự động (Flexbox `flex flex-col`), cho phần nội dung chữ tự giãn rộng để chiếm toàn bộ chỗ trống còn lại (`flex-1`), và đẩy giá tiền sát xuống đáy hộp bằng cách tự tạo khoảng đệm ở trên (`mt-auto`).

## 2. Elaboration & Self-Explanation
Trong lập trình giao diện Web, khi thiết kế một chiếc card (thẻ) chứa cả hình ảnh và văn bản thông tin, chúng ta luôn mong muốn card có kích thước cố định hoặc co giãn đều nhau giữa các cột (Grid layout). Trong layout Kanban của component `service-list`:
* Toàn bộ card nằm trong thẻ `<article>` với thuộc tính `h-full` để giãn hết chiều cao của ô Grid.
* Phía trên là ảnh với tỷ lệ khung hình `aspect-[16/10]`. Tỷ lệ này có nghĩa là khi chiều rộng của card tăng lên (trên màn hình rộng hơn), chiều cao của ảnh cũng sẽ tăng theo tỷ lệ tương ứng.
* Phía dưới là phần thông tin chứa tên dịch vụ, mô tả ngắn, và phần giá cả cùng nút chi tiết ở đáy card.

Để đẩy phần giá cả xuống sát đáy card, lập trình viên đã dùng CSS Flexbox với thuộc tính `mt-auto`. Tuy nhiên, để Flexbox hoạt động đúng, thẻ cha trực tiếp bọc ngoài nó phải có chiều cao xác định. Do đó, lập trình viên đã đặt chiều cao cho phần thông tin là `h-[calc(100%-165px)]` với kỳ vọng 165px là chiều cao của ảnh và khoảng trống lân cận.

Nhưng đây là một giả định sai lầm trong thiết kế responsive (co giãn theo màn hình). Chiều cao của ảnh không cố định ở 165px mà thay đổi theo chiều rộng màn hình. Khi màn hình lớn, chiều rộng card lớn, ảnh có thể cao tới 220px. Lúc này, tổng chiều cao của ảnh (220px) cộng với chiều cao bị ép của phần chữ (`100% - 165px`) sẽ vượt quá `100%` chiều cao của card. Vì card không có thuộc tính ẩn nội dung tràn (`overflow-hidden`), phần chữ ở đáy (chữ "Liên hệ") sẽ bị tràn qua đường viền dưới của card và hiển thị trơ trọi trên nền đen phía ngoài card.

Để sửa lỗi này, ta cần loại bỏ hoàn toàn việc tính toán chiều cao thủ công bằng pixel cứng. Thay vào đó:
1. Biến `<article>` bọc ngoài thành một Flex container dạng cột (`flex flex-col h-full`).
2. Phần ảnh bên trên sẽ chiếm chiều cao theo tỷ lệ `aspect-[16/10]` tự nhiên.
3. Phần thông tin bên dưới sẽ được gán thuộc tính `flex-1` (tương đương `flex: 1 1 0%`), giúp nó tự động tính toán và chiếm trọn phần chiều cao còn lại của card mà không bao giờ vượt quá giới hạn.
4. Bên trong phần thông tin (vốn cũng là một `flex flex-col`), phần giá tiền ở dưới cùng vẫn sẽ dùng `mt-auto` để được đẩy xuống sát đáy card một cách an toàn và chuẩn xác.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Tưởng tượng bạn có một chiếc hộp quà có chiều cao cố định là 30cm. Bạn đặt vào trong đó một món đồ chơi có kích thước thay đổi được (ví dụ một quả bóng bay có thể bơm to nhỏ tùy ý) và một cái khay xốp để đựng kẹo ở dưới. 
* **Cách làm cũ bị lỗi:** Bạn cắt một cái khay xốp luôn có chiều cao cố định là `30cm - 15cm = 15cm` vì nghĩ quả bóng chỉ to tối đa 15cm. Nhưng hôm nay, người dùng bơm quả bóng to lên thành 20cm. Khi đặt cả quả bóng (20cm) và khay xốp (15cm) vào chiếc hộp (30cm), tổng chiều cao là 35cm, khay xốp chứa kẹo sẽ bị lòi ra ngoài nắp hộp 5cm.
* **Cách làm mới đúng đắn:** Bạn không cắt khay xốp cố định 15cm nữa. Bạn dùng một chiếc khay xốp có khả năng tự co giãn (Flexbox). Khi đặt quả bóng vào hộp, khay xốp sẽ tự động co lại vừa khít với khoảng trống còn lại (nếu bóng to 20cm, khay tự co còn 10cm; nếu bóng nhỏ 12cm, khay tự giãn thành 18cm). Kẹo bên trong khay luôn được bảo vệ an toàn bên trong hộp, không bao giờ bị rơi ra ngoài.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Vị trí lỗi:** File [ServiceListSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_components/ServiceListSectionShared.tsx#L923-L954) tại hàm `renderKanban`.
* **Trạng thái:**
  * Lớp phủ ngoài `<article>` có class `h-full` nhưng thiếu `flex flex-col` để làm cha cho các phần tử con co giãn.
  * Phần thông tin chứa text có thuộc tính `h-[calc(100%-165px)]` cố định gây tràn nội dung (overflow) khi kích thước ảnh thay đổi theo responsive grid.
* **Các layout khác:** 
  * Layout `showcase` sử dụng cấu trúc chuẩn `flex flex-col` trên card và `flex-1` trên nội dung nên hiển thị chính xác.
  * Layout `about` và `contact` ở chế độ Kanban cũng sử dụng cấu trúc Flexbox tự nhiên nên không bị lỗi tràn chữ.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Nguyên nhân gốc (Root Cause)
Ép chiều cao của phần thông tin chữ trong card bằng công thức `h-[calc(100%-165px)]` tại dòng 923 của file `ServiceListSectionShared.tsx` trong khi ảnh phía trên có tỷ lệ khung hình dynamic `aspect-[16/10]`. Khi card có kích thước chiều rộng lớn, chiều cao của ảnh tăng lên làm thu hẹp khoảng trống khả dụng thực tế của phần chữ, nhưng phần chữ vẫn bị ép lấy chiều cao lớn (`100% - 165px`), dẫn đến việc nội dung phần chữ bị tràn qua khỏi border dưới của card.

*Độ tin cậy nguyên nhân gốc:* **High (Cao)** - Vì việc tràn chữ xảy ra rõ ràng trên giao diện khi chiều rộng cột đạt một ngưỡng nhất định, và phép toán CSS tĩnh `100% - 165px` không đồng bộ với sự thay đổi chiều cao của ảnh dạng `aspect-ratio`.

### Giả thuyết đối chứng (Counter-Hypothesis)
* Giả thuyết: Liệu có phải do chữ "Liên hệ" dài quá kích thước cột?
* Đối chứng: Không phải, vì kể cả khi chữ ngắn chỉ có "Liên hệ" hoặc số tiền ngắn, chữ vẫn bị nằm ngoài card. Bản thân toàn bộ khung chứa chữ bị đẩy dịch xuống dưới đường viền dưới của card. Việc sửa thành Flexbox sẽ giải quyết triệt để bất kể nội dung chữ dài hay ngắn.

---

# IV. Proposal (Đề xuất)

* **Sửa đổi CSS của `<article>` trong `renderKanban`:**
  * Thêm các class `flex flex-col` vào `<article>` để thiết lập container xếp chồng dọc.
* **Sửa đổi CSS của `div` thông tin văn bản:**
  * Thay thế class `h-[calc(100%-165px)]` thành `flex-1` để cho phép phần thông tin chiếm chính xác không gian còn lại sau khi đã trừ đi ảnh và margins/paddings.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
* [ServiceListSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_components/ServiceListSectionShared.tsx)
  * Sửa hàm `renderKanban` để thay đổi class CSS của card và khung chứa thông tin chữ.

---

# VI. Execution Preview (Xem trước thực thi)

1. Mở file `ServiceListSectionShared.tsx` và tìm đến khu vực hàm `renderKanban` (khoảng dòng 850 đến 960).
2. Tìm thẻ `<article className={cn('relative h-full border p-3 ...')}` và đổi thành `<article className={cn('relative h-full flex flex-col border p-3 ...')}`.
3. Tìm thẻ `<div className="flex flex-col h-[calc(100%-165px)]">` nằm ngay dưới phần ảnh và thay thế thành `<div className="flex flex-col flex-1">`.
4. Lưu file.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra tĩnh (Static Verification)
* Chạy trình biên dịch TypeScript thủ công để đảm bảo không phát sinh bất kỳ lỗi cú pháp hoặc kiểu dữ liệu nào sau khi sửa:
  `bunx tsc --noEmit` (pipe qua `Select-Object -First 10` để giới hạn hiển thị).

### Kiểm tra thủ công (Manual Verification)
* Nhờ người dùng F5 lại trang quản trị tại route `http://localhost:3000/admin/home-components/service-list/mx73epcmhabhhwcvhk0yp2ayr98803yt/edit` và kiểm tra xem chữ "Liên hệ" đã nằm gọn gàng bên trong border của các card dịch vụ trong layout Kanban chưa.

---

# VIII. Todo

- [ ] Sửa file [ServiceListSectionShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/admin/home-components/service-list/_components/ServiceListSectionShared.tsx) theo đề xuất Flexbox.
- [ ] Chạy lệnh kiểm tra TypeScript để đảm bảo không lỗi build.
- [ ] Thực hiện Git Commit các thay đổi.
- [ ] Phát âm thông báo hoàn thành tác vụ.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* Khung viền của từng card dịch vụ trong layout Kanban phải bao bọc hoàn toàn toàn bộ nội dung bao gồm ảnh, tiêu đề, mô tả và chữ "Liên hệ" (giá cả).
* Chữ "Liên hệ" phải nằm cách viền dưới một khoảng đệm an toàn (bằng padding `p-3` của card, khoảng 12px) và thẳng hàng ở đáy các card.
* Layout hoạt động responsive tốt trên các kích thước màn hình mà không bị tràn hay rớt chữ ra ngoài.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro:** Gần như không có rủi ro nào vì đây là sửa đổi CSS cục bộ bên trong hàm `renderKanban` của component Danh sách dịch vụ, không ảnh hưởng đến các component khác hoặc các layout khác.
* **Hoàn tác:** Nếu cần rollback, chỉ cần sử dụng lệnh `git checkout -- app/admin/home-components/service-list/_components/ServiceListSectionShared.tsx` để khôi phục lại file gốc.

---

# XI. Out of Scope (Ngoài phạm vi)
* Không thay đổi hành vi hoặc logic của việc format giá cả hay kéo thả của Kanban.
* Không sửa đổi giao diện hoặc logic của các module/giao diện khác.
