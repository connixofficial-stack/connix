## Root Cause Analysis (DARE)

### Problem Graph
```
1. [Main] Mobile search không hoạt động ở Classic/Topbar trên frontend thực
   └── 1.1 [ROOT CAUSE] Trong components/site/Header.tsx (frontend thật)
       - Classic (line ~563): mobile search button không có onClick handler
       - Topbar (line ~747): mobile search button không có onClick handler  
       - Không có search input expandable cho mobile ở cả 2 layout này
       - Allbirds (line 969-987) đã có đầy đủ: onClick + search input expandable
```

### Giải pháp

**1. Classic style (~line 563)** - Thêm onClick cho search button + search input expandable:
```tsx
// Từ
{showSearch && (
  <button className="p-2 text-slate-600 dark:text-slate-400">
    <Search size={20} />
  </button>
)}

// Thành
{showSearch && (
  <button 
    onClick={() => setSearchOpen((prev) => !prev)} 
    className="p-2 text-slate-600 dark:text-slate-400"
  >
    <Search size={20} />
  </button>
)}

// Thêm sau phần mobile icons, trước mobile menu:
{showSearch && searchOpen && (
  <div className="lg:hidden px-4 pb-4 border-b border-slate-100 dark:border-slate-800">
    <HeaderSearchAutocomplete ... />
  </div>
)}
```

**2. Topbar style (~line 747)** - Tương tự như trên

### Files cần sửa
- `components/site/Header.tsx` (2 chỗ: classic + topbar)