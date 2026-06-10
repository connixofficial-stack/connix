# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề (Slider bị văng về min/max):** Khi người dùng kéo thanh trượt (Range Slider) chọn giá trị nồng độ cồn, ví dụ kéo nút Min lên `14.0%` (trong khoảng nồng độ thực tế `13.5%` - `14.5%`), ngay sau khi thả tay ra, nút Min lập tức bị văng trở lại `14.5%` hoặc `13.5%`.
* **Nguyên nhân:** Do cơ chế đồng bộ hai chiều giữa thanh trượt và URL. Khi kéo lên `14.0%`, hệ thống lọc ra các sản phẩm thỏa mãn và gửi danh sách các mã định danh (slugs) của thuộc tính lên URL (chỉ có chai rượu `14.5%` thỏa mãn nên URL lưu `?%1abv=14-5`). Khi trang web nhận URL mới, nó đồng bộ ngược lại thanh trượt. Vì URL chỉ lưu mã `14.5`, thanh trượt bị hiểu lầm là người dùng chọn từ `14.5` đến `14.5` và tự động kéo giật cục cả hai nút về `14.5%`.
* **Giải pháp:** Sử dụng một biến ghi nhớ ghi lại danh sách mã thuộc tính vừa được thanh trượt gửi lên URL. Khi trang web nhận URL mới, nếu danh sách trên URL trùng khớp với danh sách mà chính thanh trượt vừa gửi lên, hệ thống sẽ **bỏ qua** việc đồng bộ ngược để giữ nguyên vị trí trượt trực quan của người dùng, tránh hiện tượng giật văng.

## 2. Elaboration & Self-Explanation
Thanh trượt Range Slider là một thành phần UI biểu diễn khoảng liên tục (ví dụ: từ `13.5` đến `14.5`). Tuy nhiên, cơ sở dữ liệu và URL lại quản lý bộ lọc dưới dạng các giá trị rời rạc (các Attribute Terms thực tế tồn tại, ví dụ: sản phẩm chỉ có nồng độ `13.5%` hoặc `14.5%`, không có sản phẩm nào có nồng độ lẻ ở giữa như `14.0%`).
* Khi người dùng kéo nút trượt Min đến `14.0`, hệ thống tính toán các term nằm trong khoảng `[14.0, 14.5]` và tìm thấy term `14.5%` (slug: `14-5`).
* Hệ thống cập nhật URL thành `?%1abv=14-5`.
* Một hiệu ứng phụ (`useEffect`) lắng nghe sự thay đổi của URL (`currentSelectedTermIds`) để đồng bộ trạng thái của thanh trượt Min/Max khi người dùng điều hướng trang hoặc nhấn nút xóa bộ lọc.
* Vì URL chỉ chứa `['14-5']`, hiệu ứng phụ này tìm các giá trị tương ứng của term và thấy chỉ có `14.5`. Nó đặt cả `sliderMin` và `sliderMax` bằng `14.5`, gây ra hiện tượng văng giật cục.
* Bằng cách thêm một tham chiếu `lastAppliedSlugsRef` lưu giữ danh sách các slugs vừa được slider áp dụng:
  - Nếu `currentSelectedTermIds` trên URL trùng khớp với `lastAppliedSlugsRef.current`, nghĩa là sự thay đổi URL này do chính hành động kéo trượt hiện tại tạo ra. Chúng ta sẽ ngăn chặn (`early return`) việc ghi đè trạng thái slider từ URL.
  - Nếu sự thay đổi URL do hành động khác (nhấn nút "Xóa lọc", nhấn nút Back của trình duyệt), `isSelfChange` sẽ là `false` và slider sẽ được đồng bộ chính xác về giá trị mặc định.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Bộ lọc nồng độ cồn `%1abv` có hai giá trị thực tế: `13.5%` và `14.5%`.
  - *Hiện tại:* Bạn kéo Min lên `14.0%`. Slider gửi lên URL: "Tôi muốn lọc những chai rượu có nồng độ cồn trong danh sách `['14.5%']`". URL lưu: `?%1abv=14-5`. Hệ thống đọc URL và bảo: "À, URL chỉ chọn `14.5%`, vậy tôi phải di chuyển cả hai nút trượt của Slider về `14.5%` ngay lập tức." Kết quả: nút Min bị văng giật cục từ `14.0%` lên `14.5%`.
  - *Sau khi sửa:* Bạn kéo Min lên `14.0%`. Slider ghi nhớ: "Tôi vừa gửi yêu cầu lọc `['14.5%']` lên URL đấy nhé". URL cập nhật thành `?%1abv=14-5`. Hệ thống đọc URL và so sánh: "URL đổi thành `['14.5%']`, trùng khớp với cái Slider vừa gửi lên. Vậy thì giữ nguyên vị trí trượt `14.0%` của người dùng, không được tự ý di chuyển nút trượt nữa!" Kết quả: nút trượt đứng im tại `14.0%` cực kỳ mượt mà.
