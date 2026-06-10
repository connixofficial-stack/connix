## Audit Summary
### 1) Triệu chứng (expected vs actual)
- **Expected:** Người dùng xem được toàn bộ logo, marquee/mono mượt và dễ chịu.
- **Actual:** `Grid/Badge/Featured` đang cắt danh sách bằng `+N`; `Marquee/Mono` spacing còn thưa và animation có cảm giác giật.

### 2) Phạm vi ảnh hưởng
- Ảnh hưởng cả **preview admin** và **site render** vì dùng chung shared components (`Partners*Shared`) và `ComponentRenderer`.

### 3) Repro tối thiểu
- Tạo > maxVisible logo (grid/badge/featured) => xuất hiện `+N`, không có đường dẫn khám phá logo còn lại.
- Vào style marquee/mono với nhiều logo => chuyển động nhìn không ổn định (rAF + `scrollLeft` reset).

### 4) Mốc thay đổi gần nhất
- Code hiện tại đang cố ý dùng `+N` trong:
  - `PartnersGridShared.tsx`
  - `PartnersBadgeShared.tsx`
  - `PartnersFeaturedShared.tsx`
- Marquee hiện chạy bằng JS loop `requestAnimationFrame` + reset `scrollLeft` trong `PartnersMarqueeShared.tsx`.

### 5) Dữ liệu còn thiếu
- Không có telemetry click thực tế cho `+N`; tuy nhiên bạn đã xác nhận UX không mong muốn.

### 6) Giả thuyết thay thế
- Có thể giật do asset logo khác kích thước/chưa tối ưu, nhưng root hiện tại vẫn là cơ chế scroll JS reset gây “micro-jank”.

### 7) Rủi ro nếu fix sai nguyên nhân
- Nếu chỉ tăng speed/giảm gap mà giữ cơ chế animation cũ, cảm giác giật vẫn còn.

### 8) Tiêu chí pass/fail sau sửa
- Pass khi người dùng xem được full logo list qua modal ở cả 3 layout và marquee/mono mượt hơn, không giật khi loop.

### Quyết định đã chốt với bạn
- Overflow cho Grid/Badge/Featured: **Modal xem tất cả**.
- Preview/site parity: **Giống 100%**.

## Root Cause Confidence
- **High** — Bằng chứng trực tiếp trong code:
  - `+N` đang hard-code ở 3 shared layout => chặn discoverability.
  - Marquee dùng `scrollLeft` + reset vòng lặp trong JS => dễ xuất hiện khựng khi wrap, nhất là khi item count lớn/khác kích thước.

## Implementation Plan
1. **Tạo shared modal xem tất cả logo (dùng chung preview + site)**
   - File mới: `app/admin/home-components/partners/_components/PartnersLogoCloudModal.tsx`.
   - Dùng `Dialog`, render grid responsive (mobile 2 cột, tablet 3–4, desktop 5–6), có tên/logo/link.
   - Hỗ trợ `openInNewTab`, keyboard/focus-visible, close rõ ràng.

2. **Grid: thay tile `+N` thành trigger mở modal**
   - Sửa `PartnersGridShared.tsx`:
     - Giữ compact list ban đầu.
     - Tile cuối đổi thành CTA “Xem tất cả (+N)” mở modal thay vì dead tile.

3. **Badge: thay `+N` bằng badge CTA mở modal**
   - Sửa `PartnersBadgeShared.tsx`:
     - Giữ maxVisible hiện tại.
     - Badge `+N` => button/anchor-like control mở modal.

4. **Featured: thay `+N` slot bằng CTA mở modal**
   - Sửa `PartnersFeaturedShared.tsx`:
     - Slot dư thành “Xem tất cả (+N)” mở modal.

5. **Marquee/Mono: giảm spacing + tăng tốc + bỏ cơ chế dễ giật**
   - Sửa `PartnersMarqueeShared.tsx`:
     - Chuyển từ JS `scrollLeft` loop sang **CSS transform marquee track** (2 track clone) để smooth hơn.
     - Giảm `gap` (ví dụ từ `gap-16` xuống `gap-10` desktop, `gap-8` mobile).
     - Tăng tốc vừa phải bằng duration ngắn hơn (marquee nhanh hơn mono một chút nhưng vẫn êm).
     - Giữ/siết `prefers-reduced-motion` (disable animation hoặc rất chậm).
     - Giữ pause on hover/focus để usability tốt.

6. **Đồng bộ parity 100% preview/site**
   - Rà nơi gọi ở:
     - `app/admin/home-components/partners/_components/PartnersPreview.tsx`
     - `components/site/ComponentRenderer.tsx`
   - Đảm bảo cùng props speed/gap/behavior/modal trigger.

7. **Static self-review**
   - Kiểm tra type safety, null-safe logo/link/name, không phá API props cũ.

## Verification Plan
- **Typecheck:** `bunx tsc --noEmit` (vì thay TS/TSX).
- **Repro thủ công (preview + site):**
  1. Grid/Badge/Featured với >12 logo: click CTA `+N` mở modal, xem được toàn bộ logo, đóng/mở bằng keyboard ổn.
  2. Marquee/Mono: cảm nhận chuyển động mượt, không còn giật tại điểm loop, spacing gọn hơn.
  3. Hover/focus pause hoạt động; reduced-motion không gây khó chịu.
  4. Mobile: touch target CTA đủ lớn, modal scroll dễ dùng.
- **Pass/Fail:**
  - Pass khi 3 layout không còn “ẩn cứng” logo (đã có đường khám phá rõ) và marquee/mono mượt + nhanh hơn hợp lý.
  - Fail nếu vẫn có micro-jank rõ rệt hoặc parity preview/site lệch hành vi.