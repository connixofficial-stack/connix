# Hero Colors: Before vs After

## Before (HSL + WCAG 2.0)

```ts
const colors = {
  primarySolid: brandColor,
  primaryTintLight: getTint(brandColor, 0.15),
  secondarySolid: secondary,
  textOnPrimary: getContrastColor(brandColor),
};
```

## After (OKLCH + APCA)

```ts
const primaryPalette = generatePalette(brandColor);
const secondaryPalette = generatePalette(secondary);

const colors = {
  primarySolid: primaryPalette.solid,
  primarySurface: primaryPalette.surface,
  secondarySolid: secondaryPalette.solid,
  textOnPrimary: primaryPalette.textOnSolid,
};
```

## Key Changes

- getTint/getShade -> OKLCH palette
- textOnPrimary -> APCA computed
- Added hover/active/disabled variants

## Single Source of Truth (Site = Preview)

```ts
import { getSliderColors } from '@/app/admin/home-components/hero/_lib/colors';

const sliderColors = getSliderColors(primary, secondary, mode, harmony);
```

- Site `ComponentRenderer` và admin `Preview` dùng chung helper
- Mọi thay đổi màu chỉ sửa trong `_lib/colors.ts`
