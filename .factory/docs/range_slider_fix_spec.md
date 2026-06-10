# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề 1 (Slider bị kẹt):** Khi kéo thanh chọn (Range Slider) lọc nồng độ cồn hoặc dung tích, nút Min và nút Max bị dính chặt vào nhau và không thể kéo được. Nguyên nhân là do bước nhảy được cố định cứng là `step="1"`. Với những khoảng giá trị hẹp hoặc có số lẻ (ví dụ nồng độ cồn từ 13.5% đến 14.5%, khoảng cách chỉ bằng 1.0), bước nhảy bằng 1 làm hai nút khóa chặt nhau.
* **Vấn đề 2 (Đè nút trượt):** Khi hai nút trượt nằm gần nhau hoặc đè lên nhau, người dùng không thể nhấp chuột để chọn nút nằm dưới vì thiếu sự kiện cập nhật thứ tự đè (zIndex) ngay lúc nhấn chuột xuống (chỉ cập nhật khi di chuyển chuột tự do không nhấn).
* **Giải pháp:** 
  a) Tính toán bước nhảy `step` một cách tự động dựa trên khoảng cách giữa giá trị lớn nhất và nhỏ nhất (ví dụ: khoảng hẹp thì bước nhảy nhỏ như `0.1`, khoảng lớn thì bước nhảy `1.0`).
  b) Lắng nghe sự kiện nhấn chuột xuống (`onMouseDown` và `onTouchStart`) trên toàn bộ thanh trượt để phát hiện người dùng đang muốn kéo nút nào gần nhất và đưa nút đó lên trên cùng (nâng `zIndex`) ngay lập tức.
  c) Ẩn bộ lọc thuộc tính nếu danh sách sản phẩm hiển thị chỉ có đúng một giá trị thuộc tính (ví dụ: tất cả sản phẩm đều có dung tích 500ml thì không cần hiển thị bộ lọc dung tích nữa).

## 2. Elaboration & Self-Explanation
Bộ lọc thuộc tính kiểu dải chọn (Range Slider) hoạt động bằng cách đặt hai thẻ `<input type="range">` đè khít lên nhau trong cùng một container. Để người dùng có thể kéo được cả nút Min và Max một cách độc lập:
* Hệ thống phải biết nút nào đang được tương tác để nâng chỉ số hiển thị (`zIndex`) của nút đó lên trên cùng, tránh việc nút này che khuất nút kia khiến không thể nắm kéo được.
* Trình duyệt xử lý giá trị trượt qua thuộc tính `step`. Nếu khoảng cách giữa giá trị nhỏ nhất thực tế (ví dụ: 13.5) và lớn nhất thực tế (ví dụ: 14.5) là 1.0, mà `step="1"`, thì nút Min chỉ có thể nhận giá trị 13.5 và nút Max chỉ có thể nhận giá trị 14.5 (không thể di chuyển trung gian). Khi Min = 13.5 và Max = 14.5, vì khoảng cách là 1 và bước nhảy là 1, nên hai nút này chạm giới hạn của nhau ngay lập tức, sinh ra hiện tượng kẹt cứng.
* Bằng cách điều chỉnh `step` động theo công thức:
  - Khoảng cách $\le 2$: `step = 0.1` (phù hợp cho nồng độ cồn % vol).
  - Khoảng cách $\le 20$: `step = 0.5` (phù hợp cho dung tích vừa phải).
  - Khoảng cách $> 20$: `step = 1` (phù hợp cho dung tích lớn hoặc các chỉ số lớn).
  Chúng ta sẽ giải phóng giới hạn di chuyển của hai nút trượt.
* Đồng thời, bổ sung sự kiện `onMouseDown` để gọi `handleSliderInteraction(e.clientX)` giúp xác định vị trí nhấp chuột của người dùng nằm gần nút nào hơn để gán `activeInput` ngay lập tức tại thời điểm click, bảo đảm `zIndex` thay đổi tức thời trước khi sự kiện kéo (`drag`) bắt đầu.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Sản phẩm vang đỏ có nồng độ cồn từ 13.5% đến 14.5%. Giá trị nhỏ nhất `minLimit` là 13.5, lớn nhất `maxLimit` là 14.5.
  - *Hiện tại:* `step="1"`. Khi người dùng muốn trượt nút Min từ 13.5 lên 13.8, trình duyệt ép nút Min phải nhảy lên 14.5 (vì bước nhảy là 1), nhưng nút Max đang ở 14.5 nên nút Min không thể nhảy lên được. Ngược lại, nút Max muốn giảm xuống 14.2 cũng bị ép nhảy xuống 13.5 và bị chặn bởi nút Min ở 13.5. Kết quả là cả hai nút bị khóa cứng.
  - *Sau khi sửa:* `step=0.1` (do khoảng cách $14.5 - 13.5 = 1 \le 2$). Nút Min có thể thoải mái di chuyển sang các nấc 13.6, 13.7, 13.8... mà không bị nút Max chặn đứng.
