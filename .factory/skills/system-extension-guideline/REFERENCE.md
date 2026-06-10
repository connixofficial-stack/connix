# Reference Map

## Path Map (chuẩn hoá)

**Module**
- Convex: `convex/{module}.ts`, `convex/model/{module}.ts`, `convex/schema.ts`, `convex/seed.ts`
- Admin: `app/admin/{module}/page.tsx`, `app/admin/{module}/create/page.tsx`, `app/admin/{module}/[id]/edit/page.tsx`
- System: `app/system/modules/{module}/page.tsx`

**Experience**
- System: `app/system/experiences/{experience}/page.tsx`
- Preview helpers: `components/experiences/*` + `lib/experiences/*`

**Home Component**
- Create: `app/admin/home-components/create/{component}/page.tsx`
- Edit: `app/admin/home-components/[id]/edit/page.tsx`
- Preview: `app/admin/home-components/previews.tsx`
- Renderer: `components/site/ComponentRenderer.tsx`

**Seed/Wizard**
- Seed: `convex/seed.ts`
- Wizard registry: theo file hiện có ở `/system/data` (đảm bảo dependencies rõ ràng)

## Naming & Keys

- `moduleKey`: camelCase (vd: `posts`, `productCategories`).
- Setting keys: camelCase, phải khớp DB.
- Feature keys: `enableXxx` để auto-link field.
- Component type: PascalCase; route: kebab-case.

## Convex conventions

- Index: equality trước, range/sort sau.
- Query list: dùng `paginate`/`take` + limit.
- Không `collect()` nếu không cần; tránh N+1.
- Clear data phải cleanup storage.

## Contract Map (cross-layer)

### System ↔ Admin
- Settings keys bắt buộc: `{module}PerPage`, `defaultStatus`.
- Feature/field toggles bắt buộc phản ánh vào UI (list columns, filters, create/edit fields).

### Experience ↔ Module
- Experience **chỉ đọc** module state/setting (1-way dependency).
- Module disabled phải hiển thị trạng thái phụ thuộc trong experience.

### Home Preview ↔ Renderer
- Preview phải map 1-1 với renderer theo style.
- Fallback style chỉ đặt **sau cùng** để không che các style khác.

### Seed/Wizard
- Wizard dependency graph rõ ràng, không circular.
- Reset policy: clear → seed theo thứ tự phụ thuộc.

## Failure-to-Fix Lookup

| Lỗi thường gặp | File ưu tiên kiểm tra | Gợi ý sửa nhanh |
| --- | --- | --- |
| List không theo `{module}PerPage` | `app/admin/{module}/page.tsx` | Lấy setting và clamp limit |
| Feature toggle không ẩn UI | `app/admin/{module}/page.tsx` | Map toggle → cột/filter/field |
| Preview lệch renderer | `app/admin/home-components/previews.tsx` + `components/site/ComponentRenderer.tsx` | Đồng bộ props + style map |
| Experience sửa module state | `app/system/experiences/{experience}/page.tsx` | Chỉ đọc module status/config |
| Seed nhân bản | `convex/seed.ts` | Check tồn tại trước insert |
| Clear thiếu storage cleanup | `convex/seed.ts` | Xóa storage trước khi delete record |

## Naming/Key Compatibility

- `moduleKey` và setting keys phải khớp tuyệt đối (case-sensitive).
- Feature keys dùng prefix `enableXxx` để map tự động.
- Component type: PascalCase; route: kebab-case.

## System ↔ Admin sync

- `listModuleSettings` để lấy `{module}PerPage`, `defaultStatus`.
- Feature/Field toggle ảnh hưởng UI ngay trong Admin pages.

## Experience dependency

- Experience chỉ đọc module status/config.
- Không để module phụ thuộc vào experience.
