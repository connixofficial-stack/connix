
# I. Primer

## 1. TL;DR kiểu Feynman
- Hiện tại khi admin chỉnh màu home-component, UI hiện warning kiểu kỹ thuật: "Có 1 cặp màu chưa đạt APCA (minLc=37.9)" hoặc "deltaE=15".
- Người dùng cuối (admin) không hiểu "APCA", "minLc", "deltaE" là gì — đây là thuật ngữ chuyên gia accessibility.
- Mục tiêu: **ẩn hoàn toàn** các warning này khỏi UI, vì validation vẫn chạy ngầm (token vẫn auto-fix contrast) nhưng không cần hiển thị jargon cho end-user.
- Ảnh hưởng **~20+ home-components** cả ở trang `/edit` và `/create`.

## 2. Elaboration & Self-Explanation
Hệ thống color có 2 tầng:
1. **Token generation** (`_lib/colors.ts`): derive màu text/background từ primary/secondary, đã có logic `resolveBrandTextOnBackground` tự chọn màu đủ contrast.
2. **Validation layer**: sau khi derive token, tính lại APCA score rồi hiện warning nếu có cặp không đạt ngưỡng.

Vấn đề: tầng 2 (validation warning) được hiện trực tiếp cho admin, nhưng admin không có action nào để "fix" cặp màu fail cụ thể — họ chỉ đổi được primary/secondary. Warning này chỉ có ý nghĩa với developer khi debug color algorithm.

Giải pháp: bỏ **hiển thị** warning trên UI, giữ nguyên logic validation bên trong (không xóa code tính toán, chỉ bỏ phần render warning box).

## 3. Concrete Examples & Analogies
- **Ví dụ trong repo**: Service-list edit page tính `warningMessages` rồi render warning box amber. Sau fix, `warningMessages` useMemo vẫn tồn tại nhưng không được render ra UI. Hoặc đơn giản hơn: xóa luôn cả useMemo tạo `warningMessages` + xóa JSX render warning.
- **Tương tự đời thường**: như xe hơi có cảm biến engine — thông tin diagnostic hữu ích cho thợ sửa, nhưng không cần hiện raw error code trên bảng điều khiển cho tài xế.

# II. Audit Summary (Tóm tắt kiểm tra)

Tìm thấy pattern warning APCA/deltaE/minLc ở **3 loại vị trí**:

| Vị trí | Pattern | Số file ảnh hưởng |
|--------|---------|-------------------|
| `[component]/[id]/edit/page.tsx` | `warningMessages` useMemo + render amber box | ~12-15 |
| `[component]/_components/*Preview.tsx` | Tự tính validation + render warning | ~8-10 |
| `create/[component]/page.tsx` | `warningMessages` useMemo + render | ~14-16 |

Tổng cộng **~35-40 file** cần sửa.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

**Root Cause** (Confidence: High):
Warning APCA/deltaE được thiết kế cho developer debug color system, nhưng vô tình được ship trên UI production cho end-user. Đây không phải bug — là design decision cần điều chỉnh.

**Counter-Hypothesis đã loại trừ**:
- "Chỉ service-list bị" → **Sai**, ~20+ component đều có.
- "Warning giúp user chọn màu tốt hơn" → **Không thuyết phục**, user không hiểu APCA/minLc và không có control đủ granular để fix từng cặp token.

# IV. Proposal (Đề xuất)

**Xóa hoàn toàn phần render warning APCA/deltaE trên UI** cho tất cả home-components:

1. Ở mỗi `edit/page.tsx` và `create/page.tsx`:
   - Xóa `warningMessages` useMemo block
   - Xóa JSX render warning amber box
   - Xóa prop `warningMessages` truyền xuống Form component (nếu có)

2. Ở mỗi `*Preview.tsx`:
   - Xóa `warningMessages` useMemo block
   - Xóa JSX render warning amber box

3. Ở Form components nhận prop `warningMessages`:
   - Xóa prop definition khỏi interface/type
   - Xóa phần render warning

4. **Giữ nguyên**: logic `getXxxValidationResult()`, `getAccessibilityScore()`, `getHarmonyStatus()` trong `_lib/colors.ts` — vì `validation.tokens` vẫn được dùng để render preview, chỉ bỏ phần hiện warning text.

# V. Files Impacted (Tệp bị ảnh hưởng)

