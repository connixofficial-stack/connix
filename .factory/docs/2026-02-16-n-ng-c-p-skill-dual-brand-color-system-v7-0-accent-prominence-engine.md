
## Vấn đề gốc

Skill v6.0 có các rule về diện tích (minimum visibility 5%/15%) nhưng **thiếu hệ thống tổng quát** để:
1. **Đếm số accent points** trong một layout
2. **Đánh giá diện tích** (surface area) của từng accent point
3. **Quyết định phân phối primary/secondary** dựa trên số lượng + diện tích accent points

**Ví dụ cụ thể**: Layout "fade" chỉ có 1 accent point (thumbnail border) → skill gán secondary cho border → không hay, vì khi chỉ có 1 chỗ accent thì phải ưu tiên primary (màu thương hiệu chính).

## Best Practices từ research

| Nguồn | Nguyên tắc |
|-------|-----------|
| **Material Design 3** | Primary = "most prominent components" (CTA, FAB, active states); Secondary = "less prominent" (filter chips, tonal buttons) |
| **60-30-10 Rule** (inkbotdesign 2026) | 10% accent nên dùng 1 màu duy nhất cho CTA chính; nhiều accent chỉ khi đủ diện tích |
| **Von Restorff Effect** (lawsofux.com) | Element nổi bật nhất = ghi nhớ tốt nhất → accent duy nhất phải là brand color chính |
| **Atlassian/Accor/California DS** | Single accent element → dùng primary (brand color), KHÔNG dùng secondary |
| **APCA** | Contrast đo perceptual, font-size aware → accent nhỏ cần contrast cao hơn |

### Quy tắc phân phối accent tổng quát (đúc kết):

```
1 accent point  → 100% primary (brand color chính, Von Restorff tối đa)
2 accent points → primary ở cái có diện tích lớn hơn, secondary ở cái nhỏ hơn
3 accent points → 2 primary + 1 secondary (secondary ở cái có diện tích trung bình)
4+ accent points → Theo 60-30-10 trong phần accent: ~70% primary, ~30% secondary
```

## Đề xuất: Thêm Section "Accent Prominence Engine" vào SKILL.md v7.0

### 1. Thêm Core Rule #9: Accent Prominence Engine (TRỌNG TÂM)

```md
### 9) Accent Prominence Engine (Phân phối thông minh)

Trước khi gán primary/secondary cho layout, phải phân tích:

#### Bước 1: Đếm Accent Points
Liệt kê tất cả element KHÔNG phải neutral trong layout khi có data đầy đủ.
Accent point = element dùng brand color (primary hoặc secondary).
KHÔNG tính: background, text body, card surface (đây là neutral).

#### Bước 2: Phân loại Surface Area
Mỗi accent point được xếp vào 1 trong 4 tier:

| Tier | Diện tích ước lượng | Ví dụ |
|------|---------------------|-------|
| XL (Hero) | >= 20% component | CTA button lớn, overlay gradient, hero badge |
| L (Major) | 5-20% | Card border/ring, badge with bg, progress bar |
| M (Minor) | 1-5% | Dot active, small badge, thin border |
| S (Micro) | < 1% | Icon 16px, thin line, dot inactive |

#### Bước 3: Phân phối theo Accent Count

**1 accent point (Lone Accent Rule - Von Restorff)**
→ LUÔN dùng **primary** (brand color chính)
→ Lý do: Chỉ có 1 chỗ nổi bật → phải là thương hiệu chính
→ Ví dụ: Fade layout chỉ có thumbnail border → dùng primary

**2 accent points**
→ Accent có tier cao hơn (diện tích lớn hơn) = **primary**
→ Accent có tier thấp hơn = **secondary**
→ Nếu cùng tier → cái có interaction (click/hover) = primary
→ Ví dụ: Slider có nav button + dot → dot (interactive) = primary, nav = secondary

**3 accent points**
→ 2 **primary** + 1 **secondary**
→ Secondary gán cho accent có tier THẤP NHẤT
→ Ví dụ: CTA(XL) + badge(L) + dot(M) → CTA=primary, badge=primary, dot=secondary

**4+ accent points (Standard Distribution)**
→ Áp dụng 60-30-10 bình thường
→ Primary >= 3 element types, Secondary >= 2 element types
→ (Rule 6 hiện tại đã cover)

#### Bước 4: Validate Contrast
- Accent tier S (< 1%): APCA >= 60 (phải rất rõ ràng vì quá nhỏ)
- Accent tier M (1-5%): APCA >= 45
- Accent tier L/XL (>= 5%): APCA >= 30 (diện tích lớn, dễ thấy hơn)
```

