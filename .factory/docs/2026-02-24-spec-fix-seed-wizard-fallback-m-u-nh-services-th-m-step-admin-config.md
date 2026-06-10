## Problem Graph
1. [Main] Nâng cấp Seed Wizard ở `/system/data` để không lỗi khi seed thiếu dữ liệu ngành + bổ sung bước Admin Config
   1.1 [Sub] Fallback màu single/dual theo ngành từ `public/seed_mau`
      1.1.1 [ROOT CAUSE] Hiện wizard chỉ set `brandColor` cơ bản từ template, chưa có engine chọn palette best-practice theo ngành và chưa xử lý thiếu màu phụ cho dual
   1.2 [Sub] Fallback ảnh bài viết để tránh 400 ở `/admin/posts`
      1.2.1 [ROOT CAUSE] Seed posts có thể nhận URL ảnh không hợp lệ/thiếu nguồn khi ngành không có ảnh phù hợp
   1.3 [Sub] Sai lệch services (không chọn nhưng vẫn còn dữ liệu ở `/admin/services`)
      1.3.1 [ROOT CAUSE] Luồng module sync tắt module chưa đảm bảo clear dữ liệu module tương ứng theo mong muốn
   1.4 [Sub] Bổ sung step `Admin Config` trong wizard
      1.4.1 [ROOT CAUSE] Wizard chưa có bước nhập credential admin, chưa có fallback mặc định

## Execution (with reflection)
1. Solving 1.1.1 – Thiết kế engine fallback màu ngành (single/dual)
   - Thought: Cần nguồn màu theo ngành + fallback deterministic để dùng ổn định cho mọi lần seed.
   - Action:
     - Rà soát cấu trúc `public/seed_mau/**` để tìm metadata/pattern màu hiện có.
     - Tạo utility mới (ví dụ `lib/seed-color-fallback.ts`) gồm:
       - `getIndustryBestPracticePalette(industryKey)` trả về `{ primary, secondary, modeHints }`.
       - Nếu ngành thiếu mapping: dùng nhóm ngành gần nhất hoặc palette mặc định theo cluster (food, beauty, tech, healthcare...).
       - Dual mode: sinh màu phụ bằng thuật toán best-practice (không chỉ copy màu chính): ưu tiên cặp bổ trợ/analogous có contrast tốt cho UI.
       - Single mode: trả một màu chính tối ưu theo ngành.
     - Tích hợp vào `SeedWizardDialog.tsx`:
       - Khi `handleIndustryChange`, set `businessInfo.brandColor` + `brandSecondary` từ engine mới.
       - Trước khi `setSettings`, chuẩn hóa lại brand color theo mode:
         - single: chỉ primary.
         - dual: luôn có secondary hợp lệ (tính tự động nếu user chưa nhập).
   - Reflection: ✓ Đúng yêu cầu “single/dual đều có màu best practice theo ngành”, đồng thời không phụ thuộc việc user tự nhập màu phụ.

2. Solving 1.2.1 – Fallback ảnh bài viết để tránh lỗi 400
   - Thought: User chọn “random từ ngành khác” khi thiếu ảnh; cần cơ chế an toàn tuyệt đối.
   - Action:
     - Xác định luồng seed posts trong `convex/seed/**` (module posts, asset resolver).
     - Tạo helper chọn ảnh:
       - Ưu tiên ảnh ngành đang chọn.
       - Nếu rỗng/không tồn tại: random từ pool ảnh của các ngành khác trong `public/seed_mau`.
       - Validate path trước khi ghi (chỉ cho phép path nội bộ `/seed_mau/...` tồn tại).
       - Nếu vẫn không có ảnh: fallback cuối cùng về placeholder nội bộ hợp lệ (để chặn 400 tuyệt đối).
     - Cập nhật seed posts để luôn ghi `featuredImage` hợp lệ hoặc `null` an toàn (theo schema thực tế), không ghi URL hỏng.
   - Reflection: ✓ Đáp ứng yêu cầu random ảnh ngành khác + chống lỗi `/image 400` ở `/admin/posts`.

