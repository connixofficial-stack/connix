# I. Primer

## 1. TL;DR kiểu Feynman
Khi trang web có quá nhiều danh mục sản phẩm (như giày Jordan, Air Max, Blazer, Mexico 66,...), cái hộp lựa chọn cũ (dropdown) sẽ kéo dài thườn thượt từ trên xuống dưới, che hết cả màn hình và nhìn rất xấu. Chúng ta sẽ thay nó bằng một "Hộp tìm kiếm thông minh" (Combobox):
- Bấm vào sẽ hiện ra danh sách gọn gàng, cao tối đa khoảng 300px.
- Có ô để người dùng gõ chữ tìm nhanh danh mục mình cần (ví dụ gõ "Max" sẽ lọc ra Air Max, Max 1,...).
- Có thể cuộn lên cuộn xuống mượt mà.
- Bấm ra ngoài hoặc ấn nút `ESC` là tự đóng lại lịch sự.

## 2. Elaboration & Self-Explanation
Hiện tại, trang `/search` đang sử dụng thẻ `<select>` mặc định của trình duyệt để lọc danh mục sản phẩm/bài viết/dịch vụ. Khi số lượng danh mục vượt quá 10, danh sách này phình to và không thể kiểm soát cách hiển thị trên các thiết bị khác nhau.
Giải pháp là xây dựng một component Combobox tuỳ chỉnh (Client-side Component):
- Component này nhận vào danh sách các category, giá trị hiện tại (`value`) và một hàm callback `onChange`.
- Nó sẽ render một nút bấm (Trigger Button) hiển thị tên danh mục hiện tại.
- Khi click, một Popover Panel xuất hiện tuyệt đối (`absolute`) ngay bên dưới, chứa một ô `Input` để tìm kiếm và một danh sách cuộn (`max-h-60 overflow-y-auto`).
- Chúng ta dùng React state (`open`, `query`) và `useRef` kết hợp các sự kiện `mousedown` và `keydown` toàn cục để đóng mở tự động một cách mượt mà nhất.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn vào một nhà sách lớn có hàng ngàn danh mục sách. Thay vì bắt bạn đứng đọc một cái bảng danh sách siêu dài từ trần nhà xuống đất (Select cũ), nhà sách đưa cho bạn một cái hộp nhỏ có ô gõ chữ. Bạn chỉ cần gõ "Kinh tế", hộp sẽ tự động lọc ra các kệ sách về Kinh tế cho bạn chọn.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Vị trí code hiện tại:** `app/(site)/search/page.tsx` sử dụng thẻ `<select>` native tại dòng 514–525.
- **Thư viện sẵn có:** Dự án sử dụng Tailwind CSS, Lucide React (`ChevronRight`, `Search`, `X`, `Check`).
- **Trạng thái logic:** Bộ lọc hoạt động qua URL params (`p_cat`, `b_cat`, `s_cat` tương ứng cho Product, Blog/Post, Service). Khi đổi category, component gọi hàm `handleCategoryFilter` để push URL mới.
- **Tính khả thi:** Tạo một component mới `CategoryCombobox.tsx` đặt trong `app/(site)/search/_components/` và tích hợp vào `page.tsx` là an toàn nhất, giữ code sạch sẽ và dễ bảo trì.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Thẻ `<select>` native của HTML không hỗ trợ giới hạn chiều cao tối đa (`max-height`) một cách đồng bộ trên các trình duyệt và không hỗ trợ tích hợp thanh tìm kiếm bên trong.
- **Giả thuyết đối chứng:** Có thể dùng thư viện bên ngoài như `@radix-ui` hoặc `shadcn` combobox?
  - *Đánh giá:* Việc cấu hình Radix Popover và Command trong site client có thể phức tạp và gây xung đột CSS hoặc bundle size không đáng có. Một custom combobox viết bằng React hook thuần + Tailwind sẽ nhẹ hơn, dễ kiểm soát style đồng bộ theo tông màu thương hiệu của dự án (`primaryColor`) hơn và hoàn toàn giải quyết được bài toán.

---

