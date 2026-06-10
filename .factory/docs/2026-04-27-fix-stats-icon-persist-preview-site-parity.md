# I. Primer

## 1. TL;DR kiểu Feynman

- Icon picker đã update state trong `StatsForm`, nhưng các tầng cha đang chỉ lấy `label` và `value`.
- Vì vậy preview không thấy icon, save lên Convex không có icon, F5 thì dữ liệu icon mất.
- Edit page cần preserve đủ `iconType`, `iconName`, `iconUrl` khi load, preview và save.
- Create page hiện chưa dùng `StatsForm`, nên cần đổi sang dùng chung form để create cũng có icon picker và lưu icon.
- Site renderer cũng cần đọc/render icon để giao diện thật giống preview.

## 2. Elaboration & Self-Explanation

Luồng đúng phải là: người dùng chọn icon trong form → state `statsItems` có icon → preview nhận nguyên item có icon → save config lên Convex có icon → refresh load lại vẫn còn icon → site thật render icon. Hiện tại `StatsForm` đã làm được bước đầu, nhưng edit/create và renderer đang tự rút gọn item thành `{ label, value }`, làm mất 3 field icon.

Cách sửa tốt nhất là giữ contract `StatsItem` làm source of truth cho toàn bộ Stats component. Không thêm schema Convex vì `homeComponents.config` đang là `v.any()`, chỉ cần không bỏ field khi build config.

## 3. Concrete Examples & Analogies

Ví dụ cụ thể: user chọn `iconType: 'lucide'`, `iconName: 'Award'` cho item “98%”. `StatsForm` có state đúng, nhưng `StatsPreview` đang được truyền `{ label: 'Đánh giá tích cực', value: '98%' }`, nên không thể biết phải render `Award`.

Analogy: giống như điền thêm cột “icon” vào bảng Excel, nhưng khi lưu file hệ thống chỉ export 2 cột “label/value”, nên mở lại file thì cột icon biến mất.

# II. Audit Summary (Tóm tắt kiểm tra)

- Observation: `app/admin/home-components/stats/_components/StatsForm.tsx` đã có `iconType`, `iconName`, `iconUrl` và update state đúng.
- Observation: `app/admin/home-components/stats/[id]/edit/page.tsx` khi load DB chỉ map `{ id, label, value }`, bỏ icon fields.
- Observation: `app/admin/home-components/stats/[id]/edit/page.tsx` khi save config chỉ gửi `{ label, value }`, bỏ icon fields.
- Observation: `app/admin/home-components/stats/[id]/edit/page.tsx` khi preview cũng chỉ truyền `{ label, value }`, nên 6 UI không nhận icon.
- Observation: `app/admin/home-components/create/stats/page.tsx` tự build form riêng, không dùng `StatsForm`, nên create chưa có icon contract đầy đủ.
- Observation: `components/site/ComponentRenderer.tsx` `StatsSection` đang đọc item như `{ value, label }[]`, nên site thật chưa render icon.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

Độ tin cậy nguyên nhân gốc: High.

- Root cause chính: icon fields bị strip ở các boundary `load -> state`, `state -> preview`, `state -> save`, và `config -> site renderer`.
- Counter-hypothesis: Convex không lưu được icon. Loại trừ ở mức cao vì `homeComponents.config` dùng `v.any()`, mutation `update/create` nhận `config: v.any()`, nên DB không chặn field icon.
- Counter-hypothesis: `StatsForm` không update state. Loại trừ ở mức cao vì `handleUpdate` merge patch và `StatsItem` type có đủ fields.
- Rủi ro nếu fix sai: preview có icon nhưng site thật vẫn không có, hoặc create/edit lưu format lệch nhau.
- Tiêu chí pass/fail: chọn icon ở edit/create → preview hiện icon ở cả 6 style → lưu → F5 vẫn còn icon → site render icon.

# IV. Proposal (Đề xuất)

Sửa theo hướng nhỏ nhất, giữ pattern hiện có:

1. Edit page preserve full StatsItem contract.
   - Load từ config giữ `iconType`, `iconName`, `iconUrl`.
   - Save config map đủ các field icon.
   - Preview truyền `statsItems` đầy đủ thay vì map mất icon.

2. Create page dùng lại `StatsForm`.
   - Thay form tự build bằng `StatsForm` để create/edit cùng UI và cùng behavior.
   - State type dùng `StatsFormItem[]`.
   - Submit config map đủ `label`, `value`, `iconType`, `iconName`, `iconUrl`.

