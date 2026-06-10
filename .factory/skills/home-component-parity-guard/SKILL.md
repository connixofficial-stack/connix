---
name: home-component-parity-guard
description: Chuẩn hóa home-component mới để tránh lệch preview/site, sai breakpoint, fallback sai thứ tự và vỡ contract config-renderer. Dùng khi tạo home-component mới, thêm layout mới cho home-component, hoặc khi user yêu cầu preview parity, responsive parity, 6 styles, ComponentRenderer wiring, breakpoint preview, hoặc source-of-truth parity.
---

# Home Component Parity Guard

Skill này là preflight guard cho **home-component mới** trong repo VietAdmin.

Mục tiêu:
- chặn lỗi parity giữa preview và site thật,
- chặn drift giữa 6 styles,
- chặn lỗi breakpoint/container query,
- chặn lỗi config/fallback/render mapping,
- chặn lỗi upload file tạo orphan storage,
- giảm vòng lặp “fix cả trăm lần mới đúng”.

Skill này **không thay thế** `create-home-component`.
- `create-home-component` lo scaffolding/wiring.
- `home-component-parity-guard` lo contract, checklist và anti-regression trước khi coi component là đúng.

## Khi nào dùng

Dùng skill này khi:
- tạo home-component mới,
- thêm layout/style mới cho home-component,
- làm preview cho home-component,
- map config từ admin sang site renderer,
- user nói các ý như:
  - “preview phải giống site thật”
  - “chuẩn hóa home-component”
  - “parity”
  - “6 styles”
  - “breakpoint preview”
  - “ComponentRenderer”
  - “layout bị lệch preview với site”

## Nguồn chuẩn cần tham chiếu

Trước khi đề xuất hoặc code, luôn map với:
1. `.factory/skills/create-home-component/SKILL.md`
2. `.factory/skills/experience-preview-extractor/SKILL.md`
3. `.factory/skills/system-extension-guideline/SKILL.md`
4. `.factory/skills/file-lifecycle-service/SKILL.md` nếu component có upload
5. Component reference gần nhất trong repo đang hoạt động tốt

Nếu repo đã có pattern nội bộ phù hợp thì **ưu tiên repo trước**, chỉ dùng `docs-seeker` khi domain mới hoặc thiếu pattern nội bộ.

## Output contract bắt buộc

Khi dùng skill này, câu trả lời phải có đúng khung:
1. Scope & impacted paths
2. Source of truth
3. Preview ↔ Site parity map
4. Ordered actions
5. Checklist pass/fail
6. Risks / warnings
7. Next-safe-step

## Workflow chuẩn

### Phase 1 — Scope & Source of Truth

1. Xác định component mới là gì.
2. Xác định reference component gần nhất trong repo.
3. Xác định source of truth:
   - site section thật,
   - preview shared/renderer,
   - create/edit pages,
   - constants/types/colors/config.

Không code ngay nếu chưa trả lời được:
- component này học từ component nào trong repo?
- preview phải giống site ở mức nào?
- có 6 styles chưa?
- site renderer dùng shared section hay tách riêng?

### Phase 2 — File Map bắt buộc

Phải map đủ các file sau nếu có:
- `app/admin/home-components/create/[component]/page.tsx`
- `app/admin/home-components/[component]/_components/*Preview*.tsx`
- `app/admin/home-components/[component]/_components/*SectionShared*.tsx`
- `app/admin/home-components/[component]/_lib/constants.ts`
- `app/admin/home-components/[component]/_lib/colors.ts`
- `app/admin/home-components/[component]/_types/index.ts`
- `app/admin/home-components/[id]/edit/page.tsx`
- `components/site/ComponentRenderer.tsx`
- `components/site/*Section*.tsx` hoặc site component tương ứng

Nếu thiếu một mắt xích, phải nêu rõ gap.

### Phase 3 — Preview ↔ Site Parity Map

Phải lập parity map tối thiểu:

| Surface | File | Contract cần giữ |
|---|---|---|
| Create | create page | form state + default config |
| Edit | edit page | load/save/buildConfig |
| Preview | Preview component | device toggle + style switch + mock/data binding |
| Shared UI | SectionShared | layout/render contract |
| Site | site section + ComponentRenderer | runtime parity |

Phải trả lời:
- preview có share cùng `SectionShared` với site không?
- nếu có override cho preview, override khóa bằng `context === 'preview'` chưa?
- style labels có map 1-1 với runtime styles không?

### Phase 4 — Guard Checklist bắt buộc

Đi qua checklist trong `CHECKLIST.md`.

Các mục **critical** nếu fail thì chưa được coi là done:
- source-of-truth parity
- đủ 6 styles
- preview/site mapping 1-1
- fallback style nằm cuối
- buttons trong preview có `type="button"`
- responsive contract theo device
- breakpoint/container query có evidence
- empty state + image fallback + long-text handling
- edit page load/save đúng config
- ComponentRenderer wiring đúng

