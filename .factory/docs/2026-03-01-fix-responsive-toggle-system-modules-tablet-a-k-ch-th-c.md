## Problem Graph
1. [Main] Toggle module bị vỡ bố cục ở tablet/khung trung gian <- depends on 1.1, 1.2
   1.1 [Sub] Card quá chật ở breakpoint trung gian do 3 cột xuất hiện sớm + nội dung title/badge dài
      1.1.1 [ROOT CAUSE] Grid `lg:grid-cols-3` làm card hẹp ở 1024px, trong khi header card chưa tối ưu responsive
   1.2 [Sub] Toggle đặt ở cụm góc phải header cùng title/badge nên dễ chèn/đè khi text dài

## Execution (with reflection)
1. Solving 1.1.1 (layout grid):
   - Thought: Trì hoãn layout 3 cột sang màn lớn hơn để tablet luôn đủ không gian.
   - Action: Sửa `app/system/modules/page.tsx` phần grid module từ `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` thành `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` (hoặc tương đương mobile-first ổn định).
   - Reflection: ✓ Giảm mật độ card ở tablet landscape, tránh ép chiều ngang.

2. Solving 1.2 (header card/toggle):
   - Thought: Theo lựa chọn của anh, tách toggle xuống hàng riêng dưới nội dung chính để không đè title/badge.
   - Action: Sửa `app/system/modules/_components/ModuleCard.tsx`:
     - Tách phần title và badge: title 1 hàng, badge sang hàng riêng (`flex-wrap`) bên dưới title.
     - Giữ icon + nội dung ở khối trên; chuyển cụm toggle (kèm trạng thái lock/needParent) thành hàng action riêng bên dưới khối nội dung.
     - Đảm bảo cụm toggle có `shrink-0`, căn phải ổn định; text cảnh báo không đẩy lệch switch.
     - Giữ nguyên logic business (toggle/cascade/dependency), chỉ đổi className/cấu trúc JSX để responsive.
   - Reflection: ✓ Đúng kỳ vọng “toggle nằm hàng riêng”, badge không chèn chữ.

3. Hardening responsive cho mọi size:
   - Thought: Không chỉ tablet, cần ổn từ mobile đến desktop.
   - Action:
     - Dùng `flex-wrap`, `min-w-0`, `break-words`/`truncate` hợp lý cho title/description.
     - Kiểm tra các state: module enabled/disabled, core locked, có dependents, có dependencies dài.
   - Reflection: ✓ UI ổn định khi dữ liệu dài/ngôn ngữ dài.

4. Verify trước commit:
   - Thought: Theo rule repo, chỉ chạy typecheck TS khi có đổi code TS/TSX.
   - Action: Chạy `bunx tsc --noEmit`.
   - Reflection: ✓ Nếu pass thì commit.

5. Commit (không push):
   - Thought: Repo yêu cầu mọi thay đổi code phải commit.
   - Action:
     - `git status` + `git diff --cached` để rà soát file và tránh lộ secret.
     - Commit message đề xuất: `fix(system-modules): stabilize module card toggle layout on tablet`.
     - Nếu có `.factory/docs` thì add kèm theo rule dự án.
   - Reflection: ✓ Hoàn tất yêu cầu, không mở rộng scope.

### Kết quả mong đợi
- Tablet không còn hiện tượng toggle đè/chèn nội dung.
- Badge xuống hàng riêng, đọc rõ ràng.
- Card ổn định ở mobile/tablet/desktop, không đổi logic backend/toggle.