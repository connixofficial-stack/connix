---
name: convex-real-data-ops
description: Playbook thao tác dữ liệu thật trên Convex cho VietAdmin SaaS. Dùng khi user muốn sửa nhanh record thật, patch settings/menu/products/posts/services bằng query/mutation/action có sẵn, hoặc import batch dữ liệu từ file/folder/json/excel vào Convex mà vẫn bám source of truth, read-before-write, patch tối thiểu và verify sau khi ghi.
---

# Convex Real Data Ops

Skill này chuẩn hóa cách agent thao tác với dữ liệu thật trên Convex theo rule của repo: ưu tiên dùng surface sẵn có, không bypass business logic, luôn đọc trước khi ghi, patch tối thiểu, rồi đọc lại để verify.

## Khi nào sử dụng

- User muốn sửa dữ liệu thật nhanh trong Convex.
- User muốn import batch vào Convex từ file, folder, JSON, Excel hoặc nguồn dữ liệu có cấu trúc.
- User yêu cầu “đọc data thật rồi patch record này”.
- User muốn cập nhật settings, menu, products, posts, services, homepage hoặc module data bằng query/mutation/action hiện có.
- User yêu cầu upload storage rồi tạo/cập nhật record liên quan.

## Khi nào KHÔNG sử dụng

- Tạo module mới, thêm schema/table/index hoặc mở rộng hệ thống rộng hơn; khi đó ưu tiên `system-extension-guideline` hoặc skill chuyên biệt liên quan.
- Refactor UI/admin page/experience/home-component.
- Chỉ nghiên cứu code mà chưa thao tác dữ liệu thật.
- Task yêu cầu automation/tooling productized dài hạn thay vì chỉnh dữ liệu thật cho một nhu cầu cụ thể.

## Core Principles

1. Source of truth first
   - Đọc route/surface đang dùng trước khi đụng dữ liệu.
   - Xác định đúng query/mutation/action hiện đang đọc/ghi record đó.

2. Read before write
   - Luôn query dữ liệu hiện tại để lấy `_id`, trạng thái hiện tại, quan hệ cha-con, order và guardrails liên quan trước khi mutate.

3. Minimal patch
   - Chỉ gửi field cần đổi.
   - Không overwrite cả object nếu không cần.

4. Reuse existing business logic
   - Ưu tiên mutation/action/query có sẵn.
   - Chỉ thêm function mới khi thiếu đúng capability cần thiết.

5. Verify after write
   - Sau mutate phải đọc lại đúng surface để xác nhận kết quả thực tế.

6. Evidence over opinion
   - Khi bàn giao phải nêu rõ function đã dùng, record đã chạm, field đã đổi, before/after ngắn gọn và bước verify đã thực hiện.

7. Database bandwidth discipline
   - Không fetch all rồi filter ở JS nếu đã có index/query phù hợp.
   - Với batch lớn: dùng limit, pagination, index và xử lý theo lô nhỏ nếu cần.

## Workflow A — Quick Patch dữ liệu thật

1. Xác định surface thật đang dùng
   - Route nào đang đọc dữ liệu?
   - Convex function nào là source of truth?

2. Đọc record hiện tại
   - Lấy `_id`, field hiện tại, quan hệ liên quan, trạng thái trước khi sửa.

3. Chọn mutation/action phù hợp
   - Ưu tiên function có sẵn.
   - Nếu thiếu capability thật sự, nêu rõ gap trước khi đề xuất thêm function mới.

4. Patch tối thiểu
   - Chỉ đổi đúng field user yêu cầu.
   - Tránh sửa lan sang data liên quan nếu không có evidence cần thiết.

5. Đọc lại để verify
   - Query lại đúng record hoặc surface hiển thị thực tế sau khi mutate.

6. Bàn giao evidence
   - Function đã dùng.
   - Record đã chạm.
   - Field đã đổi.
   - Before/after ngắn gọn.
   - Verify result.

## Workflow B — Batch Import vào Convex

1. Đọc input thật
   - Xác định nguồn nhập: file/folder/json/excel/images.
   - Chuẩn hóa manifest đầu vào trước khi ghi.

2. Đọc dữ liệu Convex hiện có
   - Query categories/records/settings liên quan để biết cái gì đã tồn tại.
   - Phát hiện create/update/skip trước khi chạy batch.

3. Map input vào surface hiện có
   - Bám đúng mutation/action/query sẵn có.
   - Nếu có upload file/image, dùng flow storage chuẩn của repo trước khi create/update record.

4. Chạy batch an toàn
   - Ưu tiên lô nhỏ nếu dữ liệu lớn hoặc khó rollback.
   - Skip bản ghi trùng nếu rule yêu cầu.
   - Không rewrite toàn bộ nếu user chỉ cần thêm/sửa một phần.

5. Verify sau import
   - Query lại records vừa tạo/sửa.
   - So khớp created/updated/skipped/errors với manifest đầu vào.

6. Bàn giao evidence
   - Functions đã dùng.
   - Records đã tạo/sửa/bỏ qua.
   - Fields chính đã đổi.
   - Before/after ngắn gọn.
   - Verify summary.

## Guardrails bắt buộc

- Không tự ý thêm schema/table/function mới nếu yêu cầu chỉ là chỉnh data.
- Không insert thẳng bypass business logic khi đã có mutation/action phù hợp.
- Không silent mutate diện rộng trên dữ liệu production-like.
- Trước khi mutate diện rộng, phải nêu ngắn gọn: sẽ đọc gì → sẽ sửa gì → sẽ verify gì.
- Nếu dữ liệu có storage/file đi kèm, phải để ý cleanup/orphan risk.
- Nếu không đủ evidence để xác định đúng record hoặc đúng source of truth, phải đọc thêm trước khi ghi.

## Output format khi hoàn tất

Trả kết quả ngắn gọn nhưng phải có đủ:

1. Function(s) đã dùng.
2. Record(s) đã chạm.
3. Field(s) đã đổi.
4. Before/after ngắn gọn.
5. Bước verify đã thực hiện.
6. Nếu là batch: created / updated / skipped / errors.

## Conflict resolution

Nếu task bắt đầu chạm vào schema, index, seed system, wizard wiring hoặc thay đổi cross-layer lớn, skill này chỉ dùng cho phần data ops; phần còn lại phải ưu tiên `system-extension-guideline`.
