# Checklist — Home Component Parity Guard

## A. Scope & Source of Truth

- [ ] Đã xác định reference component gần nhất trong repo
- [ ] Đã chỉ ra source-of-truth của UI thật
- [ ] Đã map đủ create / edit / preview / site / renderer

## B. Style Contract

- [ ] Có đúng 6 styles
- [ ] Preview style keys map 1-1 với runtime style keys
- [ ] Không có style “tạm”, alias mơ hồ hoặc fallback ngầm
- [ ] Default fallback return nằm cuối function

## C. Preview ↔ Site Parity

- [ ] Preview và site dùng chung shared section nếu phù hợp
- [ ] Nếu preview override riêng, override được khóa bằng `context === 'preview'` hoặc equivalent
- [ ] DOM hierarchy chính giữa preview và site không drift vô cớ
- [ ] Preview shell dùng pattern chung của repo nếu không có evidence đặc biệt

## D. Responsive / Breakpoint

- [ ] Desktop / tablet / mobile đều có contract rõ
- [ ] Nếu dùng `@container` hoặc `@[...]`, đã xác định node đo thật
- [ ] Không fix width mù mà thiếu evidence
- [ ] Preview desktop không bị lệch grid với site do shell budgeting
- [ ] Mobile preview không tự ý giả lập phone hardware trái pattern repo

## E. Config / Form / Renderer

- [ ] Create page submit đúng config
- [ ] Edit page load/save/buildConfig đúng config
- [ ] Types phản ánh đủ config thực tế
- [ ] ComponentRenderer/site section đọc đúng config runtime
- [ ] Không hardcode text/link style-specific sai chỗ

## F. Safety / UX

- [ ] Tất cả button trong preview có `type="button"`
- [ ] Long text có truncate / line-clamp hợp lý
- [ ] Empty state có hiển thị
- [ ] Image fallback / missing data fallback có hiển thị
- [ ] Không có horizontal overflow vô cớ

## G. Color / State

- [ ] Brand color / secondary / mode map đúng ở preview và site
- [ ] Override state không bị mất khi đổi style/device
- [ ] Không phá local color override state

## H. Acceptance

- [ ] Có acceptance criteria quan sát được
- [ ] Có risk / rollback ngắn gọn
- [ ] Chỉ được coi là done khi toàn bộ mục critical pass

## Critical gates

Các mục sau fail => chưa được coi là done:

- Source-of-truth parity
- 6 styles contract
- Preview ↔ Site mapping 1-1
- Responsive / breakpoint evidence
- Fallback style order
- Preview button type
- Create/Edit/Renderer wiring
