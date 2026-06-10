# I. Primer
## 1. TL;DR kiểu Feynman
- Trang `/admin/home-components/create` đã có sẵn nhóm `Gợi ý cho bạn`.
- Một số component anh muốn đẩy lên nổi bật hơn như `SpeedDial`, `Liên hệ`, `Về chúng tôi`, `Tin tức / Blog`, `Đánh giá / Review` hiện đã tồn tại trong codebase nhưng chưa được đánh dấu `recommended`.
- Cách sửa nhỏ nhất và đúng pattern hiện có là chỉ cập nhật metadata `recommended: true` cho các type này.
- Không cần thêm UI mới, không cần đổi layout trang, không mở rộng scope sang logic nhóm mới.
- Kết quả là 5 component này sẽ tự xuất hiện trong card `Gợi ý cho bạn` ở đầu trang.

## 2. Elaboration & Self-Explanation
Hiện tại trang create đang chia danh sách thành 2 nhóm bằng logic rất rõ: `recommendedTypes` và `otherTypes`. Việc một component có nằm trong `Gợi ý cho bạn` hay không phụ thuộc vào field `recommended` trong `COMPONENT_TYPES`.

Nghĩa là, để làm các component anh nêu “nổi bật hơn”, mình không nên thêm điều kiện riêng trong UI, cũng không cần tạo section mới. Chỉ cần đánh dấu đúng metadata tại source of truth là đủ. Đây là hướng ít rủi ro nhất vì page hiện tại đã support sẵn.

Nói đơn giản: trang create giống như đang có một bộ lọc “những món nên ưu tiên”. Muốn một món xuất hiện trong nhóm đó thì chỉ cần gắn nhãn ưu tiên cho nó, thay vì sửa cả cách trưng bày.

## 3. Concrete Examples & Analogies
Ví dụ cụ thể trong repo:
- `Hero`, `Stats`, `ProductList`, `CTA`, `FAQ`, `Footer` đang hiện ở `Gợi ý cho bạn` vì đã có `recommended: true`.
- `Blog`, `Testimonials`, `About`, `Contact`, `SpeedDial` chưa có cờ này nên bị rơi xuống nhóm còn lại.
- Sau khi cập nhật metadata, trang `app/admin/home-components/create/page.tsx` sẽ tự render 5 mục đó vào nhóm gợi ý mà không cần chỉnh thêm logic lọc.

Analogy đời thường:
- Giống như một cửa hàng đã có sẵn kệ “Sản phẩm nổi bật”. Nếu muốn thêm 5 món lên kệ này, ta chỉ cần gắn nhãn “nổi bật” cho 5 món đó, không cần đóng lại cái kệ mới.

# II. Audit Summary (Tóm tắt kiểm tra)
- Observation:
  - `app/admin/home-components/create/page.tsx` đang tách `visibleTypes` thành `recommendedTypes` và `otherTypes` bằng field `recommended`.
  - `app/admin/home-components/create/shared.tsx` export `COMPONENT_TYPES` từ `HOME_COMPONENT_BASE_TYPES`.
  - `lib/home-components/componentTypes.ts` là nơi chứa metadata gốc cho từng home-component.
  - 5 component anh nêu đều đã tồn tại: `Blog`, `Testimonials`, `About`, `Contact`, `SpeedDial`.
- Evidence:
  - `app/admin/home-components/create/page.tsx`: có `const recommendedTypes = visibleTypes.filter((type) => type.recommended);`
  - `lib/home-components/componentTypes.ts`: các type trên có mặt nhưng chưa được đánh dấu `recommended: true`.
- Inference:
  - Source of truth cho việc vào nhóm gợi ý là metadata type, không phải logic trang create.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
## Root Cause Confidence: High
- Nguyên nhân gốc: 5 home-component phổ biến chưa được set `recommended: true` trong metadata.
- Vì sao tin cậy cao:
  - UI hiện tại đã có sẵn luồng `recommended -> Gợi ý cho bạn`.
  - Không thấy logic phụ nào override nhóm này.

## Counter-Hypothesis
- Giả thuyết đối chứng: Có thể page create đang hardcode danh sách gợi ý ở nơi khác.
- Kết quả loại trừ:
  - Đọc `app/admin/home-components/create/page.tsx` cho thấy page chỉ dựa vào `type.recommended` sau khi filter hidden types.

