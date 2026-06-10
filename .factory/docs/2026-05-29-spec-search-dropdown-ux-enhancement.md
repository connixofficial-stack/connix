# I. Primer

## 1. TL;DR kiểu Feynman
Khi người dùng gõ tìm kiếm trên trang web, họ sẽ thấy danh sách kết quả nhanh hiện ra. Chúng ta sẽ làm cho danh sách này thông minh và dễ hiểu hơn nữa:
- Bên cạnh tiêu đề nhóm như **SẢN PHẨM** hay **BÀI VIẾT**, chúng ta sẽ gắn thêm một chiếc nhãn nhỏ (badge) hiển thị số lượng gợi ý tìm thấy (ví dụ: `5 gợi ý`).
- Dưới cùng danh sách, chúng ta sẽ thêm một nút chỉ dẫn tự giải thích (Self-explanatory) vô cùng rõ ràng: *"Nhấp vào đây hoặc nhấn 🔍 để xem đầy đủ kết quả cho [Từ khóa] →"*. Khi người dùng nhấn vào nút này, họ sẽ được đưa ngay tới trang tìm kiếm riêng để xem tất cả sản phẩm. Khách hàng nhìn là hiểu ngay và không bao giờ sợ bị quên bấm Enter nữa.

## 2. Elaboration & Self-Explanation
Yêu cầu của khách hàng gồm hai phần chính:
1. **Hiển thị số lượng:** Bổ sung nhãn số lượng gợi ý tìm được bên cạnh tiêu đề của từng nhóm phân loại (Sản phẩm, Bài viết, Dịch vụ) trong dropdown kết quả tìm kiếm nhanh. Chúng ta sẽ render một cấu trúc `flex justify-between items-center` cho tiêu đề nhóm, góc bên phải hiển thị một badge nhỏ tinh tế chứa số lượng item (`section.items.length`).
2. **UX tự giải thích (Self-explanatory):** Bổ sung một thanh hành động (Action Footer Button) dưới cùng của dropdown panel. Thanh này đóng vai trò chỉ dẫn trực quan: cho người dùng biết họ có thể click trực tiếp vào đó hoặc nhấn nút kính lúp 🔍 trên ô input để chuyển sang trang tìm kiếm đầy đủ `/search`. Điều này giải quyết triệt để edge-case người dùng di động nhập chữ xong nhưng quên bấm nút Enter trên bàn phím ảo.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đi siêu thị và hỏi nhân viên tìm "giày Nike". Thay vì nhân viên chỉ đưa cho bạn 5 đôi giày mẫu mà không nói gì thêm, họ sẽ nói: *"Đây là 5 đôi giày mẫu phù hợp nhất (5 gợi ý), nếu anh muốn xem đầy đủ tất cả các mẫu giày Nike hiện có của cửa hàng, xin mời anh đi theo lối này (Nhấp vào nút Xem đầy đủ kết quả)!"*. Bạn sẽ cảm thấy vô cùng dễ hiểu và được chỉ dẫn tận tình.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Vị trí code dropdown search:** [HeaderSearchAutocomplete.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/HeaderSearchAutocomplete.tsx)
- **Cấu trúc JSX hiện tại:**
  - Nhóm tiêu đề được hiển thị tại dòng 207–212 trong thẻ `<div className="px-4 py-1 text-[11px] ...">`.
  - Dropdown kết thúc ở dòng 245 với thẻ `</div>` bọc của phần list items, chưa có footer chỉ dẫn.
- **Trạng thái:** Hoạt động ổn định, đã được tích hợp nút tìm kiếm (Search Button) ở mobile.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:** Giao diện gợi ý nhanh (autocomplete) trước đó chỉ hiển thị danh sách các kết quả thô mà không có thông tin thống kê số lượng hiển thị và thiếu hướng dẫn hành động chuyển đổi tiếp theo (Call-to-action / Search Submission Hint), dẫn đến UX kém trực quan ("lỏ") trên thiết bị di động.
- **Giả thuyết đối chứng:** Có nên gọi API backend để đếm tổng số lượng khớp trong DB không?
  - *Đánh giá:* Việc đếm tổng số lượng khớp trong DB qua API Convex sẽ làm tăng lượng truy vấn (read amplification) và tài nguyên tính toán không cần thiết. Trong khi đó, dropdown gợi ý nhanh chỉ hiển thị tối đa 5 items đại diện. Việc hiển thị số lượng gợi ý nhanh (`5 gợi ý`) kèm theo hướng dẫn chuyển hướng sang trang tìm kiếm đầy đủ (nơi đã có đếm số lượng kết quả thực tế cực kỳ chi tiết) là giải pháp thanh lịch, nhẹ nhàng, tối ưu hiệu năng (DB Bandwidth Optimization) và đáp ứng hoàn hảo yêu cầu UX tự thân giải thích của người dùng.

---

# IV. Proposal (Đề xuất)
1. **Thêm số lượng gợi ý cạnh tiêu đề nhóm:**
   Sửa thẻ tiêu đề nhóm trong `HeaderSearchAutocomplete.tsx` thành dạng Flexbox:
   ```tsx
   <div
     className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between"
     style={{ color: tokens.dropdownSectionLabel }}
   >
     <span>{section.label}</span>
     <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 rounded px-1.5 py-0.5">
       {section.items.length} gợi ý
     </span>
   </div>
   ```
2. **Bổ sung Footer chỉ dẫn tự giải thích (Self-explanatory):**
   Thêm nút hành động dưới cùng dropdown panel (ngay dưới phần hiển thị danh sách):
   ```tsx
   {hasResults && (
     <button
       type="button"
       onClick={handleSubmit}
       className="w-full border-t border-slate-100 bg-slate-50 hover:bg-slate-100/80 px-4 py-3 text-xs text-slate-600 transition-colors flex items-center justify-center gap-1.5 font-semibold text-center mt-1"
       style={{ color: tokens.textSubtle }}
     >
       <span>Nhấp vào đây hoặc nhấn 🔍 để xem đầy đủ kết quả cho "{query}"</span>
       <span className="text-slate-400">→</span>
     </button>
   )}
   ```

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa đổi:** [HeaderSearchAutocomplete.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/HeaderSearchAutocomplete.tsx)
  - *Thay đổi:* Cập nhật tiêu đề nhóm để hiển thị badge số lượng gợi ý và thêm footer chỉ dẫn hành động "Self-explanatory" dưới cùng dropdown.

---

# VI. Execution Preview (Xem trước thực thi)
1. Cấu trúc lại thẻ tiêu đề nhóm trong `HeaderSearchAutocomplete.tsx`.
2. Thêm khối mã render footer nút hành động dưới cùng danh sách kết quả tìm kiếm trong dropdown.
3. Thực hiện kiểm tra TypeScript tĩnh (`bunx tsc --noEmit`).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Verification
- Chạy typecheck: `bunx tsc --noEmit`.

### Manual Verification
- Truy cập vào trang web trên Desktop hoặc Mobile.
- Gõ từ khóa tìm kiếm (ví dụ "hi"):
  - Kiểm tra xem tiêu đề `SẢN PHẨM` và `BÀI VIẾT` có hiển thị badge số lượng gợi ý hay không (ví dụ: `5 gợi ý`).
  - Xem dưới cùng dropdown có nút chỉ dẫn màu xám nhạt: *"Nhấp vào đây hoặc nhấn 🔍 để xem đầy đủ kết quả cho "hi" →"*.
  - Click trực tiếp vào nút này xem trang web có chuyển sang trang tìm kiếm chính `/search?q=hi` và hiển thị đầy đủ kết quả chính xác hay không.
