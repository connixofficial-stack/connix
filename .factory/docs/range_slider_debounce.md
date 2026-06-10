# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: Khi người dùng kéo slider, nếu áp dụng bộ lọc (load lại sản phẩm và đổi URL) ngay khi họ thả tay hoặc thay đổi giá trị quá nhanh, trang web sẽ bị load liên tục gây giật lag (re-render nhiều lần). Người dùng muốn quá trình kéo trượt êm ái hơn, chỉ load sản phẩm khi họ dừng kéo một lúc hoặc sau khi thả tay hẳn.
* **Giải pháp**: 
  1. Thêm cơ chế **Debounce 500ms** cho hành động kéo slider. Khi đang kéo, số trên màn hình vẫn nhảy liên tục để đảm bảo mượt mà trực quan.
  2. Nếu người dùng kéo và dừng lại (giữ tay nhưng không di chuyển) quá 500ms, hệ thống sẽ tự động áp dụng bộ lọc (load trước kết quả).
  3. Khi người dùng thả tay ra hẳn, hệ thống sẽ xóa bộ đếm debounce và áp dụng bộ lọc ngay lập tức để không có cảm giác trễ (delay).

## 2. Elaboration & Self-Explanation
Chúng ta sẽ sử dụng một `useRef` để giữ tham chiếu tới `setTimeout` dùng cho việc debounce. 
Khi sự kiện `handleChange` (gọi liên tục trong lúc drag) kích hoạt:
* Cập nhật `localValues` lập tức để số nhảy mượt.
* Hủy timer cũ (nếu có) và thiết lập timer mới 500ms. Khi hết 500ms, gọi `onValueCommit` để cập nhật bộ lọc lên URL.
Khi sự kiện `handleCommit` (người dùng thả chuột/tay ra khỏi slider) kích hoạt:
* Hủy timer đang chờ lập tức.
* Gọi `onValueCommit` ngay lập tức để áp dụng bộ lọc không có độ trễ.
Khi component bị unmount, xóa timer để tránh rò rỉ bộ nhớ (memory leak).

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Bạn kéo ABV từ 10% lên 15%. Bạn kéo lướt qua 11%, 12%, 13% trong vòng 300ms rồi thả tay ở 15%. Trang web chỉ load đúng 1 lần duy nhất cho mốc 15% ngay khi bạn thả tay. Nếu bạn kéo đến 13% và dừng tay giữ nguyên 1 giây để xem danh sách rượu ABV 13% thay đổi thế nào, trang web sẽ tự load ở mốc 13% sau 500ms dừng tay.
* **Analogy đời thường**: Giống như bạn gõ tìm kiếm trên Google. Google không tìm kiếm mỗi khi bạn gõ một chữ cái (gây giật lag), mà đợi bạn ngừng gõ khoảng 300-500ms rồi mới tự động hiển thị kết quả. Nhưng nếu bạn chủ động bấm nút Enter (tương đương thả tay khỏi slider), kết quả sẽ được tải ra ngay lập tức.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra `e:\NextJS\job\job_from_system_vietadmin\system_thienkim\components\shared\RangeSlider.tsx`:
  * Hiện tại `handleChange` chỉ update local state.
  * `handleCommit` gọi `onValueCommit` trực tiếp khi thả tay.
  * Chưa có cơ chế debounce khi kéo và giữ hoặc trì hoãn thông minh.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Triệu chứng**: Khi kéo liên tục hoặc tương tác nhanh, việc Next.js router push đổi URL liên tục sẽ làm nghẽn luồng xử lý của React/Next.js gây giật lag.
* **Độ tin cậy giải pháp**: High (Cao). Debounce là kỹ thuật kinh điển để tối ưu hóa tần suất trigger event nặng (như API call, URL navigation).

# IV. Proposal (Đề xuất)
* Cập nhật `RangeSlider.tsx`:
  * Thêm `debounceTimerRef = useRef<NodeJS.Timeout | null>(null)`.
  * Cập nhật `handleChange`: Thêm timer 500ms để trigger `onValueCommit` trong lúc kéo và dừng tay.
  * Cập nhật `handleCommit`: Hủy timer hiện tại và trigger `onValueCommit` lập tức.
  * Thêm effect dọn dẹp timer khi unmount.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: `components/shared/RangeSlider.tsx`
  * Cập nhật logic xử lý event thay đổi và commit của Radix Slider để tích hợp debounce 500ms.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và phân tích `RangeSlider.tsx`.
2. Tạo các Replacement Chunks cho `RangeSlider.tsx`.
3. Áp dụng thay đổi.
4. Chạy `bunx tsc --noEmit` để type check.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Type check**: Chạy `bunx tsc --noEmit` để đảm bảo không lỗi kiểu dữ liệu.
* **Kiểm tra hành vi (Manual)**:
  * Kéo trượt liên tục: Số trên badge cập nhật mượt, URL không đổi liên tục.
  * Dừng kéo ở một mốc nhưng vẫn giữ chuột: Sau 500ms, URL tự cập nhật và danh sách sản phẩm load.
  * Thả chuột: URL cập nhật ngay lập tức.

# VIII. Todo
* [ ] Cập nhật logic debounce trong `RangeSlider.tsx`.
* [ ] Kiểm tra lỗi typecheck bằng `bunx tsc --noEmit`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Số hiển thị trên badge cập nhật real-time mượt mà khi kéo.
* Việc thay đổi URL chỉ diễn ra sau 500ms kể từ khi người dùng ngừng di chuyển thumb hoặc xảy ra lập tức khi thả tay.
* Không có lỗi TypeScript.
