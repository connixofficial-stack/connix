# Spec v2: Audit cơ chế Snapshot / Demo Route / Export ZIP — Home Components

> **Cập nhật sau thảo luận** — Quyết định từ user:
> 1. ✅ Static types → không chụp demoBundle, render từ config.
> 2. ✅ Không migration snapshots cũ (không tồn tại).
> 3. ✅ Tận dụng cơ chế **nguồn dữ liệu demo** (`selectionMode='demo'`) thay vì query hàng trăm records thật.

---

# I. Primer

## 1. TL;DR kiểu Feynman

- Hệ thống có 32 loại component. Trong đó chỉ ~6 loại cần data từ DB: **Blog** (bài viết), **ProductList/ProductGrid** (sản phẩm), **ServiceList** (dịch vụ), **ProductCategories/CategoryProducts/HomepageCategoryHero** (danh mục). Còn lại ~26 loại là "tĩnh" — data nằm hết trong `config`.
- Các component data-dependent đã có sẵn cơ chế **3 nguồn dữ liệu**: `auto` (lấy tự động từ DB) → `manual` (chọn tay) → `demo` (admin tự nhập demoProducts/demoPosts). Hiện tại **Blog** và **ProductList** đã có mode `demo`, nhưng **ServiceList** và **ProductGrid** chưa có.
- **Ý tưởng mới**: Khi snapshot cần demo route, thay vì query cả bảng products/posts/services rồi nhét vào demoBundle nặng, chỉ cần **chuyển selectionMode → 'demo'** và **chụp đúng số items đang hiển thị** thành `demoProducts`/`demoPosts`/`demoServices` nhẹ trong `config`. Demo route render bình thường mà không cần query DB gì cả.
- Nhưng hiện tại **toàn bộ demo route đang hỏng** vì bug key mismatch (chi tiết bên dưới).

## 2. Elaboration & Self-Explanation

### Cơ chế hiện tại (đang lỗi):

```
captureSnapshot → buildDemoBundle (query 200 products, 200 posts, 200 services...)
  → componentData[component._id] = { resolved items }     ← KEY = Convex ID "j5703..."
  
getSnapshotDemo → component._id = componentKey             ← KEY = slug "homeComponent:Blog:tin-tuc:3"
  
Demo route → getComponentData("homeComponent:Blog:tin-tuc:3") → undefined ❌
```

### Cơ chế đề xuất (nhẹ, đúng):

```
captureSnapshot → KHÔNG query cả bảng
  → Với component có data-dependent:
      Nếu selectionMode='auto' → lấy đúng N items đang hiện → chuyển config thành selectionMode='demo' + demoProducts/demoPosts
      Nếu selectionMode='manual' → resolve selected IDs → chuyển config thành selectionMode='demo' + demoProducts/demoPosts
      Nếu selectionMode='demo' → giữ nguyên config (data đã có sẵn)
  → Còn lại (static types): giữ nguyên config
  
Demo route → render từ config bình thường, mọi component đều tự chứa data → KHÔNG cần demoBundle / componentData lookup
```

**Kết quả**: Bỏ hoàn toàn `demoBundle.componentData`, bỏ `SnapshotDemoProvider.getComponentData()`, bỏ `snapshotComponentKey`. Snapshot nhẹ hơn 10-50x.

## 3. Concrete Examples & Analogies

**Ví dụ cụ thể:**

Component "ProductList" đang hiển thị 4 sản phẩm (selectionMode='auto', itemCount=4):
- **Cách cũ** (nặng): Query 200 sản phẩm active, lấy 4 đầu tiên, lưu vào `demoBundle.componentData["j5703..."]`.
- **Cách mới** (nhẹ): Resolve 4 sản phẩm đang hiện → ghi thẳng vào `config.demoProducts = [4 items]`, `config.selectionMode = 'demo'`. Khi demo route render, ProductListSection thấy `selectionMode='demo'` → dùng `demoProducts` → không query DB.

**Analogy**: Thay vì photocopy cả thư viện để mang đi trình chiếu, chỉ cần chụp ảnh đúng 4 cuốn sách đang bày trên kệ.

