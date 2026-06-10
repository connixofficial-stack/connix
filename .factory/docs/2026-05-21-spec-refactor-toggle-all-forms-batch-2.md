# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta muốn thêm một nút bấm thông minh "Mở rộng/Thu gọn tất cả" (Toggle All) cho 5 biểu mẫu (Form) cấu hình giao diện. Thay vì người dùng phải bấm đóng/mở từng mục lớn (SubSection) bằng tay rất mất công, chúng ta dùng một chiếc "công tắc tổng" nằm dưới chân trang (Sticky Footer). Chiếc công tắc này sẽ điều khiển tất cả các mục lớn cùng một lúc nhờ vào một bộ quản lý trạng thái dùng chung (`useFormSectionsState`) và nút bấm dùng chung (`FormSectionsToggleAllButton`).

## 2. Elaboration & Self-Explanation
Hiện tại, các biểu mẫu `GalleryForm`, `MarqueeForm`, `ProcessForm`, `ProductListForm` và `ServiceListForm` có các phần cài đặt chính nằm trong các mục có thể đóng/mở (`SubSection`). Các mục này đang dùng thuộc tính đóng/mở mặc định tĩnh (`defaultExpanded` hoặc `defaultOpen`), dẫn đến việc chúng không được đồng bộ hóa khi người dùng muốn thu gọn hoặc mở rộng toàn bộ màn hình làm việc để có cái nhìn tổng quan nhanh.

Giải pháp là:
- Sử dụng hook `useFormSectionsState` từ thư viện dùng chung `_shared/hooks/useFormSectionsState`. Hook này nhận vào danh sách các khóa (`activeKeys`) đại diện cho các phần có thể đóng/mở trên màn hình, quản lý trạng thái của chúng, và cung cấp một hàm đảo ngược trạng thái đồng loạt (`handleToggleAll`) cùng biến `hasClosedSection` báo hiệu có phần nào đang đóng hay không.
- Thêm nút `FormSectionsToggleAllButton` vào JSX của biểu mẫu. Component này sử dụng React Portal để đưa nút điều khiển lên thanh Sticky Footer chung ở phía dưới cùng màn hình quản trị.
- Thay thế các thuộc tính điều khiển đóng mở tĩnh (`defaultOpen` hoặc `defaultExpanded`) của component `SubSection` trong các biểu mẫu bằng cách ràng buộc trực tiếp vào trạng thái `open` và hàm cập nhật `onOpenChange` từ hook.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn có 5 phòng trưng bày tranh khác nhau (đại diện cho 5 Forms). Mỗi phòng trưng bày có các gian triển lãm (SubSection) đang treo rèm che tranh.
- Trước đây: Nếu muốn xem tranh ở tất cả các gian hoặc muốn đóng tất cả các gian lại để quét dọn, bạn phải đi đến từng gian triển lãm và kéo rèm lên/xuống bằng tay.
- Sau khi refactor: Bạn lắp đặt một hệ thống rèm tự động có kết nối với một nút bấm tổng đặt ở cửa ra vào. Khi nhấn nút bấm tổng này, tất cả các rèm ở mọi gian triển lãm sẽ tự động cuốn lên hoặc hạ xuống cùng một lúc. Bạn vẫn có thể tự tay kéo rèm ở một gian cụ thể nếu muốn, và nút bấm tổng sẽ tự nhận biết trạng thái của toàn bộ rèm để hoạt động chính xác ở lần nhấn tiếp theo.

# II. Audit Summary (Tóm tắt kiểm tra)
Chúng ta đã kiểm tra 5 tệp Form và cấu trúc thư mục của chúng:
1. `GalleryForm.tsx` nằm ở `app/admin/home-components/gallery/_components/GalleryForm.tsx`
   - Đang dùng `<Card>` thay vì `<SubSection>`. Yêu cầu chuyển Card "Thư viện ảnh / Logo đối tác / Chứng nhận" thành `SubSection` với key là `gallery`.
   - Keys cần đăng ký: `['gallery']`.
2. `MarqueeForm.tsx` nằm ở `app/admin/home-components/marquee/_components/MarqueeForm.tsx`
   - Đang sử dụng `SubSection` nhưng dưới dạng `defaultOpen={defaultExpanded}` tĩnh.
   - Keys cần đăng ký: `['marquee']`.
3. `ProcessForm.tsx` nằm ở `app/admin/home-components/process/_components/ProcessForm.tsx`
   - Đang sử dụng `SubSection` nhưng dưới dạng `defaultOpen={defaultExpanded}` tĩnh.
   - Keys cần đăng ký: `['steps']`.
4. `ProductListForm.tsx` nằm ở `app/admin/home-components/product-list/_components/ProductListForm.tsx`
   - Đang sử dụng `SubSection` dưới dạng `defaultOpen={defaultExpanded}` tĩnh.
   - Keys cần đăng ký: `['products']`.
5. `ServiceListForm.tsx` nằm ở `app/admin/home-components/service-list/_components/ServiceListForm.tsx`
   - Đang sử dụng `SubSection` dưới dạng `defaultOpen={defaultExpanded ?? true}` tĩnh.
   - Keys cần đăng ký: `['services']`.

Tất cả các tệp đều có đường dẫn tương đối đến thư mục `_shared` là giống nhau: `../../_shared/...` vì đều nằm sâu 2 cấp dưới `app/admin/home-components/[component-name]/_components/`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng**: Người dùng không thể thu gọn hoặc mở rộng nhanh tất cả các phần nội dung trong 5 Form trên, gây bất tiện khi thao tác trên các trang cấu hình dài.
- **Nguyên nhân gốc**: Các Form này được phát triển độc lập và chưa được tích hợp hệ thống điều khiển trạng thái đồng loạt Toggle All dùng chung của phân hệ `home-components`.
- **Giải pháp đề xuất**: Tích hợp hook `useFormSectionsState` và nút bấm `FormSectionsToggleAllButton` đã được thiết kế sẵn.
- **Độ tin cậy giải pháp (Confidence)**: High. Do đây là mẫu thiết kế chuẩn (Standard Pattern) đã chạy ổn định trên các Form khác như `HeroForm`, `FooterForm`, `AboutForm`.

