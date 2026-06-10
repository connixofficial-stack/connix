## Vấn đề hiện tại

3 layout đang đặt BCT logo **tách biệt** khỏi social icons, gây rời rạc:

| Layout | Social hiện tại | BCT hiện tại |
|---|---|---|
| **Modern** | Hàng riêng (trên) | Hàng riêng (dưới, cùng copyright) |
| **Minimal** | Nằm ngoài cùng bên phải | BCT ở giữa, kẹp giữa logo-copyright và social |
| **Centered** | Hàng riêng `mb-4` (trên) | Hàng riêng (dưới, cùng copyright) |

---

## Thay đổi cần làm (Preview + DynamicFooter — 2 file)

### Modern Center
**Gom social icons và BCT logo vào 1 hàng `flex` cùng nhau**, trước copyright:

```jsx
{/* Social + BCT cùng hàng */}
<div className="flex items-center gap-3">
  {config.showSocialLinks && (
    <div className="flex gap-3">
      {/* social icons */}
    </div>
  )}
  {renderBctLogo('h-8')}
</div>

{/* Copyright riêng dưới */}
<div className="text-[10px] font-medium" style={{ color: colors.textSubtle }}>
  {config.copyright || '...'}
</div>
```

### Minimal
**Gom social icons và BCT logo vào 1 `div` flex cùng nhau**, bên phải (right side):

```jsx
{/* Left: Logo + copyright */}
<div className="flex items-center gap-2">...</div>

{/* Right: Social + BCT cùng nhau */}
<div className="flex items-center gap-3">
  {config.showSocialLinks && <div className="flex gap-2">{/* icons */}</div>}
  {renderBctLogo('h-7')}
</div>
```

### Centered
**Gom social icons và BCT logo vào 1 hàng `flex justify-center`** (thay vì 2 block riêng), bỏ `mb-4` của social, bỏ block BCT riêng:

```jsx
<div className="flex justify-center items-center gap-4 mb-4">
  {config.showSocialLinks && (
    <div className="flex gap-3">
      {/* social icons */}
    </div>
  )}
  {renderBctLogo('h-7')}
</div>

<p className="text-[10px]" style={{ color: colors.textSubtle }}>
  {config.copyright || '...'}
</p>
```

---

## Phạm vi sửa
- `FooterPreview.tsx`: sửa 3 layout `modern`, `minimal`, `centered`
- `DynamicFooter.tsx`: sửa tương tự 3 layout tương ứng (runtime)

**TypeScript check + commit sau khi xong.**