### Lưu ý quan trọng: Ảnh từ Convex Storage trong demo data

Demo items (demoProducts, demoPosts, demoServices) có thể chứa ảnh upload lên Convex storage (ví dụ `https://xyz.convex.cloud/api/storage/abc123`). Pipeline media hiện tại xử lý tốt:

```
collectUrls(config)          → quét đệ quy, bắt hết URLs trong config (bao gồm demoProducts[].image)
createHomepageSnapshotZip()  → fetch từng URL → nhét vào ZIP file
importHomepageSnapshot()     → re-upload media → replaceMediaUrls(config, map) thay URL cũ bằng URL mới
```

✅ **Kết luận**: Approach mới (embed demo data vào config) **tự động tương thích** với pipeline media. Không cần sửa gì thêm — chỉ cần đảm bảo khi resolve items từ DB, phải lấy đầy đủ image fields (`image`, `images[]`, `thumbnail`) để `collectUrls` bắt được.

⚠️ **Edge case**: Nếu ảnh Convex storage bị xóa trước khi export → fetch sẽ fail → chỉ ghi warning vào ZIP (hiện tại). Cần hiển thị warning cho user (P2).

### Demo route public cho khách xem

Route demo **chủ yếu để share cho khách hàng xem trước giao diện**, không phải admin-only.

**Hiện tại** (không phù hợp):
```
/admin/home-components/snapshots/[snapshotId]/demo
  ↑ nằm trong admin     ↑ Convex ID xấu
```

**Đề xuất**:
```
/demo/[slug]
  ↑ public, không cần login
  ↑ slug đẹp từ label: "Giao diện spa" → /demo/giao-dien-spa
```

**Cơ chế**:
- Schema `homeComponentSnapshots` thêm 2 field: `slug` (unique, auto-gen từ label) + `publicEnabled` (boolean, mặc định `false`)
- Admin toggle bật/tắt cho từng snapshot trong dialog "Kho profile"
- Route `/demo/[slug]` → check `publicEnabled` → nếu tắt → 404
- Giữ route admin cũ cho admin preview (hoặc redirect sang `/demo/[slug]`)

---

# II. Audit Summary (Tóm tắt kiểm tra)

| # | Vấn đề | Mức độ | File |
|---|--------|--------|------|
| 1 | **Key mismatch** `_id` vs `componentKey` → demo route 100% miss | 🔴 Blocking | `convex/homepageSnapshots.ts` |
| 2 | **demoBundle quá nặng**: query 200 products + 200 posts + 200 services mỗi lần mở dialog | 🟡 Major | `convex/homepageSnapshots.ts` L262-524 |
| 3 | **ServiceList thiếu `selectionMode='demo'`**: chỉ có `auto`/`manual` | 🟡 Major | `service-list/_types/index.ts` |
| 4 | **ProductGrid thiếu `selectionMode='demo'`** (dùng chung ProductListSection nhưng create page không có demo tab) | 🟡 Major | `create/product-list/_shared.tsx` |
| 5 | **Integrity check hardcode "demo-safe"** | 🟡 Medium | `convex/homepageSnapshots.ts` L511-517 |
| 6 | **applyHomepageSnapshot thiếu restore systemStyle** | 🟡 Medium | `convex/homepageSnapshots.ts` L848-884 |
| 7 | **LegacyComponentRenderer mất snapshotComponentKey** (sẽ bỏ nếu dùng approach mới) | ⚪ Tự giải khi bỏ componentData | `HomeComponentRenderer.tsx` |
| 8 | **Import replace_all không backup** | ⚪ Low | `convex/homepageSnapshots.ts` L800-806 |
| 9 | **Demo route nằm trong `/admin/`**: Không share được cho khách, URL xấu (Convex ID) | 🟡 Major | `app/admin/home-components/snapshots/` |

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## Root Cause chính — Confidence: High (95%)

1. **Key mismatch** khiến demo route hỏng 100%.
2. **Kiến trúc demoBundle nặng + outdated**: buildDemoBundle tự query/resolve data thay vì tận dụng cơ chế demo data sẵn có trong config. Mỗi lần thêm component type mới phải sync buildDemoBundle — nhưng không ai làm.
3. **ServiceList / ProductGrid chưa có mode 'demo'** → snapshot không thể chuyển sang demo data cho các loại này.

