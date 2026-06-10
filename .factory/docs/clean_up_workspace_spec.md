# Kế hoạch dọn dẹp file rác và thiết lập quy chuẩn giữ gìn vệ sinh Workspace

Kế hoạch này tập trung vào việc định vị và xóa bỏ toàn bộ các file rác (phôi rác, kịch bản vá, file thử nghiệm tạm thời) ở thư mục gốc của dự án, đồng thời bổ sung một quy tắc nghiêm ngặt trong `AGENTS.md` để ngăn chặn triệt để tình trạng các AI Agent sau này tự ý tạo file nháp vương vãi.

## I. Primer

### 1. TL;DR kiểu Feynman
* **Vấn đề:** Các AI Agent trước đây khi làm việc thường tự tạo ra các file kịch bản tạm thời (`rename.js`, `check_file.py`, `count_braces.py`...) để debug hoặc sửa đổi code nhanh, nhưng sau đó không dọn dẹp mà lại commit thẳng lên Git repository. Điều này làm thư mục gốc của dự án bị ô nhiễm, khó quản lý và thiếu chuyên nghiệp.
* **Giải pháp:** 
  1. Loại bỏ hoàn toàn 12 file rác đã được xác định ở thư mục gốc thông qua lệnh `git rm` để làm sạch Workspace.
  2. Bổ sung một bộ quy tắc mới mang tên `Workspace Hygiene & Cleanliness Guardrails (Quy tắc Giữ gìn Vệ sinh Workspace)` vào ngay sau mục `Core Operating Principles` của file `AGENTS.md` để nghiêm cấm hành vi này và hướng dẫn AI Agent sử dụng đúng thư mục nháp `scratch/` cũng như tự động dọn dẹp trước khi bàn giao.
* **Kết quả:** Thư mục gốc dự án sạch sẽ, đồng thời thiết lập một "tấm khiên" luật lệ để ngăn chặn các AI Agent tiếp theo bôi bẩn dự án.

### 2. Elaboration & Self-Explanation
Trong quá trình phát triển phần mềm, đặc biệt là khi kết hợp với các AI Agent tự động, chúng ta thường thấy các Agent tạo ra các script nhỏ bằng Node.js hoặc Python để thực hiện nhanh các tác vụ như đổi tên hàng loạt, đếm số ngoặc nhọn bị thiếu, hoặc vá lỗi import.
Tuy nhiên, thói quen xấu của nhiều Agent là đặt các file này ở thư mục gốc (root directory) để dễ chạy, sau đó lại "tiện tay" commit toàn bộ dự án mà không lọc bỏ chúng. 
Để giải quyết tận gốc:
* Chúng ta cần quét và xóa sạch những tàn dư cũ.
* Chúng ta cần ghi đè một luật cứng (hard rule) vào `AGENTS.md` — đây là "kinh thánh" hướng dẫn hành vi cho mọi Agent khi tiếp cận dự án này. Bằng cách đưa quy tắc giữ gìn vệ sinh vào `AGENTS.md`, bất kỳ Agent nào khởi chạy trong tương lai (kể cả chính tôi trong các lượt sau) khi đọc file hướng dẫn này sẽ bắt buộc phải tuân theo: không được tạo file nháp bừa bãi ở thư mục gốc, nếu có tạo phải nằm trong `scratch/` và bắt buộc phải xóa sạch trước khi commit/bàn giao.

