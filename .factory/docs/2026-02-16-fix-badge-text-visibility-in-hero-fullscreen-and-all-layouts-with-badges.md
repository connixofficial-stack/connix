
## Problem Graph

1. **[Main] Badge text "khong nhin thay" trong Fullscreen** <- depends on 1.1, 1.2
   1.1 **[ROOT CAUSE] `badgeText` dung raw secondary color, khong qua APCA** <- Solve first
   1.2 **[Same pattern] Split va Parallax layouts cung bi loi tuong tu**

## Root Cause Analysis

Trong `getFullscreenColors()` (file `_lib/colors.ts`):

```ts
badgeBg: getSecondaryTint(0.3),    // yellow + 0.3L = near-white (~0.98L)
badgeText: secondaryColor,          // raw yellow #fff71a (~0.95L)
```

- Yellow `#fff71a` co OKLCH Lightness ~ 0.95
- Badge background sau khi +0.3L = clamp 0.98 (gan trang)
- Contrast giua 0.95L va 0.98L = gan bang 0 (APCA < 15 Lc)
- **Badge text KHONG dung `getAPCATextColor()`** -> vi pham Rule #3 cua skill

## Fix Plan (1 file duy nhat)

### File: `app/admin/home-components/hero/_lib/colors.ts`

**1. Fix `getFullscreenColors()`:**
```ts
// BEFORE
badgeText: secondaryColor,

// AFTER  
badgeText: getAPCATextColor(getSecondaryTint(0.3), 12, 500),
```
- Dung APCA de chon text tren badgeBg (white hoac dark)
- Badge font-size = 12px (text-xs), weight 500

**2. Fix `getSplitColors()`:**
```ts
// BEFORE
badgeText: secondaryColor,

// AFTER
badgeText: getAPCATextColor(getSecondaryTint(0.4), 12, 600),
```

**3. Fix `getParallaxColors()`:**
```ts
// BEFORE
cardBadgeText: secondaryColor,

// AFTER
cardBadgeText: getAPCATextColor(getSecondaryTint(0.4), 12, 600),
```

### Ket qua mong doi

- Badge text se la `#0f172a` (dark) khi background sang (nhu truong hop yellow)
- Badge text se la `#ffffff` khi background toi
- Luon dam bao APCA Lc >= 60 cho body text

### Luu y

- **Khong thay doi badgeBg** - van giu secondary tint lam brand hint
- **badgeDotPulse / cardBadgeDot** van giu primary (nhieu sac, khong can contrast text)
- Chi thay doi text color de dam bao doc duoc
