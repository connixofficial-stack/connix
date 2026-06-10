# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề:** Khi Stats component dùng layout 4 (gradient) hoặc các layout nền tối, ở chế độ tối (Dark Mode) trên site thực, chữ bị chuyển thành màu tối đè lên nền tối gây ra hiện tượng "đen thui" không thấy gì. Đồng thời, nền gradient không tự động điều chỉnh màu tối dịu hơn.
* **Nguyên nhân:**
  1. `adaptTokensForDarkMode` lọc màu sắc bằng cách bắt đầu bằng `#`, `rgb`, `hsl` nên nó bỏ qua các chuỗi gradient (như `linear-gradient(...)`). Kết quả là nền gradient giữ nguyên phiên bản sáng của nó.
  2. Hàm `adaptColorForDarkMode` biến đổi tất cả các màu cực sáng (L > 0.95, ví dụ chữ màu trắng `#ffffff`) thành màu tối sâu (L = 0.14) bất kể đó là chữ hay nền. Điều này làm cho chữ màu sáng biến thành chữ màu xám tối.
* **Cách sửa:**
  1. Cho phép `adaptTokensForDarkMode` nhận diện chuỗi chứa từ khóa `gradient`.
  2. Viết hàm helper `adaptGradientForDarkMode` phân tích chuỗi gradient, tìm tất cả các mã màu bên trong nó và chuyển đổi từng mã màu đó thành tông tối tương ứng.
  3. Sửa `adaptColorForDarkMode` để nếu màu đang xét là chữ (`!isBackgroundKey`) và màu gốc ở Light Mode đã là màu sáng (L >= 0.58), ta giữ nguyên màu sáng đó thay vì đảo thành tối.

## 2. Elaboration & Self-Explanation
Môi trường chuyển đổi màu tự động (`adaptTokensForDarkMode`) nhận vào các token màu sắc từ database và tự động tính toán ra bảng màu Dark Mode theo nguyên lý đảo ngược độ sáng của các màu trung tính. Tuy nhiên, nó có 2 lỗ hổng lớn:
1. Nó không nhận diện được các chuỗi CSS phức tạp như `linear-gradient(135deg, #e6c148 0%, #000000 100%)` là màu sắc. Do đó, các gradient background giữ nguyên sắc sáng của Light Mode.
2. Nó xử lý cào bằng giữa màu chữ và màu nền. Nếu một component được thiết kế ở Light Mode có chữ sáng trên nền tối (như chữ trắng trên nền gradient tối), khi sang Dark Mode, chữ trắng đó lại bị đảo thành màu tối, khiến nó chìm nghỉm vào nền tối.
Bằng cách phân biệt rõ thuộc tính chữ (`!isBackgroundKey`) và thuộc tính nền (`isBackgroundKey`), đồng thời bóc tách các mã màu trong chuỗi gradient để xử lý riêng lẻ, chúng ta sẽ giữ được tính tương phản hoàn hảo ở cả 2 chế độ.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Stats component có nền gradient từ Vàng Hoàng Gia (`#e6c148`) sang Đen (`#000000`). Chữ tương phản tốt nhất là màu trắng (`#ffffff`).
  * *Trước khi sửa ở Dark Mode:*
    - Nền gradient giữ nguyên vì không được parse: `linear-gradient(135deg, #e6c148 0%, #000000 100%)` (một nửa sáng, một nửa tối).
    - Chữ trắng `#ffffff` bị đảo độ sáng thành màu tối sâu `#242424`.
    - Kết quả: Chữ tối đè lên nền tối ở phía bên phải gradient, giao diện bị hỏng.
  * *Sau khi sửa ở Dark Mode:*
    - Nền gradient được bóc tách: màu vàng `#e6c148` (sáng) bị biến thành màu vàng tối/nâu, màu đen `#000000` (tối) giữ nguyên tối. Gradient trở nên tối dịu mắt.
    - Chữ trắng `#ffffff` (L = 1) là thuộc tính chữ (`!isBackgroundKey`) và đã sáng sẵn, nên được giữ nguyên là màu trắng `#ffffff`.
    - Kết quả: Chữ trắng hiển thị rõ nét trên nền gradient tối.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* **Triệu chứng:** Xem trang Stats layout gradient ở site thực bị đen thui phần chữ và không hiển thị đúng màu chữ sáng.
