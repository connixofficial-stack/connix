---
name: system-extension-guideline
description: Guideline tổng hợp mở rộng hệ thống VietAdmin (module/experience/home-component/seed/convex). Dùng khi thêm/sửa tại /system/modules, /system/experiences, /admin/home-components, /system/data hoặc seed wizard để tránh xung đột.
---

# System Extension Guideline (Master Playbook)

Skill này là **nguồn chuẩn duy nhất** để mở rộng hệ thống VietAdmin theo 4 mũi chính: Module, Experience, Home Component, Seed/Wizard + Convex. Mục tiêu: đồng bộ cross-layer, tránh xung đột và đảm bảo quality gate bắt buộc theo mức độ rủi ro.

## When to use

- Thêm module mới ở `/system/modules/*`.
- Thêm experience mới ở `/system/experiences/*`.
- Thêm home-component mới ở `/admin/home-components/*`.
- Thêm seed data và cấu hình wizard ở `/system/data`.
- Bất kỳ thay đổi Convex schema/queries/mutations/seed/cleanup liên quan hệ thống.

## Where to place guidance

- **Nguồn chuẩn duy nhất:** `.factory/skills/system-extension-guideline/*`.
- Các skill chuyên biệt khác vẫn dùng bình thường, nhưng nếu thay đổi cross-domain thì **phải** theo master playbook này.

## Execution Protocol (bắt buộc khi trả lời)

Khi skill này được gọi, **phải** trả về đúng khung:
1) Scope & impacted paths.
2) Ordered actions (step-by-step thực thi được).
3) Gate matrix (critical/non-critical) + trạng thái pass/fail.
4) Warnings (nếu có) kèm remediation note.
5) Next-safe-step (bước tiếp theo an toàn sau khi pass gate).

## Extension Workflow (7 bước)

1) Discover scope & dependencies.
2) Contract Mapping (map input/keys giữa System ↔ Admin ↔ Convex ↔ Frontend).
3) Data/Schema Validation (schema + index + validators + pagination).
4) UI Sync (admin/system/preview/renderer parity).
5) Seed/Cleanup (idempotent + storage cleanup).
6) Gate Check (critical/non-critical).
7) Final Report (output protocol ở trên).

Nếu scope có upload file/media, thêm FLS pass vào bước 2/5/6 bằng `.factory/skills/file-lifecycle-service/SKILL.md`.

## Risk Policy (Critical vs Non-Critical)

- **Critical fail ⇒ block completion.**
- **Non-critical fail ⇒ cho phép hoàn tất với warning bắt buộc + remediation note.**
- “Done” chỉ khi **tất cả critical pass** và warning list đã được khai báo.

## Conflict Resolution Order

1) `CLAUDE.md` / `AGENTS.md`
2) `system-extension-guideline` (master)
3) Skill chuyên biệt (module/experience/home)

## Master Contract (4 luồng bắt buộc)

### 1) Module (tạo mới ở `/system/modules/*`)

**Required inputs:** `moduleKey`, `displayName`, `category`, `fields`, `features`, `settings`, `seedScope`.

**Required files:**
- `convex/schema.ts` (table + indexes)
- `convex/{module}.ts` (queries/mutations + validators)
- `convex/seed.ts` (seed + clear)
- `app/system/modules/{module}/page.tsx`
- `app/admin/{module}/page.tsx`
- `app/admin/{module}/create/page.tsx`
- `app/admin/{module}/[id]/edit/page.tsx`

**Required invariants:**
- Feature/Field/Settings sync sang Admin UI.
- Pagination admin list lấy `{module}PerPage`.
- Default status lấy từ settings.
- Seed/clear idempotent + cleanup storage.

**Common failure modes:**
- Fetch ALL rồi filter JS.
- Filter/sort không có index.
- List page không đọc settings.
- Feature toggle không ẩn UI.

### 2) Experience (tạo mới ở `/system/experiences/*`)

**Required inputs:** `experienceKey`, `moduleDependency` (1-way), `layoutStyles`, `settingsSchema`.

**Required files:**
- `app/system/experiences/{experience}/page.tsx`
- Preview component trong `components/experiences/*` hoặc `lib/experiences/*`

**Required invariants:**
- Preview/real render parity.
- Dependency 1-way (Experience phụ thuộc Module, không ngược lại).
- Save flow có `hasChanges` + `useExperienceSave`.

**Common failure modes:**
- Split panels/z-index overlay gây conflict.
- Thiếu DeviceToggle/LayoutTabs.

### 3) Home Component (tạo mới ở `/admin/home-components/*`)

**Required inputs:** `componentType`, 6 styles, `configSchema`, preview parity.

**Required files:**
- `app/admin/home-components/create/{component}/page.tsx`
- `app/admin/home-components/previews.tsx`
- `app/admin/home-components/[id]/edit/page.tsx`
- `components/site/ComponentRenderer.tsx`

**Required invariants:**
- Đúng 6 styles, preview = renderer.
- Fallback style nằm cuối function.
- Không hardcode nội dung đặc thù; dùng config fields.
- Nếu có upload file/media: draft upload được cleanup, config preserve `storageId`, `homeComponents` sync `fileReferences`, delete/bulk delete không orphan storage.

**Common failure modes:**
- Preview button thiếu `type="button"`.
- Style fallback return trước các case khác.
- Upload trước save bị orphan, hoặc xóa/đổi file bypass FLS.

### 4) Seed/Wizard (ở `/system/data`)

**Required inputs:** module seed scope, dependencies, reset policy.

**Required files:**
- `convex/seed.ts` (seed + clear)
- Wizard registry (theo REFERENCE)
- UI wizard step (nếu thêm bước)

**Required invariants:**
- Seed idempotent (không nhân bản).
- Clear xóa data + storage + relations.
- Wizard dependency graph rõ ràng.

**Common failure modes:**
- Seed không kiểm tra tồn tại.
- Clear xóa DB nhưng bỏ storage.

## Convex Full Contract (Strict)

1) **Schema + Index**: Filter/sort phải có index; compound index: equality trước, range/sort sau.
2) **Queries/Mutations**: có validators, pagination chuẩn, limit mặc định 20, max 100–500.
3) **Bandwidth**: Không N+1, không collect toàn bộ; dùng take + pagination.
4) **Seed/Clear**: idempotent, cleanup storage, cascade delete.
5) **Wizard wiring**: registry có dependencies rõ, tránh circular.

## Strict Quality Gate

Xem file [CHECKLISTS.md](CHECKLISTS.md). Gate nào fail thì **không** được coi task hoàn tất.

## Templates & Reference

- Mẫu code ngắn: [TEMPLATES.md](TEMPLATES.md)
- Mapping path/convention: [REFERENCE.md](REFERENCE.md)

## Testing

- Khi thay đổi TS/TSX: chạy `bunx tsc --noEmit`.
- Không chạy lint/test khác nếu không được yêu cầu.

## Output format

Khi dùng skill này, luôn trả về:
1) Scope + impacted paths.
2) Ordered actions.
3) Gate results (critical/non-critical).
4) Warnings + remediation note.
5) Next-safe-step.
