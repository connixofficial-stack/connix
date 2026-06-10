# Spec: Loại bỏ Opacity/Shadow + Nâng cấp Responsive cho CTA + Update Dual Brand Skill v11.2

## Mục tiêu
1. Chuẩn hóa CTA component theo flat design chuyên nghiệp (loại bỏ opacity/shadow)
2. Nâng cấp responsive cho 5 layouts (banner, centered, split, floating, minimal) theo chuẩn gradient layout
3. Cập nhật skill dual-brand-color-system với rules nghiêm ngặt về opacity/shadow

---

## Problem Graph (DARE)

```
[Main] CTA có 2 vấn đề: opacity/shadow + responsive chưa đủ
  ├─ [1.1] Skill thiếu strict rules về opacity/shadow
  │    └─ [1.1.1] ROOT: Chưa có section "Anti Opacity/Shadow Rules" trong SKILL.md
  ├─ [1.2] colors.ts dùng applyAlpha() cho decorative elements
  │    ├─ [1.2.1] Badge background dùng opacity (2A, 2E)
  │    ├─ [1.2.2] Border dùng opacity (1F, 24, 2A, 66, 7A, 80)
  │    └─ [1.2.3] cardShadow dùng opacity + box-shadow
  ├─ [1.3] CTASectionShared.tsx render boxShadow trong split/floating
  │    └─ [1.3.1] Token cardShadow được apply vào style={{}}
  └─ [1.4] 5 layouts responsive chưa đủ chi tiết (chỉ md:, thiếu sm:/lg:)
       ├─ [1.4.1] Banner: padding/font-size chỉ có md:
       ├─ [1.4.2] Centered: spacing/font-size chỉ có md:
       ├─ [1.4.3] Split: padding/grid chỉ có md:
       ├─ [1.4.4] Floating: padding/layout chỉ có md:
       └─ [1.4.5] Minimal: padding/layout chỉ có md:
```

**Execution Order**: 1.1.1 → 1.2.1, 1.2.2, 1.2.3 → 1.3.1 → 1.4.1-1.4.5

---

## Chi tiết từng bước

### Bước 1: Cập nhật SKILL.md (v11.2)

**File**: `.factory/skills/dual-brand-color-system/SKILL.md`

**Thay đổi**:
1. Version: `11.1.0` → `11.2.0`
2. Thêm section mới sau "Anti AI-Styling Design Rules" (sau line ~135):

```markdown
### Anti Opacity/Shadow Rules (STRICT - v11.2)

**CẤM tuyệt đối**:
- `${color}XX` opacity cho decorative elements (badge bg, borders, overlays)
- `box-shadow` nhiều lớp hoặc decorative depth
- `backdrop-blur`, `filter: blur()` decorative
- `opacity: 0.X` layers chồng chéo
- Gradient overlay với opacity

**CHỈ cho phép (functional only)**:
- `opacity` cho disabled state (0.4-0.5, rõ ràng)
- `shadow-sm` (0 1px 2px) cho focus ring nếu cần thiết
- Border opacity CHỈ khi background KHÔNG thể dùng solid

**Thay thế chuẩn**:
- Badge bg: Solid tint với `l+0.42` (OKLCH)
- Card border: Solid `#e2e8f0` (slate-200) hoặc tint với `l+0.45`
- Card depth: Border 1px solid, không shadow
- Gradient badge: White/slate-100 solid + border 1px rõ ràng
```

3. Cập nhật "CẤM (AI Styling)" section (line ~130) thêm:
```markdown
- NO opacity decorative (chỉ disabled state)
- NO box-shadow decorative (chỉ focus-ring nếu cần)
```

---

### Bước 2: Cập nhật checklist.md

**File**: `.factory/skills/dual-brand-color-system/checklist.md`

**Thay đổi** trong section "E. Anti AI-Styling" (line ~16):

**BEFORE**:
```markdown
## E. Anti AI-Styling

