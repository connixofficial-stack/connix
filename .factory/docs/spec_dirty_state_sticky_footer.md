# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng sửa thông tin của Loại sản phẩm (Product Types) mà lỡ tay đóng tab trình duyệt hoặc chuyển trang khác, toàn bộ thông tin sửa đổi sẽ bị mất mà không được cảnh báo. Đồng thời, họ phải cuộn chuột xuống mãi dưới cùng mới thấy nút "Lưu thay đổi".
Giải pháp là:
1. Thêm một "cảnh báo rời trang" (Unsaved Guard). Nếu người dùng đã sửa gì đó mà chưa lưu, trình duyệt sẽ hiện thông báo hỏi chắc chắn muốn rời đi hay không.
2. Thêm một "thanh nút bấm dính" (Sticky Footer) ở dưới cùng màn hình. Khi người dùng sửa bất kỳ thông tin nào, thanh này sẽ sáng lên, tự động cập nhật trạng thái "Đã lưu" hoặc "Có thay đổi chưa lưu". Admin có thể lưu lại bất cứ lúc nào mà không cần phải cuộn chuột tìm nút bấm.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ tích hợp hai cơ chế cải tiến UX đã áp dụng thành công ở các module khác (như Home Components, Categories):
- **Dirty State Guard (Cảnh báo rời trang):**
  - Chụp lại trạng thái ban đầu của dữ liệu khi load từ database qua state `initialData`.
  - Tạo một `dirtySnapshot` (chuỗi JSON đại diện cho toàn bộ state chỉnh sửa hiện tại).
  - So sánh `dirtySnapshot` với `initialData` để xác định biến `hasChanges` (boolean).
  - Sử dụng hook `useUnsavedGuard(hasChanges)` để trình duyệt tự động chặn chuyển trang khi có thay đổi chưa được lưu.
- **Sticky Footer (Chân trang dính):**
  - Tải component `HomeComponentStickyFooter` dùng chung.
  - Đặt nó ở chân trang thay thế cho phần nút bấm Submit/Cancel tĩnh cũ.
  - Truyền các props `hasChanges`, `isSubmitting`, `onCancel`, và liên kết state `active` trực tiếp vào footer để bật/tắt nhanh trạng thái hoạt động của Product Type.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**:
  - Khi Admin load trang sửa Rượu Vang, dữ liệu gốc có tên là "Rượu Vang", trạng thái là "Hoạt động".
  - Admin sửa tên thành "Rượu Vang Nhập Khẩu". Biến `hasChanges` lập tức chuyển thành `true`. Giao diện Sticky Footer chuyển từ "Đã lưu" (nút Lưu bị disable) sang "Lưu thay đổi" (nút Lưu sáng lên).
  - Nếu Admin nhấn nút "Quay lại danh sách" ở góc trên hoặc đóng tab, trình duyệt sẽ bật thông báo: "Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn rời đi?".

---

# II. Audit Summary (Tóm tắt kiểm tra)
- File đích cần sửa: `app/admin/product-types/[id]/edit/page.tsx`
- Component Sticky Footer có sẵn: `HomeComponentStickyFooter` tại `@/app/admin/home-components/_shared/components/HomeComponentStickyFooter`
- Hook chặn rời trang có sẵn: `useUnsavedGuard` tại `../../home-components/_shared/hooks/useUnsavedGuard`

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng quan sát được**: Trang edit của Product Type hiện tại sử dụng layout form truyền thống, nút Save/Cancel bị cuộn xuống dưới cùng của form. Không có cảnh báo rời trang nếu người dùng thay đổi dữ liệu mà chưa lưu.
- **Nguyên nhân gốc**: Giao diện trang edit của Product Type chưa được đồng bộ hóa với hệ thống Sticky Footer & Unsaved Guard mới của admin (đã áp dụng ở các module khác).
- **Độ tin cậy nguyên nhân gốc**: High
  - Lý do: Đã kiểm tra code `edit/page.tsx` của product-types thấy chỉ sử dụng Button tĩnh thông thường trong form và không có hook check dirty state hay component Sticky Footer nào.

---

# IV. Proposal (Đề xuất)
- Sửa `app/admin/product-types/[id]/edit/page.tsx`:
  - Import `useUnsavedGuard` và `HomeComponentStickyFooter`.
  - Khai báo state `initialData` để snapshot dữ liệu ban đầu.
  - Khai báo `hasChanges` và `dirtySnapshot` để so sánh và theo dõi thay đổi.
  - Sử dụng hook `useUnsavedGuard(hasChanges)`.
  - Thay thế phần div footer tĩnh cũ bằng component `HomeComponentStickyFooter` ở cuối form.
  - Cập nhật state `initialData` sau khi submit thành công để reset trạng thái `hasChanges` về `false` (Đã lưu).

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa:` [edit/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/product-types/[id]/edit/page.tsx)
  - Tích hợp dirty state logic và hook `useUnsavedGuard`.
  - Thay thế footer tĩnh bằng `<HomeComponentStickyFooter />`.

---

# VI. Execution Preview (Xem trước thực thi)
1. Thêm import `useUnsavedGuard` và `HomeComponentStickyFooter` vào đầu file `edit/page.tsx`.
2. Khởi tạo `initialData` state và cập nhật nó trong `useEffect` khi load xong `typeData`, `assignedGroupsData`, và `assignedCategoriesData`.
3. Tính toán `dirtySnapshot` và so sánh trong `useEffect` để set `hasChanges`.
4. Gọi `useUnsavedGuard(hasChanges)`.
5. Thay thế khối div nút lưu ở cuối Card và form bằng `<HomeComponentStickyFooter />`.
6. Cập nhật `initialData` trong callback `handleSubmit` sau khi mutation cập nhật thành công.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh**: Compile kiểm tra lỗi kiểu dữ liệu TypeScript bằng `bunx tsc --noEmit`.
- **Thực tế**: Truy cập http://localhost:3000/admin/product-types/vh7b615h3ey2v2gc90cnkvx0fd87bdb4/edit, thay đổi một trường dữ liệu (ví dụ: tên), kiểm tra xem footer dính có xuất hiện trạng thái "Có thay đổi chưa lưu" và nút lưu sáng lên không. Thử click ra ngoài xem có cảnh báo rời trang hay không.

---

# VIII. Todo
- [ ] Tích hợp logic dirty state và `HomeComponentStickyFooter` vào `app/admin/product-types/[id]/edit/page.tsx`
- [ ] Chạy compile `bunx tsc --noEmit` để đảm bảo code sạch lỗi.
- [ ] Commit các thay đổi.
- [ ] Chạy âm báo kết quả `Done, Sir.`

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang edit có footer dính ở dưới cùng (Sticky Footer).
- Khi chưa thay đổi gì, nút Lưu ở footer hiển thị "Đã lưu" và bị disabled.
- Khi thay đổi bất kỳ trường nào (tên, mô tả, checkbox danh mục, checkbox nhóm thuộc tính, tích chọn nấc giá bán), nút Lưu chuyển sang "Lưu thay đổi" và hoạt động.
- Nếu bấm nút Hủy hoặc click link rời trang khi có thay đổi chưa lưu, trình duyệt sẽ hiển thị popup cảnh báo.
- Sau khi bấm Lưu thành công, nút Lưu chuyển lại trạng thái "Đã lưu" và tắt cảnh báo rời trang.
