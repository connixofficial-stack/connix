# I. Primer

## 1. TL;DR kiểu Feynman
* **Mục tiêu**: Thêm một công tắc bật/tắt (toggle) trong trang quản trị Menu (`/system/experiences/menu`) để admin chọn hiển thị nút bấm Moon/Sun (Dark Mode) trên Header ở site thực. Khi người dùng bấm nút này ở site thực, giao diện sẽ chuyển đổi giữa giao diện Sáng (Light) và Tối (Dark).
* **Cách hoạt động**:
  - Lưu trạng thái bật nút trong `header_config` (trường `showDarkModeToggle`).
  - Ở Header (site thực và preview), nếu `showDarkModeToggle` bật, render icon Moon/Sun.
  - Khi click nút này, thay đổi class `dark` của `document.documentElement`, lưu vào `localStorage` (key `site_theme_override`) và phát event `site-theme-change`.
  - Các Home Components lắng nghe event `site-theme-change` để tự chuyển đổi màu sắc theo adapter OKLCH mà không bị hydration mismatch.

## 2. Elaboration & Self-Explanation
Hiện tại dự án đã hỗ trợ 31 Home Components chạy dark mode tự động dựa trên class `dark` của hệ thống. Tuy nhiên, người dùng yêu cầu có một nút bấm thực tế hiển thị trên Header của site thực để người dùng cuối (end-user) có thể chủ động chuyển đổi giao diện sáng/tối. Cấu hình hiển thị nút này sẽ được quản lý bởi Quản trị viên trong trang cấu hình Menu Header (`/system/experiences/menu`).
Khi bật cấu hình này lên:
- Phía Client (site thực): Đọc tùy chọn theme người dùng lưu trong `localStorage` trước tiên. Nếu không có, fallback về theme mặc định hệ thống (`siteDarkMode`). Khi người dùng click chọn theme khác, lưu lựa chọn mới vào `localStorage`, đổi class của root document và dispatch event `site-theme-change`.
- Các Home Components: Sử dụng listener để lắng nghe sự kiện `site-theme-change` để cập nhật lại style realtime khi theme thay đổi ở client-side, giải quyết triệt để lỗi hydration mismatch của Next.js (do server render trước, client thay đổi sau).

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  - Bước 1: Quản trị viên truy cập `/system/experiences/menu`, tại cột "Hiển thị" ở bên trái, bật toggle "Nút Dark Mode ở site thực". Bấm "Lưu".
  - Bước 2: Truy cập trang chủ site thực. Trên Header (ở mọi layout: Classic, Topbar, Allbirds, Darkglass) sẽ xuất hiện icon Mặt trăng/Mặt trời bên cạnh Giỏ hàng.
  - Bước 3: Người dùng bấm vào nút Mặt trăng, giao diện chuyển sang tối, các Home Components cũng tự động chuyển sang giao diện tối. Trạng thái `site_theme_override: "dark"` được lưu vào `localStorage`. Khi refresh trang hoặc sang trang khác, giao diện vẫn giữ nguyên màu tối.
