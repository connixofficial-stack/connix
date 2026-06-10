# Spec: Backport 42 commits từ system-nhan về core

## Tổng quan
- **Source**: `E:\NextJS\persional_project\system-nhan` (42 commits từ `8fa74b4..e3f7e6b`)
- **Target**: `E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs` (core)
- **Chiến lược**: Cherry-pick theo nhóm logic, test sau mỗi nhóm
- **Rủi ro cao**: Color-system refactor (104 files, BREAKING CHANGE)

## Phân nhóm commits (bottom-up dependency order)

### Nhóm 1: Foundation - Guidelines & Docs (3 commits)
**Mục đích**: Cập nhật AGENTS.md, CLAUDE.md với audit-first rules, UI/UX guardrails, clean-by-construction policy

```
86d4fed chore(guidelines): add audit-first rules
9078f77 docs: add practical UI UX guardrails  
eeaed6c docs: add UI text economy guardrail
854f9e2 refactor: streamline agent rules
e98405d chore: add clean-by-construction policy
```

**Files**: `AGENTS.md`, `CLAUDE.md`, `.factory/docs/*.md`

**Action**:
1. Setup remote: `git remote add system-nhan E:\NextJS\persional_project\system-nhan`
2. Fetch: `git fetch system-nhan`
3. Cherry-pick: `git cherry-pick 86d4fed 9078f77 eeaed6c 854f9e2 e98405d`
4. Resolve conflicts nếu có (AGENTS.md/CLAUDE.md có thể khác nhau)
5. Test: Đọc lại AGENTS.md/CLAUDE.md xem có hợp lý không
6. Commit: `git commit -m "docs: backport guidelines from system-nhan"`

---

### Nhóm 2: Categories & Products Foundation (6 commits)
**Mục đích**: Fix categories slug, products category combobox, price semantics

```
060333f fix(categories): auto regenerate slug from title on edit
5b5bbc9 fix(categories): localize duplicate slug error
f66e6d7 feat(products): use category combobox on create/edit
c978d6a fix(products): repair category combobox toggle
dd8bcbb fix(stock): hide out-of-stock UI when inventory disabled
5bd6670 fix(products): align price semantics and saved state
```

**Files**: 
- `app/admin/categories/**`
- `app/admin/products/**`
- `convex/categories.ts`, `convex/products.ts`

**Action**:
1. Cherry-pick: `git cherry-pick 060333f 5b5bbc9 f66e6d7 c978d6a dd8bcbb 5bd6670`
2. Resolve conflicts (có thể có ở products/categories logic)
3. Test: 
   - Tạo/edit category → slug auto-generate
   - Tạo/edit product → category combobox hoạt động
   - Kiểm tra price display
4. Run: `bunx tsc --noEmit`
5. Commit: `git commit -m "feat(products,categories): backport UX improvements from system-nhan"`

---

### Nhóm 3: Product Detail & Experiences (5 commits)
**Mục đích**: Product detail share, experiences public lists, topbar contact

```
e5e3101 fix(product-detail): enable share toggle and copy
d331b37 feat(experiences): an danh muc rong tren public lists
dcb485a fix(admin): localize slug errors and category links
67aede0 fix(experiences): always use contact settings in header topbar
2c50117 fix(experiences): add toggles for topbar contact info
```

**Files**:
- `app/admin/product-detail/**`
- `app/admin/experiences/**`
- `components/site/**`

**Action**:
1. Cherry-pick: `git cherry-pick e5e3101 d331b37 dcb485a 67aede0 2c50117`
2. Resolve conflicts (experiences có thể khác)
3. Test:
   - Product detail → share button hoạt động
   - Experiences → ẩn danh mục rỗng
   - Header topbar → contact info hiển thị đúng
4. Run: `bunx tsc --noEmit`
5. Commit: `git commit -m "feat(experiences,product-detail): backport UX improvements"`

---

### Nhóm 4: Admin UX Improvements (8 commits)
**Mục đích**: Excel import/export, bulk actions, copy actions, inbox hooks

```
07e2560 fix(admin): improve excel actions and product import
48da432 fix(admin): clarify bulk selection scope
7605e27 fix(admin): add export selected for products
43ef874 fix(admin): add copy action for product name
433812b fix(admin): clarify sales sidebar label and move product SEO
e72cc6f fix(site): normalize customer auth provider boundary
1b6ff8d feat(contact): add contact inbox storage
268da26 fix(admin): stabilize contact inbox hooks
963c6ad fix(admin): finalize contact inbox hook order
92a8fa0 fix(admin): stabilize dashboard inbox hooks
```

**Files**:
- `app/admin/products/**`
- `app/admin/contact-inbox/**`
- `app/admin/dashboard/**`
- `convex/contactInbox.ts`

**Action**:
1. Cherry-pick: `git cherry-pick 07e2560 48da432 7605e27 43ef874 433812b e72cc6f 1b6ff8d 268da26 963c6ad 92a8fa0`
2. Resolve conflicts (admin pages có thể khác)
3. Test:
   - Products list → export selected
   - Products → copy product name
   - Contact inbox → hooks stable
4. Run: `bunx tsc --noEmit`
5. Commit: `git commit -m "feat(admin): backport UX improvements and inbox storage"`

---

### Nhóm 5: Contact Component Refactor (10 commits)
**Mục đích**: Contact layouts refresh, form/map parity, dynamic rows

