## Problem Graph
1. [Main] Bỏ cơ chế chặn save theo APCA/harmony trong Gallery/TrustBadges, chuyển sang auto-heal <- depends on 1.1, 1.2, 1.3
   1.1 [Policy update trong skill] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] Rule hiện tại ưu tiên chặn (block) thay vì tự ứng xử
   1.2 [Runtime update ở edit flow] <- depends on 1.2.1
      1.2.1 [ROOT CAUSE] handleSubmit chỉ dùng validation để block, chưa có pipeline sanitize/fallback
   1.3 [Color token hardening] <- depends on 1.3.1
      1.3.1 [ROOT CAUSE] Chưa có cơ chế bắt buộc APCA-safe token normalization trước persist

## Execution (with reflection)
1. Solving 1.1.1 – Update policy cho đúng mong muốn user
   - Action: Sửa `/.factory/skills/dual-brand-color-system/SKILL.md` + `checklist.md` + `reference.md` theo chuẩn mới:
     - APCA: **không block save**; bắt buộc **auto-fix text tokens** trước khi lưu.
     - Harmony dual-mode: **không block save**; nếu `deltaE < 20` thì **auto-fallback secondary** (theo thứ tự: user secondary hợp lệ -> harmony color theo scheme -> complementary fallback an toàn).
     - Đổi wording từ “chặn lưu” sang “self-healing before persist”.
   - Reflection: ✓ Align với yêu cầu “hệ thống tự ứng xử, không chặn user”.

2. Solving 1.2.1 – Refactor submit flow Gallery edit
   - File: `app/admin/home-components/gallery/[id]/edit/page.tsx`
   - Action chi tiết:
     - Thay đoạn `if (mode==='dual' && harmonyStatus.isTooSimilar) return;` bằng pipeline:
       1) Gọi helper mới `getGalleryPersistSafeColors(...)` để resolve cặp màu an toàn.
       2) Dùng cặp màu đã heal khi build payload `config` (thêm metadata color nếu cần).
       3) Hiển thị toast thông tin kiểu “Hệ thống đã tự tối ưu màu phụ để đảm bảo hài hòa/đọc tốt”, **không chặn submit**.
     - Giữ nguyên dirty-state/save-button parity.
   - Reflection: ✓ Không còn hard-block; UX liền mạch.

3. Solving 1.3.1 – Thêm helper self-heal trong colors
   - File: `app/admin/home-components/gallery/_lib/colors.ts`
   - Action chi tiết:
     - Thêm hàm `autoFixTextTokensForAPCA(tokens)`:
       - Recompute các text token có nguy cơ fail (`heading`, `subheading`, `badgeText`, lightbox text) bằng `ensureAPCATextColor/getAPCATextColor`.
     - Thêm hàm `resolveSecondaryWithHarmonyFallback(...)`:
       - Nếu dual mode và `deltaE < 20`, tự sinh secondary mới (ưu tiên harmony hiện tại; nếu vẫn gần thì complementary; nếu vẫn fail thì triadic) cho tới khi `deltaE >= 20`.
     - Thêm hàm public `getGalleryPersistSafeColors({primary,secondary,mode,harmony})` trả về:
       - `resolvedPrimary`, `resolvedSecondary`, `tokensFixed`, `healedFlags`.
     - Update `getGalleryValidationResult` để trả thêm `autoHealPreview` (để UI có thể thông báo) nhưng **không dùng để block**.
   - Reflection: ✓ Self-healing nằm ở single source of truth, không tản mạn logic.

4. UI parity cho preview (không chặn nhưng phản hồi minh bạch)
   - Files:
     - `app/admin/home-components/gallery/_components/GalleryPreview.tsx`
     - `app/admin/home-components/gallery/_components/TrustBadgesPreview.tsx`
   - Action:
     - Dùng color đã resolve/heal (qua `getGalleryColorTokens` mở rộng hoặc helper wrapper) để preview khớp dữ liệu sẽ lưu.
     - Chỉ hiển thị `ColorInfoPanel` khi `mode==='dual'` (issue đã nêu trước đó).
   - Reflection: ✓ Preview ≡ Persisted render, giảm mismatch.

5. Validation
   - Run bắt buộc theo project rule: `bunx tsc --noEmit`.
   - Nếu lỗi type phát sinh từ helper mới, fix triệt để rồi chạy lại tới khi pass.
   - Reflection: ✓ Đúng AGENTS.md (không chạy lint/test nặng).

## Expected output sau khi implement
- Gallery/TrustBadges không còn chặn save vì APCA/harmony.
- Hệ thống tự normalize secondary và text color trước persist.
- User vẫn được thông báo soft (không block).
- Skill docs/checklist/reference phản ánh policy mới “auto-heal, non-blocking” cho phạm vi Gallery/TrustBadges.