## Trả lời nhanh 5/8 câu bắt buộc
1. Triệu chứng: 5 component phổ biến chưa xuất hiện trong `Gợi ý cho bạn`, dù đã có route/create page riêng.
2. Phạm vi ảnh hưởng: UX chọn loại component ở admin `/admin/home-components/create`.
3. Tái hiện: ổn định, chỉ cần mở trang create là thấy.
4. Mốc thay đổi gần nhất: chưa cần xác định commit cụ thể; evidence hiện tại đủ để kết luận metadata chưa bật.
5. Dữ liệu thiếu: chưa có.
6. Giả thuyết thay thế: UI hardcode riêng danh sách gợi ý; đã loại trừ.
7. Rủi ro nếu fix sai: component vẫn không vào nhóm gợi ý hoặc thứ tự hiển thị không như kỳ vọng.
8. Pass/fail: 5 component xuất hiện trong `Gợi ý cho bạn`, nhóm còn lại vẫn hoạt động như cũ.

# IV. Proposal (Đề xuất)
- Sửa tối thiểu tại `lib/home-components/componentTypes.ts`.
- Thêm `recommended: true` cho đúng 5 type:
  - `Blog`
  - `Testimonials`
  - `About`
  - `Contact`
  - `SpeedDial`
- Không đổi label, route, icon, position, singleton hay hidden logic.
- Không thêm component mới vì các component này đã tồn tại sẵn trong hệ thống.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\lib\home-components\componentTypes.ts`
  - Vai trò hiện tại: chứa metadata gốc cho toàn bộ home-component type, gồm label, route, position, singleton, recommended.
  - Thay đổi: bật `recommended: true` cho 5 component phổ biến để chúng tự đi vào nhóm `Gợi ý cho bạn`.

- Không dự kiến sửa: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs\app\admin\home-components\create\page.tsx`
  - Vai trò hiện tại: render nhóm gợi ý và nhóm còn lại theo metadata.
  - Lý do không sửa: logic hiện tại đã đủ, chỉ thiếu metadata đầu vào.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại `lib/home-components/componentTypes.ts` để bám đúng style object hiện có.
2. Cập nhật `recommended: true` cho 5 item mục tiêu.
3. Static review để chắc không làm đổi type/value/route hiện có.
4. Nếu có thay đổi code TypeScript, chạy `bunx tsc --noEmit` theo rule repo trước khi commit.
5. Commit thay đổi cục bộ, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Static verification:
  - Soát diff để xác nhận chỉ thêm field `recommended: true` đúng 5 nơi.
  - Kiểm tra không ảnh hưởng các type đã recommended trước đó.
- Type verification:
  - Chạy `bunx tsc --noEmit` vì có thay đổi code/TS.
- Functional verification thủ công (không chạy app trong spec mode):
  - Mở `/admin/home-components/create`.
  - Xác nhận `Speed Dial`, `Liên hệ`, `Về chúng tôi`, `Tin tức / Blog`, `Đánh giá / Review` xuất hiện trong section `Gợi ý cho bạn`.
  - Xác nhận card vẫn link đúng route create tương ứng.

# VIII. Todo
- [ ] Cập nhật metadata `recommended` cho 5 home-component mục tiêu.
- [ ] Review tĩnh diff để bảo đảm không lệch các field khác.
- [ ] Chạy `bunx tsc --noEmit`.
- [ ] Commit thay đổi cục bộ theo rule repo.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Pass khi:
  - `Blog`, `Testimonials`, `About`, `Contact`, `SpeedDial` xuất hiện trong nhóm `Gợi ý cho bạn` tại `/admin/home-components/create`.
  - Không phát sinh nhóm UI mới.
  - Không thay đổi route hoặc hành vi của các card khác.
  - TypeScript check pass.
- Fail khi:
  - Một trong 5 mục vẫn nằm ở `Các component còn lại`.
  - Có thêm side effect ngoài phạm vi như đổi thứ tự lớn, đổi label, đổi route.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: nhóm `Gợi ý cho bạn` sẽ đông hơn trước, có thể hơi dài hơn trên mobile.
- Mức rủi ro: thấp, vì chỉ đổi metadata hiển thị.
- Rollback: bỏ `recommended: true` ở các item vừa thêm là quay lại trạng thái cũ.

# XI. Out of Scope (Ngoài phạm vi)
- Không tạo home-component mới.
- Không thêm badge mới như `Phổ biến`.
- Không đổi layout, copywriting, tooltip, search/filter hay thứ tự tổng thể của trang create.
- Không chỉnh route riêng của từng create page.

# XII. Open Questions (Câu hỏi mở)
- Không có ở thời điểm này.

Root Cause Confidence: High — evidence trực tiếp từ `page.tsx` và metadata type cho thấy nguyên nhân nằm ở cờ `recommended` chưa được bật.