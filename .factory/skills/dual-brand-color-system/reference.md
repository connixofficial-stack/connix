# Reference (OKLCH / APCA / Harmony)

## OKLCH Quick Values

| Channel | Range | UI gợi ý |
|---|---|---|
| L (Lightness) | 0.0–1.0 | 0.35–0.85 |
| C (Chroma) | 0.00–0.40 | 0.08–0.16 |
| H (Hue) | 0–360 | giữ ổn định khi shift |

## APCA Thresholds (gợi ý)

| Use case | Font | Lc tối thiểu |
|---|---|---|
| Body text | 14–16px, 400–500 | 60 |
| Heading | ≥18px hoặc ≥700 | 45 |
| UI controls | button/label | 45 |

## Harmony Schemes

| Scheme | Hue shift | Khi dùng |
|---|---|---|
| Analogous | ±30° | mặc định, dịu mắt |
| Complementary | 180° | contrast mạnh, dùng accent nhỏ |
| Triadic | 120° | cân bằng nhưng dễ rối |

## ΔE Similarity (OKLCH)

- Dùng `differenceEuclidean('oklch')`
- Quy đổi: `deltaE ≈ difference * 100`
- Rule: `deltaE < 20` → quá giống, đổi harmony

## Accent Balance

- Primary mục tiêu ≥ 25%
- Secondary mục tiêu ≥ 5%
- Neutral = 100% - (Primary + Secondary)

## Accessibility Score (APCA)

- Body text: Lc ≥ 60
- Heading / bold: Lc ≥ 45
- Score = minLc của tất cả text pairs

## Color Adjacency (v11.5)

**Định nghĩa:** Khi dùng brand color ở dạng solid, nền hoặc border tiếp giáp phải là neutral (white/black/slate), không dùng tint/shade cùng family.

| Case | Trạng thái |
|---|---|
| Primary solid + neutral bg | Good |
| Secondary solid + neutral bg | Good |
| Primary solid + primaryTint bg | Bad |
| Secondary border + secondaryTint bg | Bad |

**Neutral tokens gợi ý**
- `neutralSurface #ffffff`
- `neutralBackground #f8fafc`
- `neutralBorder #e2e8f0`
- `neutralText #0f172a`

**Canonical fix**
```ts
// ❌ Anti-pattern
iconBg: getSolidTint(primary, 0.42),
iconColor: primary,

// ✅ Canonical
iconBg: neutralSurface,
iconColor: primary,
```

## Nav Button Adaptive Contrast (W3C C40)

- Dual mode: base (bg/ring) = secondary, icon = primary
- Single mode: icon = primary
- Luôn 2 lớp contrast (inner bg + outer ring)
- Secondary sáng (L >= 0.65): bg tối + icon trắng + ring trắng
- Secondary tối (L < 0.65): bg trắng + icon secondary + ring tối

## Canonical Safety Snippets

```ts
// CRITICAL: Single mode MUST return primary (monochromatic)
const resolveSecondaryForMode = (
  primary: string,
  secondary: string,
  mode: 'single' | 'dual',
  harmony?: 'analogous' | 'complementary' | 'triadic',
) => {
  if (mode === 'single') {
    return primary;  // ✅ Monochromatic - harmony ignored
  }

  if (secondary.trim() && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(secondary)) {
    return secondary;
  }

  return getHarmonyColor(primary, harmony ?? 'analogous');
};

const getHarmonyColor = (
  primary: string,
  harmony: 'analogous' | 'complementary' | 'triadic',
) => {
  const color = safeParseOklch(primary, '#3b82f6');

  if (harmony === 'complementary') {
    return formatHex(oklch({ ...color, h: (color.h + 180) % 360 }));
  }

  if (harmony === 'triadic') {
    return formatHex(oklch({ ...color, h: (color.h + 120) % 360 }));
  }

  return formatHex(oklch({ ...color, h: (color.h + 30) % 360 }));
};
```

```ts
const safeParseOklch = (value: string, fallback: string) => (
  oklch(value) ?? oklch(fallback) ?? oklch('#3b82f6')
);
```
