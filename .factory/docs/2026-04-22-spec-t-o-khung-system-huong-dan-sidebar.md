# I. Primer
## 1. TL;DR kiểu Feynman
- Mục tiêu phase này: **dựng khung “Sách hướng dẫn”** trong khu `/system`, chưa viết nội dung chi tiết.
- Tạo route mới: **`/system/huong-dan`** (slug không dấu, ổn định kỹ thuật).
- Thêm 1 item ngang hàng với “Module” trong sidebar system để người dùng thấy ngay.
- Trang index chỉ hiển thị **các đề mục lớn** (định hướng toàn hệ thống), mỗi đề mục có link đích tương lai.
- Giữ thay đổi nhỏ, dễ rollback: chủ yếu sửa `layout`, `translations`, thêm `page` mới.

## 2. Elaboration & Self-Explanation
Hiện tại người mới vào SaaS bị ngợp vì nhiều tầng (`/system`, `/admin`, homepage) và thiếu “bản đồ học nhanh”. Vấn đề không phải thiếu tính năng, mà thiếu **điểm vào thống nhất** trên chính sidebar mà họ dùng hằng ngày.

Cách xử lý ít rủi ro nhất là làm giống pattern có sẵn của repo:
1) tạo một route top-level trong `/system`,
2) gắn vào sidebar hiện tại,
3) thêm nhãn i18n,
4) dựng trang index gồm danh sách đề mục lớn (khung IA tài liệu), chưa động vào nội dung sâu.

Điều này giúp team/khách có “một cửa” để bắt đầu, giảm hỏi lặp, và vẫn giữ scope gọn đúng yêu cầu lần này.

## 3. Concrete Examples & Analogies
- Ví dụ trong repo: các mục `Modules`, `Experiences`, `SEO` đều là top-level item trong `app/system/layout.tsx`. Mục “Hướng dẫn” sẽ đi cùng pattern này để đồng bộ UX.
- Analogy đời thường: thay vì đưa khách vào siêu thị không biển chỉ dẫn, ta đặt ngay ở cửa một **“bảng chỉ đường tổng”**. Bảng chưa cần giải thích từng sản phẩm, chỉ cần chỉ đúng khu nào đi đâu.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Sidebar `/system` đang hardcode trực tiếp trong `app/system/layout.tsx`.
  - Mapping tiêu đề breadcrumb/header dùng `getPageName()` trong cùng file.
  - Label đa ngôn ngữ nằm ở `app/system/i18n/translations.ts`.
  - Global search `/system` hiện index chủ yếu modules + experiences (`SystemGlobalSearch.tsx`).
- Inference:
  - Muốn thêm top-level “Hướng dẫn” chuẩn repo thì cần tối thiểu 3 điểm: route page + sidebar item + i18n.
- Decision:
  - Triển khai khung tối thiểu đúng scope: **index page + đề mục lớn**, không làm deep content trong phase này.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause (nguyên nhân gốc):
  - Không có “entrypoint tài liệu” ngay trong luồng thao tác chính của `/system`, nên tri thức vận hành nằm rải rác, phụ thuộc người biết hệ thống.
- Root Cause Confidence: **High**
  - Lý do: cấu trúc hiện tại có nhiều khu chức năng nhưng chưa có route “guide/docs” top-level; sidebar là điểm điều hướng chính của người dùng.

Trả lời 8 câu audit bắt buộc:
1. Triệu chứng: người dùng không nắm được chỗ sửa/chỗ cấu hình; kỳ vọng là tự định vị nhanh trong 1-2 click.
2. Phạm vi: user nội bộ + khách SaaS tại khu `/system` (ảnh hưởng gián tiếp sang `/admin`, homepage do thiếu map).
3. Tái hiện: có, ổn định khi onboarding user mới hoặc bàn giao full dự án.
4. Mốc thay đổi gần nhất: codebase đã mở rộng nhiều module/experience nhưng chưa có “sách hướng dẫn” top-level.
5. Dữ liệu thiếu: chưa có analytics cụ thể về tỷ lệ hỏi lặp theo route (không chặn phase khung).
6. Giả thuyết thay thế: do UI quá rối? Có thể đúng một phần, nhưng ngay cả UI tốt vẫn cần “bản đồ bắt đầu”.
7. Rủi ro fix sai nguyên nhân: thêm page nhưng không ai dùng nếu đặt sai vị trí sidebar hoặc naming không rõ.
8. Tiêu chí pass/fail: vào `/system` thấy ngay mục “Hướng dẫn”, mở ra có đề mục lớn rõ ràng, link định hướng đầy đủ.

```mermaid
flowchart TD
  A[User vào /system] --> B[Sidebar]
  B --> C[/system/huong-dan]
  C --> D[Đề mục lớn]
  D --> E[Link đích tương lai]
```

