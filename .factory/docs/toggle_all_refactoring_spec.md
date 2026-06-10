# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta đang cải tiến giao diện quản trị bằng cách thêm một nút "Mở rộng tất cả / Thu gọn tất cả" (Toggle All) ở đầu mỗi Form cấu hình. Thay vì người dùng phải bấm click tay mở/đóng từng khối thông tin (SubSection) riêng lẻ, nay chỉ cần 1 click là có thể đóng hoặc mở toàn bộ các khối đó cùng một lúc. Chúng ta sử dụng một state hook dùng chung tên là `useFormSectionsState` để quản lý trạng thái mở/đóng của các khối này và một component nút `FormSectionsToggleAllButton` để hiển thị trên UI.

## 2. Elaboration & Self-Explanation
Hiện tại, trong các form cấu hình cấu phần (Component Form) như `ProductGridForm`, `SpeedDialForm`, `TrustBadgesForm`, `VideoForm`, và `VoucherPromotionsForm`, các khối `SubSection` (như Cài đặt hiển thị, Nguồn dữ liệu, Danh sách, v.v.) đang mở/đóng độc lập thông qua thuộc tính `defaultOpen={defaultExpanded}`. Việc này làm giảm trải nghiệm người dùng khi họ muốn duyệt nhanh tất cả các cấu hình hoặc muốn thu gọn tất cả để gọn gàng.
Giải pháp là sử dụng Hook `useFormSectionsState` nhận vào một danh sách các key định danh cho các `SubSection` và trạng thái mặc định (`defaultExpanded`). Hook này trả về:
- `openSections`: một object chứa trạng thái `true`/`false` của từng key.
- `toggleSection`: hàm để thay đổi trạng thái của một key cụ thể khi người dùng click vào header của `SubSection`.
- `hasClosedSection`: boolean cho biết có section nào đang đóng hay không (dùng để chuyển text nút Toggle All giữa "Mở rộng tất cả" và "Thu gọn tất cả").
- `handleToggleAll`: hàm xử lý đóng/mở tất cả đồng loạt.

Chúng ta sẽ khai báo danh sách key tương ứng với từng Form, khởi tạo hook, chèn nút Toggle All ngay phía trên `SubSection` đầu tiên, và truyền prop `open` cùng `onOpenChange` cho từng `SubSection`.

## 3. Concrete Examples & Analogies
Tưởng tượng bạn có một chiếc tủ có nhiều ngăn kéo. Hiện tại, bạn phải kéo từng ngăn ra để xem và đẩy từng ngăn vào khi làm xong.
Tính năng Toggle All giống như một đòn bẩy thông minh: gạt một cái, toàn bộ các ngăn tủ cùng mở ra; gạt ngược lại, toàn bộ các ngăn tủ cùng đóng vào.
Về mặt code:
- Trước đây:
  ```tsx
  <SubSection title="Cấu hình A" defaultOpen={defaultExpanded}>...</SubSection>
  <SubSection title="Cấu hình B" defaultOpen={defaultExpanded}>...</SubSection>
  ```
- Sau khi tích hợp:
  ```tsx
  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['a', 'b'], defaultExpanded);

  // Trong JSX:
  <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />
  <SubSection title="Cấu hình A" open={openSections.a} onOpenChange={(open) => toggleSection('a', open)}>...</SubSection>
  <SubSection title="Cấu hình B" open={openSections.b} onOpenChange={(open) => toggleSection('b', open)}>...</SubSection>
  ```

# II. Audit Summary (Tóm tắt kiểm tra)
Chúng ta sẽ refactor 5 file:
1. `ProductGridForm.tsx` (Keys: `['settings', 'columns', 'tabs', 'source']`)
2. `SpeedDialForm.tsx` (Keys: `['settings', 'actions']`)
3. `TrustBadgesForm.tsx` (Keys: `['settings', 'stackContent', 'badges']`)
4. `VideoForm.tsx` (Keys: `['video', 'cta']`)
5. `VoucherPromotionsForm.tsx` (Keys: `['settings', 'source', 'demo']`)

