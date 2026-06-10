
## Spec: Thêm toggle bật/tắt Copyright (CoC) cho Footer

### Phân tích hiện trạng
- `FooterConfig` có field `copyright: string` (luôn là string, không có toggle)
- Form hiện tại: Input text trực tiếp, placeholder `© 2024 Company. All rights reserved.`
- `DynamicFooter` dùng `??` → bug: empty string không fallback về default
- `FooterPreview` dùng `||` → preview hiện đúng dù empty string

---

### Thay đổi cần làm (4 files)

#### 1. `_types/index.ts` — Thêm field mới vào `FooterConfig`
```ts
showCopyright?: boolean;   // true = hiện (mặc định), false = tắt
```

#### 2. `_lib/constants.ts` — Cập nhật default + normalize
- `DEFAULT_FOOTER_CONFIG`: thêm `showCopyright: true`
- `normalizeFooterConfig`: thêm `showCopyright: safe.showCopyright !== false`

#### 3. `_components/FooterForm.tsx` — Thay input text thành toggle + preview text
Thay phần Copyright hiện tại:
```tsx
// TRƯỚC: chỉ có Input text
<Label>Copyright</Label>
<Input value={value.copyright} ... />
```
```tsx
// SAU: checkbox toggle + input text chỉ hiện khi bật
<div className="space-y-2">
  <div className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={value.showCopyright !== false}
      onChange={(e) => updateConfig({ showCopyright: e.target.checked })}
      className="w-4 h-4 rounded"
    />
    <Label>Hiển thị Copyright</Label>
  </div>
  {value.showCopyright !== false && (
    <div className="space-y-1">
      <Input
        value={value.copyright}
        onChange={(e) => updateConfig({ copyright: e.target.value })}
        placeholder={`© ${new Date().getFullYear()} Tên Web. All rights reserved.`}
      />
      <p className="text-xs text-slate-400">
        Để trống = tự động dùng: © {năm} {tên web từ Settings}. All rights reserved.
      </p>
    </div>
  )}
</div>
```

#### 4. `components/site/DynamicFooter.tsx` — Sửa bug `??` → `||` + thêm điều kiện `showCopyright`

Với **mỗi trong 6 styles** (classic, modern, corporate, minimal, centered, stacked), bọc phần copyright bằng `{config.showCopyright !== false && (...)}` và đổi `??` thành `||`:

```tsx
// TRƯỚC (bug):
<p>{config.copyright ?? `© ${currentYear} ${siteName}. All rights reserved.`}</p>

// SAU (fix):
{config.showCopyright !== false && (
  <p>{config.copyright || `© ${currentYear} ${siteName ?? 'VietAdmin'}. All rights reserved.`}</p>
)}
```

#### Bonus: `_components/FooterPreview.tsx` — Thêm điều kiện `showCopyright`
Tương tự DynamicFooter, bọc copyright bằng `{config.showCopyright !== false && (...)}` ở tất cả 6 styles.

---

### Checklist
- [ ] `_types/index.ts`: thêm `showCopyright?: boolean`
- [ ] `_lib/constants.ts`: default `showCopyright: true`, normalize `showCopyright: safe.showCopyright !== false`
- [ ] `FooterForm.tsx`: thay Input → checkbox toggle + input ẩn hiện
- [ ] `DynamicFooter.tsx`: sửa `??` → `||`, bọc `showCopyright !== false`
- [ ] `FooterPreview.tsx`: bọc `showCopyright !== false` (6 styles)
