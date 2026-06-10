# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng bấm vào biểu tượng tìm kiếm trên điện thoại, cái hộp danh sách kết quả (dropdown) bị lệch hẳn sang trái, mất đi một phần và che mất cả ảnh đại diện sản phẩm (thumbnail), chữ đầu tiên bị cắt mất trông rất mất thẩm mỹ. Ngoài ra, trên điện thoại cũng không có nút kính lúp để bấm tìm kiếm ngay, khiến người dùng nếu quên không nhấn nút "Enter" trên bàn phím thì không biết làm sao để tìm.
Chúng ta sẽ sửa lại:
- Làm cho hộp kết quả rộng bằng đúng chiều ngang của ô tìm kiếm trên điện thoại, nằm gọn gàng 100% trong màn hình, hiện đầy đủ ảnh và chữ.
- Thêm nút kính lúp tìm kiếm ở góc phải ô nhập chữ trên điện thoại để người dùng chỉ cần chạm nhẹ là tìm được ngay mà không cần ấn phím Enter trên bàn phím ảo.

## 2. Elaboration & Self-Explanation
Vấn đề dropdown kết quả search nhanh bị lệch và cắt chữ ở di động là do thuộc tính CSS `absolute right-0 min-w-[320px]` định vị lệch phải mà không giới hạn theo viewport di động. Trên màn hình nhỏ, dropdown 320px căn phải sẽ bị tràn ra ngoài lề trái của màn hình (tọa độ âm), khiến trình duyệt che khuất phần bên trái của dropdown (nơi chứa thumbnail và các ký tự đầu tiên của sản phẩm).
Giải pháp là sử dụng CSS responsive của Tailwind CSS:
- Dropdown sẽ sử dụng class `w-full md:w-[380px] left-0 md:left-auto right-0` để trên mobile nó có chiều rộng bằng 100% ô tìm kiếm cha, căn lề trái-phải hoàn hảo trong viewport, và trên desktop vẫn giữ kích thước 380px căn phải đẹp mắt.
- Thêm thuộc tính `shrink-0` vào thẻ chứa ảnh thumbnail để đảm bảo ảnh không bao giờ bị bóp méo hay co lại bởi thuộc tính flexbox.
- Bật `showButton={true}` trên mobile khi gọi `<HeaderSearchAutocomplete>` trong `Header.tsx`, đồng thời tăng padding-right cho input (`pr-10`) và cấu hình class cho nút tìm kiếm (`buttonClassName="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full"`) để tạo ra nút kính lúp bấm được cực kỳ thuận tiện trên di động.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn treo một bức tranh lớn (dropdown 320px) căn sát vào mép phải của một cây cột nhỏ (ô input trên mobile). Vì cây cột quá sát tường bên trái, bức tranh sẽ bị đè lút vào trong khe tường bên trái, bạn không thể nhìn thấy góc bên trái bức tranh (mất ảnh đại diện và chữ đầu).
Giải pháp của chúng ta là làm cho bức tranh tự co giãn vừa khít bằng đúng chiều rộng của cây cột khi ở không gian hẹp (mobile), và treo bức tranh to hơn khi cột nằm ở không gian rộng rãi (desktop).

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Vị trí code dropdown search:** `components/site/HeaderSearchAutocomplete.tsx` dòng 191–195 và 224-232.
- **Vị trí gọi ô search trên mobile:** `components/site/Header.tsx` có 3 vị trí gọi `<HeaderSearchAutocomplete>` trên mobile với `showButton={false}` tại các dòng: 1421-1437, 1603-1619, 2160-2176.
- **Trạng thái:** Toàn bộ CSS sử dụng Tailwind CSS. Dự án đã được build và chạy ổn định.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:**
  1. Dropdown định vị cứng `right-0 min-w-[320px]` khiến nó bị tràn sang trái màn hình di động hẹp.
  2. Thumbnail container thiếu class `shrink-0` có nguy cơ bị bóp méo kích thước.
  3. Tham số `showButton={false}` bị gán cứng khi gọi trên mobile trong `Header.tsx`, và input thiếu padding-right tương ứng để chừa chỗ cho nút tìm kiếm.