- [ ] Không gradient decorative (chỉ gradient style mới dùng)
- [ ] Không hover effects phức tạp (mobile-first)
- [ ] Không blur/shadow nhiều lớp
- [ ] Không animate decorative (pulse, scale)
- [ ] Flat design + border + whitespace
- [ ] Touch targets >= 44px
```

**AFTER**:
```markdown
## E. Anti AI-Styling

- [ ] Không gradient decorative (chỉ gradient style mới dùng)
- [ ] Không hover effects phức tạp (mobile-first)
- [ ] Không blur/shadow nhiều lớp
- [ ] Không animate decorative (pulse, scale)
- [ ] Không opacity cho decorative elements (badge bg, borders)
- [ ] Không box-shadow cho card depth (chỉ border 1px)
- [ ] Badge bg phải solid color (không opacity)
- [ ] Card depth dùng border 1px solid (slate-200 hoặc brand tint)
- [ ] Flat design + border + whitespace
- [ ] Touch targets >= 44px
```

---

### Bước 3: Refactor colors.ts - Loại bỏ applyAlpha()

**File**: `app/admin/home-components/cta/_lib/colors.ts`

#### 3.1. Xóa hàm applyAlpha (line 336)
```ts
// XÓA HOÀN TOÀN dòng này
const applyAlpha = (hex: string, alphaHex: string) => `${hex}${alphaHex}`;
```

#### 3.2. Thêm helper tạo solid tint (thêm sau line 335, trước chỗ applyAlpha cũ)
```ts
const getSolidTint = (hex: string, lightnessIncrease = 0.42) => {
  const color = getOKLCH(hex, DEFAULT_BRAND_COLOR);
  return formatHex(oklch({ ...color, l: clampLightness(color.l + lightnessIncrease) }));
};
```

#### 3.3. Cập nhật CTAStyleTokens interface (line ~38)
**THÊM** field mới:
```ts
export interface CTAStyleTokens {
  sectionBg: string;
  sectionBorder?: string;
  title: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder?: string; // NEW: cho gradient/banner layouts
  primaryButtonBg: string;
  primaryButtonText: string;
  primaryButtonBorder?: string;
  secondaryButtonBg?: string;
  secondaryButtonText: string;
  secondaryButtonBorder: string;
  cardBg?: string;
  cardBorder?: string;
  cardShadow?: string; // SẼ bị xóa giá trị trong các layouts
  accentLine?: string;
}
```

#### 3.4. Refactor base tokens (line ~374)
**BEFORE**:
```ts
const base: CTAStyleTokens = {
  sectionBg: '#ffffff',
  sectionBorder: applyAlpha(secondaryPalette.solid, '2A'),
  title: primaryPalette.solid,
  description: '#475569',
  badgeBg: secondaryPalette.surface,
  badgeText: secondaryPalette.textInteractive,
  primaryButtonBg: primaryPalette.solid,
  primaryButtonText: primaryPalette.textOnSolid,
  primaryButtonBorder: primaryPalette.active,
  secondaryButtonBg: '#ffffff',
  secondaryButtonText: secondaryPalette.textInteractive,
  secondaryButtonBorder: secondaryPalette.border,
  cardBg: '#ffffff',
  cardBorder: applyAlpha(secondaryPalette.solid, '24'),
  cardShadow: `0 1px 3px ${applyAlpha(secondaryPalette.solid, '1F')}`,
  accentLine: secondaryPalette.solid,
};
```

**AFTER**:
```ts
const base: CTAStyleTokens = {
  sectionBg: '#ffffff',
  sectionBorder: getSolidTint(secondaryPalette.solid, 0.45),
  title: primaryPalette.solid,
  description: '#475569',
  badgeBg: secondaryPalette.surface,
  badgeText: secondaryPalette.textInteractive,
  badgeBorder: undefined,
  primaryButtonBg: primaryPalette.solid,
  primaryButtonText: primaryPalette.textOnSolid,
  primaryButtonBorder: primaryPalette.active,
  secondaryButtonBg: '#ffffff',
  secondaryButtonText: secondaryPalette.textInteractive,
  secondaryButtonBorder: secondaryPalette.border,
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0', // Solid slate-200
  cardShadow: undefined, // XÓA shadow
  accentLine: secondaryPalette.solid,
};
```

#### 3.5. Refactor banner style (line ~391)
**BEFORE**:
```ts
if (styleNormalized === 'banner') {
  return {
    ...base,
    sectionBg: primaryPalette.solid,
    sectionBorder: primaryPalette.active,
    title: ensureAPCATextColor(primaryPalette.textOnSolid, primaryPalette.solid, 32, 700),
    description: ensureAPCATextColor(
      getAPCATextColor(primaryPalette.solid, 16, 500) === '#ffffff' ? '#ffffff' : '#1e293b',
      primaryPalette.solid,
      16,
      500,
    ),
    badgeBg: applyAlpha(secondaryPalette.solid, '2A'),
    badgeText: ensureAPCATextColor(getAPCATextColor(secondaryPalette.solid, 12, 600), applyAlpha(secondaryPalette.solid, '2A'), 12, 600),
    primaryButtonBg: '#ffffff',
    primaryButtonText: ensureAPCATextColor(primaryPalette.textInteractive, '#ffffff', 14, 700),
    primaryButtonBorder: applyAlpha(primaryPalette.active, '80'),
    secondaryButtonBg: 'transparent',
    secondaryButtonText: ensureAPCATextColor(primaryPalette.textOnSolid, primaryPalette.solid, 14, 700),
    secondaryButtonBorder: applyAlpha(primaryPalette.textOnSolid === '#ffffff' ? '#ffffff' : '#0f172a', '66'),
    cardBg: undefined,
    cardBorder: undefined,
    cardShadow: undefined,
    accentLine: undefined,
  };
}
```

**AFTER**:
```ts
if (styleNormalized === 'banner') {
  const badgeBgSolid = getSolidTint(secondaryPalette.solid, 0.42);
  return {
    ...base,
    sectionBg: primaryPalette.solid,
    sectionBorder: primaryPalette.active,
    title: ensureAPCATextColor(primaryPalette.textOnSolid, primaryPalette.solid, 32, 700),
    description: ensureAPCATextColor(
      getAPCATextColor(primaryPalette.solid, 16, 500) === '#ffffff' ? '#ffffff' : '#1e293b',
      primaryPalette.solid,
      16,
      500,
    ),
    badgeBg: badgeBgSolid,
    badgeText: getAPCATextColor(badgeBgSolid, 12, 600),
    badgeBorder: secondaryPalette.border,
    primaryButtonBg: '#ffffff',
    primaryButtonText: ensureAPCATextColor(primaryPalette.textInteractive, '#ffffff', 14, 700),
    primaryButtonBorder: primaryPalette.active, // Solid
    secondaryButtonBg: 'transparent',
    secondaryButtonText: ensureAPCATextColor(primaryPalette.textOnSolid, primaryPalette.solid, 14, 700),
    secondaryButtonBorder: primaryPalette.textOnSolid === '#ffffff' ? '#ffffff' : '#0f172a', // Solid
    cardBg: undefined,
    cardBorder: undefined,
    cardShadow: undefined,
    accentLine: undefined,
  };
}
```

#### 3.6. Refactor centered style (line ~417)
**Không đổi logic**, chỉ confirm `cardShadow: undefined`

#### 3.7. Refactor split style (line ~428)
**BEFORE**:
```ts
if (styleNormalized === 'split') {
  return {
    ...base,
    sectionBg: '#f8fafc',
    sectionBorder: undefined,
    cardBg: '#ffffff',
    cardBorder: applyAlpha(secondaryPalette.solid, '1F'),
    cardShadow: `0 1px 3px ${applyAlpha(secondaryPalette.solid, '1A')}`,
    accentLine: primaryPalette.solid,
  };
}
```

**AFTER**:
```ts
if (styleNormalized === 'split') {
  return {
    ...base,
    sectionBg: '#f8fafc',
    sectionBorder: undefined,
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0', // Solid slate-200
    cardShadow: undefined, // XÓA shadow
    accentLine: primaryPalette.solid,
  };
}
```

#### 3.8. Refactor floating style (line ~442)
**BEFORE**:
```ts
if (styleNormalized === 'floating') {
  return {
    ...base,
    sectionBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: applyAlpha(secondaryPalette.solid, '2A'),
    cardShadow: `0 2px 6px ${applyAlpha(secondaryPalette.solid, '26')}`,
  };
}
```

**AFTER**:
```ts
if (styleNormalized === 'floating') {
  return {
    ...base,
    sectionBg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0', // Solid slate-200
    cardShadow: undefined, // XÓA shadow
  };
}
```

#### 3.9. Refactor gradient style (line ~452)
**BEFORE**:
```ts
if (styleNormalized === 'gradient') {
  const { fromTint, toTint } = getGradientTints(primaryPalette.solid, secondaryPalette.solid);
  const gradientBg = `linear-gradient(135deg, ${fromTint} 0%, ${toTint} 100%)`;
  const textOnGradient = getTextOnGradient(primaryPalette.solid, secondaryPalette.solid, 24, 700);
  const descriptionOnFrom = getAPCATextColor(fromTint, 16, 500);
  const descriptionOnTo = getAPCATextColor(toTint, 16, 500);
  const descriptionColor = descriptionOnFrom === '#ffffff' && descriptionOnTo === '#ffffff'
    ? '#f8fafc'
    : descriptionOnFrom === '#0f172a' && descriptionOnTo === '#0f172a'
      ? '#1e293b'
      : textOnGradient;

  return {
    ...base,
    sectionBg: gradientBg,
    sectionBorder: undefined,
    title: textOnGradient,
    description: descriptionColor,
    badgeBg: applyAlpha('#ffffff', '2E'),
    badgeText: ensureAPCATextColor(textOnGradient, '#ffffff', 12, 600),
    primaryButtonBg: '#ffffff',
    primaryButtonText: ensureAPCATextColor(secondaryPalette.textInteractive, '#ffffff', 14, 700),
    primaryButtonBorder: applyAlpha('#ffffff', '80'),
    secondaryButtonBg: 'transparent',
    secondaryButtonText: textOnGradient,
    secondaryButtonBorder: applyAlpha('#ffffff', '7A'),
    cardBg: undefined,
    cardBorder: undefined,
    cardShadow: undefined,
    accentLine: undefined,
  };
}
```

**AFTER**:
```ts
if (styleNormalized === 'gradient') {
  const { fromTint, toTint } = getGradientTints(primaryPalette.solid, secondaryPalette.solid);
  const gradientBg = `linear-gradient(135deg, ${fromTint} 0%, ${toTint} 100%)`;
  const textOnGradient = getTextOnGradient(primaryPalette.solid, secondaryPalette.solid, 24, 700);
  const descriptionOnFrom = getAPCATextColor(fromTint, 16, 500);
  const descriptionOnTo = getAPCATextColor(toTint, 16, 500);
  const descriptionColor = descriptionOnFrom === '#ffffff' && descriptionOnTo === '#ffffff'
    ? '#f8fafc'
    : descriptionOnFrom === '#0f172a' && descriptionOnTo === '#0f172a'
      ? '#1e293b'
      : textOnGradient;

  return {
    ...base,
    sectionBg: gradientBg,
    sectionBorder: undefined,
    title: textOnGradient,
    description: descriptionColor,
    badgeBg: '#f1f5f9', // Solid slate-100
    badgeText: getAPCATextColor('#f1f5f9', 12, 600),
    badgeBorder: '#cbd5e1', // Solid slate-300 border
    primaryButtonBg: '#ffffff',
    primaryButtonText: ensureAPCATextColor(secondaryPalette.textInteractive, '#ffffff', 14, 700),
    primaryButtonBorder: '#ffffff', // Solid white
    secondaryButtonBg: 'transparent',
    secondaryButtonText: textOnGradient,
    secondaryButtonBorder: '#ffffff', // Solid white
    cardBg: undefined,
    cardBorder: undefined,
    cardShadow: undefined,
    accentLine: undefined,
  };
}
```

#### 3.10. Refactor minimal style (line ~486)
**BEFORE**:
```ts
return {
  ...base,
  sectionBg: '#ffffff',
  sectionBorder: applyAlpha(secondaryPalette.solid, '2A'),
  cardBg: undefined,
  cardBorder: undefined,
  cardShadow: undefined,
};
```

**AFTER**:
```ts
return {
  ...base,
  sectionBg: '#ffffff',
  sectionBorder: getSolidTint(secondaryPalette.solid, 0.45),
  cardBg: undefined,
  cardBorder: undefined,
  cardShadow: undefined,
};
```

---

### Bước 4: Refactor CTASectionShared.tsx

**File**: `app/admin/home-components/cta/_components/CTASectionShared.tsx`

#### 4.1. Badge node - Thêm border (line ~69)
**BEFORE**:
```tsx
const badgeNode = badge ? (
  <span
    className="mb-3 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
    style={{
      backgroundColor: tokens.badgeBg,
      color: tokens.badgeText,
    }}
  >
    {badge}
  </span>
) : null;
```

**AFTER**:
```tsx
const badgeNode = badge ? (
  <span
    className="mb-3 inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
    style={{
      backgroundColor: tokens.badgeBg,
      borderColor: tokens.badgeBorder ?? 'transparent',
      color: tokens.badgeText,
    }}
  >
    {badge}
  </span>
) : null;
```

#### 4.2. Banner layout - Nâng cấp responsive (line ~83)
**BEFORE**:
```tsx
if (normalizedStyle === 'banner') {
  return (
    <section className={cn('py-10 md:py-14', sectionClass)} style={{ background: tokens.sectionBg, borderColor: tokens.sectionBorder }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 md:flex-row md:gap-8">
        <div className="max-w-xl text-center md:text-left">
          {badgeNode}
          <HeadingTag className="text-2xl font-bold md:text-3xl" style={{ color: tokens.title }}>
            {title}
          </HeadingTag>
          <p className="mt-2 text-sm md:text-base" style={{ color: tokens.description }}>
            {description}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {primaryButton}
          {secondaryButton}
        </div>
      </div>
    </section>
  );
}
```

**AFTER**:
```tsx
if (normalizedStyle === 'banner') {
  return (
    <section className={cn('px-4 py-8 md:py-12 lg:py-14', sectionClass)} style={{ background: tokens.sectionBg, borderColor: tokens.sectionBorder }}>
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 px-4 sm:gap-6 sm:px-6 md:flex-row md:gap-8">
        <div className="max-w-xl text-center md:text-left">
          {badgeNode}
          <HeadingTag className="text-xl font-bold sm:text-2xl md:text-3xl" style={{ color: tokens.title }}>
            {title}
          </HeadingTag>
          <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: tokens.description }}>
            {description}
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          {primaryButton}
          {secondaryButton}
        </div>
      </div>
    </section>
  );
}
```

#### 4.3. Centered layout - Nâng cấp responsive (line ~106)
**BEFORE**:
```tsx
if (normalizedStyle === 'centered') {
  return (
    <section className={cn('py-12 md:py-16', sectionClass)} style={{ background: tokens.sectionBg, borderColor: tokens.sectionBorder }}>
      <div className="mx-auto max-w-3xl text-center">
        {badgeNode}
        <HeadingTag className="text-2xl font-bold md:text-4xl" style={{ color: tokens.title }}>
          {title}
        </HeadingTag>
        <p className="mx-auto mt-3 max-w-2xl text-sm md:text-base" style={{ color: tokens.description }}>
          {description}
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {primaryButton}
          {secondaryButton}
        </div>
      </div>
    </section>
  );
}
```

**AFTER**:
```tsx
if (normalizedStyle === 'centered') {
  return (
    <section className={cn('px-4 py-10 md:py-14 lg:py-16', sectionClass)} style={{ background: tokens.sectionBg, borderColor: tokens.sectionBorder }}>
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        {badgeNode}
        <HeadingTag className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl" style={{ color: tokens.title }}>
          {title}
        </HeadingTag>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed sm:mt-3 sm:text-base" style={{ color: tokens.description }}>
          {description}
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:mt-6 sm:flex-row md:mt-7">
          {primaryButton}
          {secondaryButton}
        </div>
      </div>
    </section>
  );
}
```

#### 4.4. Split layout - Xóa shadow + nâng cấp responsive (line ~126)
**BEFORE**:
```tsx
if (normalizedStyle === 'split') {
  return (
    <section className={cn('bg-slate-50 py-10 md:py-14', sectionClass)} style={{ background: tokens.sectionBg, borderColor: tokens.sectionBorder }}>
      <div
        className="mx-auto max-w-5xl rounded-xl border p-5 md:p-8"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: tokens.cardBorder,
          boxShadow: tokens.cardShadow,
        }}
      >
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr,auto]">
          <div>
            {badgeNode}
            <div className="mb-4 h-1 w-16 rounded-full" style={{ backgroundColor: tokens.accentLine ?? tokens.secondaryButtonBorder }} />
            <HeadingTag className="text-xl font-bold md:text-2xl" style={{ color: tokens.title }}>
              {title}
            </HeadingTag>
            <p className="mt-2 text-sm md:text-base" style={{ color: tokens.description }}>
              {description}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col">
            {primaryButton}
            {secondaryButton}
          </div>
        </div>
      </div>
    </section>
  );
}
```

**AFTER**:
```tsx
if (normalizedStyle === 'split') {
  return (
    <section className={cn('bg-slate-50 px-4 py-8 md:py-12 lg:py-14', sectionClass)} style={{ background: tokens.sectionBg, borderColor: tokens.sectionBorder }}>
      <div
        className="mx-auto max-w-5xl rounded-xl border p-4 sm:p-6 md:p-8"
        style={{
          backgroundColor: tokens.cardBg,
          borderColor: tokens.cardBorder,
        }}
      >
        <div className="grid grid-cols-1 items-center gap-5 sm:gap-6 md:grid-cols-[1fr,auto]">
          <div>
            {badgeNode}
            <div className="mb-3 h-1 w-12 rounded-full sm:mb-4 sm:w-16" style={{ backgroundColor: tokens.accentLine ?? tokens.secondaryButtonBorder }} />
            <HeadingTag className="text-lg font-bold sm:text-xl md:text-2xl" style={{ color: tokens.title }}>
              {title}
            </HeadingTag>
            <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: tokens.description }}>
              {description}
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row md:flex-col">
            {primaryButton}
            {secondaryButton}
          </div>
        </div>
      </div>
    </section>
  );
}
```

#### 4.5. Floating layout - Xóa shadow + nâng cấp responsive (line ~158)
**BEFORE**:
```tsx
if (normalizedStyle === 'floating') {
  return (
    <section className={cn('bg-slate-50 py-10 md:py-16', sectionClass)} style={{ background: tokens.sectionBg }}>
      <div className="mx-auto max-w-5xl">
        <div
          className="rounded-xl border p-5 md:p-8"
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.cardBorder,
            boxShadow: tokens.cardShadow,
          }}
        >
          <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div className="max-w-2xl">
              {badgeNode}
              <HeadingTag className="text-xl font-bold md:text-3xl" style={{ color: tokens.title }}>
                {title}
              </HeadingTag>
              <p className="mt-2 text-sm md:text-base" style={{ color: tokens.description }}>
                {description}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {primaryButton}
              {secondaryButton}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**AFTER**:
