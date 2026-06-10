
## Thay doi

File: `app/system/layout.tsx`

Trong component `UserMenu`, thay icon `Shield` bằng một nút link mở trang `/admin` ở tab mới.

### Chi tiet:

1. **Thay icon Shield** trong `UserMenu` button (dong 68) bang mot `Link` hoac `<a>` tag:
   - `href="/admin"` voi `target="_blank"`
   - Icon: dung `ExternalLink` hoac `LayoutDashboard` tu lucide-react (de the hien "mo trang admin")
   - Tooltip: "Mo trang Admin"

2. **Tach rieng** nut mo Admin ra khoi `UserMenu` dropdown - dat no la mot nut doc lap ben canh `UserMenu`, de click la mo ngay `/admin` o tab moi, khong can dropdown.

3. **Giu nguyen** `UserMenu` dropdown (logout, thong tin user) nhung doi icon avatar thanh mot icon khac hop ly hon (vi du: `User` icon).

### Code minh hoa:

```tsx
// Nut mo Admin (dat truoc UserMenu trong header)
<a
  href="/admin"
  target="_blank"
  rel="noopener noreferrer"
  className="p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
  title="Mo trang Admin"
>
  <ExternalLink size={18} />
</a>

// UserMenu avatar doi tu Shield sang User icon
<div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
  <User size={16} />
</div>
```