* **Analogy**: Nút này giống như công tắc đèn trong phòng khách. Mặc định chủ nhà (admin) quyết định có lắp công tắc này hay không. Nếu lắp, khách vào nhà (end-user) có thể bật/tắt đèn tùy ý. Trạng thái bật/tắt đèn đó được ghi nhớ để nếu khách ra ngoài rồi quay lại phòng khách thì đèn vẫn ở trạng thái cũ.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file `app/system/experiences/menu/page.tsx`: Hiện tại đã có `DEFAULT_CONFIG` cho menu header, hàm `handleSave` để lưu. Chưa có trường `showDarkModeToggle`.
- Đã kiểm tra file `components/experiences/previews/HeaderMenuPreview.tsx`: Giao diện preview của header. Cần hiển thị icon Moon ở đây để mô phỏng cho admin.
- Đã kiểm tra file `components/site/Header.tsx`: Nơi render header thật. Cần render component `DarkModeToggle` và xử lý logic đổi theme cục bộ.
- Đã kiểm tra file `components/site/SiteProviders.tsx`: Đang xử lý theme dựa hoàn toàn trên cài đặt `siteDarkMode` từ Convex DB. Cần bổ sung logic đọc và lắng nghe `site_theme_override` từ `localStorage`.
- Đã kiểm tra file `components/site/home/HomeComponentRenderer.tsx`: Đang render Home Components. Cần lắng nghe event `site-theme-change` để đồng bộ theme.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Vấn đề**: Người dùng cần hiển thị nút Moon/Sun chuyển đổi theme ở site thực dựa theo cấu hình từ Admin Panel, đồng bộ theme cho toàn bộ 31 Home Components mà không bị hydration mismatch.
- **Root Cause Confidence**: High.
- **Giả thuyết đối chứng**: Nếu chỉ đổi class trên `document.documentElement` ở client khi click mà không phát sự kiện, các React component (như các Home Components) đã mount từ trước sẽ không biết để render lại các biến màu oklch, dẫn đến việc đổi theme bị lỗi hiển thị ở một số phần. Do đó, việc phát và lắng nghe event `'site-theme-change'` là bắt buộc.

# IV. Proposal (Đề xuất)
1. Cập nhật `HeaderMenuConfig` (cả ở Admin và Preview) và `HeaderConfig` (ở Header site thực): Thêm trường `showDarkModeToggle: boolean`.
2. Sửa `app/system/experiences/menu/page.tsx`:
   - Thêm `showDarkModeToggle` vào `DEFAULT_CONFIG` (mặc định là `false`).
   - Thêm ToggleRow "Nút Dark Mode ở site thực" trong panel "Hiển thị" để cập nhật `config.showDarkModeToggle`.
3. Sửa `components/experiences/previews/HeaderMenuPreview.tsx`:
   - Thêm `showDarkModeToggle` vào `DEFAULT_CONFIG` và `HeaderMenuConfig` type.
   - Hiển thị icon Moon/Sun mô phỏng ở các action layout khi `showDarkModeToggle === true`.
4. Sửa `components/site/Header.tsx`:
   - Định nghĩa component `DarkModeToggle` nhận `tokens` và `variant` để render an toàn trên Client (tránh hydration mismatch).
   - Chèn `DarkModeToggle` vào 4 layout của header (Classic, Topbar, Allbirds, Darkglass) cho cả desktop và mobile view khi `config.showDarkModeToggle === true`.
5. Sửa `components/site/SiteProviders.tsx`:
   - Cập nhật `useEffect` xử lý theme: Đọc `site_theme_override` từ `localStorage` để quyết định `isDark`.
   - Lắng nghe event `'site-theme-change'` để cập nhật class `dark` của `document.documentElement` khi user click toggle theme.
6. Sửa `components/site/home/HomeComponentRenderer.tsx`:
   - Sử dụng `useState`/`useEffect` để theo dõi và lắng nghe sự kiện `'site-theme-change'` để cập nhật lại `isDark` state động ở phía client.
   - Bọc wrapper div với class `dark` nếu `isDark === true` và truyền `isDark` cho các component con nếu cần thiết.

# V. Files Impacted (Tệp bị ảnh hưởng)
1. `app/system/experiences/menu/page.tsx`:
   - Vai trò hiện tại: Trang quản trị Menu Header cho admin.
   - Thay đổi: Sửa để thêm option toggle "Nút Dark Mode ở site thực" và lưu cấu hình vào DB.
2. `components/experiences/previews/HeaderMenuPreview.tsx`:
   - Vai trò hiện tại: Render preview header ở Admin Panel.
   - Thay đổi: Sửa để hiển thị icon Moon mô phỏng khi cấu hình toggle được kích hoạt.
3. `components/site/Header.tsx`:
   - Vai trò hiện tại: Header ở site thực.
   - Thay đổi: Thêm component `DarkModeToggle` và render nó tại các vị trí thích hợp trong 4 layout của Header.
