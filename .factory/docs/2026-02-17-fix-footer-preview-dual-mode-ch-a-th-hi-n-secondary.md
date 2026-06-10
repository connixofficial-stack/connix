## Mục tiêu
Sửa Footer home-component để ở `mode='dual'` preview thể hiện secondary color đúng theo skill dual-brand-color-system, đồng thời giữ parity giữa preview và site render.

## Phạm vi file dự kiến
- `app/admin/home-components/footer/**` (preview/edit/create + lib colors liên quan)
- `components/site/**Footer*` (render thực tế nếu đang tách riêng)

## Kế hoạch thực hiện (Option A - balanced, an toàn)
1. Audit luồng màu Footer hiện tại
- Rà các file Footer preview + helper để xác định điểm đang dùng primary thay vì secondary trong dual mode.
- Lập map element: heading, subtitle/label, divider, links phụ, badge/tag, icon accents, CTA.

2. Chuẩn hóa resolver theo mode trong helper màu
- `single` => secondaryResolved = primary (monochromatic).
- `dual` => dùng secondary hợp lệ, fallback theo rule hiện có.
- Thêm guard parse màu an toàn trước xử lý OKLCH/APCA nếu còn thiếu.

3. Điều chỉnh palette/Footer tokens theo Element-Level rules
- Giữ primary cho heading/CTA/action chính.
- Áp secondary cho subtitle/label, divider, border accent, link phụ, badge/tag, một phần icon accents.
- Không đẩy secondary quá mạnh (balanced), chỉ tăng đủ nhận diện trong dual mode.

4. Áp dụng vào toàn bộ Footer preview layouts
- Cập nhật từng layout preview để secondary xuất hiện ở 2-4 điểm đủ lớn (không chỉ icon nhỏ).
- Giữ neutral cho placeholder/background theo checklist.

5. Đồng bộ render thực tế
- Đảm bảo site render dùng cùng helper/tokens với preview (single source of truth).
- Loại hardcode màu lệch nếu có.

6. Verify & commit
- Chạy `bunx tsc --noEmit` (theo AGENTS.md).
- Kiểm tra route edit Footer ở dual mode để confirm secondary hiển thị rõ.
- Commit 1 commit fix, không push.

## Kết quả kỳ vọng
- Dual mode Footer preview có secondary rõ ràng, đúng vai trò element-level.
- Single mode không bị ảnh hưởng.
- Preview và render đồng nhất màu.