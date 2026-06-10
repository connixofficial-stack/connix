# Spec: Sửa lỗi click dropdown User Menu ở Header Layout 4 (Darkglass Style)

# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn đăng nhập vào trang web và dùng Header Layout 4 (giao diện bo cong kính mờ), bạn bấm vào biểu tượng tài khoản để mở bảng menu nhỏ (chứa Đăng xuất, Đơn hàng...). Nhưng khi bạn định bấm vào "Đăng xuất" hay "Đơn hàng của tôi" thì cái bảng đó tự biến mất và không có chuyện gì xảy ra cả.
Nguyên nhân là do trang web vẽ hai cái Header cùng lúc (một cái cố định trên cùng, một cái chỉ hiện ra khi cuộn chuột xuống). Cả hai cái này đều tranh giành nhau một cái "nhãn ghi nhớ" (Ref) tên là `userMenuRef`. Vì cái Header ẩn giành được nhãn, nên khi bạn bấm vào bảng của Header đang hiện, trang web nghĩ bạn đang bấm ra ngoài giao diện và lập tức đóng bảng lại trước cả khi lệnh chuyển trang kịp chạy.

## 2. Elaboration & Self-Explanation
Trong lập trình React, để phát hiện người dùng click ra ngoài một bảng menu (Click Outside) và tự động đóng nó, lập trình viên thường dùng một `ref` (ở đây là `userMenuRef`) trỏ vào thẻ chứa menu đó. Khi có sự kiện bấm chuột, code sẽ so sánh: "Vị trí bấm có nằm trong vùng của `ref` này không? Nếu không thì đóng menu."
Tuy nhiên, giao diện Header Layout 4 (`darkglass`) lại render đồng thời hai thẻ `<header>` khác nhau:
1. **Top Header**: Hiện ở trên cùng khi chưa cuộn trang.
2. **Sticky Header**: Chỉ hiện dạng thanh Pill nổi khi người dùng cuộn trang xuống.

