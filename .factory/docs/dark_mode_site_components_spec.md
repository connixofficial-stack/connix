# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta cần làm cho 8 thành phần giao diện (components) hiển thị đẹp mắt ở cả chế độ sáng và chế độ tối. Để làm điều này, mỗi component sẽ nhận một biến chỉ định chế độ tối `isDark`. Nếu chế độ tối đang bật (`isDark` là `true`), các màu sắc thiết kế gốc (tokens) sẽ được tự động đổi sang màu tối dịu mắt hơn nhờ công cụ chuyển đổi màu `adaptTokensForDarkMode`.

## 2. Elaboration & Self-Explanation
Hiện tại, trang web đang bổ sung tính năng Dark Mode. Tuy nhiên, các component trong thư mục `components/site/` vẫn hiển thị theo màu mặc định (thường là tông sáng) vì chưa nhận diện được trạng thái `isDark` của hệ thống và chưa áp dụng bộ chuyển đổi màu sắc.
Để giải quyết, chúng ta sẽ:
- Cập nhật định nghĩa dữ liệu đầu vào (Props interface) của 8 component để chấp nhận thuộc tính `isDark?: boolean`.
- Nhận diện biến `isDark` trong code của component.
- Import hàm `adaptTokensForDarkMode` từ module chuyển đổi màu có sẵn.
- Tìm các nơi tính toán bảng màu (ví dụ: `getProductsListColors`, `getTeamColorTokens`, v.v.), bọc các kết quả này qua hàm `adaptTokensForDarkMode(tokens, isDark ?? false)`. Việc này giúp đảo ngược độ sáng của màu nền, chữ, đường viền nhưng vẫn giữ lại các tông màu thương hiệu nổi bật.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn đang đeo một chiếc kính râm thông minh. Khi đi từ ngoài nắng (Light Mode) vào trong nhà tối (Dark Mode), chiếc kính râm sẽ tự động điều chỉnh độ sáng và độ tương phản của cảnh vật xung quanh để mắt bạn dễ chịu nhất, nhưng vẫn giữ nguyên màu sắc gốc của biển hiệu quảng cáo (Brand color). Bộ lọc màu `adaptTokensForDarkMode` hoạt động y hệt như chiếc kính râm thông minh đó đối với giao diện web.

# II. Audit Summary (Tóm tắt kiểm tra)
Chúng ta đã kiểm tra cấu trúc của 8 file sau:
1. `components/site/PopupSection.tsx`: Hiện tại chưa nhận `isDark` và truyền config cho component con `PopupSectionShared`. Component con này sẽ nhận màu thương hiệu và xử lý sau.
2. `components/site/ProductGridSection.tsx`: Sử dụng `getProductsListColors` để tạo `tokens`. Cần bọc `tokens` này.
3. `components/site/ProductListSection.tsx`: Sử dụng `getProductsListColors` để tạo `tokens`. Cần bọc `tokens` này.
4. `components/site/ServiceListSection.tsx`: Sử dụng `getServiceListColorTokens` để tạo `tokens`. Cần bọc `tokens` này.
5. `components/site/SpeedDialSection.tsx`: Chưa nhận `isDark`. Chưa tính màu trực tiếp bằng hàm `get...Colors` ở đây mà truyền cho `SpeedDialSectionShared`. Cần thêm `isDark` và truyền xuống.
6. `components/site/TeamSection.tsx`: Sử dụng `getTeamColorTokens` để tạo `tokens`. Cần bọc `tokens` này.
7. `components/site/VideoSection.tsx`: Sử dụng `getVideoColorTokens` để tạo `tokens`. Cần bọc `tokens` này.
8. `components/site/VoucherPromotionsSection.tsx`: Sử dụng `getVoucherPromotionsColorTokens` để tạo `tokens`. Cần bọc `tokens` này.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause (Nguyên nhân gốc)**: Các component ở trang web (site) được dựng từ các config admin nhưng chưa được truyền cờ `isDark` từ Context/Page cha và chưa chuyển đổi token màu động qua bộ adapter. Do đó, khi kích hoạt giao diện tối, các component này vẫn render màu sáng mặc định, gây chói mắt hoặc mất tương phản.
- **Counter-Hypothesis (Giả thuyết đối chứng)**: Nếu chỉ thay đổi CSS thủ công sẽ rất phức tạp vì các mã màu được tính toán động từ JS/database (ví dụ như mã màu Hex của brandColor). Việc sử dụng hàm `adaptTokensForDarkMode` là giải pháp tối ưu và an toàn nhất vì nó phân tích mã màu OKLCH để đảo ngược màu trung hòa và giữ màu thương hiệu.