### 2. Thêm Accent Analysis Template

```md
## Accent Analysis Template (điền trước khi gán màu)

| # | Element | Tier | Area Est. | Interactive? | Assigned Color | Reason |
|---|---------|------|-----------|-------------|----------------|--------|
| 1 | thumbnail border | M | ~3% | yes (click) | ? | ? |
| 2 | | | | | | |
| Total accent points: X → Apply Rule: [Lone/Dual/Triple/Standard]
```

### 3. Sửa file `checklists/review-checklist.md` - thêm section 7

```md
## 7. Accent Prominence
- [ ] Đã liệt kê tất cả accent points
- [ ] Đã phân loại tier (XL/L/M/S) cho từng accent
- [ ] Đã áp dụng đúng rule theo accent count (Lone/Dual/Triple/Standard)
- [ ] Lone accent (nếu có) dùng primary, KHÔNG phải secondary
- [ ] Accent tier S có APCA >= 60
```

### 4. Sửa file `checklists/create-checklist.md` - thêm section 6

```md
## 6. Accent Prominence
- [ ] Đã điền Accent Analysis Template
- [ ] Áp dụng đúng Accent Count Rule
- [ ] Lone Accent = primary (Von Restorff)
```

### 5. Thêm `checklists/accent-analysis-template.md` (file mới)

File mới chứa bảng Accent Analysis Template + hướng dẫn cách điền + ví dụ Hero 6 layouts.

### 6. Cập nhật `examples/color-utils.ts` - thêm helper

```ts
// Accent tier classification helper
export type AccentTier = 'XL' | 'L' | 'M' | 'S';

export interface AccentPoint {
  element: string;
  tier: AccentTier;
  interactive: boolean;
}

export const getAccentDistribution = (
  accents: AccentPoint[],
): Map<string, 'primary' | 'secondary'> => {
  const sorted = [...accents].sort((a, b) => {
    const tierOrder = { XL: 4, L: 3, M: 2, S: 1 };
    const tierDiff = tierOrder[b.tier] - tierOrder[a.tier];
    if (tierDiff !== 0) return tierDiff;
    return (b.interactive ? 1 : 0) - (a.interactive ? 1 : 0);
  });
  
  const result = new Map<string, 'primary' | 'secondary'>();
  const count = accents.length;

  if (count <= 1) {
    // Lone Accent Rule: always primary
    sorted.forEach(a => result.set(a.element, 'primary'));
  } else if (count === 2) {
    // Larger = primary, smaller = secondary
    result.set(sorted[0].element, 'primary');
    result.set(sorted[1].element, 'secondary');
  } else if (count === 3) {
    // 2 primary + 1 secondary (smallest = secondary)
    result.set(sorted[0].element, 'primary');
    result.set(sorted[1].element, 'primary');
    result.set(sorted[2].element, 'secondary');
  } else {
    // Standard: top ~70% primary, bottom ~30% secondary
    const primaryCount = Math.ceil(count * 0.7);
    sorted.forEach((a, i) => {
      result.set(a.element, i < primaryCount ? 'primary' : 'secondary');
    });
  }
  return result;
};
```

## Tóm tắt thay đổi

| File | Hành động |
|------|-----------|
| `SKILL.md` | v7.0: thêm Core Rule #9 "Accent Prominence Engine" + Accent Analysis Template |
| `examples/color-utils.ts` | Thêm `AccentTier`, `AccentPoint`, `getAccentDistribution()` |
| `checklists/review-checklist.md` | Thêm section 7: Accent Prominence |
| `checklists/create-checklist.md` | Thêm section 6: Accent Prominence |
| `checklists/accent-analysis-template.md` | **File mới** - template phân tích accent + ví dụ Hero |

## Ảnh hưởng thực tế: Hero Fade Layout

**Trước** (v6.0): `thumbnailBorderActive = secondaryPalette.solid` → không hay, chỉ có 1 accent mà dùng secondary

**Sau** (v7.0): Agent chạy Accent Prominence Engine → phát hiện Fade chỉ có 1 accent point → áp Lone Accent Rule → `thumbnailBorderActive = primaryPalette.solid` → thương hiệu chính nổi bật

**Lưu ý**: Spec này CHỈ cập nhật skill docs/checklists/examples. Không sửa code component thật (hero/colors.ts). Việc sửa code sẽ là task riêng sau khi skill được cập nhật.