# IV. Proposal (Đề xuất)
Thực hiện refactor chuẩn xác cho từng Form:
1. **GalleryForm.tsx**:
   - Thay `<Card className="mb-6">` bằng `<SubSection>`.
   - Chuyển `CardTitle` và `AiTrustBadgesImport` thành prop `title` và `actions` của `SubSection`.
   - Tích hợp hook `useFormSectionsState(['gallery'], defaultExpanded)`.
   - Đồng bộ trạng thái đóng mở thông qua prop `open` và `onOpenChange` của `SubSection`.
   - Đặt `<FormSectionsToggleAllButton>` ở đầu JSX trả về.
2. **MarqueeForm.tsx**, **ProcessForm.tsx**, **ProductListForm.tsx**, **ServiceListForm.tsx**:
   - Import `useFormSectionsState` và `FormSectionsToggleAllButton`.
   - Khởi tạo hook với key tương ứng (`'marquee'`, `'steps'`, `'products'`, `'services'`).
   - Đặt `<FormSectionsToggleAllButton>` ở đầu JSX.
   - Thay thế `defaultOpen` tĩnh của `SubSection` thành prop `open` và `onOpenChange` đồng bộ với hook.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [GalleryForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/gallery/_components/GalleryForm.tsx)
  - Thay đổi cấu trúc từ Card sang SubSection, bổ sung hook quản lý và nút bấm Toggle All với key `'gallery'`.
- **Sửa**: [MarqueeForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/marquee/_components/MarqueeForm.tsx)
  - Tích hợp hook quản lý và nút bấm Toggle All với key `'marquee'`, chuyển `SubSection` từ tĩnh sang động.
- **Sửa**: [ProcessForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/process/_components/ProcessForm.tsx)
  - Tích hợp hook quản lý và nút bấm Toggle All với key `'steps'`, chuyển `SubSection` từ tĩnh sang động.
- **Sửa**: [ProductListForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/product-list/_components/ProductListForm.tsx)
  - Tích hợp hook quản lý và nút bấm Toggle All với key `'products'`, chuyển `SubSection` từ tĩnh sang động.
- **Sửa**: [ServiceListForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/service-list/_components/ServiceListForm.tsx)
  - Tích hợp hook quản lý và nút bấm Toggle All với key `'services'`, chuyển `SubSection` từ tĩnh sang động.

# VI. Execution Preview (Xem trước thực thi)
1. **Bước 1**: Đọc kỹ cấu trúc code của `GalleryForm.tsx` và thực hiện thay thế Card thành SubSection cùng tích hợp Toggle All.
2. **Bước 2**: Thực hiện tích hợp Toggle All cho `MarqueeForm.tsx`.
3. **Bước 3**: Thực hiện tích hợp Toggle All cho `ProcessForm.tsx`.
4. **Bước 4**: Thực hiện tích hợp Toggle All cho `ProductListForm.tsx`.
5. **Bước 5**: Thực hiện tích hợp Toggle All cho `ServiceListForm.tsx`.
6. **Bước 6**: Chạy kiểm tra kiểu TypeScript để đảm bảo tính an toàn kiểu dữ liệu.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm tra biên dịch tĩnh (Static Compilation Check)**:
  - Chạy lệnh `bunx tsc --noEmit` để xác nhận không phát sinh lỗi TypeScript trong các tệp vừa sửa đổi.
- **Kiểm nghiệm hoạt động thực tế (Runtime Verification)**:
  - Sẽ do đội ngũ Tester/Người dùng vận hành trực quan trên UI để đảm bảo nút đóng/mở chân trang hoạt động chính xác.

# VIII. Todo
- [ ] Sửa đổi [GalleryForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/gallery/_components/GalleryForm.tsx)
- [ ] Sửa đổi [MarqueeForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/marquee/_components/MarqueeForm.tsx)
- [ ] Sửa đổi [ProcessForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/process/_components/ProcessForm.tsx)
- [ ] Sửa đổi [ProductListForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/product-list/_components/ProductListForm.tsx)
- [ ] Sửa đổi [ServiceListForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/service-list/_components/ServiceListForm.tsx)
- [ ] Chạy kiểm tra kiểu TypeScript với `bunx tsc --noEmit`
- [ ] Commit các thay đổi và gửi báo cáo kết quả cho parent agent.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Cả 5 biểu mẫu đều tích hợp thành công hook `useFormSectionsState` và component nút bấm `FormSectionsToggleAllButton`.
- Tách biệt và import đúng đường dẫn tương đối `../../_shared/...`.
- Không làm thay đổi hay mất mát logic nghiệp vụ cũ của các biểu mẫu.
- `bunx tsc --noEmit` báo cáo không có lỗi biên dịch.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Lỗi import nhầm hoặc lỗi cú pháp khi sửa đổi hàng loạt.
- **Hoàn tác**: Sử dụng Git `git checkout` để khôi phục trạng thái ban đầu của bất kỳ tệp nào bị lỗi trong quá trình refactor.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh sửa hay thêm bớt các tính năng tải ảnh, kiểm thực dữ liệu, hay gọi API backend Convex.
- Không thay đổi thiết kế chung của thanh Sticky Footer hay cách hoạt động của Portal.
