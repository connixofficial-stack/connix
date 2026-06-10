# I. Primer

## 1. TL;DR kiểu Feynman
- Layout 6 của Team đang là `spotlight` trong `TeamSectionShared.tsx`.
- Ảnh hiện dùng oval/tròn dài bằng `borderRadius: '50%...'`; sẽ đổi sang hình chữ nhật bo góc nhẹ.
- Icon Facebook hiện dùng nền màu thương hiệu (`tokens.primary`), nên nếu brand là xanh lá thì Facebook cũng xanh lá; sẽ đổi Facebook sang xanh dương chuẩn `#1877F2`.
- Card thông tin đang chỉ item active có màu thương hiệu, các item khác nền trắng; sẽ làm tất cả card dùng màu thương hiệu để đồng đều.

## 2. Elaboration & Self-Explanation
Yêu cầu đang nhắm đúng `Layout 6` của home-component Team, tương ứng `style === 'spotlight'`. Code layout này nằm trong `renderSpotlight()` của `app/admin/home-components/team/_components/TeamSectionShared.tsx`, được dùng chung cho preview admin và site thật qua `components/site/TeamSection.tsx`. Vì vậy chỉ cần sửa shared renderer là preview và site đi cùng một kiểu, không chỉnh dữ liệu hay schema.

## 3. Concrete Examples & Analogies
Ví dụ hiện tại item đầu đang active nên info bar có nền `tokens.primary`, còn item 2/3/4 nền trắng. Sau sửa, cả 4 info bar đều dùng `tokens.primary`, chữ trắng, nút mũi tên nền tối nhẹ như item active hiện tại.

Analogy: hiện tại giống như một người trong đội mặc đồng phục công ty, ba người còn lại mặc áo trắng. Yêu cầu là tất cả cùng mặc đồng phục, còn logo Facebook thì vẫn giữ đúng màu xanh Facebook thay vì bị nhuộm màu công ty.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation: `TEAM_STYLES` map `Layout 6` thành `spotlight` tại `app/admin/home-components/team/_lib/constants.ts`.
- Observation: `renderSpotlight()` trong `TeamSectionShared.tsx` tạo ảnh bằng container `borderRadius: '50% 50% 50% 50% / 45% 45% 55% 55%'`, gây cảm giác oval/tròn.
- Observation: Facebook icon trong layout 6 đang `backgroundColor: tokens.primary`, không phải màu Facebook.
- Observation: Info bar dùng `isActive ? tokens.primary : '#fff'`, nên chỉ item active có màu thương hiệu.
- Impact: sửa ở shared component sẽ ảnh hưởng đồng bộ preview admin và site render thật, đúng parity.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- Root Cause Confidence: High.
- Nguyên nhân gốc: style của layout 6 hard-code oval image và active-card-only brand color trong `renderSpotlight()`.
- Counter-hypothesis: có thể data/config item đầu khác 3 item còn lại. Đã đối chiếu code render: màu khác nhau đến từ `isActive`, không phụ thuộc data từng member.
- Pass/fail sau sửa: Layout 6 hiển thị ảnh chữ nhật bo góc nhẹ; Facebook xanh `#1877F2`; mọi member card info cùng màu thương hiệu, không chỉ item active.

# IV. Proposal (Đề xuất)
Sửa tối thiểu trong `renderSpotlight()`:
- Đổi image container từ oval sang rounded rectangle:
  - giữ width hiện tại theo `ovalSize` hoặc đổi tên local thành `imageWidth` nếu cần clarity;
  - height dùng tỷ lệ portrait nhẹ, ví dụ `imageWidth * 1.05` hoặc `aspectRatio: '4/5'`;
  - `borderRadius: '18px'`/`20px` thay cho oval.
- Đổi Facebook social button:
  - `backgroundColor: '#1877F2'`, `color: '#fff'`.
- Làm info bar đồng đều:
  - bỏ dependency màu theo `isActive` cho background/text/button;
  - dùng `backgroundColor: tokens.primary` cho tất cả;
  - chữ trắng và role `rgba(255,255,255,0.8)` cho tất cả;
  - nút mũi tên dùng nền `rgba(0,0,0,0.18)` và chữ trắng cho tất cả.
- Giữ `activeIndex` nếu vẫn cần click/selection nội bộ, nhưng không dùng để tạo khác biệt màu nữa; nếu sau sửa không còn dùng thì loại bỏ state để tránh unused.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `app/admin/home-components/team/_components/TeamSectionShared.tsx` — renderer chung của Team preview/site; cập nhật riêng block `renderSpotlight()` cho Layout 6.
- Không sửa: `components/site/TeamSection.tsx` — site đang dùng shared renderer nên tự nhận thay đổi.
- Không sửa: data/config Convex — yêu cầu chỉ là UI style, không đổi dữ liệu thật.

# VI. Execution Preview (Xem trước thực thi)
1. Mở đúng block `renderSpotlight()` trong `TeamSectionShared.tsx`.
2. Sửa style container ảnh từ oval sang rounded rectangle.
3. Sửa Facebook button sang màu `#1877F2`.
4. Sửa info bar để mọi item dùng màu thương hiệu giống nhau.
5. Tự review tĩnh: kiểm tra JSX, biến unused (`isActive`, `setActiveIndex`, `activeIndex`) và parity preview/site.
6. Commit thay đổi sau khi sửa theo rule dự án; không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Không tự chạy lint/unit test/build theo `AGENTS.md`.
- Vì có thay đổi TypeScript/TSX, trước commit sẽ chạy `bunx tsc --noEmit` theo rule dự án nếu bạn duyệt thực thi.
- Review tĩnh các tiêu chí: no unused variable, no JSX syntax error, style chỉ áp dụng layout 6.
- Kiểm chứng thủ công dự kiến tại route bạn đưa: `/admin/home-components/team/js7agnhwsvjskn6n26d6bxpz3985vfy7/edit`, chọn Layout 6 và quan sát 3 điểm UI.

# VIII. Todo
- [ ] Sửa `renderSpotlight()` cho ảnh bo góc nhẹ.
- [ ] Sửa Facebook icon đúng màu Facebook.
- [ ] Làm tất cả info card dùng màu thương hiệu đồng đều.
- [ ] Tự review tĩnh và xử lý biến unused.
- [ ] Chạy `bunx tsc --noEmit` trước commit nếu có sửa code.
- [ ] Commit thay đổi, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Layout 6 không còn ảnh oval/tròn; ảnh là chữ nhật bo góc nhẹ.
- Icon Facebook trong social stack có nền xanh Facebook `#1877F2`, không bị đổi theo brand color.
- Tất cả item info bar trong Layout 6 đều dùng màu thương hiệu, không chỉ item đầu/active.
- Preview admin và site thật cùng style vì dùng chung `TeamSectionShared`.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Risk thấp: thay đổi chỉ trong một layout của một shared UI component.
- Rủi ro chính: nếu muốn giữ trạng thái active để phân biệt item đang chọn, sau sửa sẽ không còn thấy khác biệt màu; đổi lại đáp ứng yêu cầu “làm đều hết”.
- Rollback: revert commit hoặc khôi phục block style cũ trong `renderSpotlight()`.

# XI. Out of Scope (Ngoài phạm vi)
- Không đổi layout 1–5.
- Không đổi form config, schema, dữ liệu member, ảnh upload, hay logic carousel.
- Không chỉnh màu các platform khác ngoài Facebook trừ khi đang giữ màu hiện tại của từng platform trong layout 6.