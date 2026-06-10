Đã audit xong: hiện tại cả 3 layout (Grid/Sidebar/Magazine) ở preview và site đều lấy `badgeText` từ `resolvedSecondary`, nên khi secondary sáng thì badge text bị chìm; chưa đúng dual-brand-color (APCA).

Kế hoạch implement (full, 1 lần):
1) Cập nhật color token trung tâm cho services list
- File: `components/site/services/colors.ts`
- Thêm helper APCA tương tự pattern đang dùng ở `components/site/services/detail/_lib/colors.ts`:
  - parse màu -> RGB
  - `getAPCATextColor(background)` để chọn `#111111` hoặc `#ffffff`
  - `ensureAPCATextColor(preferred, background, fontSize=12, fontWeight=600)` để đảm bảo ngưỡng tương phản
- Sửa token:
  - giữ `badgeBg = secondarySoft` (đúng vai trò secondary)
  - đổi `badgeText` thành màu auto đen/trắng theo APCA trên `badgeBg` (không dùng raw secondary nữa)

2) Đồng bộ cho preview `/system/experiences/services-list`
- File dùng chung đã có: `components/experiences/previews/ServicesListPreview.tsx`
- Không đổi JSX layout; chỉ để các badge tiếp tục dùng `tokens.badgeBg` + `tokens.badgeText` để nhận token mới cho cả Grid/Sidebar (Magazine hiện chủ yếu dùng overlay đen, không tạo regression).

3) Đồng bộ cho site thật `/services`
- Các file đã dùng chung token nên nhận fix tự động:
  - `components/site/services/layouts/FullWidthLayout.tsx`
  - `components/site/services/layouts/SidebarLayout.tsx`
  - `app/(site)/services/page.tsx` (giữ nguyên gọi `getServicesListColors`)
- Không mở rộng scope ngoài badge text (KISS/YAGNI).

4) Verify
- Chạy: `bunx tsc --noEmit`
- Kiểm tra thủ công 3 layout ở:
  - `/system/experiences/services-list` (tab Grid/Sidebar/Magazine)
  - `/services` (fullwidth/sidebar/magazine theo config)
- Xác nhận badge text luôn auto đen hoặc trắng, readable trên nhiều cặp primary/secondary.

5) Commit
- Tạo 1 commit sau khi pass `bunx tsc --noEmit` với message dạng fix theo convention hiện tại (không push).