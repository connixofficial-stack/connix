# Đánh giá CTA Component theo Dual Brand Color System v11.3

## DARE Framework: Decompose

### Problem Graph

```
1. [MAIN] CTA component vi phạm Dual Brand Color System
   1.1 [ROOT CAUSE] Single mode KHÔNG monochromatic - vi phạm Principle #5
       → resolveSecondaryColor() tạo harmony color thay vì return primary
   1.2 [CRITICAL] UI hiển thị sai trong single mode
       1.2.1 Hiển thị Secondary color info khi mode='single'
       1.2.2 Hiển thị Accent balance khi mode='single'
       1.2.3 Info text hiển thị harmony thay vì "SINGLE"
   1.3 [MEDIUM] Harmony warnings (deltaE < 20)
   1.4 [MEDIUM] Accessibility warnings (APCA thresholds)
```

---

## DARE Framework: Analyze

### 1.1 ROOT CAUSE: Single Mode KHÔNG Monochromatic

**File**: `app/admin/home-components/cta/_lib/colors.ts` (line 181-192)

**Code hiện tại** (❌ SAI):
```typescript
export const resolveSecondaryColor = (
  primary: string,
  secondary: string,
  mode: BrandMode,
  harmony: CTAHarmony,
) => {
  const primaryNormalized = normalizeHex(primary, DEFAULT_BRAND_COLOR);
  const harmonyNormalized = normalizeCTAHarmony(harmony);

  if (mode === 'single') {
    if (harmonyNormalized === 'complementary') {return getComplementary(primaryNormalized);}
    if (harmonyNormalized === 'triadic') {return getTriadic(primaryNormalized)[0];}
    return getAnalogous(primaryNormalized)[0];  // ❌ TẠO HARMONY COLOR
  }

  return normalizeHex(secondary, primaryNormalized);
};
```

**Vi phạm**:
- Principle #5 (STRICT): Single mode PHẢI return `primary` (monochromatic)
- Hiện tại tạo harmony color (analogous/complementary/triadic) thay vì dùng primary
- Pattern giống FAQ bug đã fix ở v11.3

**Pattern chuẩn** (Stats, Hero, FAQ đã fix):
```typescript
if (mode === 'single') {
  return primary;  // ✅ Monochromatic
}
```

---

### 1.2 CRITICAL: UI Hiển Thị Sai trong Single Mode

**File**: `app/admin/home-components/cta/_components/CTAPreview.tsx` (line 65-100)

**Vi phạm Rule F2 (Single Mode Monochromatic):**

❌ **Hiển thị Secondary color info** (line 89-93):
```tsx
<div className="flex items-center gap-2">
  <span className="text-slate-500">Secondary</span>
  <span className="h-5 w-5 rounded border" style={{ backgroundColor: resolvedSecondary }} />
  <span className="font-mono text-slate-600">{resolvedSecondary}</span>
</div>
```
→ **Phải ẨN khi mode='single'**

❌ **Hiển thị Accent balance** (line 94-96):
```tsx
<div className="text-slate-500">
  Accent: P {accentBalance.primary}% / S {accentBalance.secondary}% / N {accentBalance.neutral}%
</div>
```
→ **Phải ẨN khi mode='single'**

❌ **Info text** (line 60):
```tsx
info={`${mode.toUpperCase()} • ${harmony}`}
```
→ **Single mode phải hiển thị "SINGLE" (không harmony)**

---

### 1.3 Harmony Warnings (deltaE < 20)

**Root cause**: Do 1.1 - khi single mode tạo analogous (+30°), nếu user chọn 2 màu gần nhau thì deltaE < 20

**Solution**: Sau khi fix 1.1 → single mode = monochromatic → deltaE = 0 (đúng)

---

### 1.4 Accessibility Warnings (APCA thresholds)

**Phân tích từng layout** (code trong `getCTAColors()`, line 290-450):

#### Layout 1: Banner
- ✅ Title on primary bg: dùng `ensureAPCATextColor()` → OK
- ✅ Description on primary bg: dùng `ensureAPCATextColor()` → OK
- ✅ Badge: solid tint + `getAPCATextColor()` → OK
- ⚠️ **Secondary button text on primary bg**: có `ensureAPCATextColor()` nhưng có thể fail nếu primary quá sáng/tối

#### Layout 2: Centered
- ✅ Title: primary color on white → OK (đã test)
- ✅ Description: #475569 on white → OK
- ✅ Badge: tint + textInteractive → OK
- ⚠️ **Secondary button text**: `textInteractive` có thể fail APCA threshold 45 (14px bold)

