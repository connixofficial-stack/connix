# I. Primer

## 1. TL;DR kiểu Feynman
- Ở trang quản lý và ngoài site thực tế, giao diện Badge của đối tác (Partners) hiển thị các logo chạy tự động vòng lặp.
- Người dùng muốn hiển thị toàn bộ logo có trong danh sách mà không bị giới hạn bởi con số cố định nào.
- Giải pháp: Thay đổi thuộc tính `maxVisible` thành số lượng logo thực tế (truyền `maxVisible={items.length}`) khi gọi `<PartnersBadgeShared>` trên cả site thực và preview để hiển thị đầy đủ và mượt mà tất cả logo.

## 2. Elaboration & Self-Explanation
Hiệu ứng Badge layout của Home Component Partners hoạt động dưới dạng tự động cuộn tròn vô hạn (marquee). Để dải logo chạy hiển thị đầy đủ tất cả các đối tác được người dùng thêm vào mà không bị cắt bớt, thuộc tính giới hạn `maxVisible` cần khớp chính xác với độ dài của mảng dữ liệu đầu vào.
Do đó, chúng ta sẽ cập nhật cả trang quản lý (Preview) và trang chủ thực tế (Site thực) để truyền `maxVisible={items.length}` khi gọi `PartnersBadgeShared`. Điều này đảm bảo:
- Không bao giờ bị giới hạn ở 6 logo hay 20 logo.
- Luôn hiển thị 100% số lượng logo đối tác có trong cấu hình.
- Parity tuyệt đối giữa hai môi trường (Preview và Site thực).

## 3. Concrete Examples & Analogies
- **Ví dụ cụ thể**: Nếu người dùng tải lên 25 logo đối tác. Trước đó, preview chỉ hiển thị 20 cái, còn site thực chỉ hiển thị 6 cái. Sau khi thay đổi truyền `maxVisible={items.length}`, cả preview và site thực đều hiển thị toàn bộ 25 logo chạy mượt mà nối đuôi nhau.
- **Phép so sánh ẩn dụ**: Giống như thiết lập độ dài của một băng chuyền hành lý. Thay vì cố định băng chuyền chỉ chứa tối đa 6 chiếc vali hoặc 20 chiếc vali (nếu nhiều hơn vali sẽ bị bỏ lại kho), chúng ta đo trực tiếp số vali đang có và điều chỉnh băng chuyền mở rộng vừa vặn để chở hết tất cả hành lý của khách hàng.

# II. Audit Summary (Tóm tắt kiểm tra)
- Đã kiểm tra file [PartnersBadgeShared.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/_components/PartnersBadgeShared.tsx):
  - Component nhận tham số `maxVisible` để xác định số lượng logo hiển thị.
- Đã kiểm tra file [PartnersPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/_components/PartnersPreview.tsx):
  - Đang gọi `PartnersBadgeShared` ở `renderBadgeStyle` (dòng 190) nhưng chưa truyền `maxVisible` (mặc định lấy 20).
- Đã kiểm tra file [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx):
  - Đang gọi `PartnersBadgeShared` ở dòng 3525 và hiện tại đang truyền `maxVisible={20}` (vừa sửa từ 6 lên 20 ở bước trước).

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause (Nguyên nhân gốc)**: Việc gán cứng các giới hạn tối đa `maxVisible` (như 6 hoặc 20) gây cản trở việc hiển thị đầy đủ danh sách khi người dùng nhập số lượng logo vượt ngưỡng giới hạn này.
- **Counter-Hypothesis (Giả thuyết đối chứng)**: Nếu chúng ta chỉ tăng `maxVisible` lên một số lớn hơn (như 100), hệ thống vẫn có rủi ro bị giới hạn nếu khách hàng tải lên 101 logo. Do đó, giải pháp tối ưu và linh hoạt nhất là sử dụng thuộc tính động `maxVisible={items.length}` để luôn co giãn theo đúng số lượng logo thực tế có trong danh sách.

# IV. Proposal (Đề xuất)
- **Đề xuất**: 
  - Sửa file [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx), truyền `maxVisible={items.length}` khi gọi `PartnersBadgeShared`.
  - Sửa file [PartnersPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/_components/PartnersPreview.tsx), truyền `maxVisible={items.length}` khi gọi `PartnersBadgeShared`.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa**: [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx)
  - Vai trò hiện tại: Render các component của home-component ngoài trang chủ (site thực).
  - Thay đổi: Truyền `maxVisible={items.length}` thay vì `maxVisible={20}`.
- **Sửa**: [PartnersPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/_components/PartnersPreview.tsx)
  - Vai trò hiện tại: Render preview của layout Partners trong trang quản trị.
  - Thay đổi: Truyền `maxVisible={items.length}` khi gọi `<PartnersBadgeShared>` tại `renderBadgeStyle`.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật thuộc tính `maxVisible` thành `items.length` trong [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx).
2. Cập nhật thuộc tính `maxVisible` thành `items.length` trong [PartnersPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/_components/PartnersPreview.tsx).
3. Chạy kiểm tra TypeScript `bunx tsc --noEmit` để đảm bảo kiểu dữ liệu an toàn.
4. Commit các thay đổi vào git local.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Kiểm chứng tĩnh (Static Verification)**:
  - Chạy lệnh: `bunx tsc --noEmit 2>&1 | Select-Object -First 10` để đảm bảo code biên dịch thành công.
- **Kiểm chứng thủ công (Manual Verification)**:
  - Kiểm tra giao diện Preview và Site thực với danh sách đối tác có số lượng logo khác nhau (ví dụ: 5, 10, 25 logo) để đảm bảo không logo nào bị ẩn hoặc cắt bớt.

# VIII. Todo
- [ ] Thay đổi thuộc tính `maxVisible` thành `items.length` khi gọi `PartnersBadgeShared` trong [ComponentRenderer.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/ComponentRenderer.tsx).
- [ ] Thay đổi thuộc tính `maxVisible` thành `items.length` khi gọi `PartnersBadgeShared` trong [PartnersPreview.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/admin/home-components/partners/_components/PartnersPreview.tsx).
- [ ] Chạy kiểm tra tĩnh TypeScript.
- [ ] Commit code và spec vào git local.
- [ ] Phát âm thanh báo hoàn thành task.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout `Badge` của Partners hiển thị toàn bộ số lượng logo có trong danh sách mà không bị giới hạn ở 6 hay 20 logo.
- Sự nhất quán tuyệt đối về hiển thị giữa Preview (trang quản lý) và Site thực (trang chủ).
- Hệ thống biên dịch thành công.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro**: Không có rủi ro chức năng.
- **Hoàn tác (Rollback)**: Khôi phục các file `git checkout -- components/site/ComponentRenderer.tsx app/admin/home-components/partners/_components/PartnersPreview.tsx`.

# XI. Out of Scope (Ngoài phạm vi)
- Thay đổi layout khác (Grid, Marquee...) nằm ngoài phạm vi.

# XII. Open Questions (Câu hỏi mở)
- Không có câu hỏi mở.
