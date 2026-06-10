# Spec: Sửa lỗi React "Cannot update a component while rendering a different component"

# I. Primer

## 1. TL;DR kiểu Feynman
Khi một component con (như bảng phiên bản) bảo component cha (trang tạo sản phẩm) thay đổi thông tin ngay trong lúc bản thân nó đang vẽ hoặc đang cập nhật, React sẽ báo lỗi vì giống như hai người tranh nhau nói cùng một lúc. Chúng ta sẽ sửa lỗi này bằng hai bước:
- Sử dụng các "thẻ ghi nhớ" (Ref) để con luôn biết thông tin mới nhất mà không cần phải vẽ lại liên tục.
- Sử dụng chiếc "hẹn giờ" siêu tốc (`setTimeout` với 0 mili-giây) để con đợi vẽ xong xuôi rồi mới bảo cha cập nhật thông tin sau, tránh làm React bị bối rối.

## 2. Elaboration & Self-Explanation
Lỗi xảy ra do component con `InlineMatrixBuilder` thực hiện các hiệu ứng phụ (`useEffect`) để đồng bộ hóa danh sách phiên bản và tự động sinh SKU mới khi thuộc tính hoặc `baseSku` thay đổi. Trong các `useEffect` này, component con gọi hàm callback `onChange` truyền lên cha, từ đó kích hoạt các hàm cập nhật state ở component cha (`setVariantSelections`, `setVariantRows`).
Do việc cập nhật state của cha diễn ra đồng bộ ngay trong quá trình render/update của con (hoặc tệ hơn là nằm trong callback của hàm update state `setVariants`), React coi đây là một hành vi không an toàn.
Giải pháp xử lý:
- Khai báo các `useRef` lưu giữ các giá trị mới nhất của `onChange`, `selections`, và `variants`. Các ref này được cập nhật đồng bộ sau mỗi lần render bằng một `useEffect` không có dependency. Điều này giúp loại bỏ hoàn toàn stale closure và loại bỏ sự phụ thuộc vòng lặp dependency trong các `useEffect` chính.
- Bọc toàn bộ các lệnh gọi callback `onChange` trong `setTimeout(() => { onChange(...) }, 0)` để chuyển việc cập nhật state của component cha thành bất đồng bộ (asynchronous), đưa nó vào hàng đợi sự kiện tiếp theo sau khi con đã render xong.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể:** Khi admin nhập tên SKU mới của sản phẩm gốc (ví dụ đổi từ `SP` sang `BCT`), component con phát hiện sự thay đổi và tự động tính toán lại SKU cho các biến thể. Sau khi cập nhật xong state của nó, thay vì gọi `onChange` ngay lập tức làm component cha crash, con sẽ đặt lịch hẹn: "Ngay khi vẽ xong cái bảng này, ta sẽ báo cho trang cha cập nhật SKU mới".
- **Analogy:** Giống như một học sinh và giáo viên trong lớp. Khi học sinh (con) đang ghi chép bài, em phát hiện ra lỗi sai và muốn báo với giáo viên (cha) để sửa giáo án. Nếu học sinh vừa viết vừa hét lên cắt ngang lời giáo viên đang giảng (cập nhật đồng bộ), lớp học sẽ bị loạn. Thay vào đó, học sinh viết xong bài rồi giơ tay phát biểu sau khi giáo viên giảng xong phần đó (hẹn giờ bất đồng bộ).

# II. Audit Summary (Tóm tắt kiểm tra)
- Lỗi xảy ra tại file [inline-matrix-builder.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/connix/app/admin/products/components/inline-matrix-builder.tsx).
- Vị trí cụ thể: Các hàm `onChange` được gọi trong hai `useEffect` ở dòng 546-569 (xử lý `baseSku`) và dòng 576-614 (xử lý sinh variants combo).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Cập nhật state của component cha đồng bộ từ `useEffect` của con trong phase render, đặc biệt là gọi callback side-effect bên trong functional update `setVariants((currentVariants) => { ... onChange(...) })`.
- **Giả thuyết đối chứng:** Nếu chuyển các cuộc gọi `onChange` ra ngoài functional update và bọc chúng trong `setTimeout(..., 0)`, React sẽ thực thi cập nhật state của cha ở tick tiếp theo của event loop, triệt tiêu hoàn toàn lỗi render conflict.

# IV. Proposal (Đề xuất)
- Sửa đổi component `InlineMatrixBuilder`:
  1. Thêm các `useRef`: `onChangeRef`, `selectionsRef`, `variantsRef`.
  2. Bổ sung `useEffect` đồng bộ ref sau render:
     ```tsx
     useEffect(() => {
       onChangeRef.current = onChange;
       selectionsRef.current = selections;
       variantsRef.current = variants;
     });
     ```
  3. Cập nhật `useEffect` xử lý `baseSku`: loại bỏ side-effect trong `setVariants` và bọc `onChange` trong `setTimeout`.
  4. Cập nhật `useEffect` xử lý sinh variants combo: bọc `onChange` trong `setTimeout`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [inline-matrix-builder.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/connix/app/admin/products/components/inline-matrix-builder.tsx)
  - Sửa đổi logic các `useEffect` xử lý đồng bộ và callback trong `InlineMatrixBuilder`.

# VI. Execution Preview (Xem trước thực thi)
1. Thêm code khai báo ref ở đầu component `InlineMatrixBuilder`.
2. Sửa đổi code của `useEffect` xử lý `baseSku` và `useEffect` xử lý combo.
3. Chạy `tsc` để kiểm chứng kiểu tĩnh.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Chạy biên dịch TypeScript tĩnh:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`
- Manual Verification: Mở console trình duyệt, thao tác thêm thuộc tính và thay đổi baseSku trên trang admin tạo/sửa sản phẩm, kiểm tra lỗi console có biến mất hay không.

# VIII. Todo
- [x] Lập spec sửa lỗi setState trong render phase.
- [ ] Chỉnh sửa logic `useEffect` trong `inline-matrix-builder.tsx`.
- [ ] Chạy kiểm tra TypeScript (`tsc`).
- [ ] Chạy lệnh thông báo hoàn thành qua PowerShell.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Lỗi console "Cannot update a component while rendering a different component" hoàn toàn biến mất.
- Các thuộc tính và biến thể thay đổi vẫn được đồng bộ chính xác lên component cha.
- Biên dịch TypeScript thành công.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro cực thấp vì `setTimeout(..., 0)` chỉ thay đổi thời điểm thực thi callback chứ không thay đổi logic dữ liệu.
- Hoàn tác qua Git dễ dàng.

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi cấu trúc dữ liệu của các biến thể hay sản phẩm.
