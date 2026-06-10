
# I. Primer

## 1. TL;DR kiểu Feynman
- Stats hiện tại chỉ có 2 field cấu hình: tiêu đề + trạng thái bật/tắt.
- Services đã có đầy đủ: toggle hiển thị title/subtitle, input subtitle, căn title, số cột desktop, căn icon toàn bộ.
- Ta sẽ copy pattern UI/UX từ services sang stats để 2 component có sự nhất quán, đồng thời stats linh hoạt hơn.
- Cần cập nhật: types, constants, edit page, create page, preview, site runtime, và ComponentRenderer (StatsSection).

## 2. Elaboration & Self-Explanation
Stats và Services là 2 component tương đồng: đều hiển thị grid items (số liệu / dịch vụ), đều có icon, đều có 6 styles. Nhưng stats đang "cứng" — không cho user ẩn title, không có subtitle, không chọn được số cột hay căn tiêu đề.

Services đã giải quyết tốt bằng cách thêm các toggle + selector vào card cấu hình chính. Ta chỉ cần "học" cùng pattern đó: thêm state mới vào edit/create, persist vào config, truyền xuống preview + site.

## 3. Concrete Examples & Analogies
- Ví dụ cụ thể: User muốn stats ẩn title trên site nhưng vẫn giữ tên "Thống kê doanh số" trong admin để quản lý → cần toggle `showTitle`.
- User muốn stats grid 3 cột thay vì 4 → cần `desktopColumns`.
- Analogy: Giống như TV có remote — Services đã có remote đầy đủ, Stats mới chỉ có nút bật/tắt.

# II. Audit Summary (Tóm tắt kiểm tra)

| Khía cạnh | Services | Stats |
|---|---|---|
| showTitle toggle | ✅ | ❌ |
| showSubtitle toggle | ✅ | ❌ |
| subtitle input | ✅ | ❌ |
| headerAlign (L/C/R) | ✅ | ❌ |
| desktopColumns (3/4) | ✅ | ❌ |
| mediaPlacement (top/left) | ✅ (ServicesForm) | ❌ |
| mediaAlign (L/C/R khi top) | ✅ (ServicesForm) | ❌ |

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Root Cause**: Stats được build trước, chưa được cập nhật config UI khi Services mở rộng. Confidence: High.
- **Counter-Hypothesis**: Stats cố ý giữ đơn giản? → User yêu cầu rõ ràng muốn mở rộng, loại bỏ giả thuyết này.

# IV. Proposal (Đề xuất)

Thêm các field config cho Stats giống Services:

1. **`showTitle`** (boolean, default `true`) — toggle hiển thị title
2. **`showSubtitle`** (boolean, default `true`) — toggle hiển thị subtitle
3. **`subtitle`** (string, default `''`) — nội dung subtitle
4. **`headerAlign`** (`'left' | 'center' | 'right'`, default `'left'`) — căn title/subtitle
5. **`desktopColumns`** (`3 | 4`, default `4`) — số cột grid desktop
6. **`mediaPlacement`** (`'top' | 'left'`, default `'top'`) — căn icon/ảnh toàn bộ (trên/bên trái)
7. **`mediaAlign`** (`'left' | 'center' | 'right'`, default `'center'`) — căn ngang khi icon nằm trên

Stats giữ `4` cột mặc định (vì data thống kê thường là 4 items), khác Services mặc định `3`.

# V. Files Impacted (Tệp bị ảnh hưởng)

### Types / Config
- **`app/admin/home-components/stats/_types/index.ts`** — Định nghĩa types cho stats. Sửa: thêm `StatsHeaderAlign`, mở rộng `StatsContent` thêm 7 fields mới.
- **`app/admin/home-components/stats/_lib/constants.ts`** — Default values. Sửa: thêm `DEFAULT_STATS_CONFIG` object đầy đủ (tương tự `DEFAULT_SERVICES_CONFIG`).