## Counter-Hypothesis (đã loại trừ)

- *"Static types cũng cần demoBundle?"*: Loại trừ — User xác nhận không cần. Config đã đủ data.
- *"Cần giữ demoBundle cho backward compat?"*: Loại trừ — Không có snapshots cũ.

---

# IV. Proposal (Đề xuất)

## Approach: **Chuyển snapshot sang config-embedded demo data** — Confidence 92%

### Chiến lược:

1. **captureHomepageSnapshot** — thay vì `buildDemoBundle` query cả bảng, chỉ cần:
   - Với mỗi component:
     - Nếu type là data-dependent (Blog, ProductList, ProductGrid, ServiceList) VÀ `selectionMode !== 'demo'`:
       - Resolve đúng N items đang hiển thị (auto → lấy N đầu, manual → resolve IDs)
       - Override `config.selectionMode = 'demo'` + inject `config.demoProducts/demoPosts/demoServices`
     - Nếu `selectionMode === 'demo'` → giữ nguyên
     - Nếu type là static → giữ nguyên config
   - Contact/Footer: inject settings vào config (đã có pattern này ở runtime)
   - ProductCategories/CategoryProducts/HomepageCategoryHero: resolve categories + products inline

2. **Bỏ demoBundle.componentData**: Không cần nữa. Demo route render từ config giống live site.

3. **Giữ demoBundle cho settings/menus**: `demoBundle.settings`, `demoBundle.menus` vẫn cần (Contact, Footer dùng).

4. **Fix key mismatch**: Nếu vẫn giữ `componentData` cho Contact/Footer → phải dùng key nhất quán. Hoặc embed settings trực tiếp vào config luôn.

5. **Thêm `selectionMode='demo'` cho ServiceList** (và ProductGrid nếu cần).

### Ưu điểm:
- Snapshot nhẹ hơn 10-50x (không query 200+200+200 records)
- Không cần maintain `buildDemoBundle` 250 dòng
- Thêm component type mới → không cần sửa snapshot code
- Demo route dùng cùng rendering path với live site → luôn đúng

### Tradeoff:
- Config trong snapshot sẽ bị mutate (selectionMode → demo). Cần giữ bản gốc nếu user muốn import/restore.
- ServiceList cần thêm mode 'demo' → ~50-80 dòng code.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Server / Convex
| File | Thay đổi |
|------|---------|
| [homepageSnapshots.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/convex/homepageSnapshots.ts) | **Sửa**: Refactor capture, fix key, fix apply systemStyle |
| convex/schema.ts | **Sửa**: Thêm `slug` + `publicEnabled` vào `homeComponentSnapshots` table |

### Route / Pages
| File | Thay đổi |
|------|---------|
| `app/demo/[slug]/page.tsx` | **Thêm**: Route public demo cho khách xem |
| `app/admin/.../snapshots/[snapshotId]/demo/page.tsx` | **Sửa**: Redirect sang `/demo/[slug]` hoặc giữ cho admin preview |

### Client / Admin Forms
| File | Thay đổi |
|------|----------|
| [service-list/_types/index.ts](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/service-list/_types/index.ts) | **Sửa**: Thêm `'demo'` vào `ServiceSelectionMode` |
| [ServiceListForm.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components/service-list/_components/ServiceListForm.tsx) | **Sửa**: Thêm tab "Demo" + form nhập demoServices (theo pattern Blog/ProductList) |
| service-list/[id]/edit/page.tsx | **Sửa**: Wire demoServices state |
| service-list create page | **Sửa**: Wire demoServices |