```
9fb49c6 feat(contact): refresh layouts, shared form, map parity
2a8a853 fix(contact): full-width map and form layout
fa7b5b0 fix(contact): stretch grid map and full-width minimal
b54cb4f fix(contact): normalize form map toggles
9854d1f fix(contact): avoid nested preview form
6d42485 fix(contact): wire layout selection on edit
2ef6245 refactor(contact): streamline edit UX
147e734 refactor(contact): keep edit sections expanded
dd55d1c refactor(contact): clarify label vs data fields
50a267a refactor(contact): add dynamic rows
a895daa feat(contact): improve admin field editors
```

**Files**:
- `app/admin/home-components/contact/**`
- `components/site/ContactSection.tsx`

**Action**:
1. Cherry-pick: `git cherry-pick 9fb49c6 2a8a853 fa7b5b0 b54cb4f 9854d1f 6d42485 2ef6245 147e734 dd55d1c 50a267a a895daa`
2. Resolve conflicts (contact component có thể khác nhiều)
3. Test:
   - Contact edit page → layouts hiển thị đúng
   - Preview → form/map parity
   - Dynamic rows hoạt động
4. Run: `bunx tsc --noEmit`
5. Commit: `git commit -m "refactor(contact): backport layouts refresh and UX improvements"`

---

### Nhóm 6: Color System Refactor - BREAKING (2 commits)
**Mục đích**: Xóa harmony property, auto-generate secondary color từ 30° hue shift

```
bac0d9b fix: align site sections with harmony removals
cea0b9f refactor(color-system): replace harmony-based color logic with automatic secondary generation
```

**Files**: 104 files (tất cả home-components)
- `app/admin/home-components/*/[id]/edit/page.tsx`
- `app/admin/home-components/*/_lib/colors.ts`
- `app/admin/home-components/*/_types/index.ts`
- `components/site/*.tsx`

**BREAKING CHANGE**: Xóa `harmony` property khỏi tất cả component configs

**Action**:
1. **Backup trước**: `git branch backup-before-color-refactor`
2. Cherry-pick: `git cherry-pick bac0d9b cea0b9f`
3. **Expect conflicts cao** (104 files):
   - Conflict strategy: Accept theirs cho logic mới, manual merge cho custom code
   - Kiểm tra từng file có custom logic không
4. Test kỹ:
   - Mở từng home-component edit page
   - Kiểm tra color preview
   - Verify secondary color auto-generate đúng
5. Run: `bunx tsc --noEmit`
6. **Nếu có lỗi nghiêm trọng**: `git reset --hard backup-before-color-refactor`
7. Commit: `git commit -m "refactor(color-system): backport harmony removal and auto secondary generation (BREAKING)"`

---

### Nhóm 7: Final Fixes (2 commits)
**Mục đích**: Oxlint warnings, skill SEO

```
7d2304d feat(skill): add viet seo product description
e3f7e6b fix: resolve oxlint warnings
```

**Files**:
- `.factory/skills/**`
- Various files với oxlint warnings

**Action**:
1. Cherry-pick: `git cherry-pick 7d2304d e3f7e6b`
2. Resolve conflicts (skill có thể không tồn tại)
3. Test: Run oxlint nếu có
4. Run: `bunx tsc --noEmit`
5. Commit: `git commit -m "chore: backport skill and oxlint fixes"`

---

## Execution Plan (Step-by-step)

### Setup Phase
```bash
cd "E:\NextJS\study\admin-ui-aistudio\system-vietadmin-nextjs"
git status  # Ensure clean working tree
git remote add system-nhan "E:\NextJS\persional_project\system-nhan"
git fetch system-nhan
git branch backup-before-backport  # Safety backup
```

### Execution Phase (7 nhóm)
Thực hiện tuần tự từ Nhóm 1 → Nhóm 7, mỗi nhóm:
1. Cherry-pick commits
2. Resolve conflicts (nếu có)
3. Test functionality
4. Run `bunx tsc --noEmit`
5. Commit với message rõ ràng
6. **Nếu fail**: `git cherry-pick --abort`, analyze, retry hoặc skip

### Rollback Strategy
- Mỗi nhóm là 1 commit độc lập → rollback dễ dàng
- Nếu Nhóm 6 (color-system) fail: `git reset --hard backup-before-color-refactor`
- Nếu toàn bộ fail: `git reset --hard backup-before-backport`

---

## Risk Assessment

### High Risk
- **Nhóm 6 (Color System)**: 104 files, BREAKING CHANGE, conflict rate ~80%
  - Mitigation: Backup branch, test kỹ từng component, có thể skip nếu quá phức tạp

### Medium Risk
- **Nhóm 5 (Contact)**: 11 commits, refactor lớn, conflict rate ~50%
  - Mitigation: Test từng layout, verify preview/site parity

### Low Risk
- Nhóm 1, 2, 3, 4, 7: Mostly isolated fixes, conflict rate ~20%

---

## Success Criteria
- [ ] Tất cả 42 commits được backport (hoặc documented skip reason)
- [ ] `bunx tsc --noEmit` pass
- [ ] Core functionality không bị break
- [ ] Git history clean (mỗi nhóm 1 commit)
- [ ] Có backup branch để rollback

---

## Estimated Time
- Setup: 5 phút
- Nhóm 1-4, 7: 30-45 phút (low conflict)
- Nhóm 5: 20-30 phút (medium conflict)
- Nhóm 6: 60-90 phút (high conflict, manual merge)
- **Total**: 2-3 giờ

---

## Notes
- Không push cho đến khi user confirm
- Mỗi nhóm commit riêng để dễ review và rollback
- Nếu conflict quá nhiều ở Nhóm 6, có thể skip và backport manual sau
- Luôn test sau mỗi nhóm trước khi tiếp tục