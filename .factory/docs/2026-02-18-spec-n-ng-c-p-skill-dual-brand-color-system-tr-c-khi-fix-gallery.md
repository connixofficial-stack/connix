## Problem Graph
1. [Main] Nâng cấp skill để enforce nguyên tắc dùng màu tinh tế <- depends on 1.1, 1.2, 1.3
   1.1 [ROOT CAUSE] Skill chưa có quy tắc "Color Adjacency" rõ ràng (cấm brand kề brand tint/shade)
   1.2 Checklist chưa có mục kiểm tra adjacency nên dễ tái phạm
   1.3 Reference + quick-fix chưa có template sửa lỗi adjacency

## Execution (with reflection)
1. Solving 1.1 (SKILL.md)
   - Thought: Cần thêm nguyên tắc chính thức, dễ áp dụng, không mâu thuẫn 60-30-10/APCA/OKLCH.
   - Action: Bổ sung **Principle #7: Color Adjacency Rule (v11.5)** ngay sau Principle #6.
   - Reflection: ✓ Đúng theo lựa chọn của user.

2. Solving 1.2 (checklist.md)
   - Thought: Nếu không có checklist item thì rule mới khó enforce khi review.
   - Action: Thêm section **B1. Color Adjacency** với các check bắt buộc.
   - Reflection: ✓ Bảo đảm QA có tiêu chí pass/fail rõ.

3. Solving 1.3 (reference.md + quick-fix-templates.md)
   - Thought: Cần ví dụ canonical + anti-pattern để team áp dụng nhanh.
   - Action: Thêm bảng/đoạn “Adjacency Do/Don’t” trong reference và thêm template fix nhanh trong quick-fix.
   - Reflection: ✓ Phù hợp phạm vi user chốt.

---

## Kế hoạch chi tiết theo file

### 1) `.factory/skills/dual-brand-color-system/SKILL.md`

#### 1.1 Version bump
- Đổi `version: 11.4.0` → `version: 11.5.0`.

#### 1.2 Thêm Principle #7 sau "6) Single Source of Truth"
Nội dung mới:
- Tên: **Color Adjacency Rule (NEW v11.5)**
- Rule cốt lõi:
  - Khi dùng `primary`/`secondary` ở dạng **solid**, nền hoặc border tiếp giáp phải là **neutral** (`#ffffff`, `#0f172a`, `#f8fafc`, `#e2e8f0`…)
  - Cấm đặt solid brand lên tint/shade cùng family.
- Do/Don’t:
  - ✅ `iconColor: primary` trên `iconBg: neutralSurface`
  - ✅ `secondary` text trên `neutralSurface`
  - ❌ `primary` trên `primaryTint`
  - ❌ `secondary` border trên `secondaryTint` background
- Clarification:
  - Tint/shade vẫn dùng được như **surface độc lập** nếu không chứa solid cùng family.
  - Không thay thế APCA; adjacency là lớp rule thẩm mỹ + clarity bổ sung.

#### 1.3 Thêm snippet canonical
```ts
// ❌ Anti-pattern
iconBg: getSolidTint(primary, 0.42),
iconColor: primary,

// ✅ Canonical
iconBg: neutralSurface,
iconColor: primary,
```

---

### 2) `.factory/skills/dual-brand-color-system/checklist.md`

#### 2.1 Chèn section mới sau mục B (Distribution)
Section: **B1. Color Adjacency**
Checklist items:
- [ ] Primary solid không nằm trên primary tint/shade (nền phải neutral)
- [ ] Secondary solid không nằm trên secondary tint/shade (nền phải neutral)
- [ ] Border quanh brand-solid ưu tiên neutralBorder; tránh same-family tint/shade pairing
- [ ] Icon container dùng neutral surface/background khi icon là brand solid
- [ ] Hover/active accent không tạo cặp "brand solid + brand tint cùng family" trong cùng cụm nhỏ

---

### 3) `.factory/skills/dual-brand-color-system/reference.md`

#### 3.1 Thêm mục tham chiếu mới
Section: **Color Adjacency (v11.5)**
- Định nghĩa adjacency conflict
- Bảng nhanh:
  - Primary solid + neutral bg = Good
  - Secondary solid + neutral bg = Good
  - Primary solid + primaryTint bg = Bad
  - Secondary solid border + secondaryTint bg = Bad
- Gợi ý neutral tokens chuẩn:
  - `neutralSurface #ffffff`
  - `neutralBackground #f8fafc`
  - `neutralBorder #e2e8f0`
  - `neutralText #0f172a`

#### 3.2 Thêm canonical snippet
- Mẫu chuyển từ same-family pairing sang neutral pairing.

---

### 4) `.factory/skills/dual-brand-color-system/examples/quick-fix-templates.md`

#### 4.1 Thêm template mới (mục #7)
Tên: **Fix color adjacency conflict (brand kề brand tint/shade)**

Nội dung:
- Triệu chứng:
  - UI nhìn gắt, thiếu tinh tế
  - Icon/chữ brand bị dính nền tint cùng màu
- Fix nhanh:
  1. Đổi nền chứa brand-solid sang neutral (`neutralSurface`/`neutralBackground`)
  2. Đổi border cùng-family sang `neutralBorder`
  3. Giữ brand-solid cho heading/CTA/active để không giảm nhận diện
- Snippet before/after ngắn.

---

## Acceptance Criteria cho đợt nâng cấp skill
- SKILL.md có Principle #7 + ví dụ Do/Don’t + snippet canonical
- checklist.md có mục B1 Color Adjacency
- reference.md có section Color Adjacency (v11.5)
- quick-fix-templates.md có template fix adjacency conflict
- Nội dung mới nhất quán với OKLCH/APCA/60-30-10, không xung đột Single Mode Monochromatic

## Bước sau khi user duyệt spec
- Implement đúng 4 file skill ở trên trước
- Sau đó mới sang phase 2: fix gallery theo rule mới (theo yêu cầu “nâng cấp skill trước fix sau”)