# Quick Fix Templates

## 1) Fix primary underuse

**Triệu chứng**
- Heading dùng secondary hoặc neutral
- Primary chỉ xuất hiện ở icon nhỏ/CTA hiếm khi hiển thị

**Fix nhanh**
1. Heading (h2) → `brandColor`
2. Thêm accent line dưới heading (`primary.solid`)
3. Đổi `cardBorderHover` → `primary.solid`
4. Category name / item title → `primary.textInteractive`

**Snippet gợi ý**

```tsx
<h2 style={{ color: colors.primary.solid }}>{title}</h2>
<div className="h-1 w-12 rounded-full" style={{ backgroundColor: colors.sectionAccent }} />
```

## 2) Fix secondary invisible

**Triệu chứng**
- Secondary chỉ nằm ở border/shadow quá nhạt
- Pagination dots gần như invisible

**Fix nhanh**
1. Tăng opacity secondary cho shadow/border (12% → 20-30%)
2. Text phụ (label, count, link) dùng `secondary.textInteractive`
3. Pagination inactive = `secondary 40%`

**Snippet gợi ý**

```ts
cardShadow: `0 2px 8px ${toOklchString(secondary.solid, 0.2)}`,
linkText: secondary.textInteractive,
paginationDotInactive: toOklchString(secondary.solid, 0.4),
```

## 3) Fix heading colors

**Triệu chứng**
- Heading = secondary hoặc neutral trong dual mode

**Fix nhanh**
1. Heading (h2) = `primary.solid`
2. Subtitle/label = `secondary.textInteractive`

**Snippet gợi ý**

```tsx
<h2 style={{ color: colors.primary.solid }}>{title}</h2>
<p style={{ color: colors.secondary.textInteractive }}>{subtitle}</p>
```

## 4) Fix accent balance

**Triệu chứng**
- Primary < 25% hoặc secondary < 5%

**Fix nhanh**
1. Thêm accent bar (primary) ở card/list
2. Đưa secondary vào labels hoặc counts
3. Tăng secondary trong hover/border

**Snippet gợi ý**

```tsx
<div className="w-1.5 self-stretch" style={{ backgroundColor: colors.cardAccentBar }} />
```

## 5) Fix runtime crash `.l` undefined (single mode)

**Triệu chứng**
- Runtime error: `Cannot read properties of undefined (reading 'l')`
- Thường xảy ra khi `secondary=''` nhưng vẫn parse `oklch(secondary)`

**Fix nhanh**
1. Resolve secondary theo mode trước: `secondaryResolved`
2. Parse qua `safeParseOklch(secondaryResolved, primary)`
3. Không dùng `oklch(x).l` trực tiếp

**Snippet gợi ý**

```ts
const secondaryResolved = mode === 'single' ? primary : (secondary.trim() ? secondary : primary);
const parsed = oklch(secondaryResolved) ?? oklch(primary) ?? oklch('#3b82f6');
const border = formatHex(oklch({ ...parsed, l: Math.min(parsed.l + 0.35, 0.98) }));
```

## 6) Fix Save button luôn enable ở trang edit

**Triệu chứng**
- Vừa mở edit page đã bấm Save được dù không đổi gì

**Fix nhanh**
1. Lưu snapshot `initialData` sau khi load data
2. Tính `hasChanges` bằng compare state hiện tại vs `initialData`
3. Button: `disabled={isSubmitting || !hasChanges}`
4. Sau save thành công: cập nhật `initialData` + reset `hasChanges=false`

**Snippet gợi ý**

```tsx
<Button type="submit" disabled={isSubmitting || !hasChanges}>
  {isSubmitting ? 'Đang lưu...' : (hasChanges ? 'Lưu thay đổi' : 'Đã lưu')}
</Button>
```

## 7) Fix color adjacency conflict (brand kề brand tint/shade)

**Triệu chứng**
- UI nhìn gắt, thiếu tinh tế
- Icon/chữ brand bị dính nền tint cùng màu

**Fix nhanh**
1. Đổi nền chứa brand-solid sang neutral (`neutralSurface`/`neutralBackground`)
2. Đổi border cùng-family sang `neutralBorder`
3. Giữ brand-solid cho heading/CTA/active để không giảm nhận diện

**Snippet gợi ý**

```ts
// ❌ Before
iconBg: getSolidTint(primary, 0.42),
iconColor: primary,
accentBorder: getSolidTint(secondary, 0.3),

// ✅ After
iconBg: neutralSurface,
iconColor: primary,
accentBorder: neutralBorder,
```
