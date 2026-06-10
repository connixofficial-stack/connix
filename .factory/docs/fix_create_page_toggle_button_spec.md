# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn tạo mới một Component (như Danh sách sản phẩm hay Thống kê), trang web được dựng sẵn từ server (SSR) và nạp ngay vào trình duyệt. Lúc này, nút đóng/mở nhanh (Toggle All) là component con chạy trước và tự đăng ký vào một "hộp thư chung" (global store) trước khi chân trang Sticky Footer (component cha) kịp mở mắt và đăng ký nhận thư. Chân trang bị lỡ mất sự kiện đăng ký này nên hiển thị trống trơn. Bằng cách gửi một thông báo nhắc nhở nhỏ ngay khi chân trang đăng ký nhận thư, chúng ta sẽ giúp chân trang cập nhật và hiển thị nút Toggle All một cách hoàn hảo.

## 2. Elaboration & Self-Explanation
Hệ thống sử dụng cơ chế React Portal tùy chỉnh thông qua một store toàn cục lưu trữ trong `HomeComponentFooterActions.tsx`. Các nút hành động như `FormSectionsToggleAllButton` (nút Toggle All) khi mount sẽ tự đăng ký vào store này và phát sự kiện cập nhật (`emitChange`). 

Ở trang Edit, do có màn hình Loading chặn trước, form được render hoàn toàn ở Client-side sau khi mount nên timing đồng bộ diễn ra hoàn hảo. Ngược lại, ở trang Create, form được render ngay lập tức. Trong quá trình Hydration và Mount của React ở Client-side:
1. `FormSectionsToggleAllButton` (nút con) mount trước, đăng ký action và gọi `emitChange()`. Lúc này, Sticky Footer (cha) chưa mount xong và chưa subscribe vào store. Do đó sự kiện thông báo bị bỏ qua.
2. `HomeComponentStickyFooter` mount sau, gọi `subscribe` của `useSyncExternalStore`. Tuy nhiên, do nút con đã đăng ký xong từ trước và không có thay đổi state nào khác kích hoạt, không có sự kiện `emitChange` nào được phát tiếp theo. Chân trang bị kẹt ở trạng thái trống ban đầu.

Giải pháp là tối ưu hóa hàm `subscribe` trong store: khi có một subscriber mới (chân trang) đăng ký, chúng ta sẽ schedule một microtask để thông báo cập nhật snapshot cho listener đó. Điều này đảm bảo chân trang luôn đồng bộ được snapshot mới nhất chứa nút Toggle All ngay sau khi mount.

## 3. Concrete Examples & Analogies
* **Ví dụ đời thường**: Bạn muốn đăng ký nhận báo giấy hàng ngày. Người đưa thư đến giao tờ báo đầu tiên lúc 7:00 sáng. Nhưng tới 8:00 sáng bạn mới ký hợp đồng đăng ký nhận báo. Nếu tòa soạn không gửi bù tờ báo lúc 7:00 cho bạn, bạn sẽ phải đợi đến ngày hôm sau mới có báo, và ngày hôm đó bạn không có báo để đọc.
* **Ví dụ trong Repo**: Trang Create Product List render `<FormSectionsToggleAllButton>` và gửi action `toggle-all` vào store. Khi `HomeComponentStickyFooter` mount và subscribe vào store, store phải "gửi bù" dữ liệu đã có sẵn cho chân trang qua microtask thông báo re-render.

