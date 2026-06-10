# I. Primer

## 1. TL;DR kiểu Feynman
* **Nguyên nhân gốc thực sự làm Slider bị kẹt:** 
  * Cấu hình của thanh trượt `<input type="range">` đang bị cố định cứng bước nhảy `step="1"`.
  * Trong trường hợp dải chọn có khoảng giá trị nhỏ hoặc chứa số thập phân lẻ (ví dụ nồng độ cồn `%1abv` từ `13.5%` đến `14.5%`, tổng khoảng cách chỉ là `1.0`), các nấc giá trị hợp lệ duy nhất của input chỉ là `13.5` và `14.5`. 
  * Do quy tắc thanh trượt Min không được vượt quá Max (`sliderMin <= sliderMax`), khi nút Min ở `13.5` và Max ở `14.5`, nút Min không thể di chuyển sang phải (vì nấc tiếp theo là `14.5` đã bị nút Max chiếm giữ), và nút Max không thể di chuyển sang trái. Điều này làm cho dải chọn bị **kẹt cứng hoàn toàn 100%** không thể dịch chuyển dù chỉ một pixel!
* **Cách giải quyết:**
  * **Tính `step` động:** Tính toán `step` động dựa trên khoảng cách `maxLimit - minLimit`. Nếu khoảng cách nhỏ (dưới hoặc bằng 2), ta cho `step="0.1"` (hoặc `0.05`) để trượt mượt mà.
  * **Nâng cấp tương tác Mouse Down:** Bổ sung sự kiện `onMouseDown` trên container slider để cập nhật `activeInput` ngay lập tức tại mili-giây người dùng click chuột xuống, giúp zIndex nổi lên chính xác trước khi drag event bắt đầu.

## 2. Elaboration & Self-Explanation
Trong các bộ lọc dạng dải chọn (Range Slider) của thuộc tính sản phẩm, các thuộc tính như Nồng độ cồn (`%1abv`) thường có khoảng dao động rất nhỏ giữa min và max (ví dụ: từ `13.5%` đến `14.5%`). Khi lập trình viên cố định thuộc tính `step="1"` trên thẻ `<input type="range">`, trình duyệt sẽ chỉ cho phép slider nhận các giá trị tăng dần theo cấp số cộng của `1` bắt đầu từ `minLimit`. 

Với dải chọn `13.5% - 14.5%`, khoảng cách là `1.0`. Các giá trị hợp lệ duy nhất là `13.5` và `14.5`. Vì logic của Double Range Slider luôn chặn không cho `sliderMin > sliderMax`, nút Min ở `13.5` không thể tăng lên `14.5` (vì sẽ lớn hơn hoặc bằng Max), và nút Max ở `14.5` không thể giảm xuống `13.5`. Kết quả là cả hai nút trượt bị khóa chặt vào nhau và kẹt cứng.

Để sửa đổi triệt để lỗi logic này, chúng ta sẽ tính toán `step` động dựa trên khoảng cách `diff = maxLimit - minLimit`:
* Nếu khoảng cách `diff <= 2`, đặt `step = 0.1` (cho phép trượt qua `13.6`, `13.7`, `13.8`... cực kỳ mượt mà).
* Nếu khoảng cách `diff <= 20`, đặt `step = 0.5`.
* Các trường hợp còn lại (như dung tích `360ml - 750ml`), đặt `step = 1`.

Đồng thời, để cải thiện UX trên Desktop, chúng ta bổ sung trình lắng nghe `onMouseDown` trên container slider. Khi người dùng click chuột xuống, hệ thống tính toán tọa độ O(1) và nâng zIndex của input có nút trượt gần con trỏ chuột nhất lên trên cùng ngay lập tức, ngăn ngừa hoàn toàn hiện tượng click hụt hoặc kẹt zIndex.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:**
  * Bộ lọc `%1abv` có nấc từ `13.5%` đến `14.5%` (khoảng cách 1.0 <= 2): `step` tự động cấu hình thành `0.1`. Người dùng có thể dễ dàng kéo nút Min từ `13.5%` lên `13.6%`, `13.7%`... và nút Max từ `14.5%` xuống `14.0%`. Slider hoạt động cực kỳ mượt mà!
  * Bộ lọc dung tích từ `360ml` đến `750ml` (khoảng cách 390 > 20): `step` tự động cấu hình thành `1`. Người dùng kéo thả bình thường theo từng ml.
* **Hình ảnh ẩn dụ:**
  * Giống như bạn đang đi trên một chiếc thang hẹp chỉ có 2 bậc cách nhau 1 mét (13.5m và 14.5m). Bậc dưới có người đứng (Min), bậc trên có người đứng (Max). Vì quy định là người ở dưới không được leo lên đứng chung bậc với người ở trên, và người ở trên không được bước xuống đứng chung bậc với người ở dưới, cả hai người đều bị kẹt cứng tại chỗ. Giải pháp là chúng ta cưa nhỏ các bậc thang ra thành từng khoảng cách 10cm (step = 0.1). Bây giờ, người ở dưới có thể leo lên bậc 13.6m, 13.7m... người ở trên có thể bước xuống bậc 14.4m, 14.3m... Cả hai di chuyển vô cùng thoải mái!