### Phase 5 — Breakpoint & Container Query Guard

Nếu component có:
- `@container`
- `@[...]`
- carousel/grid phức tạp
- preview desktop/mobile shell riêng

thì phải audit rõ:
1. Breakpoint đo theo viewport hay container?
2. Node nào là container thật sự?
3. Preview shell có làm width budgeting khác site không?
4. Nếu override preview, override ở wrapper hay ở grid rule?

**Cấm** fix width mù nhiều vòng mà không chỉ ra điểm đo breakpoint.

### Phase 6 — Config / Renderer Contract Guard

Phải kiểm tra:
- `style` lưu trong config có đúng union type không
- `buildConfig` ở edit/create có lưu đủ fields không
- runtime `ComponentRenderer` có đọc đúng type không
- nội dung style-specific có bị hardcode sai chỗ không
- màu / secondary / mode / override state có được preserve không

### Phase 6.5 — File Lifecycle Guard (FAIL CRITICAL)

> [!CAUTION]
> **FAIL CRITICAL**: Bất kỳ hành động upload media mới nào mà form component chỉ trả về URL hoặc serializer bỏ qua/strip mất `storageId` đều bị coi là vi phạm nghiêm trọng và sẽ fail validation ngay lập tức.

Nếu config có field file/media (`image`, `imageUrl`, `avatar`, `icon`, `logo`, `gallery`, `video`, `storageId`):
- **Upload mới bắt buộc phải persist `storageId`**: Không được phép tạo upload mới chỉ lưu URL; uploader, callback và config lưu trữ bắt buộc phải đồng bộ giữ `storageId`.
- Upload mới phải được register draft qua shared uploader hoặc `useFileDraftUploads`.
- Config lưu `storageId` khi uploader có trả về; nếu legacy chỉ có URL thì backend `homeComponents` phải resolve được làm fallback.
- Create/edit save phải gọi `homeComponents.create/update/updateConfig` để sync `fileReferences`.
- Xóa/đổi ảnh trong form không được bypass FLS bằng xóa storage trực tiếp sau khi record đã lưu.
- Delete/bulk delete list page phải dùng `api.homeComponents.remove`.
- Checklist pass/fail phải ghi rõ lifecycle: upload chưa save, save, replace, remove, delete record, bulk delete.

### Phase 7 — Final Report

Trước khi hoàn tất, luôn trả:
- scope đã đụng
- những contract pass
- contract nào fail hoặc còn risk
- bước verify trực quan cần làm

## Anti-regression rules rút từ commit history

### 1. Không tự sáng tác mapping style
- Preview labels và runtime style keys phải map 1-1.
- Không “layout1 nhìn giống layout3 nên dùng tạm”.

### 2. Không fix parity bằng wrapper hack trước khi hiểu source-of-truth
- Nếu site và preview dùng chung shared section, ưu tiên sửa contract ở đúng tầng.
- Chỉ override preview khi có evidence rõ preview là môi trường đặc thù.

### 3. Với layout dùng container query, phải audit điểm đo thật
- `min-width` ở child node không chắc sửa được breakpoint.
- Parent shell width và node gắn `@container` mới là trọng tâm.

### 4. Preview mobile là responsive web preview, không tự ý giả lập phone hardware
- Không thêm notch/ring/fake phone frame nếu repo không dùng pattern đó.
- Ưu tiên `PreviewWrapper + BrowserFrame` như baseline.

### 5. Fallback style luôn ở cuối
- Mọi `if (style === '...')` phải đứng trước default return.

### 6. Buttons trong preview luôn có `type="button"`
- Tránh submit form ngoài ý muốn trong create/edit page.

### 7. Không hoàn tất nếu chưa so map đủ create/edit/preview/site
- Home-component lỗi thường do thiếu một bề mặt, không chỉ do preview.

## Khi nào cần gọi skill khác

### Gọi `create-home-component`
- Khi chưa scaffold xong create/edit/renderer.

### Gọi `experience-preview-extractor`
- Khi preview cần học rất sát từ UI thật/site thật.

### Gọi `docs-seeker`
- Khi component domain mới, repo không có reference đủ mạnh.

### Gọi `system-extension-guideline`
- Khi thay đổi lan sang nhiều domain ngoài home-component.

## Không dùng skill này khi

- chỉ sửa text nhỏ hoặc màu nhỏ ở component đã ổn định,
- chỉ debug một lỗi đơn lẻ không liên quan contract tổng thể,
- chỉ làm docs mà không chỉnh implementation workflow.

## Deliverables tối thiểu khi skill được dùng

- audit parity ngắn gọn,
- checklist pass/fail,
- file map impacted,
- acceptance criteria quan sát được,
- risk/rollback ngắn gọn.

## Files tham chiếu thêm

- [CHECKLIST.md](./CHECKLIST.md)
- [PATTERNS.md](./PATTERNS.md)
- [COMMIT_SIGNALS.md](./COMMIT_SIGNALS.md)
