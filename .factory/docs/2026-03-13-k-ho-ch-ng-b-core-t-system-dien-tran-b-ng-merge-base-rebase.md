## Audit Summary
- Observation: `system-dien-tran` đang trỏ remote `core` về repo hiện tại, nên 2 repo có liên hệ git trực tiếp. Evidence: `git -C "E:\NextJS\persional_project\system-dien-tran" remote -v` cho thấy `core -> E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs`.
- Observation: merge-base giữa `system-dien-tran/master` và `core/master` chính là commit HEAD hiện tại của repo core: `8d3f2a96`. Evidence: `git merge-base master core/master` trả về `8d3f2a96`.
- Observation: `system-dien-tran/master` đang đi trước `core/master` 37 commit và core không có commit riêng sau điểm tách. Evidence: `git rev-list --left-right --count core/master...master` trả về `0 37`.
- Inference: đây là case rất thuận lợi để đồng bộ theo hướng “nâng core bằng chuỗi commit đã được kiểm chứng ở system-dien-tran”, vì không có divergence từ phía core sau split-point.
- Decision: dùng `git merge-base` để khóa đúng điểm tách, rồi rebase/cherry-pick theo batch module từ `system-dien-tran` về repo core; tránh merge toàn bộ một phát vì user muốn ưu tiên rebase theo từng module nhưng phạm vi là toàn core.

## Root Cause Confidence
- High — Vì evidence git cho thấy hai repo cùng lịch sử, điểm tách rõ ràng, và toàn bộ nâng cấp đang nằm phía `system-dien-tran` (37 commit ahead, 0 commit behind từ góc nhìn core). Rủi ro chính không nằm ở git history mà nằm ở conflict logic/app-specific khi áp commit về core.
- Counter-hypothesis đã xét: có thể 2 repo đã drift mạnh ở file tree dù chung ancestry. Chưa loại trừ hoàn toàn vì chưa diff theo module/file, nên execution cần thêm bước inventory trước khi rebase batch.

## Proposal
### Mục tiêu
Đồng bộ repo core `system-vietadmin-nextjs` với các cải tiến tốt từ `system-dien-tran`, ưu tiên code mới của `system-dien-tran`, nhưng vẫn kiểm soát rủi ro theo từng module thay vì rebase một lần toàn bộ.

### Chiến lược được đề xuất
**Option A (Recommend) — Rebase/cherry-pick theo batch module trên repo core dựa trên merge-base**
- Confidence 90%.
- Vì lịch sử hiện tại là linear từ core sang `system-dien-tran`, ta có thể lấy các commit sau merge-base và áp ngược về core theo nhóm logic. Cách này giữ được lợi ích “ưu tiên code mới từ system-dien-tran”, đồng thời cô lập conflict theo module để rollback dễ.
- Tradeoff: tốn công phân loại commit hơn merge một phát.

**Option B — Rebase một lần toàn bộ 37 commit vào core**
- Confidence 60%.
- Phù hợp nếu muốn đồng bộ nhanh và chấp nhận xử lý conflict lớn một lần.
- Tradeoff: khó review, khó rollback từng phần, dễ kéo theo thay đổi app-specific của `system-dien-tran` không phù hợp với core.

### Kế hoạch thực thi chi tiết
1. **Khóa split point và chụp phạm vi commit cần nâng**
   - Dùng `git merge-base core/master system-dien-tran/master` để khóa commit gốc.
   - Sinh danh sách commit sau split point: `git log --reverse --oneline <merge-base>..system-dien-tran/master`.
   - Mục tiêu: có danh mục chính xác tất cả nâng cấp sẽ cân nhắc đưa về core.

2. **Phân loại commit theo module thay vì theo thời gian**
   - Nhóm các commit thành các batch như: routing, UI shell, home-components, experience, data/convex, SEO, bugfix hạ tầng.
   - Với mỗi commit, map sang file paths bị ảnh hưởng để phát hiện commit app-specific của `system-dien-tran` cần bỏ qua hoặc chỉnh tay.
   - Output mong đợi: một migration matrix kiểu `commit -> module -> keep/adapt/skip`.

