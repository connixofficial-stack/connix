## Thay đổi layout Centered — Preview + DynamicFooter

### Cấu trúc hiện tại:
```
[Social icons]           ← hàng riêng, center
[BCT | copyright]        ← cùng hàng, center
```

### Cấu trúc mới:
```
[Social icons]                          ← hàng riêng, center (giữ nguyên)
[copyright (trái) | Social + BCT (phải)]  ← cùng dòng, justify-between
```

### Code mới (bottom bar):
```jsx
{/* Social riêng — giữ nguyên */}
{config.showSocialLinks && (
  <div className="flex justify-center gap-3 mb-3">
    {/* social icons */}
  </div>
)}

{/* Bottom bar: copyright trái, social + BCT phải */}
<div className="flex items-center justify-between">
  <p className="text-[10px]" style={{ color: colors.textSubtle }}>
    {config.copyright || '...'}
  </p>
  <div className="flex items-center gap-3">
    {config.showSocialLinks && (
      <div className="flex gap-3">
        {/* social icons (lặp lại ở đây) */}
      </div>
    )}
    {renderBctLogo('h-7')}
  </div>
</div>
```

> **Lưu ý:** Vì Centered trước đó render social ở hàng riêng phía trên rồi, giờ user muốn social + BCT nằm cùng bên phải với copyright ở trái — nên cần **bỏ block social riêng phía trên** (tránh render 2 lần), gom tất cả vào 1 dòng `justify-between`.

### Cấu trúc cuối cùng — gọn hơn:
```jsx
{/* 1 dòng duy nhất: copyright trái | social + BCT phải */}
<div className="flex items-center justify-between">
  <p className="text-[10px]" style={{ color: colors.textSubtle }}>
    {config.copyright || '...'}
  </p>
  <div className="flex items-center gap-3">
    {config.showSocialLinks && (
      <div className="flex gap-2">
        {/* social icons */}
      </div>
    )}
    {renderBctLogo('h-7')}
  </div>
</div>
```
Bỏ luôn block social riêng phía trên + divider `mb-4`.

### Phạm vi sửa:
- `FooterPreview.tsx`: layout `centered`
- `DynamicFooter.tsx`: layout `centered`

**TypeScript check + commit sau khi xong.**
