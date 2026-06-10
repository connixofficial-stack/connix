## Audit Summary
- Evidence đã có:
  - `AGENTS.md` hiện tại mạnh về audit/evidence/decision nhưng chưa có section riêng cho UI/UX khi agent thiết kế giao diện.
  - User muốn bổ sung triết lý UI/UX theo hướng: **dễ hiểu, clean, sang trọng, responsive**, tránh khẩu hiệu mơ hồ kiểu “UX đến con bò cũng hiểu”.
  - User đã chốt định hướng: **scope cân bằng** (principles + checklist ngắn), **ưu tiên dễ hiểu hơn thẩm mỹ**, **semi-specific** (generic trước, có note cho Shadcn/Tailwind).
- Nguồn tham chiếu đã nghiên cứu:
  - Official: WCAG 2.2 (W3C), Apple HIG, Material Design foundations/accessibility.
  - Thực chiến AGENTS.md/GitHub: các repo/issue về standard AGENTS.md và agent rule hygiene (ngắn gọn, actionable, tránh context noise).
  - Skill nội bộ `uiux-2026-best-practices` để lấy ngưỡng cụ thể (touch target, contrast, spacing, responsive).
- Gap chính:
  - Thiếu tiêu chí pass/fail UI rõ ràng trước khi agent chốt giao diện.
  - Thiếu guardrail “clarity > decoration” ở mức rule để xử lý tradeoff đẹp vs dễ dùng.

## Root Cause Confidence
**High** — vì file hiện tại chưa có bất kỳ contract UI/UX nào, trong khi yêu cầu user tập trung đúng vào quality bar cho thiết kế giao diện. Best practice từ nguồn official đồng thuận: accessibility + responsiveness + clarity phải được định nghĩa thành checklist ngắn, đo được.

## Problem Graph
1. Chất lượng hướng dẫn UI/UX trong AGENTS.md còn thiếu <- depends on 1.1, 1.2
   1.1 Không có section UI/UX riêng với tiêu chí đo được
   1.2 Không có rule ưu tiên clarity/usability khi xung đột với thẩm mỹ

## Counter-Hypothesis Check
- Giả thuyết đối chứng: “Chỉ cần thêm 1 câu chung về UI đẹp là đủ.”
- Lý do loại: không actionable, không giúp agent tự đánh giá, dễ quay lại khẩu hiệu mơ hồ và quyết định cảm tính.

## Proposal
Thêm 1 section mới vào `AGENTS.md`: **UI/UX Design Guardrails (2026, practical)**, đồng thời mirror y hệt sang `CLAUDE.md` theo Sync Rule.

### Nội dung section mới (ngắn gọn, copy-ready)
1. **Clarity > Decoration**
   - Ưu tiên dễ hiểu, dễ thao tác, giảm cognitive load.
   - Nếu đẹp hơn nhưng khó dùng hơn: chọn phương án dễ dùng.

2. **Responsive-first**
   - Thiết kế mobile trước, rồi scale lên desktop.
   - Không làm vỡ layout ở breakpoint chính; giữ hierarchy và CTA rõ.

3. **Accessibility-first (WCAG 2.2 AA practical)**
   - Focus-visible rõ, keyboard navigation được.
   - Contrast text đủ đọc (ưu tiên chuẩn AA).
   - Touch target tối thiểu usable (khuyến nghị 44x44px).

4. **Clean & Premium by System, không bằng hiệu ứng**
   - Dùng spacing scale nhất quán, typography rõ cấp bậc.
   - Hạn chế lạm dụng màu/gradient/shadow/animation.
   - Consistency giữa states: default/hover/focus/disabled/loading.

5. **Micro-checklist trước khi chốt UI**
   - UI có thể hiểu trong 5 giây không cần giải thích thêm?
   - Mobile dùng 1 tay có thao tác được không?
   - Keyboard + focus + contrast đã ổn chưa?
   - Có thành phần trang trí nào không phục vụ task chính không?

6. **Repo note (semi-specific)**
   - Ưu tiên pattern sẵn có trong Shadcn + Tailwind để giữ đồng bộ.

### Ngôn ngữ thay cho câu “UX đến con bò cũng hiểu”
- Đề xuất câu rule chuyên nghiệp, cụ thể:
  - “UI phải self-explanatory cho người dùng mới trong 5 giây đầu, không cần hướng dẫn thêm.”

## Step-by-step Implementation Plan
1. Đọc lại `AGENTS.md` và xác định vị trí chèn section mới (đề xuất sau `Core Operating Principles` hoặc trước `Execution & Verification Rules`).
2. Thêm section `UI/UX Design Guardrails (2026, practical)` với 6 block ngắn như trên, wording súc tích theo KISS/DRY.
3. Đảm bảo không trùng ý với `Decision & AskUser Quality Rules` và `Evidence over Opinion`.
4. Mirror section mới sang `CLAUDE.md` để tránh context drift.
5. Review diff để chắc chắn: ngắn gọn, actionable, không khẩu hiệu mơ hồ.
6. Vì chỉ sửa markdown guideline: không chạy typecheck theo rule hiện tại.
7. Commit local (không push), kèm `.factory/docs` nếu có.

## Post-Audit
- Blast radius: thấp (chỉ ảnh hưởng hành vi agent khi làm UI).
- Regression risk: thấp; rủi ro chính là rule quá dài. Giảm rủi ro bằng checklist 4–6 dòng, có ngưỡng cụ thể.
- Cost/complexity: thấp, lợi ích cao do tăng consistency và chất lượng UX quyết định.

## Verification Plan
- Soát `AGENTS.md` và `CLAUDE.md` đảm bảo section UI/UX mới được mirror đầy đủ.
- Kiểm tra 4 tiêu chí:
  1. Có nguyên tắc rõ “Clarity > Decoration”.
  2. Có responsive + accessibility criteria tối thiểu.
  3. Có micro-checklist trước khi chốt UI.
  4. Có note semi-specific cho Shadcn/Tailwind.
- Xác nhận không có rule trùng hoặc mâu thuẫn với sections hiện hữu.