# Fix Stats Component - Render icon/ảnh ở vị trí "Trái" (Left Placement)

## I. Primer

### 1. TL;DR kiểu Feynman

- Stats component có tùy chọn `mediaPlacement`: "Trên" (top) hoặc "Trái" (left)
- Hiện tại icon/ảnh LUÔN render ở trên (top), dù user chọn "Trái"
- Services component đã implement đúng: icon có thể nằm trên hoặc bên trái
- Cần học Services: thêm logic conditional render dựa trên `mediaPlacement`
- Khi `left`: layout flex-row (icon trái, text phải)
- Khi `top`: layout flex-col (icon trên, text dưới)

### 2. Elaboration & Self-Explanation

Trong Stats component, có 2 props quan trọng:
- `mediaPlacement`: vị trí icon (top/left)
- `mediaAlign`: căn icon (left/center/right khi top, hoặc top/center/bottom khi left)

Hiện tại, cả StatsPreview và StatsSection (site) đều hardcode layout flex-col với icon luôn ở trên. Không có logic nào check `mediaPlacement === 'left'` để đổi sang layout flex-row.

Services component đã làm đúng:
```tsx
{mediaPlacement === 'left' ? (
  <div className="flex items-center gap-4">
    {renderMedia()}
    <div className="text-left">
      {renderContent()}
    </div>
  </div>
) : (
  <div className="flex flex-col items-center">
    {renderMedia()}
    {renderContent()}
  </div>
)}
```

Cần apply pattern tương tự cho Stats, với các điều chỉnh:
- Khi `left`: icon wrapper dùng `self-center` để căn dọc
- Khi `top`: icon wrapper dùng `mediaAlign` để căn ngang
- Mỗi style (horizontal, cards, icons, gradient, minimal, counter) cần update riêng

### 3. Concrete Examples & Analogies

**Ví dụ cụ thể:**

Hiện tại (sai):
```tsx
<div className="flex flex-col items-center">
  <Icon /> {/* Luôn ở trên */}
  <span>5000+</span>
  <h3>Khách hàng</h3>
</div>
```

Mong muốn khi chọn "Trái":
```tsx
<div className="flex items-center gap-3">
  <Icon /> {/* Ở bên trái */}
  <div>
    <span>5000+</span>
    <h3>Khách hàng</h3>
  </div>
</div>
```

**Analogy:**

Giống như bạn sắp xếp tủ sách: có thể xếp sách theo chiều dọc (đứng) hoặc chiều ngang (nằm). Hiện tại code chỉ biết xếp dọc, cần thêm logic để xếp ngang khi user chọn.

## II. Audit Summary (Tóm tắt kiểm tra)

### Evidence từ code

**File: `app/admin/home-components/stats/_components/StatsPreview.tsx`**

Tất cả 6 style đều render icon ở top:
```tsx
<div className={cn("flex flex-col", getItemAlignClass(mediaAlign))}>
  {renderIcon()}
  <span>{value}</span>
  <h3>{label}</h3>
</div>
```

Không có logic nào check `mediaPlacement === 'left'`.

**File: `components/site/ComponentRenderer.tsx` (StatsSection)**

Tương tự, tất cả 6 style đều hardcode flex-col:
```tsx
<div className="flex flex-col items-center">
  {renderIcon()}
  <span>{value}</span>
  <h3>{label}</h3>
</div>
```

**File: `components/site/ServicesSectionCore.tsx` (Reference)**

Services có logic đúng:
```tsx
const stackedLayout = mediaPlacement !== 'left';
const articleClassName = stackedLayout 
  ? `px-6 py-7 ${textAlignClassName}` 
  : 'flex items-center gap-4 px-6 py-7';

{mediaPlacement === 'left' ? (
  <div className="flex items-start gap-3">
    {renderMedia()}
    <div>{renderContent()}</div>
  </div>
) : (
  <div className={textAlignClassName}>
    {renderMedia()}
    {renderContent()}
  </div>
)}
```