### 3. Concrete Examples & Analogies
* **Ví dụ thực tế:** Các file như `count_braces.py` chỉ chứa đúng 8 dòng code để đếm xem file `page.tsx` có bị lệch dấu ngoặc nhọn hay không. Sau khi tìm ra lỗi và sửa xong, file này hoàn toàn mất đi giá trị sử dụng nhưng vẫn bị bỏ lại ở thư mục gốc và commit lên Git.
* **Analogy (Phép ẩn dụ):** Việc lập trình viên hay AI Agent tạo file nháp vương vãi rồi commit lên Git giống như một người thợ sửa ống nước đến nhà bạn làm việc. Để cắt ống nước, anh ta mang theo một chiếc cưa sắt tự chế và vài mảnh gỗ kê chân. Sau khi sửa xong ống nước rất ngon lành, anh ta lại để quên cưa sắt, gỗ kê chân và mớ mạt cưa bừa bãi ngay giữa phòng khách của bạn rồi ra về. Chúng ta cần dọn dẹp đống rác đó và dán một tấm biển cảnh báo ngay cửa: "Thợ thi công bắt buộc phải tự dọn dẹp dụng cụ và rác thải nháp trước khi ra về".

---

## II. Audit Summary (Tóm tắt kiểm tra)

Chúng tôi đã thực hiện liệt kê thư mục gốc và phát hiện **12 file rác** chính hiệu đã được commit trực tiếp vào Git repository (xác nhận thông qua lệnh `git status` báo `working tree clean` mặc dù các file này đang tồn tại):

1. `rename.js` (1.72 KB) - Script đổi tên thư mục và thay thế chuỗi.
2. `check_file.py` (196 B) - Script Python đọc 100 byte cuối của một file.
3. `count_braces.py` (329 B) - Script Python đếm số ngoặc nhọn.
4. `fix-imports.js` (1.57 KB) - Script sửa lỗi import tự động.
5. `fix_spacing.js` (2.85 KB) - Script chuẩn hóa khoảng cách code.
6. `patch-partners-2.js` (2.77 KB) - Script vá file partners lần 2.
7. `patch-partners.js` (1.60 KB) - Script vá file partners lần 1.
8. `patch-useUndoRedo.js` (7.75 KB) - Script vá hook `useUndoRedo`.
9. `patch-useUnsavedGuard.js` (1.86 KB) - Script vá hook `useUnsavedGuard`.
10. `scratch_query.js` (1.98 KB) - Script thử nghiệm truy vấn database.
11. `tmp.js` (25 B) - File Javascript rác cực ngắn.
12. `README_OLD.md` (1.48 KB) - Bản sao cũ của README không còn giá trị sử dụng.

---

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc (Root Cause):** 
  * Các AI Agent thế hệ trước thiếu đi một quy tắc ràng buộc rõ ràng về mặt hành vi giữ gìn vệ sinh thư mục làm việc (Workspace Hygiene). 
  * Khi thực hiện các thay đổi phức tạp, Agent có xu hướng viết script bổ trợ để tự động hóa, nhưng lại thiếu bước dọn dẹp (cleanup step) trước khi thực hiện commit. 
  * Hệ thống Git Hook hoặc quy trình commit tự động không lọc bỏ các file kịch bản tạm thời này.
* **Giả thuyết đối chứng (Counter-Hypothesis):** 
  * *Liệu các file này có đang được sử dụng ở đâu đó trong runtime hoặc các công cụ build không?*
  * *Kiểm tra:* Không có bất kỳ file cấu hình nào (`package.json`, `next.config.ts`, `tsconfig.json`) import hoặc gọi các file này. Chúng thuần túy là các script Node/Python độc lập phục vụ cho việc debug hoặc vá code tại một thời điểm nhất định trong lịch sử. Do đó, giả thuyết này hoàn toàn bị bác bỏ. Việc xóa bỏ chúng là an toàn 100%.

---

## IV. Proposal (Đề xuất)

1. **Xóa sạch 12 file rác** tại thư mục gốc bằng cách sử dụng công cụ Git để đảm bảo lịch sử Git được ghi nhận chuẩn xác:
   `git rm rename.js check_file.py count_braces.py fix-imports.js fix_spacing.js patch-partners-2.js patch-partners.js patch-useUndoRedo.js patch-useUnsavedGuard.js scratch_query.js tmp.js README_OLD.md`
