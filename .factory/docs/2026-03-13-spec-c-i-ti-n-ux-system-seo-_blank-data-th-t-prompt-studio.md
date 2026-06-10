## Audit Summary

### Observation (evidence)
1. `/system/seo` hiện chỉ có 2 tab (`overview`, `landing-pages`) với nút tab đơn giản ở `app/system/seo/page.tsx`.
2. Trong `overview` đang render dày: `SeoCommandBar`, `SeoCriticalActions`, `SeoQuickWins`, `SeoHealthPanel`, `SeoGuidedActions` nên dễ rối thông tin.
3. Nhiều quick action nội bộ đang dùng `<Link>` không mở tab mới (ví dụ `/admin/settings`, `/admin/posts`) trong `lib/seo/checklist.ts` + các component card.
4. Link external trong command bar đã mở tab mới, nhưng `rel` đang là `noreferrer`; cần chuẩn hóa `noopener noreferrer` theo MDN.
5. Nguồn dữ liệu thật đã có sẵn qua `useSeoChecklist` (Convex queries settings + counts posts/products/services + landingPages).
6. Đã có external steps cơ bản trong checklist nhưng chưa có “prompt sẵn” dạng có ngữ cảnh dữ liệu thật để copy dùng ngay.

### Root Cause
- IA hiện tại gom quá nhiều nhiệm vụ vào 1 tab khiến cognitive load cao.
- Chưa có policy thống nhất “mọi link hành động mở tab mới”.
- Thiếu lớp “Prompt Studio” chuyển dữ liệu thật thành prompt cấu trúc để dev copy-paste tạo output chuẩn.

### Counter-hypothesis đã xét
- “Chỉ cần đổi style tab là đủ” → không đủ vì vấn đề chính là phân tách nhiệm vụ và hành vi link.
- “Không cần Prompt Studio, chỉ tips text” → không đáp ứng yêu cầu user cần prompt sẵn + dữ liệu thật.

## Root Cause Confidence
**High** — vì evidence trực tiếp từ code hiện tại + yêu cầu user đã chốt rõ:
- Mọi link nội bộ/external đều mở tab mới.
- Tab mục tiêu: `Tổng quan / Việc cần làm / Landing Pages`.
- Cần `SEO checklist + action plan` bằng prompt có dữ liệu thật.

## Proposal (file-level, actionable)

### 1) Tái cấu trúc tab rõ ràng theo workflow
**File:** `app/system/seo/page.tsx`
- Đổi state tab từ 2 tab sang 3 tab: `overview | actions | landing-pages`.
- Mapping query param `?tab=...` tương ứng 3 tab để deep-link ổn định.
- Phân bố lại content:
  - `overview`: `SeoCommandBar` + `SeoHealthPanel` (chỉ dashboard/tổng quan).
  - `actions`: `SeoCriticalActions` + `SeoQuickWins` + `SeoGuidedActions` + panel prompt mới.
  - `landing-pages`: giữ `LandingPagesPanel`.
- Tinh gọn spacing/hierarchy theo mobile-first (tab dễ scan, header gọn, ưu tiên CTA chính).

### 2) Chuẩn hóa policy mở tab mới cho toàn bộ quick actions
**Files:**
- `app/system/seo/_components/SeoCommandBar.tsx`
- `app/system/seo/_components/SeoCriticalActions.tsx`
- `app/system/seo/_components/SeoQuickWins.tsx`
- `app/system/seo/_components/SeoGuidedActions.tsx`
- `components/seo/SeoHealthPanel.tsx`

**Thay đổi:**
- Với mọi link hành động (nội bộ + external): thêm `target="_blank" rel="noopener noreferrer"`.
- Giữ semantics button/link hiện có, không đổi logic nghiệp vụ.
- Với `next/link`, truyền thêm props `target`, `rel` nhất quán.

### 3) Bổ sung Prompt Studio dùng dữ liệu thật của project
**File mới:** `app/system/seo/_components/SeoPromptStudio.tsx`

**Input data:** lấy trực tiếp từ `useSeoChecklist` + `checklist` (không gọi API mới), gồm:
- `baseUrl`, `sitemapUrl`, `robotsUrl`, `llmsUrl`
- `postsCount`, `productsCount`, `servicesCount`, `landingPagesCount` (thông qua checklist summary hoặc props mở rộng)
- Danh sách issue chưa pass (critical/high/medium), quick wins hiện tại, external steps.

**UI/UX:**
- 1 card gọn trong tab `Việc cần làm` gồm:
  - `Prompt mục tiêu` (SEO checklist + action plan theo dữ liệu thật).
  - Nút `Copy Prompt`.
  - Nút `Mở ChatGPT` (new tab).
  - Nút `Mở Claude/Gemini` (new tab, nếu cần).
  - Khối “Dữ liệu đang dùng” (read-only, để dev kiểm tra trước khi copy).

**Template prompt (định dạng chắc chắn, ít mơ hồ):**
- Structured sections: `Context`, `Current Data`, `Tasks`, `Output Format`, `Constraints`.
- Yêu cầu model trả ra:
  1. Bảng ưu tiên fix 7/30 ngày.
  2. Checklist thao tác theo module trong hệ thống hiện tại.
  3. Danh sách nội dung nên tạo dựa trên thiếu hụt thực tế.
  4. KPI/metric theo dõi index + CTR.
- Cài công thức nội suy từ dữ liệu thật (ví dụ nếu postsCount=0 thì ưu tiên content seed).

### 4) Thêm tips cụ thể, bám data thật (không generic)
**File:** `lib/seo/checklist.ts` (hoặc tách helper nhỏ nếu cần, cùng module)
- Tăng chất lượng `howToFix/steps` cho item quan trọng theo trạng thái thực tế.
- Ví dụ tip condition-based:
  - Nếu thiếu contact/email: đưa step tối thiểu + lý do E-E-A-T.
  - Nếu `landingPagesCount = 0`: đề xuất số lượng tối thiểu theo loại trang + thứ tự tạo.
- Giữ KISS: chỉ bổ sung text/tip, không đổi schema dữ liệu lớn.

### 5) Không mở rộng ngoài scope
- Không thêm dependency mới.
- Không đổi Convex schema/query mutation nếu không bắt buộc.
- Không đụng route/site rendering khác ngoài vùng SEO admin.

## Verification Plan

### Typecheck / static
- Chạy `bunx tsc --noEmit` **sau khi code xong** (theo rule repo khi có thay đổi TS/code).

### Repro checklist thủ công (cho tester)
1. Vào `/system/seo`:
   - Thấy 3 tab: Tổng quan / Việc cần làm / Landing Pages.
2. Tab `Tổng quan`:
   - Hiển thị dashboard gọn, không trộn action-heavy block.
3. Tab `Việc cần làm`:
   - Có Critical/Quick Wins/Guided Actions + Prompt Studio.
   - Prompt phản ánh dữ liệu thật hiện tại (domain, counts, links).
4. Click mọi CTA link (nội bộ + external):
   - Đều mở tab mới (`_blank`) và tab cũ giữ nguyên context.
5. Copy prompt:
   - Dán vào ChatGPT cho output có checklist + action plan đúng format yêu cầu.

### Pass/Fail criteria
- **Pass** khi đủ 3 tab rõ ràng, link hành động mở tab mới nhất quán, có prompt sẵn data thật, tips cụ thể theo tình trạng thực tế.
- **Fail** nếu còn link điều hướng cùng tab, prompt thiếu dữ liệu thật, hoặc tab chưa phân tách đúng IA user đã chọn.