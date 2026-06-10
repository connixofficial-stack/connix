# I. Primer

## 1. TL;DR kiểu Feynman
* Trang `/system/experiences` (Trải nghiệm hệ thống) hiển thị nhiều chức năng khác nhau để kiểm thử giao diện mẫu, nhưng chưa có tính năng tìm kiếm.
* Ta sẽ tạo một Convex Query (Hàm truy vấn Convex) để lọc danh sách các trải nghiệm tĩnh ở phía Backend (Convex) thay vì xử lý hoàn toàn ở Frontend.
* Ở Frontend, ta sẽ thêm một Search Bar (Thanh tìm kiếm) cực kỳ mượt mà, sử dụng Input Component có sẵn, hỗ trợ Debounce (Trì hoãn kích hoạt) để không spam yêu cầu tới Convex.
* Ánh xạ các icon tĩnh từ string nhận về từ Convex sang Lucide React Component tương ứng trên giao diện.

## 2. Elaboration & Self-Explanation
Hiện nay, trang Trải nghiệm quản trị hệ thống (`/system/experiences`) chứa rất nhiều mục như "Danh sách bài viết", "Đặt lịch", "Giỏ hàng", "Đơn hàng", v.v. Các mục này đang được lưu dưới dạng một danh sách tĩnh (Static List) trong code Frontend tại file `_constants.ts`. Do số lượng mục nhiều nên người dùng muốn tìm kiếm nhanh thay vì phải cuộn chuột tìm thủ công.

Yêu cầu cụ thể là bổ sung một thanh tìm kiếm sử dụng Convex Search. Để triển khai điều này một cách tối ưu và gọn gàng, chúng ta sẽ:
* Di chuyển dữ liệu trải nghiệm (được lược bỏ React Component của Icon) lên Backend dưới dạng một danh sách tĩnh trong file Convex mới `convex/experiences.ts`.
* Viết một Convex Query `search` nhận vào từ khóa tìm kiếm và lọc dữ liệu, trả về danh sách đã khớp. Điều này đúng nghĩa là Convex Search giúp Backend chịu trách nhiệm xử lý logic tìm kiếm.
* Tại Frontend, trang `/system/experiences/page.tsx` sẽ gọi query Convex này. Ta xây dựng một ô Input tìm kiếm hiện đại, bóng bẩy (Premium), tích hợp Debounce để tối ưu băng thông mạng. Khi danh sách trống, hiển thị trạng thái "Không tìm thấy kết quả".

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể:** Khi người dùng gõ chữ "đơn", Frontend sẽ đợi khoảng 300ms (Debounce) sau đó gửi từ khóa "đơn" lên Convex. Backend lọc qua danh sách và trả về mục "Đơn hàng (Account)" cùng "Thanh toán & Đặt hàng". Frontend nhận kết quả và render ra giao diện ngay lập tức.
* **Hình ảnh tương tự (Analogy):** Giống như việc bạn vào một nhà sách lớn. Thay vì tự đi dọc các kệ sách (lướt thủ công), bạn đến quầy tra cứu (Thanh tìm kiếm) và gõ tên cuốn sách. Hệ thống máy chủ của nhà sách (Convex Backend) sẽ tìm kiếm và chỉ cho bạn chính xác kệ sách nào chứa cuốn sách đó.

---

