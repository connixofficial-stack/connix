## Vấn đề

Classic style hiện có layout: **Logo - Nav - CTA**. Toggle `search.show` không có tác dụng gì.

---

## Giải pháp

Thêm Search bar vào khu vực actions (bên phải), layout mới: **Logo - Nav - [Search] - CTA**

### 1. HeaderMenuPreview.tsx (renderClassicStyle)

Thêm search input giữa nav và CTA:

```tsx
{/* Desktop: Search + CTA */}
{device !== 'mobile' && (
  <div className="flex items-center gap-3">
    {config.search.show && (
      <div className="relative">
        <input
          type="text"
          placeholder={config.search.placeholder}
          className="w-48 pl-4 pr-10 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-sm"
        />
        <button className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white" style={{ backgroundColor: brandColor }}>
          <Search size={14} />
        </button>
      </div>
    )}
    {config.cta.show && <a href={defaultLinks.cta} ...>CTA</a>}
  </div>
)}

{/* Mobile: Search icon + Menu button */}
{device === 'mobile' && (
  <div className="flex items-center gap-2">
    {config.search.show && <button className="p-2"><Search size={20} /></button>}
    {renderMobileMenuButton(false)}
  </div>
)}
```

### 2. Header.tsx (Frontend Classic)

Tương tự, thêm search vào khu vực actions desktop và mobile.

---

## Kết quả

- Toggle "Search" ON → Classic có search bar (desktop) hoặc search icon (mobile)
- Toggle "Search" OFF → Classic chỉ có nav + CTA (như hiện tại)
- Preview và Frontend đồng bộ