## Audit Summary

### Observation (evidence)
1. **Trang đang tách tab theo luồng chưa hợp lý, gây cảm giác rời rạc**  
   - `app/system/seo/page.tsx:18` dùng 3 tab `overview | actions | landing-pages`.  
   - Tab `overview` chứa cả command bar + checklist (`page.tsx:79-88`), tab `actions` lại render 4 khối khác (`page.tsx:91-108`) → người dùng phải qua lại nhiều nơi để hiểu "đang thiếu gì" vs "sửa ở đâu".

2. **Chưa có progress % tổng quan SEO**  
   - `components/seo/SeoHealthPanel.tsx` chỉ render danh sách theo category, chưa có thanh progress hay điểm số.

3. **Best practice đang mở link ngoài, không đúng kỳ vọng UX**  
   - `SeoHealthPanel.tsx:115-123` render anchor `href={item.learnMoreUrl}` + `target="_blank"` cho “Best practice”.

4. **Một số check chưa dựa vào dữ liệu kiểm chứng runtime thật (đặc biệt URL tài nguyên SEO)**  
   - `lib/seo/checklist.ts:129,142` robots/sitemap đang `pass` chỉ cần `hasValidBaseUrl`, chưa check endpoint trả về thực tế.  
   - `lib/seo/checklist.ts:377` llms status đang `info` nếu có chuỗi URL, không xác minh phản hồi thực.

5. **UI bị "loạn link" vì quá nhiều action button đồng cấp**  
   - `SeoCommandBar.tsx` đang render nhiều nút cùng cấp (Homepage, Sitemap, Robots, llms, Settings, Posts, Products, Services, Landing Pages, Copy domain, Copy sitemap).

### Root Cause (trả lời 8 câu theo protocol)
1. **Triệu chứng**: UI khó đọc nhanh, không có % hoàn thành SEO, người dùng không biết ưu tiên bước nào. (Expected: thấy ngay % và việc quan trọng)  
2. **Phạm vi ảnh hưởng**: Người dùng trang `/system/seo` (system admin).  
3. **Tái hiện**: Ổn định, chỉ cần mở `/system/seo` với dữ liệu bất kỳ.  
4. **Mốc thay đổi gần nhất**: Có commit gần đây liên quan SEO checklist center (git log).  
5. **Thiếu dữ liệu**: Chưa có mapping trọng số chính thức và format modal nội dung best practice. (đã được user chốt qua AskUser)  
6. **Giả thuyết thay thế**: Có thể do dữ liệu backend thiếu; nhưng evidence cho thấy vấn đề chính nằm ở cấu trúc UI + logic chấm điểm/pass chưa kiểm chứng endpoint.  
7. **Rủi ro fix sai**: % hiển thị sai ưu tiên, user hiểu nhầm trạng thái SEO.  
8. **Pass/fail sau sửa**: Có progress bar % theo trọng số, item cập nhật phản ánh dữ liệu thật, best practice mở modal nội bộ, layout 3 tab rõ ràng + sticky summary.

### Root Cause Confidence
**High** — Vì đã xác định trực tiếp vị trí render tab/layout, logic status trong checklist, và hành vi link “Best practice” bằng evidence file + line.

---

## Proposal triển khai (theo lựa chọn user)

### Quyết định đã chốt với user
- Trọng số: **Critical=40, High=30, Medium=20, Low=10**.  
- Best practice: **Modal riêng từng checklist item**.  
- Layout: **Giữ 3 tab**, nhưng gộp card rõ ràng + **sticky summary**.

### 1) Thêm SEO Progress % có trọng số vai trò

**File đổi**: `lib/seo/checklist.ts`
- Mở rộng type `SeoChecklistResult` thêm:
  - `summary: { progressPercent, completedWeight, totalWeight, bySeverity, byCategory }`
- Định nghĩa trọng số severity theo user:
  - `critical: 40, high: 30, medium: 20, low: 10`
- Quy tắc tính điểm:
  - Mỗi item có `itemWeight = severityWeight`
  - `status === 'pass'` => nhận đủ điểm
  - `warning|fail|info` => 0 điểm (đơn giản, minh bạch)