#### Layout 3: Split
- ✅ Title: primary on white → OK
- ✅ Accent line: decorative, không tính APCA
- ⚠️ **Secondary button on white**: cùng lỗi centered

#### Layout 4: Floating
- ✅ Cùng pattern centered → cùng issues

#### Layout 5: Gradient
- ✅ Title: `getTextOnGradient()` → OK
- ✅ Description: custom logic dựa trên fromTint/toTint → OK
- ⚠️ **Secondary button on gradient**: dùng `textOnGradient` nhưng có thể fail vì gradient background phức tạp

#### Layout 6: Minimal
- ✅ Cùng base pattern → OK

**Issues tìm thấy**:
1. `textInteractive` (line 165) dùng `-0.26` lightness → có thể fail threshold 45 với secondary button
2. Secondary button bg = white/transparent nhưng border/text dùng secondary palette → chưa có `ensureAPCATextColor()`

---

## DARE Framework: Reflect

### Critical (PHẢI FIX):
1. ✅ **1.1 Single mode tạo harmony color** → vi phạm v11.3 STRICT rule
2. ✅ **1.2 UI hiển thị sai** → confuse user, không tuân thủ Checklist F2

### Medium (NÊN FIX):
3. ⚠️ **1.4 Secondary button APCA** → có thể fail validation ở 1 số màu

### Low (CHẤP NHẬN):
4. ✓ Accent balance đúng theo Component Color Map (P 60% / S 40%)
5. ✓ 60-30-10 rule: đo ở content state, placeholder không tính
6. ✓ Anti AI-Styling: flat design, không decorative opacity/shadow

---

## DARE Framework: Execute Plan

### Fix 1: Single Mode Monochromatic (ROOT CAUSE)

**File**: `app/admin/home-components/cta/_lib/colors.ts`

**Thay đổi** `resolveSecondaryColor()` (line 181-192):

```typescript
// BEFORE (❌)
if (mode === 'single') {
  if (harmonyNormalized === 'complementary') {return getComplementary(primaryNormalized);}
  if (harmonyNormalized === 'triadic') {return getTriadic(primaryNormalized)[0];}
  return getAnalogous(primaryNormalized)[0];
}

// AFTER (✅)
if (mode === 'single') {
  return primaryNormalized;  // Monochromatic - harmony ignored
}
```

**Impact**:
- Single mode: primary === secondary → deltaE = 0 → không có harmony warning
- Dual mode: giữ nguyên logic (dùng secondary nếu valid, fallback harmony)

---

### Fix 2: UI Single Mode Display Rules

**File**: `app/admin/home-components/cta/_components/CTAPreview.tsx`

#### 2.1 Ẩn Secondary color info (line 88-93)
```tsx
// BEFORE
<div className="flex items-center gap-2">
  <span className="text-slate-500">Secondary</span>
  ...
</div>

// AFTER
{mode === 'dual' && (
  <div className="flex items-center gap-2">
    <span className="text-slate-500">Secondary</span>
    ...
  </div>
)}
```

#### 2.2 Ẩn Accent balance (line 94-96)
```tsx
// BEFORE
<div className="text-slate-500">
  Accent: P {accentBalance.primary}% / S {accentBalance.secondary}% / N {accentBalance.neutral}%
</div>

// AFTER
{mode === 'dual' && (
  <div className="text-slate-500">
    Accent: P {accentBalance.primary}% / S {accentBalance.secondary}% / N {accentBalance.neutral}%
  </div>
)}
```

#### 2.3 Info text (line 60)
```tsx
// BEFORE
info={`${mode.toUpperCase()} • ${harmony}`}

// AFTER
info={mode === 'single' ? 'SINGLE' : `DUAL • ${harmony}`}
```

#### 2.4 Primary color label (line 84-88)
```tsx
// BEFORE
<span className="text-slate-500">Primary</span>

// AFTER
<span className="text-slate-500">
  {mode === 'single' ? 'Primary (mono)' : 'Primary'}
</span>
```

---

### Fix 3 (OPTIONAL): Secondary Button APCA Enhancement

**File**: `app/admin/home-components/cta/_lib/colors.ts`

**Vị trí**: trong `getCTAColors()`, các return statements

**Ví dụ cho Centered layout** (line 320-340):
```typescript
// BEFORE
secondaryButtonText: secondaryPalette.textInteractive,

// AFTER
secondaryButtonText: ensureAPCATextColor(
  secondaryPalette.textInteractive,
  base.secondaryButtonBg ?? '#ffffff',
  14,
  700
),
```