---

# II. Audit Summary (Tóm tắt kiểm tra)

* **Tệp `app/(site)/_components/products/ProductsPage.tsx`:**
  * Component `AttributeFilterGroupWidget` render hai thẻ `<input type="range">` đè nhau (dòng 1918 và 1930).
  * Cả hai thẻ đều đang cấu hình tĩnh `step="1"`.
  * Chưa có trình lắng nghe `onMouseDown` trên container slider để cập nhật zIndex tức thì trên Desktop.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc 1 (Step cố định gây kẹt):**
  * `step="1"` trên khoảng dao động `maxLimit - minLimit <= 1` (hoặc chứa số thập phân lẻ) làm triệt tiêu các nấc giá trị trung gian, kết hợp với điều kiện chặn chéo `min <= max` gây khóa chặt cả hai nút trượt.
  * **Giả thuyết đối chứng:** Nếu chuyển sang `step` động (ví dụ `0.1` cho khoảng nhỏ), slider sẽ có hàng chục nấc trung gian để trượt tự do và không bao giờ bị kẹt.
* **Nguyên nhân gốc 2 (Trễ zIndex click Desktop):**
  * Hiện tại chỉ bắt `onMouseMove` khi rê chuột tự do (`buttons === 0`). Khi người dùng click chuột nhanh vào một vị trí, zIndex có thể chưa kịp chuyển đổi sang input gần nhất.
  * **Giả thuyết đối chứng:** Nếu bổ sung `onMouseDown={handleMouseDown}` trực tiếp trên container, zIndex được cập nhật ngay tại thời điểm click, đảm bảo drag event hoạt động chính xác 100%.

---

# IV. Proposal (Đề xuất)

* **Giải pháp thực hiện:**
  1. **Tính `step` động trong `AttributeFilterGroupWidget`:**
     * Khai báo:
       ```typescript
       const step = useMemo(() => {
         const diff = maxLimit - minLimit;
         if (diff <= 0) return 1;
         if (diff <= 2) return 0.1;
         if (diff <= 20) return 0.5;
         return 1;
       }, [minLimit, maxLimit]);
       ```
     * Gán `step={step}` cho cả hai thẻ `<input type="range">`.
  2. **Thêm sự kiện `onMouseDown`:**
     * Viết handler `handleMouseDown = (e: React.MouseEvent) => { handleSliderInteraction(e.clientX); }`.
     * Gán `onMouseDown={handleMouseDown}` vào container `<div className="double-range-slider">`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI / Public Pages
* `Sửa:` [ProductsPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/products/ProductsPage.tsx)
  * Thêm logic tính `step` động.
  * Thêm `handleMouseDown` và gán vào container slider.
  * Cập nhật `step={step}` cho hai thẻ input.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1 ( Frontend):** Cập nhật `AttributeFilterGroupWidget` trong `ProductsPage.tsx` bổ sung `step` động và `handleMouseDown`.
2. **Bước 2 (Frontend UI):** Cập nhật HTML container slider và các thẻ input để gán `step={step}` và `onMouseDown`.
3. **Bước 3 (Validation):** Chạy `bunx tsc --noEmit` để xác nhận hoàn thành biên dịch.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* Chạy `bunx tsc --noEmit` để xác nhận không lỗi compile.

### Manual Verification
* **Test Slider %1abv (13.5% - 14.5%):**
  * Truy cập `http://localhost:3000/ruou-vang-sam-panh?category=vang-do`.
  * Click vào dải chọn nồng độ cồn `%1abv` (13.5% - 14.5%).
  * Kéo thử nút Min sang phải hoặc nút Max sang trái.
  * Kỳ vọng: Nút trượt di chuyển vô cùng trơn tru, nhẹ nhàng, hiển thị các nấc số thập phân lẻ như `13.6%`, `13.7%`... và không hề bị kẹt.

---

# VIII. Todo
- [ ] Tính `step` động dựa trên `maxLimit` và `minLimit` trong `AttributeFilterGroupWidget`.
- [ ] Thêm handler `handleMouseDown` trong `AttributeFilterGroupWidget`.
- [ ] Gán `onMouseDown={handleMouseDown}` vào container slider.
- [ ] Gán `step={step}` vào hai thẻ input range.
- [ ] Chạy `bunx tsc --noEmit` kiểm tra lỗi compile.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Tiêu chí 1 (Không bị kẹt):** Slider có khoảng dao động nhỏ (như `%1abv` lẻ 13.5% - 14.5%) kéo thả mượt mà, không bị kẹt cứng.
* **Tiêu chí 2 (Tương tác nhạy):** Click chuột vào bất kỳ vị trí nào trên slider, zIndex được hoán đổi tức thì và cho phép kéo nút trượt tương ứng ngay lập tức.
* **Tiêu chí 3 (Biên dịch):** TypeScript typecheck hoàn thành thành công không có lỗi.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* Không có rủi ro nào được xác định. Hoàn tác bằng Git nếu cần.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi kiểu dáng UI slider.

---

# XII. Open Questions (Câu hỏi mở)
* (Không có câu hỏi mở nào).