# IV. Proposal (Đề xuất)
- Triển khai 1 route mới **`/system/huong-dan`** với trang index dạng “Guide Hub”.
- Thêm item sidebar mới: **Hướng dẫn** (top-level, cùng tầng Modules/Experiences).
- Bổ sung i18n `vi/en` cho:
  - `sidebar.guides`
  - `pages.guides`
- Cập nhật `getPageName()` để breadcrumb/header hiển thị đúng khi vào `/system/huong-dan`.
- Nội dung index chỉ là **khung đề mục lớn** (Feynman, ngắn gọn, có link placeholder/điểm đến), ví dụ nhóm:
  - Bắt đầu trong 5 phút
  - Bản đồ hệ thống: `/system` vs `/admin` vs site
  - Luồng cấu hình Module → Experience → Hiển thị
  - Vị trí dữ liệu quan trọng & nơi sửa nhanh
  - FAQ vận hành và checklist bàn giao

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `app/system/layout.tsx`
  - Vai trò hiện tại: render shell `/system`, sidebar, breadcrumb title.
  - Thay đổi: thêm SidebarItem `/system/huong-dan`, import icon phù hợp, thêm nhánh `getPageName()` cho guides.

- **Sửa:** `app/system/i18n/translations.ts`
  - Vai trò hiện tại: chứa text i18n cho sidebar/header/pages.
  - Thay đổi: thêm key `sidebar.guides`, `pages.guides` cho cả `vi` và `en`.

- **Thêm:** `app/system/huong-dan/page.tsx`
  - Vai trò hiện tại: chưa có.
  - Thay đổi: tạo trang index “Sách hướng dẫn” hiển thị danh sách đề mục lớn, copywriting ngắn gọn, dễ hiểu.

- **(Tùy chọn, chưa bắt buộc phase này) Sửa:** `app/system/components/SystemGlobalSearch.tsx`
  - Vai trò hiện tại: global search trong system.
  - Thay đổi: thêm item `/system/huong-dan` để tìm nhanh bằng Ctrl+K.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại pattern UI của các trang top-level `/system/*` để bám style hiện có.
2. Tạo `app/system/huong-dan/page.tsx` với layout index + nhóm đề mục lớn.
3. Cập nhật sidebar và breadcrumb mapping trong `app/system/layout.tsx`.
4. Cập nhật key i18n trong `translations.ts`.
5. Static self-review: type safety, null-safety, text economy, link correctness.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Theo guideline repo:
  - **Không chạy lint/unit test**.
  - Khi có thay đổi TS/code, kiểm tra kiểu bằng `bunx tsc --noEmit` ở phase implement.
- Kiểm chứng thủ công (repro):
  1) Mở `/system` thấy item “Hướng dẫn” trong sidebar.
  2) Click vào item điều hướng đúng `/system/huong-dan`.
  3) Header breadcrumb hiển thị “Hướng dẫn”.
  4) Trang hiển thị đầy đủ các đề mục lớn theo khung đã định.
  5) Dark/light mode không vỡ layout.

# VIII. Todo
- [ ] Thêm route `app/system/huong-dan/page.tsx` (index khung đề mục lớn).
- [ ] Thêm mục “Hướng dẫn” vào sidebar `/system`.
- [ ] Bổ sung i18n `sidebar.guides` + `pages.guides`.
- [ ] Cập nhật breadcrumb/title mapping cho route mới.
- [ ] Self-review tĩnh và kiểm tra điều hướng end-to-end.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Có route hoạt động: `/system/huong-dan`.
- Sidebar `/system` xuất hiện item “Hướng dẫn” cùng tầng với Modules/Experiences.
- Header/breadcrumb hiển thị tên trang đúng theo i18n.
- Trang index có danh sách đề mục lớn, ngắn gọn, dễ hiểu, không đi quá phạm vi content chi tiết.
- Không làm thay đổi behavior các route `/system` hiện hữu.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro thấp:
  - Sai key i18n gây fallback text hoặc undefined label.
  - Active state sidebar có thể highlight sai nếu path check không khớp.
- Rollback:
  - Revert 3 file chính (`layout.tsx`, `translations.ts`, `huong-dan/page.tsx`) là về trạng thái trước ngay.

# XI. Out of Scope (Ngoài phạm vi)
- Viết toàn bộ nội dung hướng dẫn chi tiết cho từng module/experience.
- Tạo hệ thống docs động, CMS tài liệu, analytics đọc docs.
- Refactor toàn bộ kiến trúc sidebar sang config-driven registry.
- Chỉnh UI/IA sâu cho `/admin` hoặc homepage ngoài khung định hướng ở phase này.