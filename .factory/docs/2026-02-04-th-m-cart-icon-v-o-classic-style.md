## Thay đổi

Thêm icon Cart vào Classic style khi toggle Cart được bật.

### 1. File: `components/experiences/previews/HeaderMenuPreview.tsx`

**Desktop** - Thêm cart icon vào nhóm search + CTA:
```tsx
<div className="flex items-center gap-3">
  {config.search.show && (...)}
  {config.cart.show && (
    <a href={defaultLinks.cart} className="p-2 text-slate-600 dark:text-slate-400 relative">
      <ShoppingCart size={20} />
      <span className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold text-white rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor }}>0</span>
    </a>
  )}
  {config.cta.show && (...)}
</div>
```

**Mobile** - Thêm cart icon cạnh search icon:
```tsx
<div className="flex items-center gap-2">
  {config.search.show && (...)}
  {config.cart.show && (
    <a href={defaultLinks.cart} className="p-2 text-slate-600 dark:text-slate-400 relative">
      <ShoppingCart size={20} />
      <span className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold text-white rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor }}>0</span>
    </a>
  )}
  {renderMobileMenuButton(false)}
</div>
```

### 2. File: `components/site/Header.tsx`

**Desktop** - Thêm CartIcon vào nhóm search + CTA:
```tsx
<div className="flex items-center gap-3">
  {config.search?.show && (...)}
  {config.cart?.show && (
    <Link href={DEFAULT_LINKS.cart} className="hidden lg:block p-2 text-slate-600 dark:text-slate-400 relative">
      <ShoppingCart size={20} />
      <span className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold text-white rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor }}>0</span>
    </Link>
  )}
  {config.cta?.show && (...)}
  ...
</div>
```

**Mobile** - Thêm cart icon cạnh search icon:
```tsx
<div className="flex items-center gap-1 lg:hidden">
  {config.search?.show && (...)}
  {config.cart?.show && (
    <Link href={DEFAULT_LINKS.cart} className="p-2 text-slate-600 dark:text-slate-400 relative">
      <ShoppingCart size={20} />
      <span className="absolute -top-1 -right-1 w-5 h-5 text-[10px] font-bold text-white rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor }}>0</span>
    </Link>
  )}
  {renderMobileMenuButton(false)}
</div>
```

### Kết quả
- Toggle Cart trong config sẽ hiển thị icon giỏ hàng trong Classic style
- Desktop: icon với badge "0" nằm cạnh search/CTA
- Mobile: icon với badge "0" nằm cạnh hamburger menu