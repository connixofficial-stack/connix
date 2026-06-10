# I. Primer

## 1. TL;DR kiểu Feynman
Khi xem trước trang web trên điện thoại hoặc máy tính bảng ở trang quản trị (Admin Preview), giao diện mô phỏng được co nhỏ lại nhưng trình duyệt của bạn vẫn hiểu là đang dùng máy tính (Desktop). Do đó, các nút bấm mua hàng và thêm giỏ hàng vẫn hiện chữ dài của bản Desktop thay vì chữ ngắn của bản di động, gây tràn viền và vỡ nút. Để sửa lỗi này, chúng ta sẽ cho phép các nút bấm nhận thông tin thiết bị đang hiển thị (`device`). Nếu đang xem chế độ điện thoại/máy tính bảng trong Admin Preview, nút bấm sẽ chủ động hiển thị chữ ngắn ("Thêm giỏ", "Mua") bất kể kích thước màn hình thực tế của trình duyệt là bao nhiêu.

## 2. Elaboration & Self-Explanation
Hiện nay, component `ProductCardActions` sử dụng Tailwind breakpoints (`sm:hidden`, `hidden sm:inline`) để ẩn/hiện chữ ngắn/dài tùy thuộc kích thước màn hình.
Tuy nhiên, trong trang quản trị (Admin Dashboard), tính năng Preview (Xem trước) thiết bị di động chỉ thay đổi chiều rộng của một thẻ `div` (ví dụ `max-w-[375px]`) chứ không dùng `iframe`. Viewport thực tế của trình duyệt admin vẫn là màn hình lớn (>1024px).
Hệ quả là:
- Breakpoint `sm` (màn hình lớn hơn 640px) vẫn có hiệu lực.
- Chữ dài ("Thêm vào giỏ", "Mua ngay") được render trong khi chiều rộng thực của thẻ `div` mô phỏng chỉ có ~375px.
- Các nút bấm bị vỡ hàng, mất chữ hoặc lệch giao diện.

Để khắc phục, chúng ta sẽ thêm prop `device` (nhận giá trị `'desktop' | 'tablet' | 'mobile'`) vào component `ProductCardActionsProps`.
- Khi `device === 'mobile'` hoặc `device === 'tablet'`, chúng ta bắt buộc render chữ ngắn ("Thêm giỏ", "Mua").
- Khi `device === 'desktop'`, render chữ dài ("Thêm vào giỏ", "Mua ngay").
- Khi không có prop `device` (ví dụ trên trang web public), component tự động quay về cơ chế CSS responsive breakpoints cũ để đáp ứng chính xác viewport của trình duyệt người dùng.

## 3. Concrete Examples & Analogies
Tưởng tượng bạn đang in một cuốn catalogue dạng mini bỏ túi. Nếu bạn cứ nhét nguyên kích thước phông chữ và đoạn văn dài lê thê của một tấm biển quảng cáo ngoài trời vào cuốn catalogue mini đó, chữ sẽ bị đè lên nhau hoặc tràn ra khỏi lề giấy.
Việc viewport trình duyệt vẫn nhận diện là Desktop trong khi container đã co nhỏ tương tự việc máy in vẫn nghĩ đang in biển quảng cáo. Chúng ta cần chủ động nói với máy in: "Đây là catalogue mini đấy nhé, hãy dùng chữ rút gọn đi!". Prop `device` chính là lời chỉ dẫn trực tiếp này.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tập tin đã kiểm tra**:
  - [ProductCardActions.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx): Đang dùng cứng responsive class `sm:hidden` và `hidden sm:inline` để ẩn hiện nhãn. Chưa có prop chỉ định thiết bị cụ thể.
  - [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx): Bọc preview trong `PreviewWrapper` có hook `usePreviewDevice()` để quản lý trạng thái `device` ('desktop' | 'tablet' | 'mobile'). Khi render `ProductCardActions` chưa truyền thiết bị hiện tại xuống.
  - [ProductListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-list/_components/ProductListPreview.tsx): Tương tự, quản lý thiết bị qua `usePreviewDevice()` nhưng chưa truyền thông tin này xuống `ProductCardActions`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Triệu chứng**: Giao diện nút bấm trên thiết bị mô phỏng di động của Admin Preview bị tràn chữ dài, vỡ dòng, hoặc trống chữ.
- **Nguyên nhân gốc**: Tailwind responsive classes dựa vào viewport trình duyệt (Media Queries) thay vì kích thước phần tử chứa (Container Queries) hoặc trạng thái thiết bị mô phỏng. Khi render trong container mô phỏng co nhỏ trên trình duyệt desktop, breakpoints Tailwind nhận diện sai và render nhãn dài của Desktop.
- **Độ tin cậy nguyên nhân gốc**: High (Cao) - Rất rõ ràng vì viewport browser admin > 1024px nên Tailwind responsive classes luôn chọn phiên bản desktop của nút.