2. **Cập nhật `AGENTS.md`**: Bổ sung thêm mục `# Workspace Hygiene & Cleanliness Guardrails` ngay sau phần `# Core Operating Principles` ở đầu file để thiết lập rào cản hành vi mạnh mẽ cho tất cả các AI Agent trong tương lai.
3. **Lưu trữ tài liệu kỹ thuật**: Lưu Spec này tại thư mục `.factory/docs/clean_up_workspace_spec.md` để đảm bảo đúng quy trình lưu trữ spec của dự án.
4. **Tạo commit duy nhất**: Commit toàn bộ các thay đổi này (bao gồm việc xóa file, cập nhật `AGENTS.md` và file spec mới) với thông điệp commit rõ ràng: `chore: clean up workspace trash files and enforce hygiene rules in AGENTS.md`.

---

## V. Files Impacted (Tệp bị ảnh hưởng)

### UI & Shared Configuration

#### [MODIFY] [AGENTS.md](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/AGENTS.md)
* **Vai trò hiện tại:** Định nghĩa các quy tắc cốt lõi, tiêu chuẩn kiến trúc, thiết kế và hành vi dành cho AI Agent khi vận hành dự án.
* **Thay đổi:** Thêm mục `# Workspace Hygiene & Cleanliness Guardrails (Quy tắc Giữ gìn Vệ sinh Workspace)` để nghiêm cấm việc tạo file rác vương vãi và yêu cầu dọn dẹp trước khi bàn giao.

#### [NEW] [.factory/docs/clean_up_workspace_spec.md](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/.factory/docs/clean_up_workspace_spec.md)
* **Vai trò hiện tại:** Không tồn tại.
* **Thay đổi:** Tạo mới file Spec để lưu trữ tài liệu về đợt dọn dẹp này và quy chuẩn đi kèm theo đúng Spec Mode Rules.

### Deleted Files (Tệp bị xóa bỏ)

* [DELETE] [rename.js](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/rename.js) - Script đổi tên và thay thế chuỗi.
* [DELETE] [check_file.py](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/check_file.py) - Script đọc 100 byte cuối của file.
* [DELETE] [count_braces.py](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/count_braces.py) - Script đếm số lượng ngoặc nhọn.
* [DELETE] [fix-imports.js](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/fix-imports.js) - Script sửa lỗi import tự động.
* [DELETE] [fix_spacing.js](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/fix_spacing.js) - Script chuẩn hóa khoảng cách.
* [DELETE] [patch-partners-2.js](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/patch-partners-2.js) - Script vá file partners lần 2.
* [DELETE] [patch-partners.js](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/patch-partners.js) - Script vá file partners lần 1.
* [DELETE] [patch-useUndoRedo.js](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/patch-useUndoRedo.js) - Script vá hook `useUndoRedo`.
* [DELETE] [patch-useUnsavedGuard.js](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/patch-useUnsavedGuard.js) - Script vá hook `useUnsavedGuard`.
* [DELETE] [scratch_query.js](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/scratch_query.js) - Script thử nghiệm truy vấn database.
* [DELETE] [tmp.js](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/tmp.js) - File JS tạm thời.
* [DELETE] [README_OLD.md](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/README_OLD.md) - File README cũ.

---

## VI. Execution Preview (Xem trước thực thi)

1. **Bước 1 (Đọc/Chỉnh):** Chỉnh sửa file `AGENTS.md` để thêm quy tắc vệ sinh workspace.
2. **Bước 2 (Tài liệu hóa):** Tạo mới file `.factory/docs/clean_up_workspace_spec.md` và sao chép nội dung Spec này vào đó.
3. **Bước 3 (Xóa bỏ rác):** Chạy lệnh `git rm` để xóa toàn bộ 12 file rác ra khỏi hệ thống theo dõi của Git và đĩa cứng.
4. **Bước 4 (Review tĩnh):** Kiểm tra lại trạng thái `git status` xem đã sạch sẽ chưa, kiểm tra file `AGENTS.md` có lỗi định dạng nào không.
5. **Bước 5 (Commit):** Tiến hành commit các thay đổi lên Git cục bộ (không push).
6. **Bước 6 (Thông báo):** Chạy âm báo hoàn thành tác vụ qua SAPI.SpVoice để thông báo cho người dùng.