- Tính `progressPercent = round((completedWeight / totalWeight) * 100)`.

**File đổi**: `components/seo/SeoHealthPanel.tsx`
- Thêm khu vực header summary:
  - Progress bar + text `% hoàn thành`
  - Nhấn mạnh “Critical còn bao nhiêu mục chưa pass”
- Dùng `Progress` component từ `app/admin/components/ui.tsx` để đồng bộ design system.

### 2) “Giá trị nào setup cũng phải thấy” + load dữ liệu thật

**File đổi**: `components/seo/useSeoChecklist.ts`
- Giữ nguồn dữ liệu Convex hiện có (site_url/settings/counts).
- Bổ sung kiểm tra endpoint thực tế (client-side, không đổi schema DB):
  - `fetch(robotsUrl, { method: 'HEAD' })`
  - `fetch(sitemapUrl, { method: 'HEAD' })`
  - `fetch(llmsUrl, { method: 'HEAD' })`
- Trả thêm `urlHealth: { robotsReachable, sitemapReachable, llmsReachable }`.

**File đổi**: `lib/seo/checklist.ts`
- Nhận thêm input `urlHealth` để set status thực hơn:
  - Robots/Sitemap: `pass` chỉ khi `hasValidBaseUrl && reachable === true`; ngược lại `warning/fail` phù hợp.
  - llms: từ `info` chuyển sang `pass/warning` theo reachable.
- Như vậy khi lưu domain chính, user sẽ thấy ngay trạng thái có kiểm chứng endpoint thật.

### 3) Best practice mở modal nội bộ, văn phong dễ hiểu

**File đổi**: `components/seo/SeoHealthPanel.tsx`
- Bỏ anchor “Best practice” đi external link trực tiếp.
- Thêm `BestPracticeModal` theo từng item:
  - Nút: “Xem cách làm nhanh”
  - Modal gồm: “Vì sao cần”, “Làm gì trước”, “Checklist 3-5 bước”, “Mẹo tránh lỗi thường gặp”.
- Ngôn ngữ plain Vietnamese, ít thuật ngữ.

**File đổi**: `lib/seo/checklist.ts`
- Thêm field dữ liệu nội bộ cho modal (ví dụ `bestPractice?: { summary, doFirst, checklist[], pitfalls[] }`), ưu tiên cho các item đang có `learnMoreUrl`.
- Không mở link ngoài mặc định; nếu cần vẫn để link tham khảo ở cuối modal với label phụ.

### 4) Audit & chỉnh layout/tabs cho đỡ loạn

**File đổi**: `app/system/seo/page.tsx`
- Giữ 3 tab hiện tại nhưng chuẩn hóa bố cục:
  - **Overview**: Sticky summary card (progress %, critical còn lại, nút hành động chính) + checklist card.
  - **Actions**: 3 cụm card rõ vai trò (Critical first, Quick wins, Guided actions), giảm nhiễu từ command links.
  - **Landing Pages**: giữ nguyên panel hiện tại.
- Đồng bộ active tab với query `tab` như hiện có, nhưng gom nhóm visual rõ hơn.

**File đổi**: `app/system/seo/_components/SeoCommandBar.tsx`
- Rút gọn thành action chính + menu phụ (hoặc nhóm theo “Mở nhanh” / “Copy nhanh”) để tránh dàn nút dày.

---

## Verification Plan
- **Typecheck**: sau khi code sẽ chạy `bunx tsc --noEmit` (theo guideline repo, không chạy lint/build/test).  
- **Repro checklist thủ công** tại `/system/seo`:  
  1. Đổi `site_url` trong settings -> reload -> kiểm tra robots/sitemap/llms status thay đổi theo fetch thật.  
  2. Xác nhận progress % tăng/giảm đúng khi các item pass/warning/fail đổi trạng thái.  
  3. Bấm “Best practice” ở từng item -> mở đúng modal riêng item, nội dung dễ hiểu, không nhảy link ngoài.  
  4. Kiểm tra sticky summary hoạt động khi scroll và 3 tab vẫn rõ vai trò.

Nếu anh duyệt spec này, em sẽ bắt đầu triển khai đúng phạm vi trên.