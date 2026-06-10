## Problem Graph
1. [Main] Footer home-component chưa tuân thủ đầy đủ dual-brand-color-system <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Footer colors dùng nhiều opacity decorative (`rgba`, `white/xx`) trái v11.2 anti-opacity rules
   1.2 [ROOT CAUSE] Footer text color hard-code (`#fff`, `rgba(255,255,255,...)`) chưa APCA-driven theo background
   1.3 [ROOT CAUSE] Thiếu parity create/edit cho footer route, dễ lệch behavior mode/validation giữa trang tạo và sửa

## Execution (with reflection)
1. Solving 1.1 (opacity decorative)
   - Thought: skill v11.2 cấm opacity decorative cho badge/bg/border/depth; footer hiện đang dùng `withAlpha(...)`, `bg-black/20`, `text-white/80`, `text-white/60`.
   - Action: refactor palette footer sang solid-only tint/shade bằng OKLCH; loại bỏ các token alpha ở footer preview + site render.
   - Reflection: ✓ đúng theo checklist E + Anti Opacity/Shadow Rules.

2. Solving 1.2 (APCA text)
   - Thought: text/footer đang hard-code trắng và các mức mờ; cần chọn màu chữ theo APCA trên từng nền thực tế.
   - Action: mở rộng `_lib/colors.ts` để sinh text colors bằng `getAPCATextColor(bg, size, weight)` cho `textPrimary`, `textMuted`, `textSubtle`, link/button text trên accent/surface.
   - Reflection: ✓ khớp checklist A (APCA, không hard-code #fff/#000).

3. Solving 1.3 (create/edit parity + single source)
   - Thought: route user đưa là edit; hiện không có `footer/create/page.tsx` riêng (chỉ legacy preview export), rủi ro lệch chuẩn mode + dirty/save.
   - Action: chuẩn hóa route create/footer theo cùng cấu trúc edit (brand mode, preview, validation, submit state), và đảm bảo preview/site cùng dùng `getFooterLayoutColors` (single source).
   - Reflection: ✓ đáp ứng checklist D/F và rule S3 parity save-state.

## Findings hiện tại (đã rà soát)
1. `app/admin/home-components/footer/_lib/colors.ts`
   - ❌ Dùng nhiều decorative alpha: `withAlpha(...)`, `textMuted: rgba(255,255,255,0.78)`, `textSubtle: rgba(255,255,255,0.55)`, các border/bg social dạng alpha.
   - ⚠️ `textPrimary: '#ffffff'` hard-code, không APCA theo nền.
2. `components/site/ComponentRenderer.tsx` (FooterSection)
   - ⚠️ Có khả năng dùng trực tiếp `colors.*` vốn chứa alpha + text hard-code từ helper hiện tại; vi phạm sẽ lan ra render site.
3. `app/admin/home-components/footer/_components/FooterPreview.tsx`
   - Hiện đang re-export legacy preview; cần kiểm lại toàn bộ footer preview dùng token mới solid-only, tránh white/opacity utility trong JSX.
4. Route create footer
   - ❌ Không có file `app/admin/home-components/footer/create/page.tsx` (ENOENT) → cần xác nhận route thực tế đang dùng ở nơi khác và chuẩn hóa parity với edit.

## Spec chi tiết để fix (file-by-file)
### 1) `app/admin/home-components/footer/_lib/colors.ts`
- Bỏ `withAlpha` khỏi decorative use-cases (chỉ giữ nếu functional disabled-state, và footer hiện không cần).
- Thay toàn bộ token màu footer sang solid OKLCH:
  - `bg`, `surface`, `border`, `borderSoft` (solid tint/shade chứ không alpha)
  - `centeredBrandBg`, `centeredBrandBorder`, `centeredSocial*`, `stackedSocial*` đều là solid colors.
- Sinh text tokens APCA theo từng nền:
  - `textPrimaryOnBg`, `textMutedOnBg`, `textSubtleOnBg`
  - `textOnSurface`, `textOnAccent`.
- Đảm bảo single mode monochromatic giữ nguyên: `resolveSecondaryForMode(single)=primary`.
- Không đổi API public quá rộng; ưu tiên giữ tên fields cũ nếu có thể, chỉ bổ sung fields mới khi bắt buộc để tránh vỡ call-sites.

### 2) `components/site/ComponentRenderer.tsx` (khối `FooterSection`)
- Refactor style props của footer để dùng token mới từ `getFooterLayoutColors` (không hard-code `text-white/*`, không `bg-*/xx`).
- Thay mọi border/background alpha (nếu có trong FooterSection) bằng màu solid tương ứng (`border`, `borderSoft`, `surface`, ...).
- Đảm bảo heading/title chính của footer ưu tiên primary theo element-level rule; secondary dùng cho subtitle/label/accent/link hover hợp lý.
- Giữ nguyên layout/structure 6 styles footer, chỉ thay màu/tokens.

### 3) `app/admin/home-components/_shared/legacy/previews.tsx` (phần FooterPreview thực tế)
- Rà toàn bộ JSX preview footer:
  - loại class màu có opacity decorative (`text-white/80`, `bg-white/10`, border `.../20`, v.v.)
  - map qua token solid từ `getFooterLayoutColors`.
- Đảm bảo preview/site parity: token và logic màu giống FooterSection.
- Single mode UI không hiển thị secondary/harmony warning nếu preview panel có phần info mode.

### 4) `app/admin/home-components/footer/[id]/edit/page.tsx`
- Giữ dirty-state hiện có (đang đúng chuẩn S3).
- Bổ sung validation guard nhẹ trước submit (nếu chưa có): đảm bảo `config` normalize xong trước save; không cần harmony validation khi single (footer không cần deltaE chặn save trừ khi có UI harmony riêng).
- Không thay đổi UX ngoài phạm vi màu/footer.

### 5) Route create Footer (xác thực + chuẩn hóa)
- Xác định route create thực tế của Footer (đang không nằm ở `footer/create/page.tsx`).
- Nếu create đang dùng generic editor: tạo route dedicated `app/admin/home-components/footer/create/page.tsx` theo pattern edit để parity tốt hơn.
- Nếu đã có route dedicated ở vị trí khác: refactor route đó theo cùng logic mode/preview/tokens như edit.

## Validation plan (sau khi implement)
1. `bunx tsc --noEmit` (theo AGENTS.md project rule).
2. Kiểm tra thủ công 2 mode:
   - single: secondary bị ignore hoàn toàn, footer vẫn readable.
   - dual: secondary áp đúng ở accent/link/social theo token mới.
3. So khớp preview vs render site (same config, same màu).
4. Kiểm tra 6 styles footer không có decorative opacity/shadow trái rule.

## Expected outcome
- Footer đạt chuẩn dual-brand-color-system v11.4: OKLCH + APCA + single-mode monochromatic + single-source preview/render.
- Loại bỏ toàn bộ decorative opacity trong footer.
- Create/Edit footer đồng nhất hành vi, tránh lệch runtime về mode/màu.