### Client / Runtime Rendering
| File | Thay đổi |
|------|----------|
| [ServiceListSection.tsx](file:///e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/components/site/ServiceListSection.tsx) | **Sửa**: Thêm logic `selectionMode === 'demo'` → dùng `config.demoServices` (theo pattern ProductListSection) |

### Có thể đơn giản hóa / xóa
| File | Thay đổi |
|------|----------|
| snapshot-demo-types.ts | Có thể giảm `SnapshotComponentResolvedData` union |
| SnapshotDemoProvider.tsx | Giữ cho settings/menus, bỏ `getComponentData` nếu không cần |

---

# VI. Execution Preview (Xem trước thực thi)

1. **Thêm mode 'demo' cho ServiceList**: type + form + runtime (theo pattern ProductList đã có)
2. **Refactor `captureHomepageSnapshot`**: Thay `buildDemoBundle` nặng → logic nhẹ resolve N items + override selectionMode
3. **Khi resolve items từ DB**: Lấy đầy đủ image fields (`image`, `images[]`, `thumbnail`) để pipeline media đóng gói ảnh Convex storage vào ZIP
4. **Fix key mismatch** (nếu vẫn giữ componentData cho Contact/Footer)
5. **Fix `applyHomepageSnapshot`** thiếu systemStyle restore
6. **Fix integrity check**
7. **Review tĩnh**: typing, null-safety, đảm bảo `collectUrls` bắt được hết URLs trong config mới

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

1. `bunx tsc --noEmit` pass
2. Manual test:
   - a) Mở dialog "Tạo nhanh" → không bị chậm (không query cả bảng nữa)
   - b) Save profile → mở Demo → tất cả components render đúng
   - c) Component có `selectionMode='auto'` → demo hiện đúng N items
   - d) Component có `selectionMode='demo'` → demo giữ nguyên data admin nhập
   - e) ServiceList có thể chọn mode "Demo" trong admin form
   - f) Export ZIP → import → homepage khôi phục đúng (selectionMode gốc được giữ)

---

# VIII. Todo

- [ ] **[P0]** Thêm `selectionMode='demo'` cho ServiceList (type + form + runtime)
- [ ] **[P0]** Refactor `captureHomepageSnapshot`: bỏ `buildDemoBundle` nặng → resolve inline + override selectionMode
- [ ] **[P0]** Fix key mismatch cho Contact/Footer
- [ ] **[P1]** Route public `/demo/[slug]` + toggle bật/tắt
- [ ] **[P1]** Schema: thêm `slug` + `publicEnabled` vào `homeComponentSnapshots`
- [ ] **[P1]** UI toggle trong dialog "Kho profile" để admin bật/tắt demo
- [ ] **[P1]** Fix `applyHomepageSnapshot` thiếu systemStyle restore
- [ ] **[P1]** Fix integrity check
- [ ] **[P2]** Bump snapshot version
- [ ] **[P2]** Kiểm tra ProductGrid create page có cần tab demo riêng không

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. ✅ Demo route `/demo/[slug]` render đúng tất cả components — data-dependent dùng demoProducts/demoPosts/demoServices từ config
2. ✅ Demo route chỉ accessible khi admin bật `publicEnabled`
3. ✅ Static types (Hero, Stats, Team...) render bình thường từ config, không cần demoBundle
4. ✅ ServiceList admin form có tab "Demo" để nhập demoServices
5. ✅ Export ZIP nhẹ hơn (không kèm 200+ records thật)
6. ✅ Import/Apply → homepage khôi phục đúng, selectionMode gốc được giữ
7. ✅ URL demo đẹp, share được cho khách: `/demo/giao-dien-spa`
8. ✅ TypeScript compile pass

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

| Rủi ro | Xác suất | Giảm thiểu |
|--------|----------|------------|
| Config bị mutate khi snapshot → import trả về selectionMode='demo' thay vì 'auto' gốc | Medium | Lưu `originalSelectionMode` trong config để restore khi import |
| ProductCategories/CategoryProducts/HomepageCategoryHero cần logic resolve phức tạp hơn | Medium | Giữ logic resolve nhẹ cho 3 types này, không fetch all |
| ServiceList form thêm mode demo có thể có edge case | Low | Bám pattern ProductList đã stable |

**Rollback**: Git revert, không ảnh hưởng data production.

---

# XI. Out of Scope (Ngoài phạm vi)

- Refactor ComponentRenderer.tsx 4910 dòng
- Chuyển `captureHomepageSnapshot` sang on-demand (sẽ tự nhẹ khi bỏ buildDemoBundle)
- Import mode `append`
- Tách registry pattern cho snapshot
