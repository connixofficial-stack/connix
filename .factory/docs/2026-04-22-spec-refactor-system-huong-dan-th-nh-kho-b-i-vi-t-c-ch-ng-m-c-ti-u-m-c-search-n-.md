# I. Primer
## 1. TL;DR kiểu Feynman
- Bỏ style “card 5 phút” hiện tại, đổi sang **kho bài hướng dẫn dạng menu chương** giống cách điều hướng dễ scan.
- Mỗi bài là 1 route tĩnh: **`/system/huong-dan/{slug}`**.
- Search chỉ tìm **trong kho bài hướng dẫn** (title/slug/từ khóa/chương-mục-tiểu mục), không search toàn app.
- Mục tiêu phase này: dựng **khung đầy đủ đề mục** cho modules, admin, experiences, seeds, và action chi tiết (vd trust badge) — **chưa viết nội dung dài**.
- Trải nghiệm: vào `/system/huong-dan` thấy cây chương rõ ràng + ô search; click mở đúng bài.

## 2. Elaboration & Self-Explanation
Anh muốn người dùng học hệ thống theo kiểu “tra mục lục” thay vì đọc landing dài. Cách phù hợp nhất là biến `/system/huong-dan` thành một “sổ tay tĩnh có index”, trong đó:
1) Có taxonomy rõ: Chương → Mục → Tiểu mục.
2) Mỗi node quan trọng map sang 1 bài route tĩnh (`{slug}`) để tìm và share URL dễ.
3) Search chỉ phục vụ kho này: gõ “sản phẩm”, “seed”, “trust badge” là ra bài liên quan.

Vì phase này chỉ làm khung, bài chi tiết sẽ để placeholder có cấu trúc chuẩn (heading + block TODO), tránh viết lan man và giúp team bổ sung dần mà vẫn đồng bộ format.

## 3. Concrete Examples & Analogies
- Ví dụ trực quan: giống “mục lục sách giáo khoa”, người đọc nhìn chương là biết học chỗ nào, không cần đọc bài dài tổng quan trước.
- Ví dụ bám task:
  - Chương: `Admin`
  - Mục: `Home Components`
  - Tiểu mục: `Trust Badges`
  - Bài route: `/system/huong-dan/admin-home-components-trust-badges`

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - Trang `app/system/huong-dan/page.tsx` hiện đang là 5 card giới thiệu ngắn, chưa phải cấu trúc chương/mục.
  - `SystemGlobalSearch` hiện chỉ index modules + experiences, chưa có nguồn dữ liệu cho guide articles.
  - Chưa thấy pattern `[slug]` page cho khu guides trong `app/system`.
- Inference:
  - Cần tách “guide index” và “guide article page” bằng route động `[slug]` hoặc static map tương đương.
- Decision:
  - Dùng **data-driven static registry** cho guides (1 nguồn sự thật), render ra cả index tree + searchable list + bài `{slug}`.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause (nguyên nhân gốc):
  - Cấu trúc hiện tại ưu tiên giới thiệu nhanh, chưa phải knowledge architecture (kiến trúc tri thức) theo chương/mục để tra cứu lâu dài.
- Root Cause Confidence: **High**
  - Lý do: UI hiện tại không có article route riêng và không có taxonomy sâu để chia bài nhỏ.

Trả lời 8 câu audit bắt buộc:
1. Triệu chứng: user khó tìm đúng chỗ trong hệ thống lớn, hỏi lại nhiều.
2. Phạm vi: toàn bộ người dùng thao tác `/system`, gián tiếp ảnh hưởng `/admin`, experiences, seed flows.
3. Tái hiện: ổn định với user mới/onboarding/bàn giao.
4. Mốc thay đổi: đã có trang `/system/huong-dan` nhưng theo style card tổng quan, chưa đáp ứng tra cứu sâu.
5. Dữ liệu thiếu: chưa có analytics search terms của user guide (không chặn phase khung).
6. Giả thuyết thay thế: chỉ cần viết 1 bài dài tổng hợp; phản biện: bài dài khó scan, khó maintain.
7. Rủi ro fix sai: tạo quá nhiều bài nhưng taxonomy kém nhất quán gây trùng lặp.
8. Pass/fail: search trong guides trả đúng bài, cây chương rõ, bài chia nhỏ không quá dài.

```mermaid
flowchart TD
  A[/system/huong-dan] --> B[Index chương-mục-tiểu mục]
  B --> C[Click đề mục]
  C --> D[/system/huong-dan/{slug}]
  A --> E[Search guides]
  E --> F[Filter từ registry guides]
  F --> D
```

# IV. Proposal (Đề xuất)
## 1) Kiến trúc nội dung (chỉ khung)
- Tạo registry tĩnh cho guide articles, mỗi article có:
  - `slug`, `title`, `chapter`, `section`, `subsection`, `keywords`, `relatedRoutes`.
  - `outline` rỗng/placeholder (để viết nội dung sau).