---

## VII. Verification Plan (Kế hoạch kiểm chứng)

### Kiểm chứng tự động (Qua Git và Shell)
* Chạy `git status` sau khi thực thi để đảm bảo:
  * 12 file rác đã ở trạng thái `deleted`.
  * `AGENTS.md` ở trạng thái `modified`.
  * `.factory/docs/clean_up_workspace_spec.md` ở trạng thái `new file`.
* Đảm bảo không còn bất kỳ file `.js` hay `.py` không thuộc mã nguồn chính nào trôi nổi ở thư mục gốc của dự án.

### Kiểm chứng thủ công (Review trực quan)
* Người dùng mở file [AGENTS.md](file:///E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/AGENTS.md) và xác minh phần luật mới đã được bổ sung một cách mạch lạc, dễ đọc.
* Kiểm tra cấu trúc thư mục gốc trên File Explorer để thấy sự thông thoáng, sạch sẽ.

---

## VIII. Todo

- [ ] Sửa file `AGENTS.md` bằng cách bổ sung mục `# Workspace Hygiene & Cleanliness Guardrails`.
- [ ] Tạo file spec mới tại `.factory/docs/clean_up_workspace_spec.md`.
- [ ] Chạy lệnh `git rm` để xóa 12 file rác ở thư mục gốc.
- [ ] Chạy `git status` để xác minh trạng thái dọn dẹp.
- [ ] Tạo commit cục bộ ghi nhận đợt dọn dẹp này.
- [ ] Chạy âm báo `powershell -c "(New-Object -ComObject SAPI.SpVoice).Speak('Done, Sir.')"` để báo hiệu hoàn thành tác vụ.

---

## IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Điều kiện ĐẠT (Pass):**
  * Thư mục gốc hoàn toàn sạch bóng 12 file rác đã nêu.
  * File `AGENTS.md` chứa chính xác quy tắc vệ sinh mới ở vị trí trang trọng và không làm phá vỡ các quy tắc cũ.
  * File spec lưu trữ được tạo thành công trong `.factory/docs/`.
  * Toàn bộ thay đổi được commit thành công vào Git cục bộ.
  * Âm báo "Done, Sir." phát ra thành công.
* **Điều kiện KHÔNG ĐẠT (Fail):**
  * Còn sót lại bất kỳ file nào trong danh sách 12 file rác ở thư mục gốc.
  * File `AGENTS.md` bị mất đi các quy tắc cũ hoặc định dạng sai lệch.
  * Commit chứa các file rác phát sinh mới.

---

## X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro:** Cực kỳ thấp. Vì các file bị xóa hoàn toàn độc lập và không liên quan gì đến runtime hay quy trình build của Next.js hay Convex.
* **Hoàn tác (Rollback):** Nếu có bất kỳ sự cố ngoài ý muốn nào hoặc người dùng muốn khôi phục lại một script cụ thể:
  * Có thể dễ dàng khôi phục bằng lệnh Git: `git checkout HEAD~1 -- <tên-file>` hoặc `git reset --hard HEAD~1` để quay lại trạng thái trước khi dọn dẹp.

---

## XI. Out of Scope (Ngoài phạm vi)

* Không can thiệp vào các script hữu ích trong thư mục `scripts/` (ví dụ seed dữ liệu, tải ảnh...).
* Không xóa các file nháp cũ trong thư mục `scratch/` vì chúng nằm đúng phân vùng nháp được phép tồn tại, trừ khi người dùng yêu cầu làm sạch cả thư mục này sau đó.
* Không thay đổi bất kỳ logic ứng dụng hay code Next.js/Convex nào trong đợt tác vụ này.

---

## XII. Open Questions (Câu hỏi mở)
* *Hiện tại không có câu hỏi mở nào. Phương án đề xuất đã cực kỳ rõ ràng, an toàn và giải quyết triệt để yêu cầu của người dùng.*
