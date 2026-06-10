# Thiết Kế Lại 3 Layout Trang Chi Tiết Tài Nguyên & Bổ Sung Tùy Chọn Gallery Grid/Scroll

# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề:** Trang chi tiết tài nguyên hiện tại chỉ có một kiểu hiển thị ảnh phụ dạng cuộn ngang (scroll) khá thô sơ. Ngoài ra, giao diện xem trước (Preview) ở Admin và trang thực tế (Site thực) không giống nhau; thay đổi giữa các bố cục (Classic, Modern, Minimal) chưa tạo ra sự khác biệt rõ rệt và tinh tế.
- **Giải pháp:**
  1. Thêm cấu hình `galleryMode` gồm hai chế độ: `grid` (Lưới - làm mặc định) và `scroll` (Cuộn ngang).
  2. Bổ sung tùy chọn cấu hình này trong trang quản trị Admin `system/experiences/resources-detail`.
  3. Thiết kế lại 3 layout (`classic`, `modern`, `minimal`) theo tư duy MacBook app và iOS: tối giản, bo góc mượt mà, phân cấp thông tin rõ ràng, hiệu ứng đổ bóng mịn và khoảng thở rộng rãi.
  4. Đồng bộ hóa cấu trúc hiển thị 3 layout và gallery của Preview trong Admin giống hệt với Site thực tế.

## 2. Elaboration & Self-Explanation
Hiện tại, trang quản trị cấu hình trải nghiệm cho phép đổi giữa 3 layout (Classic, Modern, Minimal) nhưng trang public chỉ mới nhận diện sơ sài (`isModern` để đổi màu hero banner). Điều này tạo ra một "vết nợ thiết kế" lớn vì layout `minimal` (lẽ ra phải tinh giản 1 cột) lại hiển thị 2 cột giống hệt `classic`. Hơn nữa, ảnh phụ chỉ có một kiểu cuộn ngang thô sơ, không tối ưu cho các bộ thư viện ảnh lớn (như Autocad 2D gồm nhiều bản vẽ chi tiết cần nhìn tổng quan dạng Grid).

Chúng ta sẽ giải quyết triệt để bằng cách:
- Cấu trúc lại mã nguồn của cả trang site thực `ResourceDetailPage.tsx` và trang preview `ResourcePreview.tsx` thành 3 khối bố cục riêng biệt ứng với `classic`, `modern`, `minimal`.
- Xây dựng một khối logic hiển thị Gallery đồng bộ hỗ trợ cả hai chế độ:
  - **Grid (Lưới):** Hiển thị ảnh chính lớn ở trên, bên dưới là một lưới ảnh phụ (mặc định 4 cột). Bấm vào ảnh nào thì ảnh đó làm ảnh chính, ảnh phụ đang chọn có viền màu thương hiệu kèm hiệu ứng glow nhẹ.
  - **Scroll (Cuộn ngang):** Giữ kiểu cuộn ngang cũ nhưng bo góc tinh tế theo cấu hình và thêm hiệu ứng transition mượt mà.
- Thiết kế lại các layout theo phong cách iOS/macOS:
  - **Classic:** Bố cục 2 cột truyền thống, thẻ tải tài nguyên (CtaCard) dạng card nổi màu trắng, shadow nhẹ mờ, bo góc lớn (`rounded-2xl`).
  - **Modern:** Banner gradient mượt, các card có hiệu ứng shadow sâu hơn, phủ màu thương hiệu nhẹ, nút tải nổi bật có glow nhẹ.
  - **Minimal:** Bố cục 1 cột căn giữa (max-width 850px) giống trang tài liệu của Apple, thẻ tải thu gọn thành một thanh ngang/card inline thanh lịch nằm ngay dưới mô tả ngắn để tiết kiệm diện tích và tăng tính tiện dụng.