* **Phát hiện:** `components/site/home/utils/darkModeColorAdapter.ts` bỏ qua gradient, đồng thời cào bằng việc đảo màu chữ trắng thành tối.
* **Dữ liệu database:** Stats component `mx7189yqp4dt77fz19m1z8d1r1880xbx` đang dùng `style: "gradient"`, màu chính là `#e6c148`, màu phụ là `#000000`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence:** High
* **Lý do:** Logic phân tích màu oklch trong `adaptColorForDarkMode` đảo ngược độ sáng của chữ sáng mà không check xem nền tương ứng của nó có phải nền tối sẵn không. Đồng thời, regex lọc màu của `adaptTokensForDarkMode` bỏ qua gradient.
* **Giả thuyết đối chứng:** Nếu chỉ sửa CSS cứng hoặc thêm CSS variables thủ công, chúng ta sẽ phá vỡ kiến trúc Dynamic Brand Color từ database và APCA contrast engine. Sửa trực tiếp adapter màu là giải pháp triệt để và tổng quát nhất cho toàn bộ 30+ home components.

---

# IV. Proposal (Đề xuất)
Cập nhật tệp `components/site/home/utils/darkModeColorAdapter.ts`:
1. Thêm hàm `adaptGradientForDarkMode(gradientStr, isDark)` để parse và convert các màu bên trong gradient.
2. Cập nhật `adaptColorForDarkMode` để gọi `adaptGradientForDarkMode` khi chuỗi chứa `'gradient'`.
3. Bổ sung điều kiện `if (!isBackgroundKey) return colorStr;` cho các trường hợp kiểm tra độ sáng cao (L > 0.75) để bảo toàn màu chữ sáng.
4. Cập nhật `isColor` check trong `adaptTokensForDarkMode` để cho phép chuỗi chứa `'gradient'` lọt qua.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa:** [darkModeColorAdapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/utils/darkModeColorAdapter.ts) - Cập nhật logic xử lý gradient và bảo toàn màu chữ sáng.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa file [darkModeColorAdapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/utils/darkModeColorAdapter.ts).
2. Chạy check TypeScript compile để đảm bảo không có lỗi cú pháp.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Tests
* Chạy `bunx tsc --noEmit` để đảm bảo tính đúng đắn về kiểu dữ liệu.

### Manual Verification
* Người dùng kiểm tra trang edit và site thực của Stats layout gradient. Giao diện phải đồng bộ, chữ hiển thị rõ ràng (màu sáng) trên cả preview và site thực ở cả light mode và dark mode.

---

# VIII. Todo
- [ ] Cập nhật file [darkModeColorAdapter.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/home/utils/darkModeColorAdapter.ts)
- [ ] Chạy check TypeScript
- [ ] Chạy lệnh báo âm thanh hoàn thành task

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Layout gradient hiển thị chữ màu sáng rõ ràng khi bật Dark Mode (cả ở Admin Preview và Site thực).
* Nền gradient tự động tối hơn ở Dark Mode.
* Không có lỗi TypeScript compile xảy ra.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Một số màu chữ sáng ở Light Mode của các component khác (nếu có) có thể không bị đảo sang tối ở Dark Mode. Tuy nhiên, theo logic thiết kế UI, chữ sáng chỉ dùng trên nền tối, nên việc giữ nguyên nó sáng ở Dark Mode là hoàn toàn chính xác.
* **Rollback:** `git checkout components/site/home/utils/darkModeColorAdapter.ts` để khôi phục trạng thái cũ.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi thiết kế của các layout Stats khác không liên quan đến vấn đề màu sắc/tương phản.