### Gap Analysis

1. **StatsPreview**: Thiếu logic conditional render cho `mediaPlacement === 'left'` ở cả 6 style
2. **StatsSection (site)**: Thiếu logic conditional render cho `mediaPlacement === 'left'` ở cả 6 style
3. **StatsForm**: Tùy chọn `mediaAlign` chỉ hiện khi `mediaPlacement === 'top'` (cần fix riêng)

## III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

### Root Cause Confidence: High (95%)

**Nguyên nhân:**
Stats component được implement trước Services, chưa có requirement về left placement. Khi Services thêm feature này, Stats không được sync.

**Evidence:**
- Services có `mediaPlacement` prop và logic render đầy đủ
- Stats có `mediaPlacement` prop nhưng không dùng trong render logic
- Form admin có tùy chọn nhưng preview/site không reflect

### Counter-Hypothesis

**H1:** `mediaPlacement` prop không được truyền vào component

**Bác bỏ:** Đã verify trong edit page, prop được truyền đầy đủ vào StatsPreview và persist vào DB.

**H2:** Có version code khác đang chạy

**Bác bỏ:** Đã đọc code hiện tại, không có logic left placement.

## IV. Proposal (Đề xuất)

### Option 1 (Recommend) — Confidence 90%

**Implement đầy đủ left placement cho cả preview và site, học theo Services:**

1. Tạo helper functions tương tự Services:
   - `getItemLayoutClass(mediaPlacement, mediaAlign)`: trả về flex-col hoặc flex-row
   - `getMediaWrapperClass(mediaPlacement, mediaAlign)`: trả về class cho icon wrapper

2. Update cả 6 style trong StatsPreview:
   - Wrap mỗi stat item với conditional layout
   - Khi `left`: flex-row với gap, icon wrapper self-center
   - Khi `top`: flex-col với mediaAlign

3. Update cả 6 style trong StatsSection (site):
   - Apply cùng logic như preview

4. Update StatsForm:
   - Bỏ conditional `{mediaPlacement === 'top' && (...)}`
   - Hiển thị tùy chọn align cho cả 2 placement
   - Label động: "Căn ngang" vs "Căn dọc"

**Lý do:**
- Parity đầy đủ với Services
- UX nhất quán: user thấy gì trong form là được gì trong preview/site
- Maintainable: pattern rõ ràng, dễ extend

**Tradeoff:**
- Cần sửa nhiều file (2 component × 6 style = 12 render functions)
- Cần test kỹ cả 6 style × 2 placement × 3 align = 36 combinations

### Option 2 — Confidence 60%

**Chỉ fix 1-2 style phổ biến nhất (horizontal, cards), để lại các style khác:**

**Lý do:**
- Nhanh hơn, ít code change
- User có thể chỉ dùng 1-2 style

**Tradeoff:**
- Inconsistent: một số style support left, một số không
- User confusion: tại sao style A có left nhưng style B không?

## V. Files Impacted (Tệp bị ảnh hưởng)

### 1. `app/admin/home-components/stats/_components/StatsPreview.tsx`

**Vai trò:** Preview component cho admin, render 6 style khác nhau

**Thay đổi:**
- Thêm: Helper functions `getItemLayoutClass`, `getMediaWrapperClass`
- Sửa: 6 render functions (renderHorizontalStyle, renderCardsStyle, renderIconsStyle, renderGradientStyle, renderMinimalStyle, renderCounterStyle)
- Logic: Mỗi function check `mediaPlacement === 'left'` để render flex-row hoặc flex-col

### 2. `components/site/ComponentRenderer.tsx` (StatsSection)

**Vai trò:** Site component render Stats thực tế

**Thay đổi:**
- Sửa: 6 style blocks trong StatsSection function
- Logic: Tương tự StatsPreview, check `mediaPlacement === 'left'`

### 3. `app/admin/home-components/stats/_components/StatsForm.tsx`