```tsx
if (normalizedStyle === 'floating') {
  return (
    <section className={cn('bg-slate-50 px-4 py-8 md:py-14 lg:py-16', sectionClass)} style={{ background: tokens.sectionBg }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div
          className="rounded-xl border p-4 sm:p-6 md:p-8"
          style={{
            backgroundColor: tokens.cardBg,
            borderColor: tokens.cardBorder,
          }}
        >
          <div className="flex flex-col items-center justify-between gap-5 text-center sm:gap-6 md:flex-row md:text-left">
            <div className="max-w-2xl">
              {badgeNode}
              <HeadingTag className="text-lg font-bold sm:text-xl md:text-2xl lg:text-3xl" style={{ color: tokens.title }}>
                {title}
              </HeadingTag>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: tokens.description }}>
                {description}
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {primaryButton}
              {secondaryButton}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

#### 4.6. Minimal layout - Nâng cấp responsive (line ~211)
**BEFORE**:
```tsx
return (
  <section
    className={cn('border-y py-8 md:py-10', sectionClass)}
    style={{
      background: tokens.sectionBg,
      borderColor: tokens.sectionBorder,
    }}
  >
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-5 md:flex-row md:gap-8">
      <div className="flex items-center gap-4 text-center md:text-left">
        <div className="hidden h-14 w-1 rounded-full md:block" style={{ backgroundColor: tokens.accentLine }} />
        <div>
          <HeadingTag className="text-xl font-bold" style={{ color: tokens.title }}>
            {title}
          </HeadingTag>
          <p className="mt-1 text-sm md:text-base" style={{ color: tokens.description }}>
            {description}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {primaryButton}
        {secondaryButton}
      </div>
    </div>
  </section>
);
```

**AFTER**:
```tsx
return (
  <section
    className={cn('border-y px-4 py-6 md:py-8 lg:py-10', sectionClass)}
    style={{
      background: tokens.sectionBg,
      borderColor: tokens.sectionBorder,
    }}
  >
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:gap-5 sm:px-6 md:flex-row md:gap-8">
      <div className="flex items-center gap-3 text-center sm:gap-4 md:text-left">
        <div className="hidden h-12 w-1 rounded-full sm:h-14 md:block" style={{ backgroundColor: tokens.accentLine }} />
        <div>
          <HeadingTag className="text-lg font-bold sm:text-xl" style={{ color: tokens.title }}>
            {title}
          </HeadingTag>
          <p className="mt-1 text-sm leading-relaxed sm:text-base" style={{ color: tokens.description }}>
            {description}
          </p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {primaryButton}
        {secondaryButton}
      </div>
    </div>
  </section>
);
```

---

### Bước 5: Test 6 layouts

**Test matrix**:

| Layout | Device | Primary | Secondary | Check |
|--------|--------|---------|-----------|-------|
| Banner | Mobile | Blue | Orange | Font size, padding, border solid |
| Banner | Tablet | Blue | Orange | Layout switch, badge border |
| Banner | Desktop | Blue | Orange | Full width |
| Centered | Mobile | Green | Analogous | Spacing progressive |
| Centered | Tablet | Green | Analogous | Font size sm: breakpoint |
| Centered | Desktop | Green | Analogous | Max-width |
| Split | Mobile | Purple | Triadic | Card padding, no shadow |
| Split | Tablet | Purple | Triadic | Grid layout |
| Split | Desktop | Purple | Triadic | Card border only |
| Floating | Mobile | Red | Complementary | Text center, no shadow |
| Floating | Tablet | Red | Complementary | Responsive padding |
| Floating | Desktop | Red | Complementary | Flex-row |
| Gradient | Mobile | Cyan | Orange | Badge border, solid bg |
| Gradient | Desktop | Cyan | Orange | Gradient smooth |
| Minimal | Mobile | Indigo | Analogous | Accent line hidden sm |
| Minimal | Desktop | Indigo | Analogous | Border solid |

**Verify points**:
1. ✅ Không có opacity trong badge bg (`#f1f5f9` solid)
2. ✅ Không có box-shadow trong card
3. ✅ Badge có border rõ ràng (gradient/banner)
4. ✅ Font size progressive: `text-xl sm:text-2xl md:text-3xl lg:text-4xl`
5. ✅ Padding progressive: `px-4 py-8 md:py-12 lg:py-14`
6. ✅ Spacing progressive: `mt-2 sm:mt-3`, `gap-5 sm:gap-6`
7. ✅ APCA contrast pass (≥60 cho title, ≥45 cho description)

