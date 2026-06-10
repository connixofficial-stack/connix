# I. Primer
## 1. TL;DR kiểu Feynman
- Hiện SpeedDial đang render như 1 home-component nên chỉ thấy ở homepage.
- Ta sẽ thêm 2 option trong create/edit: `Mặc định mở/đóng` (default = mở) và `Hiển thị toàn site`.
- Khi bật `Hiển thị toàn site`, SpeedDial sẽ được render ở `SiteShell` (mọi route public), không còn bị giới hạn ở trang chủ.
- Để tránh render trùng ở homepage, homepage sẽ bỏ qua SpeedDial nếu option toàn site đang bật.
- Theo yêu cầu mới của bạn: **không khóa “luôn bên phải”**, chỉ tăng margin phải trên mobile thêm 2px để tránh đụng thanh scroll.

## 2. Elaboration & Self-Explanation
Bạn đang gặp đúng bản chất kiến trúc hiện tại: SpeedDial là “khối nội dung trang chủ”, nên engine trang chủ render nó, còn các route public khác không đi qua engine này thì không có SpeedDial. Cách xử lý đúng là giữ logic cấu hình ở home-component (để không phá luồng admin hiện tại), nhưng thêm một nhánh render global tại shell public. Nhánh global chỉ hoạt động khi cờ `showOnAllPages=true`, còn mặc định vẫn giữ behavior cũ để không ảnh hưởng dữ liệu hiện có.

Phần “mặc định mở/đóng” sẽ được lưu vào config và dùng trực tiếp trong `SpeedDialSectionShared` để khởi tạo trạng thái open. Mặc định đặt là mở (`true`) như bạn yêu cầu.

Riêng yêu cầu vị trí: bạn đã đổi ý, nên mình không ép “luôn phải”. Mình chỉ chỉnh offset mobile khi đang ở bên phải thành `right-[2px]` (desktop giữ như cũ) để tránh sát mép/scrollbar.

## 3. Concrete Examples & Analogies
- Ví dụ cụ thể theo task:
  - Bạn bật `Hiển thị toàn site = ON` ở `/admin/home-components/speed-dial/.../edit`.
  - Vào `/`, `/products`, `/blog/abc` đều thấy SpeedDial.
  - Vào homepage sẽ **không bị nhân đôi** vì homepage renderer bỏ qua SpeedDial khi cờ global bật.
- Analogy đời thường: giống như treo chuông gọi phục vụ ở sảnh chung của tòa nhà (SiteShell) thay vì chỉ treo trong một phòng (homepage).

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  1) `HomePageClient` chỉ render danh sách home components cho route `/` (`app/(site)/_components/HomePageClient.tsx`).
  2) `SiteShell` là khung chung của toàn bộ public routes và hiện chưa mount SpeedDial (`components/site/SiteShell.tsx`).
  3) `SpeedDialSectionShared` đang khởi tạo `isOpen=false`, nên mặc định đóng (`app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`).
  4) Form create/edit hiện chưa có field `defaultOpen` và `showOnAllPages`.
- Inference:
  - Root cause chính là SpeedDial bị ràng buộc lifecycle vào homepage renderer, không có global mount point.
- Decision:
  - Thêm config + global renderer có điều kiện + chống duplicate ở homepage.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Trả lời 8 câu (bắt buộc):
  1. Triệu chứng: kỳ vọng hiển thị mọi trang, thực tế chỉ homepage; kỳ vọng default mở, thực tế default đóng.
  2. Phạm vi: toàn bộ public site routes trong `app/(site)`; admin create/edit speed-dial.
  3. Tái hiện: ổn định 100% vì kiến trúc render hiện tại cố định theo route.
  4. Mốc thay đổi gần nhất: chưa thấy cơ chế global render SpeedDial trong shell.
  5. Thiếu dữ liệu: không thiếu blocker nào sau khi bạn đã xác nhận scope bằng AskUser.
  6. Giả thuyết thay thế: “do CSS ẩn ở trang khác” -> bị loại trừ vì route khác không mount component.
  7. Rủi ro nếu fix sai nguyên nhân: thêm CSS/form nhưng vẫn không hiện toàn site.
  8. Tiêu chí pass/fail: bật cờ global thì mọi route public có SpeedDial; defaultOpen=true thì vào trang thấy mở sẵn.

- Root Cause Confidence (Độ tin cậy nguyên nhân gốc): **High**
  - Vì evidence trực tiếp từ flow render: homepage mount qua `HomePageClient`, global shell chưa mount SpeedDial.

```mermaid
flowchart TD
A[Admin SpeedDial Config] --> B{showOnAllPages?}
B -- No --> C[Render trong HomePageClient]
B -- Yes --> D[Render trong SiteShell GlobalSpeedDial]
D --> E[Hiện ở mọi route app(site)]
C --> F[Chỉ hiện homepage]
```

# IV. Proposal (Đề xuất)
1. Thêm 2 field config mới cho SpeedDial:
   - `defaultOpen: boolean` (mặc định `true`).
   - `showOnAllPages: boolean` (mặc định `false` để backward-compatible).
2. Mở rộng UI create/edit:
   - Thêm toggle “Mặc định mở”.
   - Thêm toggle “Hiển thị toàn site public”.
3. Mở rộng renderer:
   - `SpeedDialSection` + `SpeedDialSectionShared` nhận `defaultOpen` và dùng để init trạng thái open.
4. Mount global:
   - Tạo `GlobalSpeedDial` trong `components/site`, mount ở `SiteShell`.
   - Chỉ render khi tìm thấy SpeedDial active và `showOnAllPages=true`.