# II. Audit Summary (Tóm tắt kiểm tra)
* Đã kiểm tra file `app/system/experiences/page.tsx`: Danh sách hiện tại sử dụng hằng số `systemExperiences` từ `_constants.ts` được import tĩnh.
* Đã kiểm tra file `app/system/experiences/_constants.ts`: Định nghĩa danh sách các `SystemExperience` dạng array tĩnh, trong đó trường `icon` là React Component (LucideIcon).
* Đã kiểm tra Convex Schema (`convex/schema.ts`): Không tồn tại bảng `experiences`. Do đây là dữ liệu cấu hình hệ thống tĩnh nên việc tạo table và migration là không cần thiết, YAGNI (You Aren't Gonna Need It) và KISS (Keep It Simple, Stupid). Giải pháp lọc danh sách qua Convex Query là sạch và an toàn nhất.
* Đã kiểm tra `app/admin/components/ui.tsx`: Có sẵn Component `Input` thiết kế đẹp mắt, sẵn sàng để tái sử dụng.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Root Cause Confidence (Độ tin cậy nguyên nhân gốc/giải pháp):** High (Cao).
* **Lý do:** Đây là một yêu cầu phát triển tính năng mới (Feature Request) nhằm cải thiện trải nghiệm người dùng (UX). Giải pháp lưu trữ danh sách trải nghiệm tĩnh ở Convex Backend và triển khai Convex Query tìm kiếm là tối ưu nhất vì nó phân tách rạch ròi dữ liệu/logic Backend và giao diện Frontend, đồng thời dễ dàng nâng cấp lên thành cơ sở dữ liệu động sau này nếu có nhu cầu phát sinh.

---

# IV. Proposal (Đề xuất)
1. **Phía Server (Convex):**
   * Tạo file `convex/experiences.ts`.
   * Khai báo danh sách tĩnh `systemExperiences` tương tự như ở Frontend, nhưng lưu thuộc tính `icon` dưới dạng `string` đại diện cho tên Icon (ví dụ `"FileText"`, `"Briefcase"`).
   * Viết Convex Query `search` nhận tham số `query` (v.string()). Nếu `query` rỗng, trả về toàn bộ danh sách. Ngược lại, thực hiện tìm kiếm không phân biệt chữ hoa chữ thường trên trường `title` và `description`.

2. **Phía Client (UI/UX):**
   * Sửa file `app/system/experiences/page.tsx`.
   * Thêm một đối tượng ánh xạ `iconMap` để chuyển đổi tên string từ Convex về Lucide Icon Component thực tế.
   * Cài đặt hook `useQuery(api.experiences.search, { query: debouncedQuery })`.
   * Xây dựng ô Input tìm kiếm cao cấp, tích hợp icon Search của Lucide ở bên trái và nút Clear (X) khi có chữ.
   * Thêm trạng thái Loading (Đang tải) và Trống (Không có kết quả).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Thêm:** [experiences.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/convex/experiences.ts)
  * Mô tả vai trò hiện tại: Chưa tồn tại.
  * Thay đổi: Định nghĩa danh sách các trải nghiệm hệ thống và cung cấp Convex Query `search` để tìm kiếm thông tin ở phía Backend.

* **Sửa:** [page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/system/experiences/page.tsx)
  * Mô tả vai trò hiện tại: Trang hiển thị danh sách các Trải nghiệm cấu hình giao diện.
  * Thay đổi: Tích hợp thanh tìm kiếm hiện đại, sử dụng dữ liệu trả về từ Convex query thay vì hằng số tĩnh local, bổ sung logic Debounce và ánh xạ Icon.

---

# VI. Execution Preview (Xem trước thực thi)
1. **Tạo file Backend:** Viết file `convex/experiences.ts` với danh sách dữ liệu tĩnh được sao chép từ Frontend và logic tìm kiếm.
2. **Kiểm thử tĩnh API:** Đảm bảo kiểu dữ liệu và cú pháp Convex Query chính xác.
3. **Cập nhật Frontend:** Chỉnh sửa giao diện trang `page.tsx` để hiển thị ô tìm kiếm mượt mà và fetch API Convex.
4. **Kiểm tra kiểu dữ liệu (Type-check):** Chạy `bunx tsc --noEmit` để chắc chắn không có lỗi TypeScript.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Type-check:** Chạy `bunx tsc --noEmit` để kiểm tra compile-time.
* **Manual Verification (Kiểm chứng thủ công):**
  * Truy cập `/system/experiences` trên trình duyệt.
  * Nhập từ khóa bất kỳ (ví dụ: "Sản phẩm", "đơn", "giỏ").
  * Kiểm tra xem danh sách có lọc tức thời sau 300ms (debounce) không.
  * Nhấn nút Clear (X) để xóa nhanh từ khóa tìm kiếm.
  * Nhập từ khóa không có thực (ví dụ: "xyz123") để kiểm tra giao diện "Không tìm thấy kết quả".

---

# VIII. Todo
* [ ] Tạo file `convex/experiences.ts` định nghĩa Convex Query `search`.
* [ ] Sửa file `app/system/experiences/page.tsx` tích hợp Search Bar, sử dụng Convex Query, Debounce và `iconMap`.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Trang `/system/experiences` hiển thị một thanh tìm kiếm Premium.
* Gõ chữ vào ô tìm kiếm thì danh sách trải nghiệm tự động lọc khớp với từ khóa (dựa trên Convex Query).
* Khi xóa sạch chữ trong ô tìm kiếm, hiển thị lại đầy đủ danh sách ban đầu.
* Khi tìm từ khóa không khớp, hiển thị giao diện báo trống đẹp mắt.
* Không có lỗi TypeScript (`bunx tsc --noEmit` không báo lỗi).

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro:** Không có rủi ro về cơ sở dữ liệu thực vì không sửa đổi schema của hệ thống.
* **Hoàn tác:** Dễ dàng rollback bằng cách sử dụng `git checkout` trả lại trạng thái cũ của file `page.tsx` và xóa file `convex/experiences.ts`.

---

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi thiết kế hoặc tính năng của các trang trải nghiệm chi tiết (ví dụ `/system/experiences/booking`, `/system/experiences/products-list`).

---

# XII. Open Questions (Câu hỏi mở)
* Không có câu hỏi mở. Phương án hiện tại đã rất rõ ràng và tối ưu.
