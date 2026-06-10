# I. Primer

## 1. TL;DR kiểu Feynman
- Service-list hiện đã hết warning APCA/minLc ở UI preview.
- Nhưng chưa thể nói “hết toàn bộ home-components”: grep mới phát hiện `voucher-promotions/[id]/edit/page.tsx` vẫn còn render warning `APCA/minLc/ΔE`.
- Các match trong `_lib/colors.ts` là logic nội bộ, giữ lại là đúng.
- Cần sửa thêm đúng file `voucher-promotions/[id]/edit/page.tsx` để hết warning jargon còn sót trên UI admin.

## 2. Elaboration & Self-Explanation
Kết quả kiểm tra read-only cho thấy service-list đã sạch ở UI: không còn `warningMessages`, `APCA`, `minLc`, `AlertTriangle`, `Eye` trong `ServiceListPreview.tsx`. Tuy nhiên khi rà toàn bộ `app/admin/home-components`, có một UI file khác vẫn còn tạo và render warning: `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx`.

Các file `_lib/colors.ts` vẫn chứa `APCA`, `minLc`, `deltaE` vì đó là thuật toán tính màu/contrast, không phải text hiển thị cho admin. Không nên xóa các phần đó.

## 3. Concrete Examples & Analogies
- Service-list: đã bỏ khối UI cảnh báo trong `ServiceListPreview.tsx`, nên dòng user báo không còn nguồn render ở service-list.
- Voucher promotions: còn đoạn `warningMessages` tạo text `Có ... cặp màu chưa đạt APCA (minLc=...)` và render `<ul>` trong box amber.
- Analogy: đã dọn sạch phòng service-list, nhưng khi kiểm tra cả nhà thì còn một mẩu giấy cảnh báo kỹ thuật ở phòng voucher-promotions.

# II. Audit Summary (Tóm tắt kiểm tra)

Observation:
- `git status --short` sau commit chỉ còn 3 file docs cũ chưa track từ ngày 2026-04-26, không liên quan trực tiếp commit vừa rồi.
- Grep trong service-list UI không còn match warning jargon.
- Grep toàn bộ `app/admin/home-components` còn UI warning ở:
  - `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx:97` tạo `warningMessages`.
  - `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx:101` có `ΔE`.
  - `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx:105` có `APCA (minLc=...)`.
  - `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx:234-238` render warning box.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

Root Cause Confidence: High.

Lý do:
- Chuỗi warning còn sót nằm trực tiếp trong file UI edit page, không phải `_lib/colors.ts`.
- Pattern giống các home-component đã xử lý: `warningMessages` + amber warning box.
- Service-list không còn source render warning nên trang service-list user hỏi hiện đã xử lý đúng.

Counter-Hypothesis:
- Có thể còn warning ở home-components ngoài `app/admin/home-components` hoặc runtime cache cũ, nhưng trong scope grep hiện tại chỉ còn UI warning rõ ràng ở voucher-promotions edit.
- Các match trong `_lib/colors.ts` không phải lỗi vì là logic nội bộ.

# IV. Proposal (Đề xuất)

1. Sửa `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx` bằng exact edit:
   - Xóa `warningMessages` useMemo tạo text `ΔE`, `APCA`, `minLc`.
   - Xóa JSX render amber warning box dùng `warningMessages`.
   - Giữ `validation` useMemo nếu file vẫn cần dùng cho token/logic khác; nếu chỉ còn phục vụ warning thì xóa luôn import/validation để tránh unused.

2. Verify sau sửa:
   - Grep UI files để xác nhận không còn `warningMessages` + `APCA/minLc/ΔE` render trong TSX UI.
   - Chạy `bunx tsc --noEmit`.
   - Commit patch nhỏ mới.

# V. Files Impacted (Tệp bị ảnh hưởng)

## UI / Edit page
- Sửa: `app/admin/home-components/voucher-promotions/[id]/edit/page.tsx`
  - Vai trò hiện tại: trang edit voucher promotions, còn render warning màu kỹ thuật cho admin.
  - Thay đổi: bỏ warning jargon APCA/minLc/ΔE khỏi UI, giữ phần form/preview/save nguyên vẹn.

# VI. Execution Preview (Xem trước thực thi)

1. Read latest `voucher-promotions/[id]/edit/page.tsx`.
2. Exact edit xóa `warningMessages` block.
3. Exact edit xóa JSX warning box.
4. Xóa import/biến unused nếu TypeScript báo.
5. Grep lại home-components UI để phân biệt:
   - `_lib/colors.ts`: được phép còn APCA/minLc/deltaE.
   - `*.tsx` UI: không còn render jargon warning.
6. Chạy `bunx tsc --noEmit`.
7. Commit với message dạng `fix(home-components): hide voucher color warnings`.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- `bunx tsc --noEmit` pass.
- Grep `app/admin/home-components/**/*.tsx` không còn text UI `APCA`, `minLc`, `deltaE`, `ΔE` trong warning render.
- Manual tester có thể mở service-list và voucher-promotions edit để xác nhận không còn box warning jargon.

# VIII. Todo

- [ ] Read latest voucher-promotions edit page.
- [ ] Remove warningMessages calculation/render.
- [ ] Remove unused imports/variables.
- [ ] Grep verify TSX UI warnings gone.
- [ ] Run `bunx tsc --noEmit`.
- [ ] Commit patch.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Service-list edit không còn dòng `Một số cặp màu chữ/nền chưa đủ tương phản APCA...`.
- Voucher-promotions edit không còn warning `APCA/minLc/ΔE`.
- `_lib/colors.ts` vẫn giữ APCA logic nội bộ.
- Typecheck pass.
- Có commit mới cho patch còn sót.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Risk thấp vì chỉ xóa UI warning box và state phục vụ warning.
- Rollback: restore riêng `voucher-promotions/[id]/edit/page.tsx` từ git nếu có lỗi.

# XI. Out of Scope (Ngoài phạm vi)

- Không đổi thuật toán màu/contrast.
- Không đổi dữ liệu voucher.
- Không sửa 3 docs untracked ngày 2026-04-26 vì không liên quan task này.