3. Solving 1.3.1 – Không chọn services thì clear dữ liệu services
   - Thought: User muốn “không seed services và clear services nếu module tắt”.
   - Action:
     - Trong `SeedWizardDialog.handleSeed` sau `syncModules(selectedModules)`:
       - Nếu `!hasServices` thì gọi clear dữ liệu services (`clearModule({ module: 'services' })` hoặc mutation tương ứng trong seedManager nếu đã có).
       - Đảm bảo không đưa `services` vào `seedConfigs` khi không chọn.
     - Kiểm tra phụ thuộc module khác để không clear nhầm quan hệ bắt buộc.
   - Reflection: ✓ Đồng bộ trạng thái wizard với dữ liệu thực tế ở `/admin/services`.

4. Solving 1.4.1 – Thêm step Admin Config trong wizard
   - Thought: Cần step riêng nhập email/password admin, fallback mặc định nếu bỏ trống.
   - Action:
     - Mở rộng types trong `components/data/seed-wizard/types.ts`:
       - `adminConfig: { email: string; password: string }`.
     - Tạo step mới `components/data/seed-wizard/steps/AdminConfigStep.tsx`:
       - Form 2 trường email/password.
       - Hint fallback mặc định: `tranmanhhieu10@gmail.com` / `123456`.
     - Chèn step `adminConfig` vào flow `steps` trong `SeedWizardDialog.tsx` (sau business hoặc trước review).
     - Trong `handleSeed`, ghi cấu hình vào nơi hệ thống đang dùng cho auto login/admin config (ưu tiên module settings hiện hữu hoặc key phù hợp ở `/system/admin-config`).
       - Nếu user để trống: tự động set mặc định theo yêu cầu.
   - Reflection: ✓ Đúng yêu cầu thêm bước ở wizard, không bắt user thao tác thêm sau seed.

5. Sửa fallback avatar admin lỗi ở `/admin`
   - Thought: lỗi ảnh avatar thường do URL rỗng/invalid.
   - Action:
     - Tìm component hiển thị avatar admin (header/profile) và logic đọc `admin-config`.
     - Bổ sung fallback cứng:
       - Nếu URL avatar không hợp lệ hoặc load fail → hiển thị initials/default avatar local.
       - Tránh render `next/image` với src invalid gây 400.
   - Reflection: ✓ Giảm lỗi ảnh runtime, UX ổn định hơn.

6. Websearch cho “màu best-practice theo ngành” như user yêu cầu
   - Thought: User yêu cầu “websearch kỹ” để palette single/dual “đỉnh”.
   - Action:
     - Dùng `WebSearch` tổng hợp nguồn 2026 về industry color psychology, accessibility contrast, và palette thực chiến cho e-commerce/brand.
     - Chốt bảng mapping ngành → palette đề xuất (single + dual) có lý do ngắn gọn và ưu tiên contrast.
     - Áp vào utility ở bước 1.
   - Reflection: ✓ Đảm bảo quyết định màu có cơ sở thay vì hardcode tùy ý.

7. Validation + commit theo rule repo
   - Action:
     - Chạy `bunx tsc --noEmit` sau khi sửa code TS/TSX.
     - Nếu lỗi, fix đến khi pass.
     - Kiểm tra `git status`, `git diff --cached` để tránh lộ secret.
     - Commit 1 commit gọn theo scope thay đổi (không push).
   - Reflection: ✓ Tuân thủ đúng CLAUDE.md/AGENTS.md.

## File dự kiến tác động
- `components/data/SeedWizardDialog.tsx`
- `components/data/seed-wizard/types.ts`
- `components/data/seed-wizard/steps/AdminConfigStep.tsx` (mới)
- `lib/seed-color-fallback.ts` (mới)
- `lib/seed-templates.ts` hoặc nơi map ngành hiện có (nếu cần nối metadata)
- `convex/seed/**` (posts seed + asset fallback)
- `convex/seedManager.ts` hoặc mutation clear module liên quan services (nếu thiếu)
- Component avatar admin ở `/admin` (file sẽ xác định chính xác khi grep)

Nếu bạn duyệt spec này, mình sẽ implement full luôn theo đúng flow trên, có websearch màu ngành trước rồi mới code mapping palette.