- **Giả thuyết đối chứng:** Có thể dùng một thư viện modal search tràn màn hình riêng cho mobile?
  - *Đánh giá:* Quá phức tạp và thay đổi lớn cấu trúc Header vốn đã rất đồ sộ (>2000 dòng). Sửa đổi trực tiếp CSS responsive của component autocomplete hiện tại là giải pháp gọn gàng, an toàn, dễ rollback và mang lại hiệu quả cao nhất (KISS/YAGNI).

---

# IV. Proposal (Đề xuất)
1. **Sửa `components/site/HeaderSearchAutocomplete.tsx`:**
   - Thay đổi class của dropdown panel thành:
     `absolute left-0 md:left-auto right-0 mt-2 w-full md:w-[380px] rounded-xl border z-50 overflow-hidden`
   - Thêm `shrink-0` vào container của ảnh đại diện:
     `relative w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0`
2. **Sửa `components/site/Header.tsx`:**
   - Tại cả 3 vị trí gọi `<HeaderSearchAutocomplete>` cho mobile, thay thế:
     - `showButton={false}` bằng `showButton={true}`
     - Thêm `buttonClassName="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full"`
     - Cập nhật `inputClassName` thay đổi `px-3` thành `pl-4 pr-10` để chừa chỗ cho nút search và nút xóa.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa đổi:** [HeaderSearchAutocomplete.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/HeaderSearchAutocomplete.tsx)
  - *Thay đổi:* Tối ưu hóa CSS định vị dropdown panel và thêm `shrink-0` cho ảnh.
- **Sửa đổi:** [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/Header.tsx)
  - *Thay đổi:* Kích hoạt hiển thị nút search, style lại nút và padding-right của input tìm kiếm trên thiết bị di động.

---

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật class dropdown và thumbnail trong `HeaderSearchAutocomplete.tsx`.
2. Định vị lại các cuộc gọi autocomplete di động trong `Header.tsx` và chèn props `showButton`, `buttonClassName` và sửa `inputClassName`.
3. Kiểm tra kiểu tĩnh TypeScript tĩnh (`bunx tsc --noEmit`).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Verification
- Chạy kiểm tra TypeScript tĩnh: `bunx tsc --noEmit`.

### Manual Verification
- Truy cập bằng điện thoại (hoặc chế độ Responsive di động F12 trên trình duyệt) vào trang web.
- Click biểu tượng kính lúp trên Header để mở ô tìm kiếm:
  - Kiểm tra xem ô tìm kiếm có nút kính lúp nhỏ ở góc phải hay không. Thử click trực tiếp vào nút này để tìm kiếm.
  - Gõ từ khóa tìm kiếm (ví dụ "nike").
  - Dropdown kết quả hiển thị thẳng hàng, cân đối, cách đều hai bên màn hình điện thoại (bằng đúng chiều rộng ô nhập liệu).
  - Ảnh thumbnail hiển thị rõ nét bên trái, tiêu đề sản phẩm hiển thị đầy đủ chữ đầu tiên, không bị lệch hay che khuất.

---

# VIII. Todo
- [ ] Cập nhật `components/site/HeaderSearchAutocomplete.tsx`.
- [ ] Cập nhật `components/site/Header.tsx` tại 3 vị trí gọi mobile search.
- [ ] Chạy check kiểu tĩnh TypeScript để đảm bảo không lỗi.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Dropdown autocomplete nằm trọn vẹn 100% trong khung nhìn di động, hiển thị ảnh đại diện sắc nét và chữ đầu tiên đầy đủ.
- Có nút kính lúp ở góc phải ô tìm kiếm di động, click vào thực hiện tìm kiếm chính xác.
- Không có hiện tượng chồng lấn chữ nhập với nút xóa (X) và nút kính lúp.
- Typecheck hoàn hảo, không lỗi runtime.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Trên các layout header đặc thù khác, việc đổi class dropdown có thể ảnh hưởng nhẹ?
  - *Giải pháp:* Lớp `w-full md:w-[380px] left-0 md:left-auto right-0` là lớp tiêu chuẩn và hoạt động hoàn hảo trên mọi layout nhờ cơ chế căn responsive `md:` độc lập. Rủi ro gần như bằng không.
- **Rollback:** Dùng lệnh `git checkout` để khôi phục nhanh hai file này.

---

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi thuật toán tìm kiếm backend.
- Sửa đổi giao diện trang kết quả tìm kiếm chính `/search`.