# IV. Proposal (Đề xuất)
Thực hiện sửa đổi đồng bộ trên 8 component:
1. Định nghĩa thêm thuộc tính optional `isDark?: boolean` trong interface Props.
2. Lấy `isDark` từ việc destructure Props.
3. Import `adaptTokensForDarkMode` từ `@/components/site/home/utils/darkModeColorAdapter`.
4. Tìm memo/biến chứa tokens màu, bọc chúng lại:
   - `adaptTokensForDarkMode(rawTokens, isDark ?? false)`
5. Nếu component gọi một component con dạng `...Shared` (như `PopupSectionShared`, `SpeedDialSectionShared`), ta cũng sẽ truyền `isDark` vào các component con đó để đảm bảo chúng có đủ context hoạt động (nếu component con hỗ trợ).

# V. Files Impacted (Tệp bị ảnh hưởng)
- `components/site/PopupSection.tsx`:
  - *Sửa*: Thêm `isDark?: boolean` vào `PopupSectionProps`. Truyền `isDark` xuống `PopupSectionShared`.
- `components/site/ProductGridSection.tsx`:
  - *Sửa*: Thêm `isDark?: boolean` vào `ProductGridSectionProps`. Bọc `getProductsListColors` qua `adaptTokensForDarkMode`.
- `components/site/ProductListSection.tsx`:
  - *Sửa*: Thêm `isDark?: boolean` vào `ProductListSectionProps`. Bọc `getProductsListColors` qua `adaptTokensForDarkMode`.
- `components/site/ServiceListSection.tsx`:
  - *Sửa*: Thêm `isDark?: boolean` vào `ServiceListSectionProps`. Bọc `getServiceListColorTokens` qua `adaptTokensForDarkMode`.
- `components/site/SpeedDialSection.tsx`:
  - *Sửa*: Thêm `isDark?: boolean` vào `SpeedDialSectionProps`. Truyền `isDark` xuống `SpeedDialSectionShared`.
- `components/site/TeamSection.tsx`:
  - *Sửa*: Thêm `isDark?: boolean` vào `TeamSectionProps`. Bọc `getTeamColorTokens` qua `adaptTokensForDarkMode`.
- `components/site/VideoSection.tsx`:
  - *Sửa*: Thêm `isDark?: boolean` vào `VideoSectionProps`. Bọc `getVideoColorTokens` qua `adaptTokensForDarkMode`.
- `components/site/VoucherPromotionsSection.tsx`:
  - *Sửa*: Thêm `isDark?: boolean` vào `VoucherPromotionsSectionProps`. Bọc `getVoucherPromotionsColorTokens` qua `adaptTokensForDarkMode`.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và phân tích kỹ từng tệp trong số 8 tệp.
2. Dùng công cụ sửa file `replace_file_content` để thực hiện sửa đổi trên từng tệp một.
3. Kiểm tra tính chính xác của các chỉnh sửa cú pháp.
4. Chạy build/kiểm tra lỗi tĩnh của TypeScript (nếu cần thiết qua terminal nhưng tuân thủ quy định cấm chạy unit test/lint tự động, trừ phi chạy tsc để check compile).

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Xác nhận các file được sửa đổi thành công và không chứa lỗi cú pháp TypeScript.
- Chạy lệnh `bunx tsc --noEmit` để xác minh dự án biên dịch thành công không bị lỗi type.

# VIII. Todo
- [ ] Cập nhật `components/site/PopupSection.tsx`
- [ ] Cập nhật `components/site/ProductGridSection.tsx`
- [ ] Cập nhật `components/site/ProductListSection.tsx`
- [ ] Cập nhật `components/site/ServiceListSection.tsx`
- [ ] Cập nhật `components/site/SpeedDialSection.tsx`
- [ ] Cập nhật `components/site/TeamSection.tsx`
- [ ] Cập nhật `components/site/VideoSection.tsx`
- [ ] Cập nhật `components/site/VoucherPromotionsSection.tsx`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Cả 8 component đều biên dịch thành công mà không có bất kỳ lỗi cú pháp hay kiểu dữ liệu (type check) nào.
- Thuộc tính `isDark` được khai báo chính xác và chuyển tiếp qua bộ lọc màu hoặc component con một cách an toàn.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Lỗi cú pháp import hoặc import sai đường dẫn tương đối.
- **Hoàn tác**: Sử dụng Git để khôi phục trạng thái trước khi chỉnh sửa (`git checkout -- <file>`).

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa giao diện của trang admin hay thay đổi logic nghiệp vụ của các component ngoài việc hỗ trợ màu tối (Dark Mode).

# XII. Open Questions (Câu hỏi mở)
- (Không có)