## 3. Concrete Examples & Analogies
- **Ví dụ thực tế:** Hãy tưởng tượng bạn đang xem thư viện bản vẽ "AutoCAD 2D" như hình ảnh người dùng cung cấp. Việc cuộn ngang 10-12 ảnh phụ rất mệt mỏi và không thể so sánh được các bản vẽ với nhau. Khi đổi sang dạng Grid (Lưới), 12 ảnh phụ xếp gọn gàng thành 3 dòng x 4 cột ngay dưới ảnh chính. Người dùng chỉ cần liếc mắt là thấy toàn bộ thư viện và click nhanh vào hình cần xem.
- **Analogy:** Giống như ứng dụng Photos trên macOS hoặc iOS: luôn có một ảnh lớn hiển thị ở trên (hoặc trung tâm) và một lưới các ảnh thu nhỏ (thumbnails) ngay bên dưới để duyệt nhanh, thay vì bắt người dùng cuộn một hàng ngang vô tận.

---

# II. Audit Summary (Tóm tắt kiểm tra)

Sau khi kiểm tra các file cấu hình và giao diện liên quan đến trải nghiệm chi tiết tài nguyên, chúng tôi ghi nhận:
1. `lib/experiences/useSiteConfig.ts`:
   - Chứa định nghĩa type `ResourcesDetailConfig` và hook `useResourcesDetailConfig`. Hiện tại thiếu trường `galleryMode`.
2. `app/system/experiences/resources-detail/page.tsx`:
   - Trang quản lý cấu hình trong admin. Hiện tại chỉ có toggles cho: `showGallery`, `showRelated`, `showStickyCta`, `showResourceFilters`, và `cornerRadius`. Thiếu bộ chọn chế độ ảnh phụ.
3. `components/experiences/previews/ResourcePreview.tsx`:
   - Component `ResourceDetailPreview` dùng để hiển thị giao diện xem trước. Hiện tại, phần gallery chỉ là mock cứng 3 ô xám dạng grid (`grid-cols-3`), không đồng bộ với ảnh thật và không đổi theo cấu hình. Cấu trúc layout trong preview cũng khác biệt lớn so với site thực.
4. `app/(site)/_components/resources/ResourceDetailPage.tsx`:
   - Trang chi tiết tài nguyên thực tế cho người dùng. Hiện tại chỉ phân biệt `isModern` để đổi màu banner. Layout `minimal` hoàn toàn giống `classic` và gallery chỉ hiển thị duy nhất dạng cuộn ngang (`overflow-x-auto`).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân gốc:**
  - Thiết kế ban đầu của trang chi tiết tài nguyên chưa hoàn thiện các biến thể layout (classic/modern/minimal) ở site thực, dẫn đến việc thiếu đồng bộ với các tùy chọn layout ở trang admin.
  - Gallery ảnh phụ chỉ được cài đặt mặc định một kiểu cuộn ngang và chưa hỗ trợ cấu hình động. Giao diện preview trong admin chỉ là mô hình thô sơ (mock) chứ chưa được viết để phản ánh giao diện thực tế của từng layout.
- **Giả thuyết đối chứng:**
  - Nếu chỉ sửa giao diện site thực mà không sửa preview ở admin, người dùng quản trị khi thay đổi cấu hình ảnh phụ (Grid/Scroll) sẽ không thấy bất kỳ thay đổi nào ở màn hình preview, tạo cảm giác tính năng bị lỗi. Do đó, việc đồng bộ code hiển thị giữa Preview và Site thực là bắt buộc.

---

# IV. Proposal (Đề xuất)

1. **Cập nhật TypeScript Type & Hook:**
   - Thêm `galleryMode?: 'scroll' | 'grid'` vào `ResourcesDetailConfig` trong [useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/experiences/useSiteConfig.ts). Mặc định trả về `'grid'`.
2. **Cập nhật Giao diện Quản trị (Admin Page):**
   - Thêm select box hoặc toggle để cấu hình "Chế độ ảnh phụ" (`galleryMode`) trong [resources-detail/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-detail/page.tsx). Chỉ hiển thị cấu hình này khi `showGallery` được bật.
