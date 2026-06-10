# I. Primer

## 1. TL;DR kiểu Feynman
- **Vấn đề**: Người dùng thấy dải thuộc tính trên Mobile/Tablet chỉ hiện 2 thuộc tính cùng lúc là hơi ít, muốn nâng lên hiển thị 3 thuộc tính đồng thời. Tuy nhiên, màn hình điện thoại hẹp, nếu không thu nhỏ (scale) các biểu tượng, khoảng cách và cỡ chữ thì giao diện sẽ bị chen chúc, xô lệch.
- **Giải pháp**:
  1. Thay đổi giới hạn (limit) hiển thị của Mobile từ 2 lên thành 3 items (đồng dạng với Tablet là 3, Desktop là 4).
  2. Co nhỏ kích thước icon trên Mobile từ `24px` xuống `18px`.
  3. Co hẹp khoảng cách đệm (`px-2.5` thay vì `px-4`) và khoảng trống giữa icon với chữ (`gap-2` thay vì `gap-3.5`).
  4. Thu nhỏ nhẹ cỡ chữ giá trị thuộc tính trên Mobile từ `12px` (text-xs) xuống `11px` để đảm bảo hiển thị cân đối, xuống dòng tự nhiên và không bị tràn.

## 2. Elaboration & Self-Explanation
Chúng ta sẽ thay đổi cấu hình dải thuộc tính Premium trên cả trang xem trước (`ProductDetailPreview.tsx`) và trang thực tế (`ProductDetailPage.tsx`):
- **Giới hạn số lượng hiển thị trên 1 hàng (Limit)**:
  - Trước đây: Mobile là 2, Tablet là 3, Desktop là 4.
  - Hiện tại: Cả Mobile và Tablet sẽ hiển thị đồng đều **3** items, Desktop hiển thị **4** items.
  - Mã nguồn: `const limit = isMobileViewport ? 3 : isTabletViewport ? 3 : 4;`
- **Tỉ lệ phân chia trong Embla Carousel (flexBasis)**:
  - Trước đây: Mobile chiếm `1/2` độ rộng (`calc(100% / 2)`).
  - Hiện tại: Mobile chiếm `1/3` độ rộng (`calc(100% / 3)`), đồng dạng với Tablet.
- **Quy tắc Scale giao diện trên thiết bị di động (Mobile-First responsive scale)**:
  - Để tránh giao diện bị chật chội khi chia làm 3 cột trên Mobile, chúng ta giảm nhẹ các thông số CSS:
    - Khoảng cách padding ngang của mỗi ô thuộc tính: từ `px-4 md:px-6` giảm còn `px-2.5 md:px-6`.
    - Khoảng cách giữa icon và chữ: từ `gap-3.5` giảm còn `gap-2 md:gap-3.5`.
    - Kích thước icon Lucide: từ `24px` giảm còn `18px` trên Mobile (giữ nguyên `26px` trên Desktop).
    - Cỡ chữ của giá trị thuộc tính: từ `text-xs md:text-sm` giảm còn `text-[11px] md:text-sm`.

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: 
  Trên một màn hình điện thoại iPhone có chiều rộng khoảng 375px. 
  - Nếu chia làm 2 ô (kiểu cũ): mỗi ô rộng ~150px, chữ và icon hiển thị thoải mái.
  - Nếu chia làm 3 ô (kiểu mới) mà không scale: mỗi ô chỉ rộng ~100px. Nếu icon to 24px và gap to 14px, phần chữ chỉ còn lại ~60px, chữ sẽ bị xuống dòng liên tục làm giao diện trông rất dài và mất thẩm mỹ.
  - Bằng cách scale (icon còn 18px, gap còn 8px, padding còn 10px): phần chữ sẽ có không gian rộng hơn (~64px) và cỡ chữ 11px giúp hiển thị trọn vẹn từ ngữ, dải thuộc tính trông cực kỳ cân đối, gọn gàng và cao cấp.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Tệp bị ảnh hưởng**:
  1. `app/(site)/_components/details/ProductDetailPage.tsx`
  2. `components/experiences/previews/ProductDetailPreview.tsx`
- **Mục tiêu**: Hiển thị 3 items thuộc tính cùng lúc trên Mobile/Tablet và scale kích thước hợp lý để UI cân đối, gọn gàng.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Cấu hình limit cũ đặt Mobile là 2, flexBasis là 1/2 làm số lượng item hiển thị đồng thời bị giới hạn.
- **Giả thuyết đối chứng**: Đặt limit và flexBasis Mobile về 3, đồng thời tinh chỉnh CSS padding, gap, icon size và font size thông qua các lớp Tailwind responsive (`md:...`) sẽ mang lại trải nghiệm hiển thị 3 items trên di động cực kỳ thoáng đãng và premium.

# IV. Proposal (Đề xuất)
1. **Sửa file `ProductDetailPage.tsx`**:
   - Đổi `limit` thành `isMobileViewport ? 3 : isTabletViewport ? 3 : 4`.
   - Đổi `flexBasis` của Mobile trong Embla slide sang `calc(100% / 3)`.
   - Cập nhật class padding: `px-2.5 md:px-6`.
   - Cập nhật class gap: `gap-2 md:gap-3.5`.
   - Cấu hình size icon: `size={18} className="md:w-[26px] md:h-[26px]"`.
   - Cấu hình cỡ chữ giá trị: `text-[11px] md:text-sm`.
2. **Sửa file `ProductDetailPreview.tsx`**:
   - Áp dụng các thay đổi tương tự cho `limit`, `flexBasis` (dựa trên `device === 'mobile'`), padding, gap, icon size và font size đồng bộ 100%.

# V. Files Impacted (Tệp bị ảnh hưởng)
- `Sửa`: [ProductDetailPage.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/%28site%29/_components/details/ProductDetailPage.tsx)
  - Vai trò: Giao diện chi tiết sản phẩm trên site thực tế.
  - Thay đổi: Cập nhật cấu hình limit, flexBasis và scale CSS dải thuộc tính.
- `Sửa`: [ProductDetailPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/experiences/previews/ProductDetailPreview.tsx)
  - Vai trò: Bản xem trước chi tiết sản phẩm trong admin.
  - Thay đổi: Cập nhật cấu hình limit, flexBasis và scale CSS dải thuộc tính.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật khối render attributes Premium trong `ProductDetailPage.tsx` và `ProductDetailPreview.tsx`.
2. Chạy `bunx tsc --noEmit` để typecheck toàn dự án.
3. Commit code và bàn giao.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Tĩnh (Static Check)**: Chạy `bunx tsc --noEmit`.
- **Visual Check**: Kiểm tra dải thuộc tính hiển thị 3 items song song trên màn hình Mobile/Tablet, chữ xuống dòng gọn gàng, icon nhỏ gọn xinh xắn cân đối.

# VIII. Todo
- [ ] Cập nhật file `ProductDetailPage.tsx` (Real Site).
- [ ] Cập nhật file `ProductDetailPreview.tsx` (Preview).
- [ ] Chạy kiểm tra TypeScript compile check.
- [ ] Commit code và phát âm báo hoàn thành `Done, Sir.`.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Hiển thị đúng 3 items thuộc tính cùng lúc trên Mobile/Tablet.
- Giao diện scale gọn gàng (icon 18px, gap 8px, padding 10px, font 11px) trên Mobile.
- Sạch lỗi biên dịch TypeScript.