3. **Tạo nhánh tích hợp an toàn từ core/master**
   - Dù bạn chọn base là `master`, lúc thực thi nên tạo working branch tạm kiểu `sync/dien-tran-core-upgrade` từ `master` để không làm bẩn nhánh gốc.
   - Không push; chỉ commit local sau mỗi batch ổn định.

4. **Áp thay đổi theo batch từ thấp lên cao**
   - Thứ tự khuyến nghị:
     1. shared libs / utils / types
     2. data layer / convex schema / query helpers
     3. routing & app structure
     4. UI shared components
     5. feature modules
     6. SEO / metadata / polish fixes
   - Mỗi batch dùng một trong hai cách:
     - `git cherry-pick <range>` nếu batch commit sạch và cohesive.
     - `git checkout <system-dien-tran-commit> -- <paths>` + commit tay nếu commit bị trộn nhiều concern.
   - Lý do: user muốn “rebase theo từng module nhỏ”; về thực tiễn, cherry-pick/restore theo batch an toàn hơn rebase branch-to-branch khi đồng bộ giữa hai repo làm việc song song.

5. **Quy tắc resolve conflict mặc định**
   - Ưu tiên code mới từ `system-dien-tran` ở phần generic/core.
   - Giữ code hiện tại của core ở phần branding, content, tenant-specific config, SEO nội dung riêng.
   - Checklist resolve từng file:
     - File này là core reusable hay app-specific?
     - Có thay đổi schema/data contract không?
     - Có ảnh hưởng route public/admin hiện có không?
     - Có đang đè customization chỉ tồn tại ở core không?

6. **Commit checkpoint sau mỗi batch**
   - Mỗi batch 1 commit rõ nghĩa, ví dụ: `feat: sync core data layer from system-dien-tran`.
   - Nếu batch fail, reset về checkpoint gần nhất thay vì gỡ conflict trên toàn bộ 37 commit.

7. **Review tĩnh trước bàn giao**
   - Theo guideline repo, không chạy lint/test/build.
   - Chỉ làm static review: type flow, null-safety, import graph, data compatibility, backward compatibility của routes/schema.
   - Khi vào execution thực tế, nếu có thay đổi TypeScript code thì chỉ chạy `bunx tsc --noEmit` trước commit theo rule của repo.

8. **Commit cuối cùng trên repo core**
   - Sau khi hoàn tất các batch, review `git status`, `git diff --cached`, rà secrets, rồi commit local.
   - Không push.

### Lệnh git khung dự kiến khi thực thi
```bash
git -C "E:\NextJS\persional_project\system-dien-tran" merge-base master core/master
git -C "E:\NextJS\persional_project\system-dien-tran" log --reverse --oneline <merge-base>..master
git -C "E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs" checkout -b sync/dien-tran-core-upgrade
# sau đó áp từng batch bằng cherry-pick hoặc checkout path-based từ repo nguồn
```

### Guardrails quan trọng
- Không merge trực tiếp `system-dien-tran/master` vào `core/master` vì sẽ kéo cả custom app behavior lẫn history khó kiểm soát.
- Không rebase một phát nếu chưa có inventory file-level.
- Ưu tiên batch nhỏ, commit nhỏ, dễ rollback.
- Nếu phát hiện module nào ở `system-dien-tran` đã diverge mạnh theo business riêng, chuyển sang mode “extract fix pattern” thay vì bê nguyên file.

## Verification Plan
- Repro: xác nhận lại merge-base và danh sách 37 commit nguồn trước khi đụng code.
- Static verify mỗi batch: review file diff, imports, typings, null-safety, compatibility dữ liệu cũ.
- Typecheck: chỉ khi bắt đầu execution và có thay đổi TS/code thì chạy `bunx tsc --noEmit` đúng theo guideline repo.
- Pass criteria:
  1. Core nhận được các nâng cấp generic từ `system-dien-tran` theo từng batch rõ ràng.
  2. Không kéo nhầm customization riêng của app `system-dien-tran`.
  3. Lịch sử commit local trên core sạch, rollback được theo từng batch.
  4. Kết thúc bằng commit local, không push.

Nếu bạn duyệt spec này, bước execution đầu tiên của tôi sẽ là lập **migration matrix 37 commit** để tách rõ commit nào `keep / adapt / skip`, rồi mới áp batch đầu tiên vào repo core.