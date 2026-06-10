# Spec: Fix CTA Harmony Warning + Nâng cấp Dual Brand Color System Skill v11.4

## Phân tích (DARE Framework)

### Problem Graph
```
1. CTA bị chặn lưu với 2 warnings
   ├── 1.1 [BUG] Harmony deltaE = 0 khi mode = 'single'
   │   └── ROOT: Validation không skip single mode → primary = secondary → deltaE = 0 → BLOCK
   │
   └── 1.2 [EXPECTED] Accessibility minLc = 38.7
       └── ROOT: User chọn màu không đạt APCA threshold → validation đúng

2. Skill thiếu mention rule
   └── 2.1 Principle 5 có "Single Mode = Monochromatic (STRICT)" nhưng...
       └── 2.2 Checklist F2 có pattern ✅/❌ nhưng...
           └── 2.3 THIẾU rule "Skip harmony validation khi mode = 'single'"
```

---

## Solution

### ✅ Fix 1: CTA Component - Skip Harmony Validation khi Single Mode

**Files cần sửa:**
1. `app/admin/home-components/cta/[id]/edit/page.tsx` (line 93-96)
2. `app/admin/home-components/create/cta/page.tsx` (nếu có validation tương tự)

**Thay đổi:**
```typescript
// ❌ BEFORE (line 93-96)
if (harmonyStatus.isTooSimilar) {
  toast.error(`Không thể lưu CTA: deltaE=${harmonyStatus.deltaE} < 20 (Primary/Secondary quá giống nhau).`);
  return;
}

// ✅ AFTER
if (mode === 'dual' && harmonyStatus.isTooSimilar) {
  toast.error(`Không thể lưu CTA: deltaE=${harmonyStatus.deltaE} < 20 (Primary/Secondary quá giống nhau).`);
  return;
}
```

**Optional - Improve Accessibility Message (line 98-101):**
```typescript
// Before
toast.error(`Không thể lưu CTA: APCA chưa đạt cho ${failedPairs}.`);

// After
toast.error(
  `Không thể lưu CTA: APCA chưa đạt cho ${failedPairs}. ` +
  `Gợi ý: (1) Chọn màu có contrast cao hơn, (2) Đổi harmony mode, (3) Chuyển Single mode ở /admin/system/brand.`
);
```

---

### ✅ Fix 2: Skill Update v11.4 - Thêm Harmony Validation Rules

**File:** `.factory/skills/dual-brand-color-system/SKILL.md`

**Thay đổi trong Principle 5 (sau dòng "UI Display Rules:"):**

```markdown
### 5) Single Mode = Monochromatic (STRICT)

// ... (giữ nguyên phần đầu)

**UI Display Rules:**
- KHÔNG hiển thị secondary color info khi mode = 'single'
- KHÔNG hiển thị accent balance (P%/S%/N%) khi mode = 'single'
- Chỉ hiển thị Primary color swatch + hex

**Harmony Validation Rules (v11.4 - NEW):**
- ✅ PHẢI skip harmony validation (deltaE check) khi mode = 'single'
- ✅ CHỈ validate harmony khi mode = 'dual'
- ⚠️ Single mode với deltaE = 0 là EXPECTED → KHÔNG chặn lưu
- ⚠️ Dual mode với deltaE < 20 → VẪN chặn lưu (too similar)

**Pattern chuẩn (edit/create page validation):**
```typescript
// ✅ ĐÚNG: Skip harmony check trong single mode
if (mode === 'dual' && harmonyStatus.isTooSimilar) {
  toast.error(`deltaE=${harmonyStatus.deltaE} < 20...`);
  return;
}

// ❌ SAI: Không check mode → chặn cả single mode
if (harmonyStatus.isTooSimilar) {
  toast.error(...);
  return;
}
```

// ... (giữ nguyên phần sau)
```

---

**File:** `.factory/skills/dual-brand-color-system/checklist.md`

**Thay đổi trong section F2 (sau dòng "Single mode UI: không hiển thị accent balance"):**

```markdown
## F2. Single Mode Monochromatic (CRITICAL)

// ... (giữ nguyên checklist items)

- [ ] Single mode UI: không hiển thị accent balance
- [ ] **[v11.4 NEW]** Validation SKIP harmony check (deltaE) khi mode = 'single'
- [ ] **[v11.4 NEW]** Validation CHỈ check harmony khi mode = 'dual'

**Pattern chuẩn (Stats, Hero):**
// ... (giữ nguyên)

**Harmony Validation Pattern (v11.4 - NEW):**
```typescript
// ✅ Edit/Create page validation
const handleSubmit = async (e) => {
  const { harmonyStatus } = getValidationResult(...);
  
  // Skip harmony check khi single mode
  if (mode === 'dual' && harmonyStatus.isTooSimilar) {
    toast.error(`deltaE < 20...`);
    return;
  }
  
  // Accessibility vẫn check cho cả single/dual
  if (accessibility.failing.length > 0) {
    toast.error(...);
    return;
  }
  
  await updateMutation(...);
};
```
```

