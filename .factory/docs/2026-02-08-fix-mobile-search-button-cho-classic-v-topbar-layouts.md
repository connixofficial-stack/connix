## Phân tích vấn đề

Ở file `HeaderMenuPreview.tsx`:
- **Allbirds layout (hoạt động đúng)**: Mobile search button có `onClick={() => setSearchOpen((prev) => !prev)}` và hiển thị search input khi `searchOpen = true`
- **Classic & Topbar layouts (bị lỗi)**: Mobile search button chỉ là `<button>` rỗng, không có onClick handler

## Kế hoạch sửa

### 1. Sửa renderClassicStyle() (line ~300)
```tsx
// Từ
{config.search.show && (<button className="p-2 text-slate-600 dark:text-slate-400"><Search size={20} /></button>)}

// Thành  
{config.search.show && (<button onClick={() => setSearchOpen((prev) => !prev)} className="p-2 text-slate-600 dark:text-slate-400"><Search size={20} /></button>)}
```

### 2. Thêm search input expandable cho Classic mobile (sau mobile menu button div)
```tsx
{device === 'mobile' && config.search.show && searchOpen && (
  <div className="px-6 pb-4 border-b border-slate-100 dark:border-slate-800">
    <input
      type="text"
      placeholder={config.search.placeholder ?? 'Tìm kiếm...'}
      className="w-full px-3 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
    />
  </div>
)}
```

### 3. Sửa renderTopbarStyle() (line ~370)
Tương tự - thêm onClick handler cho button và thêm search input expandable

### 4. Files cần sửa
- `components/experiences/previews/HeaderMenuPreview.tsx`