### Admin Edit/Create
- **`app/admin/home-components/stats/[id]/edit/page.tsx`** — Edit page. Sửa: thêm 7 state, thêm UI card cấu hình (clone từ services edit), truyền props mới xuống preview, persist vào config khi save.
- **`app/admin/home-components/create/stats/page.tsx`** — Create page. Sửa: thêm state + UI tương tự, truyền vào config khi submit.

### Preview
- **`app/admin/home-components/stats/_components/StatsPreview.tsx`** — Preview admin. Sửa: nhận thêm props (showTitle, showSubtitle, subtitle, headerAlign, desktopColumns, mediaPlacement, mediaAlign, title), render header section + áp dụng columns/mediaPlacement vào grid.
- **`app/admin/home-components/stats/_components/StatsForm.tsx`** — Form danh sách items. Sửa: thêm section "Căn icon/ảnh cho toàn bộ" (mediaPlacement + mediaAlign) tương tự ServicesForm, nhận thêm props.

### Site Runtime
- **`components/site/ComponentRenderer.tsx`** — StatsSection trong ComponentRenderer. Sửa: đọc thêm config fields mới, render header (title/subtitle) + áp dụng columns/alignment.
- **`components/site/home/sections/StatsRuntimeSection.tsx`** — Runtime section. Sửa: nhận + render header, áp dụng desktopColumns, mediaPlacement.

# VI. Execution Preview (Xem trước thực thi)

1. Mở rộng types (`_types/index.ts`) — thêm fields vào `StatsContent`
2. Cập nhật constants (`_lib/constants.ts`) — thêm `DEFAULT_STATS_CONFIG`
3. Cập nhật `StatsForm` — thêm section "Căn icon/ảnh toàn bộ" + nhận props mới
4. Cập nhật `StatsPreview` — nhận + render header, áp dụng columns + alignment
5. Cập nhật edit page — thêm 7 state, UI card cấu hình, wiring persist/load
6. Cập nhật create page — thêm state + UI + submit config
7. Cập nhật `ComponentRenderer.tsx` StatsSection — đọc config mới, render header
8. Cập nhật `StatsRuntimeSection.tsx` — tương tự
9. Static review: kiểm tra typing, backward compat (dữ liệu cũ không có field mới → fallback default)

# VII. Verification Plan (Kế hoạch kiểm chứng)

- `bunx tsc --noEmit` — không lỗi type
- Dữ liệu cũ (config không có field mới) → fallback default, không crash
- Preview hiển thị đúng khi toggle on/off title/subtitle
- Preview phản ánh đúng alignment, columns
- Site runtime render đúng tương ứng

# VIII. Todo

1. Mở rộng `_types/index.ts` + `_lib/constants.ts`
2. Cập nhật `StatsForm` (thêm mediaPlacement/mediaAlign section)
3. Cập nhật `StatsPreview` (nhận props mới, render header + columns)
4. Cập nhật edit page (state, UI card, persist, load)
5. Cập nhật create page (state, UI, submit)
6. Cập nhật `ComponentRenderer.tsx` StatsSection
7. Cập nhật `StatsRuntimeSection.tsx`
8. Chạy `bunx tsc --noEmit`

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [ ] Edit/Create stats có UI config tương tự services: toggle showTitle, showSubtitle, input subtitle, căn tiêu đề 3 hướng, số cột desktop 3/4, căn icon toàn bộ top/left + align khi top
- [ ] Preview phản ánh thay đổi realtime
- [ ] Site runtime render đúng config
- [ ] Dữ liệu cũ không crash (backward compat)
- [ ] `bunx tsc --noEmit` pass

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro thấp**: Chỉ thêm fields optional, dữ liệu cũ fallback default → không break.
- **Rollback**: Revert commit, config cũ vẫn hoạt động vì các field đều optional với default.

# XI. Out of Scope (Ngoài phạm vi)

- Không refactor preview thành shared component (Stats vs Services vẫn giữ riêng)
- Không thay đổi schema Convex (config là JSON object untyped)
- Không sửa style/layout của 6 stats styles ngoài việc áp dụng columns + alignment mới