---

### Bước 6: Typecheck + Commit

```bash
bunx tsc --noEmit
git add .factory/skills/dual-brand-color-system/SKILL.md
git add .factory/skills/dual-brand-color-system/checklist.md
git add app/admin/home-components/cta/_lib/colors.ts
git add app/admin/home-components/cta/_components/CTASectionShared.tsx
git commit -m "feat(cta): flat design (no opacity/shadow) + mobile-first responsive upgrade

- colors.ts: loại bỏ applyAlpha(), thêm getSolidTint(), badge/border solid
- CTASectionShared: xóa boxShadow, nâng cấp 5 layouts responsive (sm:/lg: breakpoints)
- SKILL v11.2: Anti Opacity/Shadow Rules strict
- checklist: +4 checks opacity/shadow
"
```

---

## Tổng kết thay đổi

### Skill updates (2 files)
- **SKILL.md**: 
  - Version: 11.1.0 → 11.2.0
  - +1 section "Anti Opacity/Shadow Rules" (~15 lines)
  - Cập nhật "CẤM (AI Styling)" +2 rules
  
- **checklist.md**: 
  - +4 checks về opacity/shadow trong section E

### CTA component (2 files)

#### colors.ts (~600 lines total)
- **XÓA**: `applyAlpha()` function (1 line)
- **THÊM**: `getSolidTint()` helper (4 lines)
- **THÊM**: `badgeBorder?: string` trong CTAStyleTokens interface
- **THAY**: 15 instances của `applyAlpha(...)` → solid colors
- **XÓA**: `cardShadow` values trong 3 layouts (split, floating, minimal default)
- **Impact**: Banner (7 changes), Split (2), Floating (2), Gradient (5), Minimal (1)