**Vai trò:** Form admin để config Stats

**Thay đổi:**
- Sửa: Bỏ conditional `{mediaPlacement === 'top' && (...)}`
- Thêm: Label động dựa trên `mediaPlacement`

## VI. Execution Preview (Xem trước thực thi)

1. **Tạo helper functions** trong StatsPreview.tsx
2. **Update renderHorizontalStyle** (test đầu tiên)
3. **Verify preview** với horizontal style
4. **Update 5 style còn lại** trong StatsPreview
5. **Update StatsSection** (site) với cùng logic
6. **Update StatsForm** để hiện tùy chọn align cho cả 2 placement
7. **Typecheck** `bunx tsc --noEmit`
8. **Commit** kèm spec

## VII. Verification Plan (Kế hoạch kiểm chứng)

### Typecheck
- `bunx tsc --noEmit` sau mỗi file change

### Manual Testing (do tester)
1. Mở `/admin/home-components/stats/[id]/edit`
2. Test matrix:
   - 6 style × 2 placement × 3 align = 36 combinations
   - Verify preview render đúng
   - Lưu và verify site render đúng
3. Responsive: test mobile/tablet/desktop
4. Edge cases:
   - Item không có icon
   - Item có icon URL dài
   - Item có text dài

## VIII. Todo

- [ ] Tạo helper functions trong StatsPreview
- [ ] Update renderHorizontalStyle (preview)
- [ ] Update renderCardsStyle (preview)
- [ ] Update renderIconsStyle (preview)
- [ ] Update renderGradientStyle (preview)
- [ ] Update renderMinimalStyle (preview)
- [ ] Update renderCounterStyle (preview)
- [ ] Update StatsSection horizontal style (site)
- [ ] Update StatsSection cards style (site)
- [ ] Update StatsSection icons style (site)
- [ ] Update StatsSection gradient style (site)
- [ ] Update StatsSection minimal style (site)
- [ ] Update StatsSection counter style (site)
- [ ] Update StatsForm để hiện align cho cả 2 placement
- [ ] Typecheck
- [ ] Commit

## IX. Acceptance Criteria (Tiêu chí chấp nhận)

- [ ] Khi chọn `mediaPlacement = 'left'`, icon render bên trái text (flex-row layout)
- [ ] Khi chọn `mediaPlacement = 'top'`, icon render trên text (flex-col layout)
- [ ] `mediaAlign` hoạt động đúng cho cả 2 placement
- [ ] Cả 6 style đều support left placement
- [ ] Preview và site render giống nhau
- [ ] Responsive OK trên mobile/tablet/desktop
- [ ] Typecheck pass

## X. Risk / Rollback (Rủi ro / Hoàn tác)

### Risk
- **High:** Sửa 12 render functions (6 preview + 6 site), dễ miss edge case hoặc inconsistent
- **Medium:** Layout shift có thể ảnh hưởng spacing/alignment hiện tại

### Mitigation
- Test từng style một, commit incremental
- Dùng Services code làm reference chặt chẽ
- Screenshot before/after cho mỗi style

### Rollback
- Revert commit nếu phát hiện regression
- Dễ rollback vì không đụng schema, chỉ render logic

## XI. Out of Scope (Ngoài phạm vi)

- Không thêm placement mới (ví dụ: right, bottom)
- Không refactor toàn bộ Stats component
- Không thay đổi color logic hoặc style variants

## XII. Open Questions (Câu hỏi mở)

1. **Có cần support `mediaAlign` cho left placement không?**
   - Services dùng `self-center` cố định khi left
   - Hoặc có thể dùng `self-start`, `self-center`, `self-end` để căn dọc?
   - **Decision:** Học theo Services, dùng `self-center` cố định khi left, chỉ apply `mediaAlign` khi top

2. **Có cần update Services Form để sync với Stats không?**
   - Services Form cũng có conditional tương tự
   - **Decision:** Không, user chỉ report Stats
