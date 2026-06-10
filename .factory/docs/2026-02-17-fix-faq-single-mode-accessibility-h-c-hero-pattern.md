# Fix FAQ Single Mode Accessibility Warning

## 🎯 Mục tiêu
Fix accessibility warning `minLc: 53.2 • fail: tabActive` ở FAQ component khi ở **single mode** bằng cách áp dụng pattern từ Hero/Stats đã fix thành công.

## 🔍 Root Cause
**File:** `app/admin/home-components/faq/_lib/colors.ts:228`

```typescript
// ❌ SAI - FAQ hiện tại
export const resolveFaqSecondary = (primary, secondary, mode, harmony) => {
  if (mode === 'single') {return primary;} // Trả về primary → primary = secondary → fail contrast
  ...
};

// ✅ ĐÚNG - Hero pattern (commit 03e1a3c)
const resolveSecondaryColor = (primary, secondary, mode, harmony) => {
  if (mode === 'single') {
    if (harmony === 'complementary') return getComplementary(primary);
    if (harmony === 'triadic') return getTriadic(primary)[0];
    return getAnalogous(primary)[0]; // Tạo màu khác hue → đủ contrast
  }
  return secondary;
};
```

**Hệ quả hiện tại:**
- Single mode: `primary = #00b315`, `resolvedSecondary = #00b315` (giống hệt)
- `tabActiveBg = #00b315`, `tabActiveText = getAPCATextColor(#00b315)` → Lc ≈ 53.2 < 60 → **FAIL**

## 📋 Implementation Plan

### 1. Fix `resolveFaqSecondary()` trong `faq/_lib/colors.ts`

**File:** `app/admin/home-components/faq/_lib/colors.ts`

**Thay đổi:**
```typescript
export const resolveFaqSecondary = (
  primary: string,
  secondary: string,
  mode: FaqBrandMode,
  harmony: FaqHarmony = 'analogous',
) => {
  if (mode === 'single') {
    // ✅ FIX: Trả về harmony color thay vì primary
    if (harmony === 'complementary') {
      return getComplementary(primary);
    }
    if (harmony === 'triadic') {
      return getTriadic(primary)[0];
    }
    return getAnalogous(primary)[0]; // default analogous
  }

  // Dual mode logic giữ nguyên
  const trimmedSecondary = secondary.trim();
  if (trimmedSecondary && isValidHexColor(trimmedSecondary)) {return trimmedSecondary;}
  return getFaqHarmonyFallback(primary, normalizeHarmony(harmony));
};
```

**Logic:**
- Single mode: Tạo secondary từ primary qua harmony (analogous/complementary/triadic)
- Dual mode: Ưu tiên user-provided secondary, fallback harmony nếu invalid
- Functions `getAnalogous()`, `getComplementary()`, `getTriadic()` đã tồn tại trong file

### 2. Fix label hiển thị trong `FaqPreview.tsx`

**File:** `app/admin/home-components/faq/_components/FaqPreview.tsx`

**Hiện tại (dòng ~125):**
```tsx
<div className="flex items-center gap-2">
  <span className="text-slate-500">Primary</span>
  <span className="h-5 w-5 rounded border" style={{ backgroundColor: normalizedPrimary }} />
  <span className="font-mono text-slate-600 dark:text-slate-300">{normalizedPrimary}</span>
</div>
<div className="flex items-center gap-2">
  <span className="text-slate-500">Secondary</span> {/* ❌ Sai khi single mode */}
  <span className="h-5 w-5 rounded border" style={{ backgroundColor: resolvedSecondary }} />
  <span className="font-mono text-slate-600 dark:text-slate-300">{resolvedSecondary}</span>
</div>
```

**Fix:**
```tsx
<div className="flex items-center gap-2">
  <span className="text-slate-500">Primary</span>
  <span className="h-5 w-5 rounded border" style={{ backgroundColor: normalizedPrimary }} />
  <span className="font-mono text-slate-600 dark:text-slate-300">{normalizedPrimary}</span>
</div>
<div className="flex items-center gap-2">
  <span className="text-slate-500">
    {mode === 'single' ? `Accent (${harmony})` : 'Secondary'}
  </span>
  <span className="h-5 w-5 rounded border" style={{ backgroundColor: resolvedSecondary }} />
  <span className="font-mono text-slate-600 dark:text-slate-300">{resolvedSecondary}</span>
</div>
```

**Tham khảo:** Hero không hiện label này (giản lược hơn), nhưng FAQ có thể giữ với label rõ nghĩa.

### 3. Verify accessibility pass

**Kiểm tra:**
- URL test: `http://localhost:3000/admin/home-components/faq/js72rn9pmncmzzwjkdt2r8s3wd81aggr/edit`
- Mode: single
- Style: tabbed
- Harmony: analogous (default)

**Kỳ vọng:**
- `primary = #00b315`
- `resolvedSecondary = getAnalogous(#00b315)[0]` → ví dụ `#00b34a` (hue +30°)
- `tabActiveBg = #00b34a`, `tabActiveText = getAPCATextColor(#00b34a)` → Lc ≥ 60 → **PASS**
- Warning "Accessibility warning" biến mất
- Label hiện: "Primary / Accent (analogous)"

## ✅ Checklist thành công
- [ ] `resolveFaqSecondary()` trả về harmony color trong single mode
- [ ] Accessibility warning biến mất (minLc ≥ 60)
- [ ] Label "Secondary" đổi thành "Accent (analogous/complementary/triadic)" khi single mode
- [ ] Dual mode hoạt động bình thường (không bị ảnh hưởng)
- [ ] Test cả 6 layouts FAQ (accordion/cards/two-column/minimal/timeline/tabbed)
- [ ] TypeScript compile không lỗi (`bunx tsc --noEmit`)
- [ ] Commit với message: `fix(faq): align single mode with hero pattern - use harmony color for secondary`

## 📚 Tham chiếu
- Hero fix: commit `03e1a3c` - "fix(faq): align tabActive APCA weight"
- Stats similar pattern: `stats/_lib/colors.ts:20`
- Dual Brand Color System Skill v11.2