---

**File:** `.factory/skills/dual-brand-color-system/SKILL.md` - Update version

```markdown
---
name: dual-brand-color-system
description: ...
version: 11.4.0  # ← Update từ 11.3.0
---
```

**File:** `.factory/skills/dual-brand-color-system/SKILL.md` - Update Component Color Map

```markdown
## Component Color Map (Hiện trạng)

### Home Components - 4 nhóm

**Nhóm C: Balanced dual-brand** (~50/50)
| Component | P% | S% | Pattern | Last Updated | Status |
|---|---|---|---|---|------|
| CTA | 60 | 40 | P: bg/buttons; S: title text/button text | 2026-02-17 | Fixed v11.4 (harmony validation) |
| FAQ | 40 | 60 | secondary: expanded border/icon | 2026-02-17 | Fixed v11.3 (single mode) |
// ... (rest unchanged)
```

---

## Implementation Steps (Full)

### Step 1: Fix CTA Component
1. Đọc file `app/admin/home-components/cta/[id]/edit/page.tsx`
2. Tìm dòng 93-96 (validation `if (harmonyStatus.isTooSimilar)`)
3. Thêm `mode === 'dual' &&` vào condition
4. (Optional) Improve accessibility message line 98-101

### Step 2: Check Create Page
1. Đọc file `app/admin/home-components/create/cta/page.tsx`
2. Grep pattern `isTooSimilar` trong file
3. Nếu có → apply fix tương tự step 1

### Step 3: Update Skill v11.4
1. Đọc `.factory/skills/dual-brand-color-system/SKILL.md`
2. Update version: `11.3.0` → `11.4.0`
3. Thêm section **Harmony Validation Rules (v11.4)** vào Principle 5
4. Update Component Color Map: CTA status = "Fixed v11.4 (harmony validation)"

### Step 4: Update Skill Checklist
1. Đọc `.factory/skills/dual-brand-color-system/checklist.md`
2. Thêm 2 items mới vào section F2:
   - `[ ] [v11.4] Validation SKIP harmony check khi mode = 'single'`
   - `[ ] [v11.4] Validation CHỈ check harmony khi mode = 'dual'`
3. Thêm section **Harmony Validation Pattern (v11.4)** với code example

### Step 5: Validation
1. Test case 1: Edit CTA với single mode + bất kỳ màu nào → KHÔNG bị chặn harmony warning
2. Test case 2: Edit CTA với dual mode + primary/secondary giống nhau → VẪN bị chặn (correct)
3. Test case 3: Edit CTA với màu minLc < threshold → VẪN bị chặn + message có gợi ý
4. Chạy `bunx tsc --noEmit` kiểm tra TypeScript
5. Commit message: `fix(cta): skip harmony validation in single mode (v11.4)`

---

## Expected Outcome

### ✅ CTA Component
- **Single mode**: deltaE = 0 → KHÔNG warning → lưu được (nếu APCA pass)
- **Dual mode**: deltaE < 20 → VẪN warning → phải chọn màu khác
- **Accessibility**: minLc < threshold → VẪN warning → message có gợi ý rõ ràng

### ✅ Skill v11.4
- Principle 5 có **Harmony Validation Rules** rõ ràng
- Checklist F2 có **Harmony Validation Pattern** với code example
- Component Color Map cập nhật CTA status = "Fixed v11.4"

### ✅ Alignment
- Pattern giống Hero/FAQ (không validate harmony khi single mode)
- Dual Brand Color System skill hoàn chỉnh hơn cho validation rules
- Future components sẽ follow pattern này từ skill

---

## Files Summary

**Sửa code (2 files):**
1. `app/admin/home-components/cta/[id]/edit/page.tsx` (line 93-96, optional 98-101)
2. `app/admin/home-components/create/cta/page.tsx` (nếu có validation)

**Nâng cấp skill (2 files):**
1. `.factory/skills/dual-brand-color-system/SKILL.md` (version + Principle 5 + Component Color Map)
2. `.factory/skills/dual-brand-color-system/checklist.md` (section F2 + pattern example)

**Commit:**
- Message: `fix(cta): skip harmony validation in single mode (v11.4)`
- Includes: CTA code fix + skill v11.4 update