**Apply cho**: centered, split, floating, minimal (4 layouts dùng white/transparent bg)

---

## Validation Checklist

### Core (A)
- [x] OKLCH only: ✅ culori
- [x] APCA: ✅ apca-w3
- [x] Palette đủ: ✅ solid/surface/hover/active/border/disabled
- [❌→✅] Single mode auto-suggest: FIX 1
- [x] Dual mode similarity check: ✅ getHarmonyStatus()

### Distribution (B)
- [x] 60-30-10: ✅ ACCENT_BALANCE_BY_STYLE
- [x] Primary CTA/heading: ✅ title + primaryButton
- [x] Secondary badge/labels: ✅ badgeBg + secondaryButton

### Single Mode (F2) - CRITICAL
- [❌→✅] resolveSecondary() return primary: FIX 1
- [❌→✅] UI không hiển thị secondary info: FIX 2.1
- [❌→✅] UI không hiển thị accent balance: FIX 2.2
- [❌→✅] Info text "SINGLE": FIX 2.3

### Anti AI-Styling (E)
- [x] Flat design: ✅ border 1px, không decorative shadow
- [x] Không opacity decorative: ✅ badge dùng solid tint
- [x] Touch targets >= 44px: ✅ min-h-[44px]

---

## Kết Luận

### Issues Tìm Thấy

#### CRITICAL (vi phạm v11.3 STRICT):
1. ❌ **Single mode tạo harmony color** thay vì monochromatic
2. ❌ **UI hiển thị Secondary color info** khi mode='single'
3. ❌ **UI hiển thị Accent balance** khi mode='single'
4. ❌ **Info text hiển thị harmony** thay vì "SINGLE"

#### MEDIUM:
5. ⚠️ **Secondary button text** có thể fail APCA threshold ở 1 số màu (centered/split/floating/minimal)

#### Harmony Warning (deltaE < 20):
- **Root cause**: Do issue #1 → fix #1 sẽ resolve

#### Accessibility Warning (APCA):
- **Root cause**: Do issue #5 → fix #3 optional (hoặc chấp nhận validate fail ở edge cases)

---

## Component Color Map Status

| Component | P% | S% | Pattern | Last Updated | Status |
|---|---|---|---|---|---|
| CTA | 60 | 40 | P: bg/buttons; S: title text/button text | N/A | **Needs Fix v11.3** |

**After Fix**:
- Status: ✅ Fixed v11.3 (single mode monochromatic)
- Last Updated: 2026-02-17

---

## Files Cần Sửa

1. `app/admin/home-components/cta/_lib/colors.ts` (Fix 1)
2. `app/admin/home-components/cta/_components/CTAPreview.tsx` (Fix 2)
3. (Optional) `app/admin/home-components/cta/_lib/colors.ts` (Fix 3)

---

## Test Plan

### Test Case 1: Single Mode Monochromatic
- Mode: single, Primary: #00b315, Harmony: analogous
- **Expected**: Secondary = #00b315 (không phải analogous +30°)
- **Expected**: Info = "SINGLE" (không "SINGLE • analogous")
- **Expected**: Không hiển thị Secondary color swatch
- **Expected**: Không hiển thị Accent balance

### Test Case 2: Dual Mode Normal
- Mode: dual, Primary: #00b315, Secondary: #ff6b35
- **Expected**: Secondary = #ff6b35
- **Expected**: Info = "DUAL • analogous"
- **Expected**: Hiển thị Secondary color swatch
- **Expected**: Hiển thị Accent balance

### Test Case 3: Dual Mode Similarity
- Mode: dual, Primary: #00b315, Secondary: #00b320 (deltaE < 20)
- **Expected**: Harmony warning hiển thị
- **Expected**: Save button bị chặn

### Test Case 4: Accessibility
- Test 6 layouts với primary sáng (#fbbf24) và tối (#1e3a8a)
- **Expected**: Không có accessibility warning (hoặc chỉ fail ở edge cases nếu không apply Fix 3)

---

## Commit Message Template

```
fix(cta): align single mode with v11.3 monochromatic rule

- resolveSecondaryColor() returns primary in single mode
- Hide secondary color info in single mode UI
- Hide accent balance in single mode UI
- Info text shows "SINGLE" instead of harmony
- (optional) Enhance secondary button APCA

Fixes harmony warning (deltaE < 20) in single mode
Aligns with Stats/Hero/FAQ pattern (v11.3)
```