Cả 5 file đều sử dụng `CollapsibleSubSection` làm `SubSection` và có cấu trúc tương đối tương đồng, nằm trong các thư mục con của `app/admin/home-components`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Vấn đề**: Các form chưa đồng bộ hóa trạng thái đóng mở của các SubSection và thiếu cơ chế điều khiển tập trung (Toggle All).
- **Giải pháp**: Tích hợp hook quản lý trạng thái tập trung và nút điều khiển chung đã được thiết kế sẵn trong thư mục `_shared`.

# IV. Proposal (Đề xuất)
Refactor từng file theo cấu trúc chuẩn:
1. Import `useFormSectionsState` và `FormSectionsToggleAllButton` từ relative path thích hợp (đều là `../../_shared/...`).
2. Khai báo hook bên trong Component chính. Đảm bảo `defaultExpanded` có giá trị mặc định là `true` trong phần destructuring props.
3. Chèn `<FormSectionsToggleAllButton ... />` ở đầu phần JSX.
4. Cập nhật các prop `open` và `onOpenChange` cho từng `<SubSection>`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa: app/admin/home-components/product-grid/_components/ProductGridForm.tsx` - Tích hợp Toggle All cho 4 sections: settings, columns, tabs, source.
- `Sửa: app/admin/home-components/speed-dial/_components/SpeedDialForm.tsx` - Tích hợp Toggle All cho 2 sections: settings, actions.
- `Sửa: app/admin/home-components/trust-badges/_components/TrustBadgesForm.tsx` - Tích hợp Toggle All cho 3 sections: settings, stackContent, badges.
- `Sửa: app/admin/home-components/video/_components/VideoForm.tsx` - Tích hợp Toggle All cho 2 sections: video, cta.
- `Sửa: app/admin/home-components/voucher-promotions/_components/VoucherPromotionsForm.tsx` - Tích hợp Toggle All cho 3 sections: settings, source, demo.

# VI. Execution Preview (Xem trước thực thi)
1. Thực hiện refactor `ProductGridForm.tsx` -> xác thực tĩnh.
2. Thực hiện refactor `SpeedDialForm.tsx` -> xác thực tĩnh.
3. Thực hiện refactor `TrustBadgesForm.tsx` -> xác thực tĩnh.
4. Thực hiện refactor `VideoForm.tsx` -> xác thực tĩnh.
5. Thực hiện refactor `VoucherPromotionsForm.tsx` -> xác thực tĩnh.
6. Chạy kiểm tra TypeScript (`bunx tsc --noEmit`) để chắc chắn toàn bộ thay đổi không làm vỡ build.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra syntax bằng TypeScript Compiler: `bunx tsc --noEmit`.
- Đảm bảo tất cả các file import đúng đường dẫn tương đối và không bị lỗi cú pháp React/JSX.

# VIII. Todo
- [ ] Refactor `ProductGridForm.tsx`
- [ ] Refactor `SpeedDialForm.tsx`
- [ ] Refactor `TrustBadgesForm.tsx`
- [ ] Refactor `VideoForm.tsx`
- [ ] Refactor `VoucherPromotionsForm.tsx`
- [ ] Chạy `bunx tsc --noEmit` để xác nhận thành công.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Tất cả 5 file Form biên dịch thành công mà không có bất kỳ lỗi TypeScript nào liên quan đến các thay đổi này.
- Trạng thái `open` và `onOpenChange` của các `SubSection` được kết nối chính xác tới `openSections` và `toggleSection`.
- Nút `FormSectionsToggleAllButton` được chèn ở vị trí thích hợp (đầu form hoặc ngay trước SubSection đầu tiên).

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro cực thấp vì đây là thay đổi thuần túy về giao diện (UI) và quản lý state cục bộ.
- Dễ dàng rollback bằng cách sử dụng `git checkout`.

# XI. Out of Scope (Ngoài phạm vi)
- Không can tiệp vào các logic nghiệp vụ khác của các Form (như submit dữ liệu, kéo thả, upload ảnh, v.v.).
