---
name: uiux-2026-best-practices
description: Tổng hợp best practices UI/UX năm 2026 để thiết kế giao diện đơn giản, gọn gàng, đẹp mắt theo mobile-first và accessibility-first. Dùng khi user hỏi checklist UI/UX, design rules, design system, spacing/typography/color, hoặc muốn thiết kế theo Shadcn UI + Tailwind + Lucide React.
---

# UI/UX 2026 Best Practices

Skill này tổng hợp các nguyên tắc và checklist UI/UX 2026 để tạo giao diện **simple–clean–premium** với **mobile-first** và **accessibility-first**, phù hợp stack **React + Shadcn UI + Tailwind + Lucide**.

## Quick start

1. Xác định bối cảnh sản phẩm (dashboard/landing/admin), đối tượng người dùng, mục tiêu chính.
2. Áp dụng checklist 2026 (Hierarchy → Spacing → Typography → Color → Components → A11y → Motion → Perf).
3. Kết xuất thành checklist/tiêu chí đánh giá trước khi code UI.

## Instructions

### Step 1: Thu thập bối cảnh (bắt buộc)
- Loại trang: landing / dashboard / admin / app.
- Mục tiêu chính (CTA, task completion, discoverability).
- Thiết bị chính (mobile/desktop) và tần suất sử dụng.

### Step 2: Áp dụng nguyên tắc nền tảng 2026
- **Clarity > Decoration**: ưu tiên rõ ràng, giảm nhiễu.
- **Visual hierarchy**: cấp bậc tiêu đề/CTA rõ ràng.
- **Consistency**: thống nhất component, spacing, states.
- **Whitespace & rhythm**: khoảng trắng là yếu tố tạo “sang”.
- **Accessibility-first (WCAG 2.2)**: contrast, focus, keyboard, tap targets.
- **Mobile-first**: thiết kế mobile trước rồi scale lên.

### Step 3: Thiết kế hệ thống (Design System-lite)
#### Thông số cụ thể (tỉ lệ/khuyến nghị)
- **Line length**: 45–75 ký tự mỗi dòng (body text) để dễ đọc.
- **Line height**: 1.4–1.6 cho body text.
- **Touch target**: tối thiểu 44×44 CSS px (khuyến nghị 44–48px).
- **Target size (WCAG 2.2 AA)**: tối thiểu 24×24 CSS px, nếu nhỏ hơn phải có khoảng cách bù.
- **Aspect ratio phổ biến**:
  - 16:9 cho hero/banner.
  - 4:3 cho ảnh/card nội dung tổng quan.
  - 3:2 cho ảnh sản phẩm/ảnh chụp.
- **Typography scale (modular scale)**: 1.125 / 1.2 / 1.25 (base 16px).

#### Color
- 1 primary + neutral scale + semantic colors.
- Contrast: text ≥ 4.5:1, UI ≥ 3:1.

#### Typography
- 1 font family, tối đa 3–4 weights.
- Line-height 1.4–1.6, tránh chữ dày đặc.

#### Spacing
- Dùng scale cố định: 4/8/12/16/24/32.
- Ưu tiên **spacing đồng nhất** giữa section/card/button.

### Step 4: Component rules (Shadcn + Tailwind + Lucide)
- Dùng **shadcn/ui** để đồng bộ a11y + states.
- Icon Lucide: 16–20px, stroke 1.5–2, chỉ dùng khi cần.
- States bắt buộc: hover, focus-visible, disabled, loading.

### Step 5: Accessibility checklist (WCAG 2.2)
- **Focus-visible** rõ ràng (ring 2px).
- **Keyboard navigation** đầy đủ.
- **Touch target** ≥ 44–48px.
- Heading hierarchy chuẩn (H1 → H2 → H3).
- `aria-label` cho icon-only button.

### Step 6: Motion & feedback
- Transition 150–300ms.
- Skeleton thay cho spinner kéo dài.
- Motion không được gây “đau mắt”.

### Step 7: Performance (perceived speed)
- Lazy-load nội dung ngoài viewport.
- Ưu tiên layout ổn định (tránh CLS).

## 2026 Checklist (rút gọn)

### Layout & Hierarchy
- [ ] 1 mục tiêu chính/section
- [ ] CTA rõ ràng, không cạnh tranh nhau
- [ ] Whitespace đủ “thở”

### Typography
- [ ] 1 font family
- [ ] 3–4 weights tối đa
- [ ] line-height 1.4–1.6
- [ ] line length 45–75 ký tự
- [ ] modular scale 1.125 / 1.2 / 1.25

### Spacing
- [ ] Dùng 4/8/12/16/24/32
- [ ] Mobile giảm spacing hợp lý (max-md)

### Color
- [ ] 1 primary + neutral scale
- [ ] Contrast text ≥ 4.5:1

### Components
- [ ] Shadcn UI cho controls
- [ ] States đầy đủ
- [ ] Icon chỉ khi cần, không lạm dụng
- [ ] Touch target ≥ 44×44px

### Accessibility
- [ ] Focus-visible rõ
- [ ] Keyboard navigation OK
- [ ] Touch target ≥ 44–48px (WCAG 2.2 minimum 24×24px)

### Motion & Feedback
- [ ] Transition 150–300ms
- [ ] Skeleton cho loading

### Performance
- [ ] Lazy-load
- [ ] Không layout shift lớn

## Mẫu output khi user hỏi “Checklist UI/UX 2026”

```markdown
## UI/UX 2026 Checklist

### Foundations
- Clarity > decoration
- Strong hierarchy
- Consistency
- Mobile-first
- Accessibility-first (WCAG 2.2)

### System
- Colors: 1 primary + neutral + semantic
- Typography: 1 font, 3–4 weights
- Spacing: 4/8/12/16/24/32

### Components (Shadcn + Tailwind + Lucide)
- Use shadcn primitives
- Icon size 16–20px, stroke 1.5–2
- States: hover/focus/disabled/loading

### A11y
- Focus-visible ring
- Keyboard nav
- Tap targets ≥ 44–48px
```

## Nguồn tham khảo (đa nguồn)

### Accessibility & WCAG 2.2
- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html
- https://www.browserstack.com/guide/design-accessibility-checklist-2026
- https://www.atomica11y.com/accessible-design/

### Principles & Design
- https://www.uxdesigninstitute.com/blog/ux-design-principles-2026/
- https://webdesignerdepot.com/the-ultimate-guide-to-ui-design-in-2026/
- https://trymata.com/blog/user-experience-ux-design-principles/

### Typography & layout ratios
- https://developerux.com/2025/02/12/typography-in-ux-best-practices-guide/
- https://pimpmytype.com/line-length-line-height/
- https://typescale.com/

### Aspect ratio guidelines
- https://www.uxpin.com/studio/blog/aspect-ratio/

### Design systems / Checklists (GitHub)
- https://github.com/thedaviddias/Front-End-Design-Checklist
- https://github.com/ctrimm/Government-Design-Systems-List
- https://github.com/unicef/design-system/blob/master/design-guidelines.md

### Shadcn principles
- https://gist.github.com/eonist/c1103bab5245b418fe008643c08fa272

## Best practices khi dùng Skill này

- Luôn hỏi bối cảnh sản phẩm trước khi đưa checklist.
- Ưu tiên checklist ngắn, rõ, dễ áp dụng.
- Không đưa màu sắc “flashy” hoặc gradient rực.
- Gợi ý theo stack: Shadcn + Tailwind + Lucide.

## Limitations

- Best practices mang tính tổng quát, cần tùy biến theo domain.
- Không thay thế user testing thực tế.