#### CTASectionShared.tsx (~240 lines total)
- **Badge node**: +1 line `border` className, +1 line `borderColor`
- **Banner layout**: 8 responsive class changes
- **Centered layout**: 7 responsive class changes  
- **Split layout**: XÓA `boxShadow`, +9 responsive class changes
- **Floating layout**: XÓA `boxShadow`, +8 responsive class changes
- **Minimal layout**: 6 responsive class changes
- **Total**: ~40 class changes

### Responsive enhancement details

**Mobile-first breakpoints pattern**:
```
Base (mobile) → sm:640px → md:768px → lg:1024px
```

**Spacing scale**:
- Section padding: `py-8` → `md:py-12` → `lg:py-14/16`
- Inner padding: `px-4` → `sm:px-6`
- Card padding: `p-4` → `sm:p-6` → `md:p-8`
- Gaps: `gap-4/5` → `sm:gap-5/6` → `md:gap-8`

**Typography scale**:
- Heading: `text-xl` → `sm:text-2xl` → `md:text-3xl` → `lg:text-4xl`
- Description: `text-sm` → `sm:text-base`
- Leading: `leading-relaxed` for better readability

### Impact summary
- ✅ 6 layouts đều flat design (no opacity, no shadow)
- ✅ Badge solid bg + border rõ ràng
- ✅ Card depth chỉ border 1px
- ✅ 100% tuân thủ APCA contrast
- ✅ Mobile-first responsive với sm:/lg: breakpoints
- ✅ Preview device switcher hoạt động tốt với 3 breakpoints