3. **Thiết kế lại 3 Layout cho Site thực & Preview (Đồng nhất hóa):**
   - Tạo các component con hoặc các hàm render chung cho Gallery và CtaCard để dùng cho cả Preview và Site thực nhằm đảm bảo tính nhất quán 100%.
   - **Classic Layout:** Giao diện 2 cột cổ điển. Thẻ CtaCard nổi bật với shadow nhẹ, viền mảnh, bo góc mềm mại. Gallery nằm bên trái, CtaCard bên phải.
   - **Modern Layout:** Hero banner sử dụng màu gradient mượt. Thẻ CtaCard có glow nhẹ, viền màu thương hiệu mờ. Các ảnh phụ có hiệu ứng hover zoom mượt mà.
   - **Minimal Layout:** Giao diện 1 cột căn giữa (max-width 850px). Banner Hero hòa nhập vào nền trang trắng. CtaCard và giá được chuyển đổi thành dạng inline (chiều rộng đầy đủ nhưng mỏng gọn) nằm ngay dưới mô tả ngắn, giúp người dùng tập trung hoàn toàn vào nội dung tài nguyên bên dưới.
4. **Cải tiến Gallery Component:**
   - Hỗ trợ cả 2 chế độ:
     - `grid`: lưới ảnh phụ ở dưới (ví dụ `grid-cols-4` trên desktop, `grid-cols-3` trên mobile).
     - `scroll`: thanh cuộn ngang mượt mà.
   - Thêm hiệu ứng transition, border màu thương hiệu đậm và bóng đổ cho ảnh phụ đang được chọn.
   - Đảm bảo bo góc của ảnh chính và ảnh phụ tuân thủ đúng cấu hình `cornerRadius` (`none` | `sm` | `lg`).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

- **Sửa:** [useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/experiences/useSiteConfig.ts)
  - Mô tả: Định nghĩa thêm trường `galleryMode` trong type `ResourcesDetailConfig` và trả về giá trị mặc định là `'grid'` trong hook `useResourcesDetailConfig`.
- **Sửa:** [resources-detail/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-detail/page.tsx)
  - Sửa: Bổ sung cấu hình `galleryMode` vào kiểu `ResourcesDetailExperienceConfig` và `DEFAULT_CONFIG`. Thêm điều khiển SelectRow cấu hình chế độ ảnh phụ trong cột "Khối hiển thị" và truyền prop xuống `ResourceDetailPreview`.
- **Sửa:** [ResourcePreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/components/experiences/previews/ResourcePreview.tsx)
  - Sửa: Sửa đổi component `ResourceDetailPreview` để nhận thêm `galleryMode`. Thiết kế lại giao diện của 3 layouts (classic, modern, minimal) tương thích với cấu trúc của trang thực tế. Tích hợp khối Gallery thông minh hiển thị theo `galleryMode` với dữ liệu mock trực quan.
- **Sửa:** [ResourceDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/(site)/_components/resources/ResourceDetailPage.tsx)
  - Sửa: Thiết kế lại toàn bộ 3 layout trên trang chi tiết thực tế của khách hàng (Classic 2 cột, Modern 2 cột cao cấp, Minimal 1 cột tài liệu). Đồng bộ khối Gallery và CtaCard hiển thị theo cấu hình `galleryMode` của admin.

---

# VI. Execution Preview (Xem trước thực thi)

1. Đọc kỹ và chỉnh sửa [useSiteConfig.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/lib/experiences/useSiteConfig.ts) để khai báo cấu hình mới.
2. Thêm trường giao diện cấu hình và bộ chọn vào trang Admin [resources-detail/page.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/app/system/experiences/resources-detail/page.tsx).
3. Cập nhật `ResourcePreview.tsx` để hỗ trợ hiển thị 3 layout mới và chế độ Grid/Scroll Gallery đồng bộ.
4. Cập nhật trang public `ResourceDetailPage.tsx` tương tự, kế thừa đúng các class CSS/Tailwind, tối ưu hóa trải nghiệm trên mobile và desktop.
5. Tiến hành review tĩnh toàn bộ code trước khi bàn giao.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Quy trình kiểm tra thủ công tại Localhost:
1. **Kiểm tra tại Admin Panel (`/system/experiences/resources-detail`):**
   - Truy cập trang cấu hình chi tiết tài nguyên.
   - Bật toggle "Gallery", kiểm tra xem tùy chọn "Chế độ ảnh phụ" có xuất hiện bên dưới hay không.
   - Thay đổi chế độ ảnh phụ giữa "Dạng lưới (Grid)" và "Cuộn ngang (Scroll)". Kiểm tra xem ảnh hiển thị ở phần Xem trước (Preview) ở phía dưới có thay đổi tương ứng hay không.
   - Đổi qua lại giữa 3 Layout (Cổ điển, Hiện đại, Tối giản) và kiểm tra giao diện Preview có thay đổi đúng bố cục thiết kế mới hay không.
   - Bấm nút "Lưu" để lưu cấu hình vào DB.
