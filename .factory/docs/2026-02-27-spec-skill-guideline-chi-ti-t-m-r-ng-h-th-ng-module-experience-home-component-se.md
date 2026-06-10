## Problem Graph
1. [Main] Chuẩn hoá guideline mở rộng hệ thống để tránh xung đột khi thêm/sửa Module, Experience, Home Component, Seed/Wizard, Convex
   1.1 [Sub] Guideline hiện có phân tán nhiều skill, chưa có 1 “master playbook” bắt buộc gate chung
      1.1.1 [ROOT CAUSE] Thiếu 1 skill điều phối end-to-end với contract/checklist thống nhất cross-layer
   1.2 [Sub] Thiếu quy tắc chống xung đột giữa `/system/modules`, `/system/experiences`, `/admin/home-components`, `/system/data` + seed wizard
   1.3 [Sub] Thiếu gate strict để chặn merge logic sai (feature toggle không sync UI, pagination không ăn settings, seed/cleanup storage thiếu)

## Execution (with reflection)
1. Solving 1.1.1 — tạo skill mới ở project scope
   - Action: Tạo thư mục `/.factory/skills/system-extension-guideline/` với các file:
     - `SKILL.md` (entrypoint + workflow bắt buộc)
     - `CHECKLISTS.md` (strict gate checklist)
     - `REFERENCE.md` (mapping chuẩn file/path + naming + convention)
     - `TEMPLATES.md` (snippet template cho module/experience/home-component/seed)
   - Reflection: ✓ Phù hợp yêu cầu “team dùng chung + full playbook”.

2. Đánh giá guideline hiện tại và nêu điểm cần bổ sung (trong skill mới, mục “Gap Analysis”)
   - Action: Tổng hợp từ các skill hiện có (`module-creator`, `experiences-builder`, `create-home-component`, `module-qa-tester`, `coc-module-system`) thành 1 bảng:
     - Đã tốt: pattern CRUD, config tabs, preview styles, QA checklist nền
     - Thiếu/đụng nhau: cross-feature contract, seed wizard contract, Convex cleanup contract, integration gate bắt buộc
   - Reflection: ✓ Trả lời trực diện câu hỏi “design pattern đã chuẩn chưa”.

3. Thiết kế “Master Contract” cho 4 luồng user yêu cầu
   - Action: Viết section bắt buộc trong `SKILL.md` theo đúng 4 bài toán:
     1) **Tạo module mới** `/system/modules/*`
     2) **Tạo experience mới** `/system/experiences/*`
     3) **Tạo home-component mới** `/admin/home-components/*`
     4) **Thêm seed + cấu hình wizard** `/system/data`
   - Mỗi mục có: input contract → file phải sửa → acceptance criteria → anti-pattern cấm.
   - Reflection: ✓ Đúng yêu cầu chi tiết, không mở rộng ngoài scope.

4. Chuẩn hóa Convex full-scope (strict)
   - Action: Thêm chương “Convex Full Contract” gồm:
     - Schema + index strategy (equality trước, range/sort sau)
     - Query/mutation validators + pagination chuẩn
     - Không N+1, không collect bừa, giới hạn default/max
     - Seed module + clear data + storage cleanup + idempotency
     - Seed wizard wiring (registry, dependencies, cascade)
   - Reflection: ✓ Khớp lựa chọn của bạn: “Full Convex scope”.

5. Tạo strict quality gate (bắt buộc pass)
   - Action: `CHECKLISTS.md` sẽ chia 5 gate fail-fast:
     - Gate A: Schema/Index/Validator
     - Gate B: System↔Admin sync (feature/field/settings)
     - Gate C: Experience↔Module dependency 1-way
     - Gate D: Home preview↔render parity + style fallback order
     - Gate E: Seed wizard + cleanup + rerun safety
   - Rule: Gate nào fail thì không được coi task hoàn tất.
   - Reflection: ✓ Khớp lựa chọn “Strict gate”.

6. Thêm template thực thi để giảm lỗi khi làm thật
   - Action: `TEMPLATES.md` chứa snippet ngắn cho:
     - module definition/config
     - list page đọc `{module}PerPage`
     - create/edit conditional fields
     - experience config+preview shell
     - seed/clear mutations + wizard registry entry
   - Reflection: ✓ Tăng tính áp dụng, giảm copy-paste sai.

7. Bổ sung “nên thêm hướng dẫn ở đâu” (đúng câu hỏi của bạn)
   - Action: Trong `SKILL.md` sẽ có mục “Where to place guidance”:
     - **Nguồn chuẩn duy nhất:** `/.factory/skills/system-extension-guideline/*`
     - Skill chuyên biệt cũ giữ nguyên, nhưng phải tham chiếu về skill master này khi làm thay đổi cross-domain.
   - Reflection: ✓ Tránh phân mảnh tài liệu và xung đột chuẩn.

8. Xác minh chất lượng trước khi bàn giao
   - Action: Soát lại naming/frontmatter theo `skill-writer`; kiểm tra consistency với path conventions hiện tại; đảm bảo nội dung tiếng Việt, KISS/DRY/YAGNI.
   - Reflection: ✓ Đảm bảo skill mới dùng được ngay cho team.

## Deliverables cụ thể sau khi bạn duyệt
- `/.factory/skills/system-extension-guideline/SKILL.md`
- `/.factory/skills/system-extension-guideline/CHECKLISTS.md`
- `/.factory/skills/system-extension-guideline/REFERENCE.md`
- `/.factory/skills/system-extension-guideline/TEMPLATES.md`

Nếu bạn duyệt spec này, tôi sẽ implement luôn đúng cấu trúc trên, nội dung full-playbook + strict gate + full Convex coverage.