---

# IV. Proposal (Đề xuất)
1. **Sửa component [ProductCardActions.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx)**:
   - Thêm trường `device?: 'desktop' | 'tablet' | 'mobile'` vào `ProductCardActionsProps`.
   - Cập nhật logic render văn bản nhãn:
     - Nếu `device === 'mobile'` hoặc `device === 'tablet'`, hiển thị chữ ngắn: `"Thêm giỏ"` và `"Mua"`/`"Hết"`.
     - Nếu `device === 'desktop'`, hiển thị chữ dài: `"Thêm vào giỏ"` và `secondaryLabel`.
     - Nếu không truyền `device`, sử dụng logic responsive CSS cũ của Tailwind để đảm bảo tính tương thích ngược ở storefront public.

2. **Cập nhật Admin Preview [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx)**:
   - Truyền prop `device={device}` vào các điểm gọi `<ProductCardActions ... />` (ở hàm render `ProductCard` và component `CarouselSection`).

3. **Cập nhật Admin Preview [ProductListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-list/_components/ProductListPreview.tsx)**:
   - Truyền prop `device={device}` vào các điểm gọi `<ProductCardActions ... />` (ở `CarouselPreviewInner`, `renderMinimalStyle`, `renderCommerceStyle`, `renderTabbedStyle`).

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### UI Shared Components
- **Sửa**: [ProductCardActions.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx) - Bổ sung prop `device` và thay đổi logic render nhãn chữ theo điều kiện thiết bị.

### Admin Preview Components
- **Sửa**: [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx) - Truyền prop `device` cho component con `ProductCardActions`.
- **Sửa**: [ProductListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-list/_components/ProductListPreview.tsx) - Truyền prop `device` cho component con `ProductCardActions`.

---

# VI. Execution Preview (Xem trước thực thi)
1. Thêm `device` vào định nghĩa interface `ProductCardActionsProps`.
2. Sửa logic hiển thị nhãn trong `ProductCardActions.tsx` để check prop `device`.
3. Tìm kiếm và cập nhật tất cả lời gọi `<ProductCardActions>` trong `CategoryProductsPreview.tsx` để bổ sung `device={device}`.
4. Tìm kiếm và cập nhật tất cả lời gọi `<ProductCardActions>` trong `ProductListPreview.tsx` để bổ sung `device={device}`.
5. Chạy TypeScript typecheck để đảm bảo tính nhất quán của kiểu dữ liệu.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh**: Chạy lệnh `bunx tsc --noEmit` để đảm bảo dự án không gặp lỗi TypeScript.
- **Thủ công**: Người dùng kiểm tra trang chỉnh sửa admin preview, thay đổi thiết bị giữa Desktop, Tablet và Mobile, quan sát các nút sản phẩm hiển thị đúng kích cỡ chữ ngắn gọn mà không bị vỡ dòng.

---

# VIII. Todo
- [ ] Cập nhật [ProductCardActions.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/shared/ProductCardActions.tsx)
- [ ] Cập nhật [CategoryProductsPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/category-products/_components/CategoryProductsPreview.tsx)
- [ ] Cập nhật [ProductListPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/app/admin/home-components/product-list/_components/ProductListPreview.tsx)
- [ ] Chạy kiểm tra biên dịch TypeScript
- [ ] Git commit các tệp thay đổi

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Khi xem preview ở chế độ Mobile/Tablet, nút bấm hiển thị ngắn gọn ("Thêm giỏ" / "Mua") và không bị vỡ dòng.
- Khi xem preview ở chế độ Desktop, nút hiển thị đầy đủ ("Thêm vào giỏ" / "Mua ngay").
- Trang storefront public của khách hàng vẫn hoạt động bình thường, nút co giãn responsive tự động dựa trên viewport thiết bị thật.
- Biên dịch dự án thành công không lỗi TypeScript.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Lỗi biên dịch TypeScript ở các component public khác nếu định nghĩa prop `device` là bắt buộc.
- **Giảm thiểu**: Thiết lập prop `device` là optional (`device?: 'desktop' | 'tablet' | 'mobile'`), do đó các component cũ không truyền prop này sẽ không bị lỗi kiểu và giữ nguyên hành vi CSS responsive cũ.
- **Hoàn tác**: `git checkout -- <file>` để quay lại trạng thái ban đầu nếu cần thiết.

---

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi cấu trúc layout tổng thể hoặc cơ chế mô phỏng preview của hệ thống Admin (như dùng `iframe`).
- Tối ưu hóa hiệu năng tải ảnh hoặc các logic nghiệp vụ khác của sản phẩm.