2. **Kiểm tra tại Public Site (`/resources/[slug]`):**
   - Truy cập trang chi tiết tài nguyên bất kỳ có nhiều ảnh phụ (ví dụ: AutoCAD 2D).
   - Kiểm tra xem giao diện hiển thị ảnh phụ có mặc định là dạng lưới (Grid) ở dưới ảnh chính hay không.
   - Click chọn các ảnh phụ xem ảnh chính có thay đổi mượt mà và ảnh phụ đang chọn có hiển thị viền nổi bật hay không.
   - Thay đổi cấu hình ở Admin sang "Scroll" và lưu lại. Tải lại trang chi tiết tài nguyên thực tế để đảm bảo nó chuyển sang dạng cuộn ngang mượt mà.
   - Kiểm tra hiển thị responsive trên các thiết bị di động (Mobile/Tablet) đảm bảo không bị tràn khung và khoảng cách hiển thị hợp lý.

---

# VIII. Todo

- [ ] Cập nhật định nghĩa cấu hình và hook trong `useSiteConfig.ts`.
- [ ] Thêm điều khiển cấu hình chế độ ảnh phụ trong trang Admin `resources-detail/page.tsx`.
- [ ] Tái cấu trúc và thiết kế lại 3 layouts kèm logic Gallery trong Preview component `ResourcePreview.tsx`.
- [ ] Tái cấu trúc và thiết kế lại 3 layouts kèm logic Gallery trong public page `ResourceDetailPage.tsx`.
- [ ] Review tĩnh code toàn dự án, đảm bảo không có lỗi TypeScript hoặc imports.
- [ ] Chạy thông báo hoàn thành qua PowerShell voice.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. Cấu hình "Chế độ ảnh phụ" được lưu thành công vào cơ sở dữ liệu khi nhấn "Lưu" ở Admin.
2. Trang chi tiết tài nguyên thực tế hiển thị mặc định ảnh phụ dạng Grid (Lưới) đồng bộ. Bấm vào ảnh phụ phải cập nhật ngay lập tức ảnh chính tương ứng.
3. Bố cục 3 layouts (Classic, Modern, Minimal) phải nhất quán 100% về cấu trúc cơ bản giữa trang Xem trước (Admin Preview) và trang thực tế (Site thực).
4. Thiết kế layouts phải mang tính thẩm mỹ cao, bo góc mịn màng, đổ bóng mờ nhẹ, khoảng thở thoáng rộng theo tư tưởng thiết kế của macOS và iOS.
5. Giao diện responsive hoạt động hoàn hảo trên mobile, touch target của các ảnh phụ dạng grid và scroll đạt chuẩn dễ bấm (>40px), không bị chồng chéo giao diện.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro:** Khi cấu hình chưa từng được lưu trong database, trường `galleryMode` có thể bị undefined.
- **Giải pháp giảm thiểu:** Luôn sử dụng fallback mặc định là `'grid'` ở cả hook `useResourcesDetailConfig` và các component hiển thị để đảm bảo trang không bị crash và hiển thị đúng chế độ mặc định mong muốn của user.
- **Hoàn tác:** Khôi phục các file đã chỉnh sửa về trạng thái commit trước đó bằng Git.

---

# XI. Out of Scope (Ngoài phạm vi)

- Chỉnh sửa các chức năng tải xuống, thanh toán, quản lý quyền hạn của tài nguyên hoặc chỉnh sửa dữ liệu các bảng khác của Convex. Chỉ tập trung tối ưu hóa giao diện (UI/UX) và bố cục hiển thị trang chi tiết tài nguyên.
