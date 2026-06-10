# I. Primer

## 1. TL;DR kiểu Feynman
* **Vấn đề**: 
  1. Trong màn hình giả lập di động (Mobile Preview) của Admin panel, chữ của **Layout 6** vẫn bị co cụm và chừa khoảng trống cũ vì trình duyệt đang chạy trên máy tính Desktop nên luôn kích hoạt các lớp `@media` của máy tính (`md:`).
  2. Font size của tiêu đề các dịch vụ chi tiết trên Mobile hơi to so với diện tích hiển thị nhỏ hẹp, cần được giảm bớt để cân đối và sang trọng hơn.
* **Giải pháp**: 
  1. Chúng ta sẽ cấu hình logic JS động trong [ServicesSectionCore.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ServicesSectionCore.tsx): Nếu đang trong màn hình xem trước (**Preview**), nó sẽ dựa vào biến `device === 'mobile'` để áp dụng trực tiếp các class CSS di động, đồng bộ hóa tuyệt đối với site thực tế.
  2. Giảm $20\%$ kích thước font size của Tiêu đề dịch vụ chi tiết trên Mobile từ `13px` xuống `11px`, đồng thời giảm kích thước của Mô tả tương ứng xuống `10px` để nhỏ hơn tiêu đề một chút và giữ nét sang trọng.
* **Phạm vi sửa đổi**: Chỉ cần cập nhật duy nhất tệp [ServicesSectionCore.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ServicesSectionCore.tsx).

## 2. Elaboration & Self-Explanation
Để tối ưu không gian hiển thị trên các màn hình di động nhỏ, việc quản lý typography (cấp bậc font size) là vô cùng quan trọng:
* **Tiêu đề dịch vụ chi tiết**: Giảm từ `13px` xuống `11px` trên Mobile.
* **Mô tả dịch vụ**: Giảm từ `12px` xuống `10px` trên Mobile.

Đồng thời, kết hợp với các biểu thức logic động dựa trên `isPreview` và `device` để xử lý triệt để sự lệch hiển thị giữa Desktop Browser và Mobile Device Emulator:
* **article**:
  `isPreview ? (device === 'mobile' ? 'pl-4' : 'pl-[76px]') : 'pl-4 md:pl-[76px]'`
* **h3 (Tiêu đề)**:
  `isPreview ? (device === 'mobile' ? 'pl-[56px] min-h-[42px] text-[11px]' : 'pl-0 min-h-0 text-[13px]') : 'pl-[56px] md:pl-0 min-h-[42px] md:min-h-0 text-[11px] md:text-[13px]'`
* **p (Mô tả)**:
  `isPreview ? (device === 'mobile' ? 'mt-2 text-[10px]' : 'mt-0.5 text-[12px]') : 'mt-2 md:mt-0.5 text-[10px] md:text-[12px]'`

Sự điều phối linh hoạt này giúp font size nhỏ gọn hơn, giúp các dòng chữ Tiêu đề chỉ chiếm tối đa 2 dòng, còn Mô tả dàn ngang ra toàn bộ chiều rộng dưới ribbon một cách cực kỳ gọn gàng.

## 3. Concrete Examples & Analogies
* **Ví dụ thực tế**: Giống như bạn đang in một cuốn catalogue nhỏ bỏ túi. 
  * Nếu bạn vẫn giữ kích thước chữ to như cuốn sách lớn trên bàn, chữ sẽ bị tràn dòng liên tục và làm cuốn catalogue trở nên dày cộp một cách không cần thiết.
  * Giệc giảm nhỏ font chữ đi $20\%$ giúp thông tin hiển thị vừa vặn, gọn gàng và giữ đúng thiết kế thẩm mỹ ban đầu của cuốn catalogue nhỏ.

---

# II. Audit Summary (Tóm tắt kiểm tra)

* Chúng tôi đã phân tích tệp [ServicesSectionCore.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ServicesSectionCore.tsx) và định vị chính xác hằng số `serviceTitleClassName` (13px) và `serviceBodyClassName` (12px).
* Chúng tôi sẽ ghi đè động font-size trong thẻ `h3` và `p` thông qua helper `cn` bằng các giá trị `text-[11px]` và `text-[10px]` trên mobile.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Độ tin cậy nguyên nhân gốc: High (Cao)
* **Lý do**: Yêu cầu tinh chỉnh font-size giảm 20% trên mobile giúp giải quyết trực quan vấn đề chữ hiển thị dày đặc, kết hợp với sửa lỗi Preview giúp tạo nên sự đồng bộ tuyệt đối trên cả site thật và admin panel.

---

# IV. Proposal (Đề xuất)

Cập nhật mã nguồn render của Layout 6 trong [ServicesSectionCore.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ServicesSectionCore.tsx) như sau:
1. **article**:
   ```tsx
   className={cn(
     "relative flex min-h-[54px] flex-col justify-center rounded-md py-2.5 pr-4 text-left shadow-sm",
     isPreview
       ? (device === 'mobile' ? 'pl-4' : 'pl-[76px]')
       : 'pl-4 md:pl-[76px]'
   )}
   ```
2. **h3 (Tiêu đề)**:
   ```tsx
   className={cn(
     serviceTitleClassName,
     isPreview
       ? (device === 'mobile' ? 'pl-[56px] min-h-[42px] text-[11px]' : 'pl-0 min-h-0 text-[13px]')
       : 'pl-[56px] md:pl-0 min-h-[42px] md:min-h-0 text-[11px] md:text-[13px]'
   )}
   ```
3. **p (Mô tả)**:
   ```tsx
   className={cn(
     serviceBodyClassName,
     "pl-0",
     isPreview
       ? (device === 'mobile' ? 'mt-2 text-[10px]' : 'mt-0.5 text-[12px]')
       : 'mt-2 md:mt-0.5 text-[10px] md:text-[12px]'
   )}
   ```

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa đổi:
1. **[ServicesSectionCore.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ServicesSectionCore.tsx)**
   * *Vai trò hiện tại*: Render Services layout.
   * *Thay đổi*: Đồng bộ hiển thị Preview và giảm font size 20% trên Mobile cho Layout 6.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1**: Đọc lại đoạn render mặc định của `ServicesSectionCore.tsx` (dòng 774-830).
2. **Bước 2**: Thực hiện thay thế bằng mã nguồn responsive nâng cao kết hợp font-size mới.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm tra thủ công:
1. Mở trang Admin edit Services: `http://localhost:3000/admin/home-components/services/js73xcsqx77bk7cbxdzjqpx0qh87jebn/edit`
2. Chọn **Layout 6** (Timeline) và giả lập **Mobile**.
3. Đảm bảo Preview hiển thị đúng giao diện di động: chữ mô tả tràn rộng dưới cờ, font size tiêu đề thu nhỏ về 11px, mô tả thu nhỏ về 10px rất thanh tú và vừa vặn.
4. Kiểm tra trên site thực tế bằng thiết bị di động.

---

# VIII. Todo

- [x] Cập nhật lớp CSS responsive động và tối ưu font-size 20% cho Layout 6 trong [ServicesSectionCore.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/ServicesSectionCore.tsx).
- [x] Xác minh hiển thị và cập nhật walkthrough.md.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Điều kiện Đạt (Pass)**:
  * Trong khung preview di động (375px) của Admin Panel và site di động thực tế, chữ tiêu đề có font-size 11px, mô tả có font-size 10px, mô tả dàn rộng dưới cờ.
  * Preview Desktop vẫn hiển thị font-size 13px/12px và đệm trái `pl-[76px]` ban đầu.
