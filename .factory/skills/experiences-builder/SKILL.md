---
name: experiences-builder
description: Tạo hoặc refactor Experience pages theo chuẩn VietAdmin dựa trên posts-list experience. Use khi user yêu cầu tạo experience mới, chỉnh layout experience, thêm settings/preview, hoặc chuẩn hóa UI/UX experience editor (posts-list, products-list, services-list, detail pages, menu, v.v.).
---

# Experiences Builder

Skill này giúp tạo/refactor Experience pages theo **vertical scroll pattern** (giống posts-list experience) với checklist chi tiết, chuẩn UI/UX và cấu trúc code thống nhất.

## Quick start

Khi user yêu cầu tạo experience mới hoặc chuẩn hóa experience:

1. Dựa trên mẫu: `app/system/experiences/posts-list/page.tsx`
2. Tạo layout dạng scroll dọc (no split panels, no z-index overlay)
3. Tách Settings cards + Preview card
4. Giữ DeviceToggle + LayoutTabs trong Preview card header

## Files tham chiếu

- `app/system/experiences/posts-list/page.tsx` (mẫu chuẩn)
- `components/experiences/editor/*` (BrowserFrame, DeviceToggle, LayoutTabs, ControlCard, ToggleRow, SelectRow)
- `components/experiences/*` (ExperienceModuleLink, ExperienceHintCard, previews)
- `lib/experiences/*` (useExperienceConfig, useExperienceSave, constants)

## Checklist tổng quát

### 1) Xác định scope
- [ ] Experience type: list/detail/menu/checkout/etc.
- [ ] Layout options (2-3 layouts max) + description rõ ràng
- [ ] Settings nào là shared vs layout-specific
- [ ] Có cần sync module settings không (module liên quan)

### 2) Cấu trúc layout (vertical scroll)
- [ ] Wrapper: `max-w-7xl mx-auto space-y-6 pb-20`
- [ ] Header block: title + back link + save button
- [ ] Settings cards theo từng nhóm
- [ ] Preview card cuối trang (LayoutTabs + DeviceToggle nằm trong CardHeader)
- [ ] Không dùng panel overlay / z-index stack

### 3) Settings grid rules
- [ ] `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` nếu < 4 cards
- [ ] `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4` nếu >= 4 cards
- [ ] Luôn giữ `gap-4`

### 4) Preview card
- [ ] CardHeader có title + `LayoutTabs` + `DeviceToggle`
- [ ] BrowserFrame hiển thị preview
- [ ] Info line: style label + device label

### 5) Save flow
- [ ] `useExperienceConfig` + `useExperienceSave`
- [ ] Disable save nếu `!hasChanges || isSaving`
- [ ] Nếu có legacy keys → bổ sung `additionalSettings`

### 6) Module liên quan
- [ ] `ExperienceModuleLink` hiển thị module status
- [ ] Link sang `/system/modules/{module}`

### 7) Hints & Example links
- [ ] `ExperienceHintCard` cho best practices
- [ ] `ExampleLinks` cho quick preview URLs

### 8) Validation & commit
- [ ] Khi thay đổi TS/TSX: chạy `bunx tsc --noEmit`
- [ ] Không chạy lint/oxlint mặc định nếu không được yêu cầu
- [ ] Commit theo message rõ ràng

## Template layout mẫu (rút gọn)

```tsx
return (
  <div className="max-w-7xl mx-auto space-y-6 pb-20">
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-blue-600" />
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <Link href="/system/experiences" className="text-sm text-blue-600 hover:underline">
          Quay lại danh sách
        </Link>
      </div>
      <Button size="sm" onClick={handleSave} disabled={!hasChanges || isSaving} className="bg-blue-600 hover:bg-blue-500 gap-1.5">
        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        <span>{hasChanges ? 'Lưu' : 'Đã lưu'}</span>
      </Button>
    </div>

    <Card>
      <CardHeader><CardTitle className="text-base">Thiết lập hiển thị</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ControlCard title="Hiển thị">...</ControlCard>
        <ControlCard title="Phân trang">...</ControlCard>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle className="text-base">Module & liên kết</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ControlCard title="Module liên quan">...</ControlCard>
        <ControlCard title="Link xem thử">...</ControlCard>
        <Card className="p-2"><ExperienceHintCard hints={HINTS} /></Card>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Eye size={18} /> Preview
          </CardTitle>
          <div className="flex items-center gap-3">
            <LayoutTabs layouts={LAYOUTS} activeLayout={config.layoutStyle} onChange={...} accentColor="#3b82f6" />
            <DeviceToggle value={previewDevice} onChange={setPreviewDevice} size="sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`mx-auto transition-all duration-300 ${deviceWidths[previewDevice]}`}>
          <BrowserFrame url="yoursite.com/...">
            <PreviewComponent {...props} />
          </BrowserFrame>
        </div>
        <div className="mt-3 text-xs text-slate-500">Style: ... • Device: ...</div>
      </CardContent>
    </Card>
  </div>
);
```

## Checklist chi tiết theo loại experience

### A) List experiences (posts-list/products-list/services-list)
- [ ] Layout options: Full Width / Sidebar / Magazine (tuỳ module)
- [ ] Filters: search, categories, sorting
- [ ] Pagination: pagination vs infinite scroll
- [ ] Cards: Module + Example links + Hints

### B) Detail experiences (posts-detail/product-detail/services-detail)
- [ ] Layout options: classic / modern / minimal (tuỳ nhu cầu)
- [ ] Toggles: author, share, tags, related, comments, ratings
- [ ] Cross-module sync nếu điều khiển comments/rating/wishlist

### C) Menu/Header experience
- [ ] Layout options: centered / split / transparent
- [ ] Modules: search, cart, wishlist, login
- [ ] Link preview: homepage, search page

## QA checklist (bắt buộc)

- [ ] Save button disabled khi không thay đổi
- [ ] Preview đổi layout đúng theo LayoutTabs
- [ ] DeviceToggle đổi kích thước preview đúng
- [ ] Các settings không bị rơi xuống 1 cột khi đủ không gian
- [ ] Không có overflow/z-index chồng chéo
- [ ] Module link đúng đường dẫn
- [ ] Example links render đủ

## Pitfalls cần tránh

- Không dùng `position: fixed` / z-index overlay cho settings panel
- Không nhồi quá nhiều controls vào 1 card
- Không quên `additionalSettings` nếu có legacy keys
- Không quên cập nhật `EXPERIENCE_KEY` đúng module

## Khi nào KHÔNG dùng skill này

- Khi chỉ chỉnh CSS nhỏ trong preview
- Khi chỉ sửa text/hints tĩnh, không liên quan layout experience

## Testing

Chạy:

```bash
bunx tsc --noEmit
```

Nếu có yêu cầu riêng về lint/oxlint, hãy làm theo yêu cầu đó.

## Conflict Resolution

Nếu có xung đột với `system-extension-guideline`, luôn ưu tiên master playbook.