Vì cả hai Header đều chứa cụm menu tài khoản sử dụng chung một `ref={userMenuRef}`, React chỉ gán `userMenuRef.current` cho phần tử được vẽ sau cùng (ở đây là Sticky Header).
Khi người dùng chưa cuộn trang và bấm vào menu tài khoản ở Top Header:
- Menu hiện ra bình thường vì state `userMenuOpen` đổi thành `true`.
- Khi người dùng click vào nút "Đăng xuất" hoặc "Đơn hàng của tôi" trên menu này, trình duyệt kích hoạt sự kiện `mousedown`.
- Hàm bắt sự kiện `handleClick` (click outside) kiểm tra xem click có nằm trong `userMenuRef.current` (của Sticky Header) không. Vì người dùng đang click trên Top Header chứ không phải Sticky Header, phép so sánh `contains` trả về `false`.
- Kết quả là `setUserMenuOpen(false)` chạy ngay lập tức, đóng menu của Top Header trước khi sự kiện `click` thực sự của thẻ Link/Button kịp kích hoạt. Do đó, các hành động chuyển trang hoặc đăng xuất hoàn toàn bị bỏ qua.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn có hai ngôi nhà sinh đôi giống hệt nhau đứng cạnh nhau: Nhà A (Top Header) và Nhà B (Sticky Header). Bạn chỉ có duy nhất một tấm bản đồ (Ref) tên là "Bản đồ nhà tôi", và hiện tại nó đang chỉ vào Nhà B.
Bạn đang đứng ở Nhà A, mở tủ lạnh ra để lấy đồ ăn (mở dropdown). Bạn thò tay định lấy hộp sữa (click Đăng xuất). Ngay lúc đó, hệ thống an ninh kiểm tra: "Người này có đang đứng ở ngôi nhà trên tấm bản đồ ('Bản đồ nhà tôi' - tức Nhà B) không?". Vì bạn đang đứng ở Nhà A chứ không phải Nhà B, hệ thống bảo: "Không phải chủ nhà!" và lập tức đóng sầm cửa tủ lạnh lại trước khi tay bạn chạm vào hộp sữa.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Thiết bị/Môi trường bị ảnh hưởng**: Giao diện người dùng ngoài trang site (public facing), cụ thể khi cấu hình Header Style là `darkglass` (Layout 4).
- **Mã nguồn liên quan**: [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx#L441-L449).
- **Trạng thái**: Tái hiện ổn định 100% ở đầu trang khi chưa cuộn.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## Root Cause Confidence: High (Độ tin cậy nguyên nhân gốc: Cao)
- **Nguyên nhân chính**: Xung đột tham chiếu `ref={userMenuRef}` do cơ chế render song song hai Header (`Top Header` và `Sticky Header`) trong Layout 4, dẫn đến kiểm tra Click Outside sai thực tế trên Top Header.
- **Giả thuyết đối chứng**: Có thể do `pointer-events-none` hoặc `z-index` của nội dung trang web phủ lên trên dropdown. Tuy nhiên, nếu bị phủ hoàn toàn thì menu không thể nhận hover hay click để đóng. Thực tế khi click vào menu, nó bị đóng ngay lập tức, chứng tỏ sự kiện click được chuyển đến trình xử lý `mousedown` của click-outside và thay đổi state đóng menu. Do đó giả thuyết xung đột `ref` là chính xác.

# IV. Proposal (Đề xuất)
Thay vì sử dụng một React `ref` duy nhất có thể bị ghi đè khi render nhiều Header song song, chúng ta sẽ chuyển sang xác định click outside thông qua một CSS class cụ thể đại diện cho vùng menu tài khoản, ví dụ: `user-menu-container`.

### Giải pháp chi tiết:
1. Gắn class `user-menu-container` vào thẻ bao ngoài cùng của `renderUserMenu`.
2. Trong hàm xử lý click outside `handleClick`, thay vì kiểm tra `userMenuRef.current.contains()`, chúng ta sẽ quét toàn bộ các phần tử có class `.user-menu-container` trong DOM và kiểm tra xem điểm click có nằm trong bất kỳ phần tử nào không.

```typescript
const handleClick = (event: MouseEvent) => {
  const target = event.target as Node;
  const isInside = Array.from(document.querySelectorAll('.user-menu-container')).some(
    el => el.contains(target)
  );
  if (!isInside) {
    setUserMenuOpen(false);
  }
};
```
Cách tiếp cận này an toàn, tối giản (KISS), không phá vỡ logic sẵn có và hoạt động hoàn hảo bất kể có bao nhiêu Header được render.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa:
- [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx):
  - Thay đổi cách bắt sự kiện click outside trong `useEffect` để quét class `.user-menu-container`.
  - Gắn class `user-menu-container` vào thẻ `div` bọc ngoài cùng của `renderUserMenu`.
  - Xóa bỏ khai báo `userMenuRef` không còn cần thiết.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ file [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx) xung quanh khu vực dòng 440 và 680.
2. Thực hiện sửa đổi logic click outside bằng cách sử dụng `document.querySelectorAll('.user-menu-container')`.
3. Cập nhật mã nguồn hàm `renderUserMenu` để thêm class `user-menu-container` và gỡ bỏ `ref={userMenuRef}`.
4. Tự review tĩnh và verify.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm thử thủ công:
- Truy cập trang chủ hoặc bất kỳ trang nào của site sử dụng Layout 4.
- Đăng nhập tài khoản.
- Khi ở trên cùng trang (chưa cuộn chuột):
  - Bấm vào biểu tượng User để mở dropdown.
  - Bấm vào "Thông tin tài khoản" -> Đảm bảo chuyển trang thành công.
  - Bấm vào "Đơn hàng của tôi" -> Đảm bảo chuyển trang thành công.
  - Bấm vào "Đăng xuất" -> Đảm bảo đăng xuất thành công.
  - Bấm ra vùng trống ngoài dropdown -> Đảm bảo dropdown đóng lại.
- Cuộn trang xuống để Sticky Header xuất hiện:
  - Lặp lại các thao tác tương tự đối với dropdown trên Sticky Header.

# VIII. Todo
- [ ] Xóa khai báo `userMenuRef` ở dòng 430 trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx).
- [ ] Cập nhật effect click outside ở dòng 441-449 trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx) để tìm theo class `.user-menu-container`.
- [ ] Thêm class `user-menu-container` và gỡ bỏ `ref={userMenuRef}` ở hàm `renderUserMenu` dòng 688-690 trong [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx).

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Tất cả các link/button hành động trong dropdown User Menu hoạt động bình thường, không bị đóng đột ngột trước khi kích hoạt chuyển trang hoặc đăng xuất.
- Hành vi click outside (đóng menu khi click bên ngoài) vẫn hoạt động chính xác ở cả hai trạng thái cuộn trang (Sticky) và không cuộn trang (Top Header).

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Thấp. Thay đổi hoàn toàn cục bộ trong file `Header.tsx` và chỉ ảnh hưởng tới hoạt động click outside của menu tài khoản.
- **Hoàn tác**: Sử dụng `git checkout` để khôi phục lại file [Header.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/site/Header.tsx) nếu có vấn đề.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa giao diện thiết kế, màu sắc hoặc các logic nghiệp vụ khác của Header.
- Không sửa file preview của admin `HeaderMenuPreview.tsx` trừ khi có yêu cầu thêm vì nó là phần hiển thị tĩnh và không có bug này do chỉ render 1 header.

# XII. Open Questions (Câu hỏi mở)
*Không có câu hỏi mở.*