4. `components/site/SiteProviders.tsx`:
   - Vai trò hiện tại: Cung cấp theme và các provider khác ở site thực.
   - Thay đổi: Đồng bộ theme với `localStorage.getItem('site_theme_override')` và lắng nghe sự kiện `'site-theme-change'`.
5. `components/site/home/HomeComponentRenderer.tsx`:
   - Vai trò hiện tại: Renderer chính cho các Home Components.
   - Thay đổi: Thêm state `isDark` và lắng nghe event `'site-theme-change'` để render giao diện dark mode chính xác ở client-side mà không gây hydration mismatch.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc và chỉnh sửa `app/system/experiences/menu/page.tsx` để thêm toggle và mở rộng cấu hình.
2. Đọc và chỉnh sửa `components/experiences/previews/HeaderMenuPreview.tsx` để render nút demo trên preview.
3. Đọc và chỉnh sửa `components/site/Header.tsx` để tích hợp `DarkModeToggle` thực tế cho 4 layout.
4. Chỉnh sửa `components/site/SiteProviders.tsx` để đồng bộ theme giữa Convex settings, `localStorage` và event listener.
5. Chỉnh sửa `components/site/home/HomeComponentRenderer.tsx` để đồng bộ state `isDark` realtime thông qua event listener.
6. Chạy `bunx tsc --noEmit` để kiểm tra lỗi kiểu dữ liệu và sửa lỗi (nếu có).

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Biên dịch tĩnh: Chạy command `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để verify TypeScript compile thành công.
- Kiểm thử tích hợp: Admin bật nút toggle ở `/system/experiences/menu` -> lưu lại. Giao diện preview cập nhật chính xác nút Moon.
- Kiểm thử site thực: Truy cập localhost:3000, kiểm tra Header xem nút Moon/Sun có xuất hiện hay không. Click nút, kiểm tra xem document root có nhận class `dark` không, các Home Components có đổi màu tương ứng không, và `site_theme_override` trong `localStorage` có thay đổi không.

# VIII. Todo
- [ ] Cập nhật `DEFAULT_CONFIG` và giao diện admin trong `app/system/experiences/menu/page.tsx`.
- [ ] Cập nhật `HeaderMenuConfig` và logic render preview trong `components/experiences/previews/HeaderMenuPreview.tsx`.
- [ ] Viết component `DarkModeToggle` và tích hợp vào 4 layout của `components/site/Header.tsx`.
- [ ] Bổ sung logic lắng nghe theme trong `components/site/SiteProviders.tsx`.
- [ ] Bổ sung logic lắng nghe event `site-theme-change` trong `components/site/home/HomeComponentRenderer.tsx`.
- [ ] Chạy Oxlint & TSC check để xác nhận code sạch sẽ.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Trang `/system/experiences/menu` có toggle "Nút Dark Mode ở site thực". Trạng thái được lưu thành công vào `header_config.showDarkModeToggle`.
- Khi bật toggle này, Header site thực xuất hiện nút Mặt Trăng/Mặt Trời (Moon/Sun) ở cả 4 style (Classic, Topbar, Allbirds, Darkglass) và cho cả Desktop + Mobile.
- Khi người dùng click vào nút Moon/Sun ở site thực, giao diện sẽ chuyển đổi ngay lập tức (Light <-> Dark), lưu trạng thái vào `localStorage` và cập nhật style của tất cả 31 Home Components mà không bị hydration mismatch.
- Khi tải lại trang, giao diện được khôi phục chính xác theo cấu hình lưu trong `localStorage`.
- Dự án build thành công không có lỗi lint hoặc TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Hydration Mismatch: Cần đảm bảo component `DarkModeToggle` và state `isDark` trong `HomeComponentRenderer` chỉ được kích hoạt sau khi đã mount (`mounted === true`). Điều này được giải quyết triệt để nhờ sử dụng `useEffect`.
- Hoàn tác: Dễ dàng rollback bằng cách sử dụng `git checkout` các file bị ảnh hưởng.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào cách tính màu sắc oklch của 31 Home Components vì phần đó đã hoạt động ổn định từ task trước.
- Không cấu hình đổi theme cho trang quản trị Admin (trừ preview header).
