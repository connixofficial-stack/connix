# Spec: Loại bỏ trùng lặp giữa "Gợi ý cho bạn" và "Tất cả"

## Problem Graph
1. [Main] Loại bỏ trùng lặp danh sách component
   1.1 [Sub] Tách danh sách "Tất cả" khỏi nhóm "Gợi ý"
      1.1.1 [ROOT CAUSE] Hiện tại "Tất cả" render full `COMPONENT_TYPES`

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: `COMPONENT_TYPES` đã có flag `recommended`. Chỉ cần lọc bỏ `recommended` khỏi danh sách "Tất cả" để tránh trùng.
   - Action: Tạo `otherTypes = COMPONENT_TYPES.filter(t => !t.recommended)` và render danh sách này cho section "Tất cả".
   - Reflection: ✓ Đúng yêu cầu, không tăng độ phức tạp, vẫn giữ đủ component.

---

## Implementation Plan

### 1. Update `page.tsx`
**File:** `app/admin/home-components/create/page.tsx`

**Change:**
- Thêm `otherTypes`:
  ```ts
  const recommendedTypes = COMPONENT_TYPES.filter((type) => type.recommended);
  const otherTypes = COMPONENT_TYPES.filter((type) => !type.recommended);
  ```
- Thay render "Tất cả" từ `COMPONENT_TYPES` → `otherTypes`:
  ```tsx
  {otherTypes.map((type) => (
    <ComponentCard key={type.value} type={type} count={typeCounts[type.value] ?? 0} />
  ))}
  ```

### 2. UI copy (optional, nếu cần rõ hơn)
- Đổi tiêu đề "Tất cả Components" → "Các component còn lại" để phản ánh đã loại trùng.
  (Giữ nguyên nếu user không muốn đổi copy.)

---

## Files to Change
1. `app/admin/home-components/create/page.tsx`

---

## Expected Result
- "Gợi ý cho bạn" chỉ hiển thị nhóm recommended.
- "Tất cả" chỉ hiển thị các component còn lại → không trùng lặp.
- UX gọn, không bị dup như phản hồi của user.

---

## Validation
- Run: `bunx oxlint --type-aware --type-check --fix`
- Run: `bun run lint`

---

## Notes
- Không thay đổi data/DB.
- Không ảnh hưởng logic tạo component.