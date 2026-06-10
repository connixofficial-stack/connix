## Thay đổi layout Centered — Preview + DynamicFooter

### Cấu trúc hiện tại:
```
[Social icons + BCT logo]  ← cùng hàng
[copyright]                ← riêng
```

### Cấu trúc mới:
```
[Social icons]             ← hàng riêng (center)
[BCT logo | copyright]     ← cùng hàng, căn giữa
```

### Code mới (cả Preview lẫn DynamicFooter):
```jsx
{/* Social riêng */}
{config.showSocialLinks && (
  <div className="flex justify-center gap-3 mb-3">
    {/* social icons */}
  </div>
)}

{/* BCT + Copyright cùng hàng */}
<div className="flex justify-center items-center gap-3">
  {renderBctLogo('h-7')}
  <p className="text-[10px]" style={{ color: colors.textSubtle }}>
    {config.copyright || '...'}
  </p>
</div>
```

### Phạm vi sửa:
- `FooterPreview.tsx`: layout `centered`
- `DynamicFooter.tsx`: layout `centered`

**TypeScript check + commit sau khi xong.**