- Phân cụm đề mục lớn bao phủ full hệ thống:
  - System Core (auth, ia/routing, modules config, integrations, data)
  - Admin Modules (mỗi module 1 cụm bài con)
  - Experiences (list/detail/account/checkout/contact...)
  - Home Components (bao gồm tiểu mục trust badges và action chi tiết)
  - Seed & Data Flows
  - SEO / IA / vận hành nâng cao

## 2) UI/UX trình bày
- `/system/huong-dan`:
  - Header ngắn.
  - Ô search.
  - Danh sách dạng menu tree: Chương > Mục > Tiểu mục > bài.
- `/system/huong-dan/{slug}`:
  - Breadcrumb theo chapter/section/subsection.
  - Title + metadata (module liên quan / route liên quan).
  - Body placeholder theo template thống nhất.

## 3) Search behavior
- Search local trên registry guides:
  - match `title`, `slug`, `chapter`, `section`, `subsection`, `keywords`.
- Có trạng thái “không tìm thấy”.
- Không trộn kết quả modules/experiences global search ở phase này (đúng yêu cầu).

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `app/system/huong-dan/page.tsx`
  - Vai trò hiện tại: landing card tổng quan.
  - Thay đổi: đổi thành trang index menu chương + search + link bài `{slug}`.

- **Thêm:** `app/system/huong-dan/[slug]/page.tsx`
  - Vai trò hiện tại: chưa có.
  - Thay đổi: render bài hướng dẫn tĩnh theo slug từ registry.

- **Thêm:** `app/system/huong-dan/_data/guides.ts` (hoặc tương đương)
  - Vai trò hiện tại: chưa có source dữ liệu tập trung.
  - Thay đổi: khai báo toàn bộ khung đề mục + mapping slug + metadata search.

- **Thêm:** `app/system/huong-dan/_components/GuidesTree.tsx`
  - Vai trò: render cây chương/mục/tiểu mục.
  - Thay đổi: hiển thị gọn, dễ scan, có thể collapse nhẹ.

- **Thêm:** `app/system/huong-dan/_components/GuidesSearch.tsx`
  - Vai trò: input + filter + result list.
  - Thay đổi: lọc cục bộ theo registry.

- **(Tùy chọn) Sửa:** `app/system/i18n/translations.ts`
  - Vai trò hiện tại: i18n text system.
  - Thay đổi: thêm key text cho guides index/search nếu cần đồng bộ ngôn ngữ.

# VI. Execution Preview (Xem trước thực thi)
1. Chuẩn hóa schema dữ liệu bài guide trong file registry.
2. Populate danh sách đề mục đầy đủ (modules/admin/experiences/seeds/trust badge…).
3. Refactor index `/system/huong-dan` sang tree + search.
4. Tạo route `/system/huong-dan/[slug]` đọc dữ liệu từ registry.
5. Self-review consistency slug, trùng lặp đề mục, route hợp lệ.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Theo guideline repo: không chạy lint/unit test.
- Khi có thay đổi TS/code: chạy `bunx tsc --noEmit`.
- Repro checklist:
  1) Vào `/system/huong-dan` thấy menu chương/mục/tiểu mục đầy đủ.
  2) Gõ keyword như `sản phẩm`, `seed`, `trust badge` ra đúng bài.
  3) Click kết quả mở đúng `/system/huong-dan/{slug}`.
  4) Bài có breadcrumb + title + placeholder nhất quán.
  5) Không làm vỡ sidebar và layout system hiện có.

# VIII. Todo
- [ ] Thiết kế schema guide article và tạo registry tĩnh.
- [ ] Dựng đầy đủ khung đề mục cho toàn hệ thống (chỉ đề mục).
- [ ] Refactor trang index guides thành menu tree + search nội bộ.
- [ ] Tạo route bài tĩnh `/system/huong-dan/{slug}`.
- [ ] Tự review trùng lặp đề mục, tính dễ scan, và điều hướng end-to-end.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- `/system/huong-dan` không còn card intro kiểu cũ; thay bằng menu chương/mục/tiểu mục.
- Có search trong guides, trả kết quả theo bài hướng dẫn.
- Có route bài riêng `/system/huong-dan/{slug}` cho các đề mục.
- Khung đề mục bao phủ modules, admin, experiences, seeds và action chi tiết (vd trust badge).
- Nội dung bài vẫn là placeholder (đúng scope “chỉ đề mục”).

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro:
  - Danh sách đề mục quá lớn gây khó scan nếu không group tốt.
  - Trùng slug hoặc naming không nhất quán.
- Giảm thiểu:
  - Prefix slug theo chapter (`admin-`, `exp-`, `seed-`, `system-`).
  - Validate uniqueness trong lúc build registry.
- Rollback:
  - Revert nhóm file guides mới là quay lại bản card cũ.

# XI. Out of Scope (Ngoài phạm vi)
- Viết nội dung chi tiết cho từng bài.
- Đồng bộ search này vào global search Ctrl+K của toàn system.
- CMS hóa/DB hóa kho hướng dẫn ở phase này.

# XII. Open Questions (Câu hỏi mở)
- Không còn ambiguity chính. Scope đã chốt: search trong guides, route bài `/system/huong-dan/{slug}`, chỉ dựng đề mục.