# IV. Proposal (Đề xuất)
1. **Tạo component mới:** `app/(site)/search/_components/CategoryCombobox.tsx`
   - Quản lý state đóng mở `open` và từ khóa tìm kiếm `query`.
   - Sử dụng `useRef` và `useEffect` để bắt sự kiện click bên ngoài (click outside) và ấn phím `Escape` để đóng panel.
   - Thêm ô tìm kiếm danh mục mượt mà.
   - Tự động hiển thị dấu check (✓) bên cạnh danh mục đang được chọn.
   - Giới hạn chiều cao tối đa của danh sách bằng `max-h-60` (240px) và hỗ trợ cuộn dọc.
   - Hỗ trợ option "Tất cả danh mục" với giá trị rỗng `""`.
2. **Cập nhật trang search:** `app/(site)/search/page.tsx`
   - Import `CategoryCombobox`.
   - Thay thế thẻ `<select>` native bằng component mới này.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Thêm mới:** `app/(site)/search/_components/CategoryCombobox.tsx`
  - *Vai trò:* Cung cấp component lọc danh mục dạng Combobox thông minh, mượt mà.
- **Sửa đổi:** [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/%28site%29/search/page.tsx)
  - *Vai trò:* Trang kết quả tìm kiếm của site.
  - *Thay đổi:* Import và tích hợp `CategoryCombobox` thay thế `<select>` native tại khu vực lọc danh mục.

---

# VI. Execution Preview (Xem trước thực thi)
1. Tạo thư mục `_components` trong `app/(site)/search/` nếu chưa có.
2. Viết file `CategoryCombobox.tsx` với logic quản lý đóng mở, lọc và keyboard accessibility.
3. Import `CategoryCombobox` vào `app/(site)/search/page.tsx`.
4. Thay thế đoạn mã thẻ `<select>` cũ bằng component mới.
5. Review tĩnh code (typing, import, props).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Verification
- Chạy kiểm tra TypeScript lỗi type: `bunx tsc --noEmit`. Do hệ thống pre-commit hook đã có sẵn kiểm tra, chúng ta chỉ cần chạy thủ công để đảm bảo không có lỗi TypeScript trước khi bàn giao.

### Manual Verification
- Người dùng mở trang `http://localhost:3000/search?tab=product`.
- Bấm vào hộp lọc danh mục mới:
  - Menu mở ra đẹp mắt, không bị tràn màn hình.
  - Nhập từ khóa tìm kiếm (ví dụ "Air Jordan"), danh sách lọc đúng thời gian thực.
  - Chọn một danh mục, trang web tải lại và hiển thị sản phẩm thuộc danh mục đó, hộp lọc đóng lại, hiển thị tên danh mục đã chọn.
  - Click ra ngoài hoặc nhấn phím `ESC` để đóng menu lọc danh mục.

---

# VIII. Todo
- [ ] Tạo thư mục `app/(site)/search/_components` nếu chưa có.
- [ ] Viết file `app/(site)/search/_components/CategoryCombobox.tsx`.
- [ ] Thay thế thẻ `<select>` bằng `<CategoryCombobox>` trong `app/(site)/search/page.tsx`.
- [ ] Thực hiện static review và typecheck.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Hộp lọc danh mục hiển thị gọn gàng, chiều cao panel tối đa `max-h-60` (có scrollbar).
- Có thanh search hoạt động lọc local chính xác.
- Khi chọn xong danh mục, URL cập nhật đúng tham số lọc và panel đóng lại.
- Trải nghiệm mượt mà, không bị giật lag, click ngoài đóng panel hoạt động chính xác.
- Không phát sinh bất kỳ lỗi TypeScript hay runtime crash nào.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Click outside không nhạy hoặc tranh chấp sự kiện click với các phần tử khác.
  - *Giải pháp:* Sử dụng `mousedown` listener gắn trực tiếp trên `document` và kiểm tra `containerRef.current.contains(...)` là giải pháp chuẩn và cực kỳ đáng tin cậy.
- **Rollback:** Nếu gặp lỗi nghiêm trọng, hoàn tác file `app/(site)/search/page.tsx` về trạng thái ban đầu bằng Git.

---

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi cấu trúc dữ liệu database, thay đổi API Convex.
- Thay đổi bộ lọc Sort hoặc hiển thị Grid/List (giữ nguyên hoạt động).

---

# XII. Open Questions (Câu hỏi mở)
*Không có.*