* **Analogy (Phép ẩn dụ):** Bạn gọi điện đặt bàn ăn cho 4 người. Nhà hàng ghi nhận yêu cầu và xếp bạn vào bàn 4 người. Sau đó, nhà hàng gọi điện lại cho bạn và bảo: "Chúng tôi thấy bạn đang ngồi bàn 4 người, nên chúng tôi bắt buộc phải đổi số lượng khách thực tế của bạn thành đúng 4 người, bạn không được phép dẫn thêm bạn bè hay đổi ý nữa!" Với giải pháp mới, nhà hàng sẽ nhận diện được cuộc gọi xác nhận bàn là từ chính bạn, họ sẽ giữ nguyên kế hoạch ban đầu của bạn mà không tự ý can thiệp hay ép buộc thông tin.

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra tệp `app/(site)/_components/products/ProductsPage.tsx` trong component `AttributeFilterGroupWidget` tại dòng 1860 đến 1900.
* Xác nhận `useEffect` đồng bộ trạng thái slider từ URL (`currentSelectedTermIds`) đang thực hiện ghi đè vô điều kiện `sliderMin` và `sliderMax` mỗi khi `currentSelectedTermIds` thay đổi.
* Xác nhận URL lưu bộ lọc dưới dạng các term slugs rời rạc, làm mất đi thông tin khoảng giá trị liên tục mà người dùng vừa kéo trên UI, gây ra hiện tượng đồng bộ ngược làm văng nút trượt.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause (Nguyên nhân gốc):**
  - Thiếu cơ chế phân biệt nguồn gốc thay đổi của bộ lọc trên URL: Thay đổi do chính thanh trượt tạo ra (kéo thả) vs Thay đổi do các tương tác bên ngoài (xóa bộ lọc, điều hướng trang). Việc đồng bộ ngược vô điều kiện các term rời rạc lên một dải chọn liên tục đã phá vỡ trạng thái cục bộ của thanh trượt.
* **Root Cause Confidence (Độ tin cậy nguyên nhân gốc):** **High**
  - Lý do: Bản chất của dữ liệu rời rạc lưu trên URL không thể phản ánh chính xác 100% tọa độ trượt liên tục của người dùng. Cách duy nhất để giữ trải nghiệm mượt mà là bảo vệ trạng thái cục bộ của thanh trượt khỏi sự đồng bộ ngược khi chính nó là tác nhân thay đổi URL.

# IV. Proposal (Đề xuất)
* **Giải pháp:**
  1. Khai báo `lastAppliedSlugsRef` bằng `useRef<string[] | null>(null)` bên trong component `AttributeFilterGroupWidget`.
  2. Trong hàm `applyRangeFilter`, cập nhật `lastAppliedSlugsRef.current = matchedTermSlugs` trước khi gọi `onAttributeChange`.
  3. Trong `useEffect` đồng bộ URL, so sánh mảng `currentSelectedTermIds` và `lastAppliedSlugsRef.current`. Nếu trùng khớp hoàn toàn, thực hiện `early return` để giữ nguyên vị trí trượt hiện tại.
  4. Đảm bảo khi `currentSelectedTermIds` trống (người dùng click xóa lọc toàn cục), nếu trước đó slider đã được kéo, so sánh sẽ không trùng khớp và slider sẽ được reset về mặc định một cách chính xác.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  - *Vai trò hiện tại:* Quản lý giao diện và logic lọc khoảng thuộc tính sản phẩm.
  - *Thay đổi:* Tích hợp cơ chế ghi nhớ `lastAppliedSlugsRef` và kiểm tra `isSelfChange` trong `useEffect` để chặn đứng hiện tượng văng giật cục của Range Slider.

# VI. Execution Preview (Xem trước thực thi)
1. **Đọc tệp tin:** Xem lại component `AttributeFilterGroupWidget` trong `ProductsPage.tsx`.
2. **Cập nhật logic:**
   - Thêm `lastAppliedSlugsRef`.
   - Cập nhật `applyRangeFilter` để lưu trữ trạng thái slugs đã áp dụng.
   - Thêm logic kiểm tra so sánh mảng trong `useEffect`.
3. **Kiểm tra biên dịch tĩnh:** Chạy `bunx tsc --noEmit` để xác nhận tính đúng đắn của TypeScript.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Typecheck:** Chạy `bunx tsc --noEmit` để xác nhận tệp tin TypeScript hợp lệ 100%.
* **Kiểm tra trực quan ( Tester phụ trách):**
  - Mở bộ lọc nồng độ cồn có khoảng hẹp (ví dụ 13.5% - 14.5%).
  - Kéo nút Min lên 14.0% rồi thả tay ra.
  - Xác nhận nút Min đứng im tại vị trí 14.0% cực kỳ mượt mà, URL cập nhật chính xác các sản phẩm tương ứng, không còn bị giật văng trở lại nữa.
  - Thử click nút "Xóa lọc" ở Empty State hoặc Sidebar, xác nhận Slider được reset hoàn toàn về `13.5% - 14.5%`.

# VIII. Todo
* [ ] Viết Spec vào `.factory/docs/range_slider_bounce_fix_spec.md`. (Đã hoàn thành bước khởi tạo này)
* [ ] Sửa đổi logic đồng bộ trong `AttributeFilterGroupWidget` tại [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx).
* [ ] Chạy `bunx tsc --noEmit` để kiểm tra lỗi biên dịch TypeScript.
* [ ] Phát âm thanh thông báo hoàn thành hệ thống.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Người dùng kéo thả thanh trượt tự do, sau khi thả tay ra giá trị hiển thị và nút trượt đứng im tại chỗ (không bị văng giật cục về min/max).
* URL cập nhật tương ứng với các term sản phẩm được lọc.
* Tính năng "Xóa lọc" vẫn hoạt động hoàn hảo, đưa slider trở lại dải giới hạn mặc định ban đầu.
* Biên dịch thành công không phát sinh bất kỳ lỗi TypeScript nào.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Thay đổi cực kỳ an toàn, chỉ liên quan đến cơ chế so sánh và chặn đồng bộ ngược cục bộ của Range Slider, hoàn toàn không làm ảnh hưởng đến dữ liệu hay các tính năng khác trên trang.
* **Hoàn tác:** Sử dụng Git để khôi phục tệp `ProductsPage.tsx` về trạng thái trước thay đổi nếu cần thiết.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc lưu trữ dữ liệu bộ lọc trên URL (giữ nguyên cơ chế query string rời rạc hiện tại để tránh phá vỡ kiến trúc chung của hệ thống).