3. ComponentRenderer render icon cho site thật.
   - Import `lucide-react` hoặc dùng dynamic icon map tương tự preview.
   - Update `StatsSection` item type để đọc đủ icon fields.
   - Với mỗi 6 style, render lucide/url icon giống preview; giữ fallback số liệu như hiện tại khi không có icon.

4. Tự review tĩnh, không chạy lint/build/test theo AGENTS.md.

# V. Files Impacted (Tệp bị ảnh hưởng)

- Sửa: `app/admin/home-components/stats/[id]/edit/page.tsx` — hiện là edit surface cho Stats; sẽ preserve icon fields khi load/save/preview.
- Sửa: `app/admin/home-components/create/stats/page.tsx` — hiện là create surface tự build form riêng; sẽ dùng `StatsForm` và lưu icon fields.
- Sửa: `components/site/ComponentRenderer.tsx` — hiện là renderer site thật cho Stats; sẽ đọc/render icon fields để parity với preview.
- Có thể sửa nhỏ: `app/admin/home-components/stats/_types/index.ts` nếu cần helper type cho item config, nhưng ưu tiên không đổi nếu không cần.

# VI. Execution Preview (Xem trước thực thi)

1. Chỉnh edit page:
   - map item từ DB thành `{ id, label, value, iconType, iconName, iconUrl }`.
   - tạo helper `serializeStatsItem` hoặc inline map để save đủ field.
   - truyền `items={statsItems}` cho `StatsPreview`.

2. Chỉnh create page:
   - import `StatsForm` và `StatsFormItem`.
   - thay UI list thủ công bằng `<StatsForm items={statsItems} onChange={setStatsItems} />`.
   - submit config đủ icon fields.

3. Chỉnh site renderer:
   - thêm resolver cho Lucide icon trong `ComponentRenderer.tsx`.
   - update `StatsSection` type item.
   - render icon/url cho `horizontal`, `cards`, `icons`, `gradient`, `minimal`, `counter` theo cùng logic preview.

4. Review tĩnh:
   - kiểm tra import unused sau khi bỏ `Plus`, `Trash2`, `Card...` ở create page.
   - kiểm tra `button type="button"` trong `StatsForm` đã có.
   - kiểm tra config cũ không có icon vẫn render như cũ.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Không chạy `npm run lint`, `bunx tsc`, build hoặc test runtime vì AGENTS.md cấm tự chạy lint/unit test và chỉ cho tĩnh review.
- Static review pass/fail:
  - Không còn chỗ nào trong edit/create strip `iconType/iconName/iconUrl`.
  - Create và edit cùng dùng `StatsForm`.
  - `StatsPreview` nhận full item.
  - `ComponentRenderer` đọc full item và giữ fallback cũ.
- Manual verification do tester:
  - Vào edit URL user cung cấp, chọn icon lucide cho từng item.
  - Check 6 preview styles hiện icon.
  - Lưu, F5, icon còn nguyên.
  - Tạo mới Stats component, chọn icon, lưu, mở edit lại vẫn còn icon.
  - Mở site/homepage thật, Stats hiện icon đúng style.

# VIII. Todo

- [ ] Sửa edit page preserve icon fields.
- [ ] Refactor create Stats dùng `StatsForm`.
- [ ] Sửa site `StatsSection` render icon cho 6 styles.
- [ ] Tự review tĩnh import/type/backward compatibility.
- [ ] Commit thay đổi sau khi hoàn tất theo rule repo.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Chọn icon ở edit thì 6 preview UI nhận icon ngay.
- Lưu edit xong F5 không mất icon.
- Create Stats có icon picker giống edit.
- Create Stats lưu icon vào config và mở lại edit vẫn thấy icon.
- Site renderer hiển thị icon cho cả lucide và URL icon ở 6 styles.
- Component cũ không có icon vẫn render số liệu/label như trước.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Risk: `components/site/ComponentRenderer.tsx` là file lớn; sửa cần rất surgical để tránh ảnh hưởng các section khác.
- Risk: import toàn bộ `lucide-react` trong site renderer có thể tăng bundle nếu không tree-shake tốt; tuy nhiên preview/form đang dùng cùng pattern và đây là fix contract nhanh, ít scope.
- Rollback: revert commit sẽ quay về behavior cũ; data icon đã lưu trong config sẽ vẫn nằm trong DB nhưng renderer cũ bỏ qua.

# XI. Out of Scope (Ngoài phạm vi)

- Không đổi schema Convex.
- Không migrate dữ liệu cũ.
- Không thiết kế lại UI Stats.
- Không refactor toàn bộ `ComponentRenderer.tsx` thành shared section trong task này.