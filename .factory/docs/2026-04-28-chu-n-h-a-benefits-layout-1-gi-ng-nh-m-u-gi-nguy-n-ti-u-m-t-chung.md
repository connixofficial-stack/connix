# I. Primer

## 1. TL;DR kiểu Feynman

- Sẽ giữ nguyên phần `Tiêu đề & Mô tả` chung đang nằm ở `SectionHeader`; không bỏ, không đổi logic header.
- Chỉ đổi phần UI bên dưới của riêng `Layout 1`: dãy card lợi ích giống ảnh mẫu.
- Create và edit đều dùng chung preview/runtime shared component, nên sửa đúng nhánh layout 1 sẽ áp dụng cho cả hai.
- Không đổi schema, không đổi cách lưu `title`, `subtitle`, `badgeText`, `hideHeader`, `showTitle`, `showSubtitle`.
- Layout 2–6 không bị đụng.

## 2. Elaboration & Self-Explanation

Benefits hiện có 2 tầng hiển thị: tầng header chung (`Tiêu đề & Mô tả`) và tầng nội dung layout bên dưới. User đã nhắc rõ phần `Tiêu đề & Mô tả` vẫn thuộc layout 1 nhưng là phần chung, nên hướng xử lý đúng là giữ `SectionHeader` như hiện tại và chỉ đổi phần card bên dưới trong `BenefitsSectionShared.tsx` tại nhánh `style === '1'`.

Nói cách khác: không đưa title/subtitle vào card layout 1, không xóa `skipHeader`, không đổi `HeaderConfigSection`, không đổi logic `SectionHeader`. Layout 1 chỉ thay giao diện danh sách benefits phía dưới để giống ảnh: 5 card trắng, icon tròn, line accent, số thứ tự lớn mờ, nền arrow tím nhạt.

## 3. Concrete Examples & Analogies

Ví dụ ở trang edit bạn đưa: phần “Tiêu đề hiển thị”, mô tả/subtitle/badge nếu admin cấu hình vẫn render bằng header chung như trước. Bên dưới header đó, 5 item benefits mới đổi thành card giống ảnh mẫu.

Analogy: giống thay “khung trưng bày sản phẩm” bên dưới bảng hiệu cửa hàng; bảng hiệu (`Tiêu đề & Mô tả`) vẫn giữ nguyên, chỉ đổi cách sắp sản phẩm trong quầy.

# II. Audit Summary (Tóm tắt kiểm tra)

- Observation: `BenefitsPreview.tsx` render `SectionHeader` trước, sau đó gọi `BenefitsSectionShared` với `skipHeader={true}`.
- Observation: site runtime trong `BenefitsRuntimeSection.tsx` và `ComponentRenderer.tsx` cũng render `SectionHeader` riêng rồi gọi `BenefitsSectionShared` với `skipHeader={true}`.
- Observation: `BenefitsSectionShared.tsx` vẫn có `renderHeader()`, nhưng trong current preview/site flow của Benefits, header chung đang được quản lý ở wrapper bên ngoài.
- Observation: nhánh `style === '1'` trong `BenefitsSectionShared.tsx` hiện chỉ là UI danh sách cards, đây là vị trí cần sửa.
- Decision: giữ nguyên toàn bộ `SectionHeader`, `HeaderConfigSection`, `extractSectionHeaderConfig`, `hideHeader/showTitle/showSubtitle/showBadge` flow.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- Root Cause Confidence: High.
- Nguyên nhân: UI bên dưới của layout 1 đang dùng pattern card highlight, khác ảnh mẫu. Header không phải nguyên nhân và không nên bị sửa.
- Counter-hypothesis 1: Cần gộp header vào `BenefitsSectionShared` để giống ảnh. Không chọn vì user yêu cầu giữ phần `Tiêu đề & Mô tả` chung, không đổi logic.
- Counter-hypothesis 2: Cần đổi create/edit form. Không chọn vì create/edit đã truyền header config và layout config đúng.
- Counter-hypothesis 3: Cần sửa dữ liệu thật của component ID. Không chọn vì yêu cầu là đổi layout UI cho create và edit, không phải patch data.

# IV. Proposal (Đề xuất)

1. Giữ nguyên header chung:
   - không sửa `HeaderConfigSection`;
   - không sửa `SectionHeader`;
   - không sửa `extractSectionHeaderConfig`;
   - không đổi `skipHeader={true}` trong preview/site runtime;
   - không đổi logic `title`, `subtitle`, `badgeText`, `hideHeader`, `showTitle`, `showSubtitle`, `showBadge`.