# II. Audit Summary (Tóm tắt kiểm tra)
* **Triệu chứng**: Trang `/admin/home-components/create/product-list` và `/admin/home-components/create/stats` không hiển thị nút Toggle All ở Sticky Footer dù code render đầy đủ.
* **Đường dẫn import**: Đã kiểm tra toàn bộ relative imports của `HomeComponentFooterActions` ở các file liên quan, tất cả đều trỏ chính xác về cùng một file vật lý, loại trừ khả năng trùng lặp instance module.
* **Timing analysis**: Lỗi lệch pha (timing mismatch) xảy ra do thứ tự chạy `useEffect` của con (đăng ký action) diễn ra trước khi cha chạy `subscribe` của `useSyncExternalStore` trong quá trình hydration trang Create.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
* **Độ tin cậy nguyên nhân gốc**: **High (Cao)**.
* **Nguyên nhân chính**: Lệch pha timing khi mount trang Create (SSR/Hydration) khiến sự kiện `emitChange` của con phát ra khi danh sách `listeners` của cha còn trống. Cha subscribe sau đó nhưng không nhận được thông báo để lấy snapshot mới nhất.
* **Giả thuyết đối chứng**: Nếu là lỗi import trùng lặp hoặc unmount, trang Edit cũng sẽ bị mất nút. Tuy nhiên trang Edit hoạt động ổn định nhờ cơ chế render trì hoãn (lazy render sau loading spinner), chứng minh store và portal component hoàn toàn lành mạnh và chỉ bị lỗi timing ở pha mount của trang Create.

# IV. Proposal (Đề xuất)
Chỉnh sửa hàm `subscribe` trong `app/admin/home-components/_shared/components/HomeComponentFooterActions.tsx`:
Sử dụng `Promise.resolve().then(...)` để schedule microtask gọi `listener()` ngay sau khi subscribe. Điều này kích hoạt một chu kỳ cập nhật an toàn ở React client-side, giúp đồng bộ hóa các action đã được đăng ký trước đó mà không gây ra hydration mismatch hay cảnh báo vòng lặp update.

# V. Files Impacted (Tệp bị ảnh hưởng)
* **Sửa**: [HomeComponentFooterActions.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/_shared/components/HomeComponentFooterActions.tsx)
  * Hàm `subscribe`: Thêm microtask thông báo cho listener mới để đồng bộ snapshot đã đăng ký trước đó.
  * Dọn dẹp các console.log debug tạm thời để code sạch đẹp.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc file `HomeComponentFooterActions.tsx` để xác định chính xác các dòng cần sửa.
2. Cập nhật hàm `subscribe` với cơ chế microtask thông báo đồng bộ.
3. Loại bỏ hoàn toàn các log debug tạm thời đã thêm trước đó.
4. Chạy kiểm tra tĩnh TypeScript bằng `bunx tsc --noEmit` để đảm bảo dự án sạch lỗi.

# VII. Verification Plan (Kế hoạch kiểm chứng)
* **Kiểm tra tĩnh**: Chạy `bunx tsc --noEmit` để đảm bảo không phát sinh bất kỳ lỗi biên dịch nào.
* **Xác nhận thực tế**: Truy cập `/admin/home-components/create/product-list` và `/admin/home-components/create/stats` để xác nhận nút Toggle All hiển thị ổn định, xoay icon chính xác và thực hiện đóng/mở mượt mà.

# VIII. Todo
- [ ] Cập nhật hàm `subscribe` trong `HomeComponentFooterActions.tsx` sử dụng microtask.
- [ ] Dọn dẹp log debug trong `HomeComponentFooterActions.tsx`.
- [ ] Chạy check TypeScript tĩnh `bunx tsc --noEmit`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
* Nút Toggle All xuất hiện ổn định ở bên trái nút Save/Tạo chính trên Sticky Footer tại trang Create Product List và Create Stats.
* Icon mũi tên của nút Toggle All xoay chính xác tương ứng với trạng thái thu gọn/mở rộng.
* Nhấp vào nút Toggle All đóng/mở đồng bộ tất cả các section của form mượt mà.
* Không có lỗi TypeScript nào trong toàn bộ dự án.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
* **Rủi ro**: Rất thấp do thay đổi chỉ nằm trong cơ chế sync store nội bộ của component chân trang và chạy trong microtask an toàn.
* **Hoàn tác**: Khôi phục lại hàm `subscribe` nguyên bản của `HomeComponentFooterActions.tsx` bằng `git checkout`.

# XI. Out of Scope (Ngoài phạm vi)
* Không thay đổi schema hoặc logic nghiệp vụ lưu trữ của các component.
* Không can thiệp vào các component hiển thị preview hay API Convex.
