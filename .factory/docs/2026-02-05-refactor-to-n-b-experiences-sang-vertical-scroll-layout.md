## Refactor toàn bộ Experiences sang Vertical Scroll Layout

### Tổng quan
Áp dụng **experiences-builder skill** để refactor 12 experience pages từ layout `h-[calc(100vh-64px)] + ConfigPanel overlay` sang **vertical scroll pattern** như posts-list.

### Danh sách files cần refactor

| # | File | Type | Độ phức tạp |
|---|------|------|-------------|
| 1 | `products-list/page.tsx` | List | Cao (nhiều modules liên quan) |
| 2 | `services-list/page.tsx` | List | Trung bình |
| 3 | `posts-detail/page.tsx` | Detail | Cao (cross-module sync) |
| 4 | `product-detail/page.tsx` | Detail | Cao (nhiều settings + highlights) |
| 5 | `services-detail/page.tsx` | Detail | Trung bình |
| 6 | `menu/page.tsx` | Menu | Cao (nhiều layout options) |
| 7 | `cart/page.tsx` | Cart | Trung bình |
| 8 | `checkout/page.tsx` | Checkout | Trung bình |
| 9 | `wishlist/page.tsx` | Wishlist | Thấp |
| 10 | `contact/page.tsx` | Contact | Thấp |
| 11 | `comments-rating/page.tsx` | Comments | Thấp |
| 12 | `search/page.tsx` | Search | Thấp |

### Thay đổi chung cho mỗi file

**Từ (pattern cũ):**
```tsx
<div className="h-[calc(100vh-64px)] flex flex-col">
  <header className="h-12 px-4 ...">...</header>
  <main className="flex-1 overflow-auto p-4 ...">
    <BrowserFrame>...</BrowserFrame>
  </main>
  <ConfigPanel isExpanded={isPanelExpanded} onToggle={...} leftContent={...}>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      <ControlCard>...</ControlCard>
    </div>
  </ConfigPanel>
</div>
```

**Sang (pattern mới):**
```tsx
<div className="max-w-7xl mx-auto space-y-6 pb-20">
  <div className="flex items-center justify-between flex-wrap gap-4">
    <div>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-{color}" />
        <h1 className="text-2xl font-bold">Title</h1>
      </div>
      <Link href="/system/experiences">Quay lại danh sách</Link>
    </div>
    <Button onClick={handleSave} disabled={!hasChanges || isSaving}>...</Button>
  </div>

  <Card>
    <CardHeader><CardTitle>Thiết lập hiển thị</CardTitle></CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ControlCard>...</ControlCard>
    </CardContent>
  </Card>

  <Card>
    <CardHeader><CardTitle>Module & liên kết</CardTitle></CardHeader>
    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <ControlCard>...</ControlCard>
    </CardContent>
  </Card>

  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <CardTitle className="flex items-center gap-2"><Eye /> Preview</CardTitle>
        <div className="flex items-center gap-3">
          <LayoutTabs layouts={...} activeLayout={...} onChange={...} />
          <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <BrowserFrame url="..."><PreviewComponent {...props} /></BrowserFrame>
      <div className="mt-3 text-xs text-slate-500">Style: ... • Device: ...</div>
    </CardContent>
  </Card>
</div>
```

### Kế hoạch thực hiện

**Batch 1 - List pages (3 files):**
1. `products-list/page.tsx`
2. `services-list/page.tsx`
3. `search/page.tsx`

**Batch 2 - Detail pages (3 files):**
4. `posts-detail/page.tsx`
5. `product-detail/page.tsx`
6. `services-detail/page.tsx`

**Batch 3 - E-commerce pages (4 files):**
7. `cart/page.tsx`
8. `checkout/page.tsx`
9. `wishlist/page.tsx`
10. `menu/page.tsx`

**Batch 4 - Utility pages (2 files):**
11. `contact/page.tsx`
12. `comments-rating/page.tsx`

### Sau mỗi batch
- [ ] Run `bunx oxlint --type-aware --type-check --fix`
- [ ] Run `bun run lint`
- [ ] Commit với message rõ ràng

### Ước tính thời gian
- Mỗi file ~2-5 phút tùy độ phức tạp
- Tổng: ~30-45 phút cho 12 files

### Notes
- Giữ nguyên logic settings/config (chỉ đổi layout)
- Giữ nguyên preview components
- Xóa `isPanelExpanded` state và import `ConfigPanel`
- Thêm import `Link` từ `next/link`
- Thêm import `Eye` từ `lucide-react`
- Thêm import `CardContent, CardHeader, CardTitle`