* **Analogy (Phép ẩn dụ):** Tưởng tượng hai người đi trên một cây cầu hẹp chỉ có các bậc đá cách nhau 1 mét (`step="1"`). Cây cầu chỉ dài 1 mét và hai người đang đứng ở hai đầu cầu. Vì khoảng cách giữa họ chỉ có 1 mét, nếu một người muốn bước 1 bước thì họ sẽ đâm sầm vào người kia. Họ hoàn toàn bị kẹt cứng không thể di chuyển. Nếu ta chia nhỏ các bậc đá thành cách nhau 10 centimet (`step="0.1"`), họ có thể tiến lùi tự do và nhường đường cho nhau một cách dễ dàng.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra tệp `app/(site)/_components/products/ProductsPage.tsx` tại vị trí dòng 1787 đến 2025.
* Phát hiện hai thẻ `<input type="range">` phục vụ lọc khoảng (`filterType === 'range'`) tại dòng 1989 và 2003 đang bị cố định `step="1"`.
* Phát hiện container của Slider (`ref={sliderRef}`) lắng nghe `onMouseMove` nhưng có điều kiện `if (e.buttons === 0)` nên chỉ hoạt động khi chuột di chuyển tự do mà không nhấn giữ. Khi người dùng nhấp chuột xuống (click/mousedown) để bắt đầu kéo, zIndex của nút không được cập nhật kịp thời, dẫn đến nút bị đè không thể kéo vượt qua nút kia.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc):**
  1. Thuộc tính `step="1"` cố định trong môi trường dữ liệu có khoảng biên hẹp (đặc biệt là nồng độ cồn có số thập phân lẻ) làm triệt tiêu khả năng di chuyển của hai nút trượt khi chúng tiệm cận nhau.
  2. Thiếu sự kiện bắt vị trí nhấp chuột `onMouseDown` trên container để cập nhật `activeInput` ngay lập tức, dẫn đến `zIndex` của input không phản ánh đúng ý định kéo của người dùng tại thời điểm bấm chuột.
* **Root Cause Confidence (Độ tin cậy nguyên nhân gốc):** **High**
  - Lý do: Bản chất hoạt động của thẻ `<input type="range">` đè nhau yêu cầu zIndex động phải được quyết định trước khi sự kiện kéo (drag) bắt đầu. Sự thiếu hụt `onMouseDown` và `step` tĩnh là lời giải thích hoàn chỉnh cho cả hai triệu chứng kẹt cứng và không nắm kéo được.

# IV. Proposal (Đề xuất)
* **Giải pháp 1 (Step động):** Tính toán biến `step` bằng `useMemo` bên trong `AttributeFilterGroupWidget` dựa trên khoảng cách `maxLimit - minLimit`. Áp dụng `step` này vào cả hai input range.
* **Giải pháp 2 (Bắt click chuột tức thì):**
  - Thêm hàm `handleMouseDown` gọi `handleSliderInteraction(e.clientX)` để cập nhật `activeInput` ngay khi nhấn chuột.
  - Gán `onMouseDown={handleMouseDown}` vào container `div` của slider.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  - *Vai trò hiện tại:* Chứa giao diện hiển thị danh sách sản phẩm và các bộ lọc thuộc tính bên sidebar/dropdown.
  - *Thay đổi:* Cập nhật thành phần `AttributeFilterGroupWidget` để tính `step` động, bổ sung hàm `handleMouseDown` và tích hợp sự kiện `onMouseDown` cùng `step` vào giao diện Range Slider.

# VI. Execution Preview (Xem trước thực thi)
1. **Đọc và xác định:** Xác định chính xác vị trí của `AttributeFilterGroupWidget` trong `ProductsPage.tsx`.
2. **Cập nhật logic:**
   - Thêm `step` động thông qua `useMemo`.
   - Thêm `handleMouseDown` xử lý sự kiện click chuột.
3. **Cập nhật giao diện HTML:**
   - Gán `onMouseDown={handleMouseDown}` vào container Slider.
   - Thay `step="1"` thành `step={step}` ở hai phần tử `<input type="range">`.
4. **Kiểm tra biên dịch tĩnh:** Chạy `bunx tsc --noEmit` để đảm bảo không phát sinh lỗi TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Typecheck:** Chạy `bunx tsc --noEmit` để xác nhận tệp tin TypeScript hợp lệ 100%.
* **Kiểm tra trực quan ( Tester phụ trách):**
  - Mở trang sản phẩm, bật hệ thống thuộc tính.
  - Kéo thanh chọn nồng độ cồn (ví dụ 13.5% - 14.5%) xem có di chuyển mượt mà không, hai nút có bị kẹt vào nhau không.
  - Kiểm tra click trực tiếp vào thanh trượt xem nút trượt tương ứng có được đưa lên trước (zIndex) để kéo được luôn không.

# VIII. Todo
* [ ] Viết Spec vào `.factory/docs/range_slider_fix_spec.md`. (Đã hoàn thành bước khởi tạo này)
* [ ] Cập nhật tệp [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx) với đề xuất cải tiến Range Slider.
* [ ] Kiểm tra lỗi biên dịch TypeScript bằng `bunx tsc --noEmit`.
* [ ] Phát âm thanh thông báo hoàn thành hệ thống.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Dải chọn Range Slider kéo mượt mà, không bị kẹt cứng tại các khoảng thuộc tính hẹp hoặc lẻ (ví dụ nồng độ cồn %vol).
* Nhấp chuột trực tiếp lên thanh trượt cập nhật ngay lập tức độ ưu tiên `zIndex` cho nút trượt gần nhất để kéo được ngay.
* Dự án biên dịch hoàn toàn thành công, không sinh bất kỳ lỗi TypeScript nào.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Thay đổi chỉ nằm trong phạm vi component cục bộ `AttributeFilterGroupWidget` nên rủi ro ảnh hưởng đến các màn hình khác gần như bằng 0.
* **Hoàn tác:** Sử dụng Git để khôi phục tệp `ProductsPage.tsx` về trạng thái ban đầu nếu cần thiết (`git checkout -- app/(site)/_components/products/ProductsPage.tsx`).

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi logic kết nối database hoặc thay đổi API Convex (chỉ tinh chỉnh hành vi UI/UX tại Client).
* Không thay đổi CSS toàn cục hoặc cấu trúc giao diện lớn của trang sản phẩm.
