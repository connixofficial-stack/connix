## Vấn đề

Style "Classic" hiện tại **không render Topbar** - toggle `topbar.show` không có tác dụng gì.

---

## Giải pháp

### 1. Cập nhật HeaderMenuPreview.tsx (`renderClassicStyle`)

Thêm Topbar render vào đầu Classic style khi `config.topbar.show = true`:

```tsx
const renderClassicStyle = () => (
  <div className={cn('dark:bg-slate-900', classicSeparatorClass, classicPositionClass)} style={classicBackgroundStyle}>
    {/* THÊM: Topbar cho Classic */}
    {config.topbar.show && (
      <div className="px-4 py-2 text-xs" style={{ backgroundColor: brandColor }}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            {displayTopbar.hotline && <span className="flex items-center gap-1"><Phone size={12} />{displayTopbar.hotline}</span>}
            {device !== 'mobile' && displayTopbar.email && <span className="flex items-center gap-1"><Mail size={12} />{displayTopbar.email}</span>}
          </div>
          <div className="flex items-center gap-3">
            {device !== 'mobile' && displayTopbar.showTrackOrder && <a href={defaultLinks.trackOrder} className="hover:underline">Theo dõi đơn</a>}
            {device !== 'mobile' && displayTopbar.showStoreSystem && <a href={defaultLinks.storeSystem} className="hover:underline">Cửa hàng</a>}
            {config.login.show && <a href={defaultLinks.login} className="hover:underline flex items-center gap-1"><User size={12} />{config.login.text}</a>}
          </div>
        </div>
      </div>
    )}
    {config.showBrandAccent && <div className="h-0.5" style={{ backgroundColor: brandColor }} />}
    {/* ... phần còn lại giữ nguyên */}
  </div>
);
```

### 2. Cập nhật Header.tsx (Frontend Classic style)

Thêm Topbar render tương tự vào phần `if (headerStyle === 'classic')`.

---

## Kết quả

- Toggle "Topbar" ON → Classic header có thanh topbar (hotline, email, links) giống style Topbar
- Toggle "Topbar" OFF → Classic header chỉ có brand accent + menu (như hiện tại)
- Preview và Frontend đồng bộ