**Nhóm Edit pages** (~12-15 file): Xóa `warningMessages` useMemo + render JSX warning
- `service-list/[id]/edit/page.tsx`, `services/[id]/edit/page.tsx`, `pricing/[id]/edit/page.tsx`, `team/[id]/edit/page.tsx`, `testimonials/[id]/edit/page.tsx`, `voucher-promotions/[id]/edit/page.tsx`, `clients/[id]/edit/page.tsx`, `contact/[id]/edit/page.tsx`, `case-study/[id]/edit/page.tsx`, `career/[id]/edit/page.tsx`, `blog/[id]/edit/page.tsx`, `benefits/[id]/edit/page.tsx`, `cta/[id]/edit/page.tsx`

**Nhóm Preview components** (~8-10 file): Xóa `warningMessages` useMemo + render JSX warning
- `service-list/_components/ServiceListPreview.tsx`, `pricing/_components/PricingPreview.tsx`, `team/_components/TeamPreview.tsx`, `faq/_components/FaqPreview.tsx`, `cta/_components/CTAPreview.tsx`, v.v.

**Nhóm Form components** (~3-5 file): Xóa prop `warningMessages` + render
- `service-list/_components/ServiceListForm.tsx`, `clients/_components/*Form.tsx`, v.v.

**Nhóm Create pages** (~14-16 file): Xóa `warningMessages` useMemo + render JSX warning
- `create/services/page.tsx`, `create/pricing/page.tsx`, `create/team/page.tsx`, `create/voucher-promotions/page.tsx`, `create/testimonials/page.tsx`, `create/contact/page.tsx`, `create/clients/page.tsx`, `create/case-study/page.tsx`, `create/career/page.tsx`, `create/blog/page.tsx`, `create/benefits/page.tsx`, `create/faq/page.tsx`, `create/about/page.tsx`, `create/product-list/_shared.tsx`

**Không sửa**: `_lib/colors.ts`, `lib/home-components/color-system.ts` — giữ nguyên logic validation.

# VI. Execution Preview (Xem trước thực thi)

1. **Scan** tất cả file chứa `warningMessages`/`minLc`/`APCA` warning render
2. **Edit pages**: xóa `warningMessages` useMemo + amber box JSX + prop passing
3. **Preview components**: xóa `warningMessages` useMemo + amber box JSX
4. **Form components**: xóa prop definition + render
5. **Create pages**: xóa `warningMessages` useMemo + amber box JSX
6. **Review tĩnh**: đảm bảo không xóa nhầm `validation` variable (vẫn cần cho tokens)
7. **TypeCheck**: `bunx tsc --noEmit`

> Vì số file lớn (~35-40), sẽ dùng sub-agent song song để tăng tốc.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- `bunx tsc --noEmit` pass — không lỗi type do xóa prop/variable
- Grep lại `warningMessages` / `minLc` / `APCA` / `deltaE` trong JSX render → không còn hiện trên UI
- Spot-check: `validation.tokens` vẫn được sử dụng trong Preview render → preview không bị vỡ

# VIII. Todo

1. Xóa warning render ở edit pages (~13 file)
2. Xóa warning render ở preview components (~8 file)
3. Xóa warning prop ở form components (~4 file)
4. Xóa warning render ở create pages (~15 file)
5. TypeCheck: `bunx tsc --noEmit`
6. Grep verify không còn warning APCA/deltaE trên UI

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Không còn warning amber box chứa "APCA", "minLc", "deltaE" trên bất kỳ home-component edit/create/preview nào.
- Logic validation (`getXxxValidationResult`, `getAccessibilityScore`) vẫn tồn tại, `validation.tokens` vẫn dùng cho preview.
- TypeCheck pass.
- Không ảnh hưởng UI/UX khác (preview, form, save).

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro thấp**: chỉ xóa UI render, không thay đổi logic business hay data.
- **Rollback**: `git revert` 1 commit.
- **Lưu ý**: nếu tương lai cần hiện warning dạng user-friendly ("Màu có thể khó đọc, thử đổi màu khác"), có thể thêm lại dễ dàng vì validation logic vẫn giữ nguyên.

# XI. Out of Scope (Ngoài phạm vi)

- Không refactor/gom validation logic về helper chung.
- Không thay đổi color token generation.
- Không tạo warning user-friendly thay thế (nếu muốn, làm task riêng).
- Không xóa `_lib/colors.ts` validation functions.
