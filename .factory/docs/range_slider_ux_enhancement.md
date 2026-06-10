# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Slider lọc khoảng giá trị (như %ABV) hiện tại đã hoạt động nhưng kích thước nút kéo (thumb) trên mobile còn hơi nhỏ (18x18px), khó thao tác bằng một tay. Ngoài ra, khi muốn xóa lọc khoảng này, người dùng phải kéo thủ công cả 2 nút về 2 đầu cực, rất bất tiện.
* **Giải pháp**: 
  1. Thêm một vùng chạm ẩn xung quanh nút kéo có kích thước 44x44px (chuẩn WCAG) bằng CSS pseudo-element để vuốt kéo mượt mà hơn trên điện thoại.
  2. Thêm nút "X" nhỏ bên cạnh badge hiển thị dải đang chọn để người dùng click phát là reset về khoảng mặc định ngay lập tức.
  3. Cải tiến độ mượt mà khi di chuyển slider.

## 2. Elaboration & Self-Explanation
Range Slider được xây dựng dựa trên thư viện `@radix-ui/react-slider`. Mặc dù Radix xử lý pointer capture rất chuẩn và không bị lỗi ẩn nút kéo như thanh trượt cũ, kích thước hiển thị của thumb (18px) vẫn là một trở ngại nhỏ cho trải nghiệm di động. Để giải quyết, chúng ta sử dụng CSS pseudo-element `::after` tạo ra một vùng chạm ẩn rộng 44x44px mà không làm ảnh hưởng đến thiết kế nhỏ gọn trực quan của nút.
Đồng thời, khi người dùng lọc một dải hẹp, nút reset nhanh sẽ xuất hiện trực quan cạnh badge hiển thị để họ dễ dàng xóa bộ lọc mà không cần mở toàn bộ bộ lọc hoặc kéo slider thủ công về min/max.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Khi người dùng vào trang rượu vang và muốn lọc ABV từ 12% - 13.5%. Họ kéo thanh trượt. Sau khi xem xong, họ muốn quay lại xem tất cả. Thay vì phải kéo nút bên trái về kịch sàn (10%) và nút bên phải lên kịch trần (15%), họ chỉ cần click vào nút "X" nhỏ ngay cạnh badge `12% - 13.5%` để reset nhanh về `10% - 15%`.
* **Analogy đời thường**: Giống như dây đai an toàn hoặc dây đeo balo, khi bạn muốn nới lỏng ra hết cỡ, có một lẫy bấm nhả nhanh (quick-release) thay vì bạn phải dùng tay nới từng đoạn một cách thủ công.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra `e:\NextJS\job\job_from_system_vietadmin\system_thienkim\components\shared\RangeSlider.tsx`:
  * Sử dụng Radix UI Slider, quản lý state qua `localValues` và sync từ prop `valueMin`/`valueMax`.
  * Thumb hiện tại có size `width: 18, height: 18` và không có vùng touch-target bổ sung.
  * Chỉ hiển thị badge tĩnh chứ chưa có action reset.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Triệu chứng**: Thao tác trên mobile đôi lúc trượt tay vì kích thước thumb nhỏ. Thiếu cơ chế reset nhanh cho range filter gây giảm điểm UX.
* **Độ tin cậy giải pháp**: High (Cao). Tăng touch target bằng pseudo-element và thêm nút reset là các pattern chuẩn trong UI/UX hiện đại, không tác động đến logic nghiệp vụ cốt lõi của Convex backend hay routing.

# IV. Proposal (Đề xuất)
1. Cải tiến `RangeSlider.tsx`:
   * Import `X` từ `lucide-react`.
   * Thêm prop `onReset` hoặc tự xử lý reset bằng cách gọi `onValueCommit?.(minLimit, maxLimit)`. Ở đây, ta tự xử lý reset nội bộ bằng cách gọi callback `onValueCommit` với `minLimit` và `maxLimit` để kích hoạt update URL.
   * Thêm class Tailwind `relative after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:w-11 after:h-11 after:rounded-full` vào các `SliderPrimitive.Thumb` để mở rộng touch target ảo lên 44px (w-11 = 44px).
   * Render thêm nút reset `X` kế bên badge dải chọn nếu `min !== minLimit` || `max !== maxLimit`.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: `e:\NextJS\job\job_from_system_vietadmin\system_thienkim\components\shared\RangeSlider.tsx`
  * Thêm nút reset cạnh badge dải chọn.
  * Thêm pseudo-element cho các Slider Thumb để tăng diện tích chạm lên 44x44px.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ file `RangeSlider.tsx` và chuẩn bị các chunk thay đổi.
2. Cập nhật `RangeSlider.tsx` để tích hợp touch target ảo và nút reset.
3. Review tĩnh code thay đổi.
4. Chạy type-check bằng `bunx tsc --noEmit` để verify tính toàn vẹn của TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Type check**: Chạy `bunx tsc --noEmit` để đảm bảo code build thành công, không có lỗi kiểu dữ liệu.
* **Manual Verification (nhờ tester/user)**:
  * Kéo slider để chọn dải. Kiểm tra nút reset "X" xuất hiện khi dải chọn khác mặc định.
  * Click nút "X" và kiểm tra slider tự động reset về giá trị biên tối đa và URL tự động đồng bộ lại (xóa query param hoặc cập nhật lại giá trị).

# VIII. Todo
* [ ] Sửa `RangeSlider.tsx` để thêm touch target ảo 44x44px.
* [ ] Sửa `RangeSlider.tsx` để hiển thị nút reset nhanh bên cạnh badge dải chọn.
* [ ] Kiểm tra lỗi typecheck với `bunx tsc --noEmit`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Slider hoạt động bình thường, không giật lag.
* Thumb kéo dễ dàng hơn trên mobile.
* Nút reset xuất hiện đúng lúc (chỉ xuất hiện khi khoảng chọn khác khoảng giới hạn tối đa) và hoạt động đúng (reset slider về min Limit và max Limit, đồng thời đồng bộ lên URL).
* Không có lỗi TypeScript.