5. Chống trùng ở homepage:
   - `HomePageClient` lọc bỏ SpeedDial khi `showOnAllPages=true`.
6. Mobile right spacing:
   - Chỉ khi position là right và context site: đổi offset mobile sang `right-[2px]` (desktop giữ chuẩn hiện tại).

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `app/admin/home-components/speed-dial/_types/index.ts`  
  Vai trò hiện tại: định nghĩa shape config SpeedDial.  
  Thay đổi: thêm `defaultOpen`, `showOnAllPages`.

- **Sửa:** `app/admin/home-components/speed-dial/_lib/constants.ts`  
  Vai trò hiện tại: default config SpeedDial.  
  Thay đổi: set default `defaultOpen: true`, `showOnAllPages: false`.

- **Sửa:** `app/admin/home-components/create/speed-dial/page.tsx`  
  Vai trò hiện tại: create speed-dial payload.  
  Thay đổi: quản lý state 2 toggle và submit vào config.

- **Sửa:** `app/admin/home-components/speed-dial/[id]/edit/page.tsx`  
  Vai trò hiện tại: edit speed-dial và snapshot dirty-check.  
  Thay đổi: normalize/load/save 2 field mới + đưa vào snapshot.

- **Sửa:** `app/admin/home-components/speed-dial/_components/SpeedDialForm.tsx`  
  Vai trò hiện tại: form cấu hình vị trí + actions.  
  Thay đổi: thêm UI 2 toggle cấu hình mới.

- **Sửa:** `app/admin/home-components/speed-dial/_components/SpeedDialPreview.tsx`  
  Vai trò hiện tại: preview speed-dial trong admin.  
  Thay đổi: truyền `defaultOpen` xuống shared preview.

- **Sửa:** `components/site/SpeedDialSection.tsx`  
  Vai trò hiện tại: normalize config SpeedDial cho site.  
  Thay đổi: normalize `defaultOpen` và pass xuống shared.

- **Sửa:** `app/admin/home-components/speed-dial/_components/SpeedDialSectionShared.tsx`  
  Vai trò hiện tại: renderer chung preview/site + state open/close.  
  Thay đổi: dùng `defaultOpen` làm initial open; chỉnh offset phải mobile +2px ở context site.

- **Thêm:** `components/site/GlobalSpeedDial.tsx`  
  Vai trò hiện tại: chưa có.  
  Thay đổi: component global render SpeedDial toàn public site theo cờ config.

- **Sửa:** `components/site/SiteShell.tsx`  
  Vai trò hiện tại: shell chung public routes (Header/Main/Footer).  
  Thay đổi: mount `<GlobalSpeedDial />`.

- **Sửa:** `app/(site)/_components/HomePageClient.tsx`  
  Vai trò hiện tại: render home components ở homepage.  
  Thay đổi: bỏ render SpeedDial local khi `showOnAllPages=true` để tránh duplicate.

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật type/constants để có contract config mới.
2. Nối wiring create/edit/form/preview cho 2 toggle.
3. Nối wiring runtime (`SpeedDialSection` + shared) cho `defaultOpen` và right offset mobile +2px.
4. Tạo `GlobalSpeedDial` và mount trong `SiteShell`.
5. Update `HomePageClient` filter chống trùng.
6. Review tĩnh toàn bộ flow config cũ/mới.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm chứng thủ công (không chạy lint/unit test theo quy ước repo):
  1) Create mới SpeedDial: mặc định toggle “Mặc định mở” = bật.  
  2) Bật “Hiển thị toàn site public”, lưu -> kiểm tra `/`, `/blog`, `/products` đều có SpeedDial.  
  3) Homepage không render double SpeedDial khi cờ global bật.  
  4) Tắt cờ global -> chỉ homepage có SpeedDial như cũ.  
  5) Mobile viewport: vị trí phải có offset 2px, không dính mép scroll.
- Static type check trước commit: `bunx tsc --noEmit`.

# VIII. Todo
1. Mở rộng SpeedDial config type + default constants.
2. Cập nhật create/edit/form/preview cho `defaultOpen` + `showOnAllPages`.
3. Cập nhật renderer shared cho default-open và mobile right offset +2px.
4. Tạo GlobalSpeedDial và mount vào SiteShell.
5. Chống duplicate ở homepage khi bật global.
6. Tự review tĩnh + typecheck `bunx tsc --noEmit` + commit.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Có 2 option mới trong create/edit SpeedDial: `Mặc định mở/đóng` và `Hiển thị toàn site public`.
- Giá trị mặc định của `Mặc định mở/đóng` là **mở**.
- Khi `Hiển thị toàn site public = ON`, SpeedDial xuất hiện ở mọi route public trong `app/(site)`.
- Homepage không bị nhân đôi SpeedDial khi cờ global bật.
- Ở mobile, khi đặt bên phải, SpeedDial lệch vào trong thêm 2px so với mép phải hiện tại.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro chính: render trùng ở homepage nếu filter chưa đúng.
- Rủi ro phụ: dữ liệu cũ không có field mới -> cần normalize fallback an toàn.
- Rollback: revert các file SpeedDial + SiteShell + HomePageClient, behavior quay lại hiện trạng cũ.

# XI. Out of Scope (Ngoài phạm vi)
- Không thay đổi logic/UX các home-component khác.
- Không refactor lớn kiến trúc site renderer ngoài phần cần cho SpeedDial global.
- Không can thiệp khu admin routes (ngoài form cấu hình speed-dial).