2. Chỉ sửa nhánh `style === '1'` trong `BenefitsSectionShared.tsx`:
   - card trắng, border mảnh, shadow nhẹ;
   - icon nằm trong vòng tròn nền tím/brand nhạt;
   - line accent nhỏ dưới icon;
   - title đậm, description nhỏ;
   - số thứ tự lớn mờ ở đáy trái khi `showItemNumbers=true`;
   - accent line dưới card;
   - background arrow lớn mờ phía sau khi `showDecorativeVisuals=true`.
3. Giữ parity create/edit/site:
   - `BenefitsPreview.tsx` không đổi trừ khi phát hiện cần class wrapper nhỏ để không cắt arrow;
   - `BenefitsRuntimeSection.tsx` và `ComponentRenderer.tsx` không đổi dự kiến;
   - layout 2–6 không đổi.
4. Responsive:
   - desktop/tablet rộng: tối đa 5 card ngang như ảnh;
   - mobile: 1 cột để dễ đọc;
   - preview mobile vẫn theo `previewDevice` hiện có.

# V. Files Impacted (Tệp bị ảnh hưởng)

- Sửa: `app/admin/home-components/benefits/_components/BenefitsSectionShared.tsx` — chỉ chỉnh nhánh `style === '1'` để đổi UI phần danh sách lợi ích bên dưới header.
- Không sửa dự kiến: `app/admin/home-components/benefits/_components/BenefitsPreview.tsx` — giữ `SectionHeader` chung và preview wiring hiện tại.
- Không sửa dự kiến: `app/admin/home-components/create/benefits/page.tsx` — giữ create logic/header config hiện tại.
- Không sửa dự kiến: `app/admin/home-components/benefits/[id]/edit/page.tsx` — giữ edit load/save/header config hiện tại.
- Không sửa dự kiến: `components/site/home/sections/BenefitsRuntimeSection.tsx` và `components/site/ComponentRenderer.tsx` — giữ runtime header + shared layout wiring.

# VI. Execution Preview (Xem trước thực thi)

1. Re-read đoạn `style === '1'` để chỉnh đúng phạm vi.
2. Thay JSX/classes phần card trong layout 1; không chạm header flow.
3. Đảm bảo decorative arrow nằm trong section/card area bên dưới header, không che header.
4. Review create/edit/site parity map.
5. Chạy `bunx tsc --noEmit` vì có đổi TSX; không chạy lint/build theo instruction repo.
6. Commit thay đổi, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Static review:
  - xác nhận không sửa `SectionHeader`, `HeaderConfigSection`, hoặc header config serialization;
  - xác nhận `BenefitsPreview` vẫn render header chung trước layout;
  - xác nhận only branch `style === '1'` đổi.
- Typecheck: chạy `bunx tsc --noEmit`.
- Manual visual check cho tester:
  - edit URL user đưa: phần `Tiêu đề & Mô tả` vẫn còn và điều khiển bằng cấu hình chung;
  - dưới header, Layout 1 giống ảnh mẫu;
  - create Benefits có behavior tương tự;
  - Layout 2–6 không đổi.

# VIII. Todo

- [ ] Sửa UI bên dưới của `Layout 1` trong `BenefitsSectionShared.tsx`.
- [ ] Kiểm tra không đụng logic `Tiêu đề & Mô tả` chung.
- [ ] Review parity create/edit/site.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit thay đổi, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- `Tiêu đề & Mô tả` chung vẫn hoạt động như trước ở create/edit/site.
- Layout 1 chỉ đổi phần cards bên dưới header để giống ảnh mẫu.
- Không bỏ hoặc hardcode title/subtitle/badge vào layout 1.
- Create và edit của Benefits đều thấy layout 1 mới.
- Site/runtime layout 1 đồng bộ với preview.
- Layout 2–6 không đổi.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro: ảnh mẫu không có header trong crop, nhưng hệ thống vẫn có header chung theo config; sẽ giữ đúng yêu cầu của user thay vì bỏ header để match crop.
- Rủi ro: arrow nền có thể cần opacity/position tinh chỉnh sau visual QA.
- Rollback: revert commit hoặc khôi phục riêng nhánh `style === '1'`.

# XI. Out of Scope (Ngoài phạm vi)

- Không đổi logic `Tiêu đề & Mô tả` chung.
- Không chỉnh dữ liệu thật của record `js75h35bhmk6kb3ns7yvyh0nq185qwc9`.
- Không đổi layout 2–6.
- Không đổi schema hoặc Convex functions.

# XII. Open Questions (Câu hỏi mở)

- Không có câu hỏi bắt buộc. Sẽ bám màu brand hiện tại để tạo tông tím/brand giống ảnh, không hardcode một mã màu cố định trừ các màu nền trung tính cần thiết.