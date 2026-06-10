# Footer Redesign Spec — 6 Layout thực sự khác biệt

---

# I. Primer

## 1. TL;DR kiểu Feynman

- **Vấn đề**: 6 footer layout hiện tại gần như giống nhau — chỉ khác alignment và số cột. Không tạo cảm giác "chọn layout".
- **Giải pháp**: Redesign 6 layout để mỗi cái có **kiến trúc bố cục khác biệt rõ ràng**, lấy cảm hứng từ 12 mẫu Sapo.
- **Nguyên tắc**: Phân 12 mẫu thành 6 nhóm kiến trúc → chọn 1 đại diện mỗi nhóm.
- **Config giữ nguyên**: Cùng `FooterConfig` cho cả 6 layout — form admin không đổi.
- **3 file sync**: `DynamicFooter.tsx`, `FooterPreview.tsx`, `ComponentRenderer.tsx`.

## 2. Elaboration & Self-Explanation

### Phân tích 12 mẫu → 6 nhóm kiến trúc

**Nhóm A — "Classic 4-Column Grid"** (Construction, Dino Book)
- Logo+mô tả trái | 2–3 cột link | social/contact phải
- Truyền thống, grid đều, dễ đọc

**Nhóm B — "Info-Rich Asymmetric"** (Sudes Craft, Bean Wine, Bean Cargo)
- Brand+contact+social trái (rộng) | 2 cột link giữa | Newsletter+Payment phải (rộng)
- 3 vùng chức năng rõ, asymmetric

**Nhóm C — "Split Horizontal Zones"** (Wolf Fix, Wolf Cookware)
- Zone 1: brand+payment+social (ngang) | Zone 2: grid cột link (ngang)
- 2 tầng ngang, zone trên = identity, zone dưới = navigation

**Nhóm D — "Dark Magazine"** (Wolf Home dark, Bean Đông Trùng)
- 4 cột full-width đều nhau trên nền tối, dense info

**Nhóm E — "Wave Decorative"** (Dola Moto, Moto red wave)
- Wave/curve decorative bg + brand trái + 2 cột link + newsletter+social phải

**Nhóm F — "Minimal Compact"** (Mr. Bean bar)
- 1–2 dòng: logo+copyright trái | policy links phải

### Mapping → 6 style names

| Style | Nhóm | Mẫu chính | Mẫu phụ |
|-------|------|-----------|---------|
| `classic` | A — Classic Grid | Construction | Dino Book |
| `modern` | B — Info-Rich | Sudes Craft | Bean Cargo |
| `corporate` | C — Split Zones | Wolf Cookware | Wolf Fix |
| `minimal` | F — Compact | Mr. Bean bar | — |
| `centered` | D — Dark Magazine | Wolf Home dark | Bean Đông Trùng |
| `stacked` | E — Wave Decorative | Dola Moto | Moto red |

## 3. Concrete Examples & Analogies

**Analogy**: 6 kiểu bàn ăn — bàn tròn (classic), bàn bar chữ L (modern), bàn hội nghị 2 tầng (corporate), bàn đứng (minimal), bàn tiệc dài tối (centered), bàn outdoor sóng biển (stacked).

---

# II. Audit Summary

- 6 layout hiện tại chỉ khác alignment/padding/số cột, cùng 1 cấu trúc grid
- `FooterConfig` đã đủ field cho mọi layout
- 3 file cần sync: DynamicFooter, FooterPreview, ComponentRenderer
- Form admin + types + colors + constants: **không cần sửa**

---

# III. Root Cause & Counter-Hypothesis

**Root Cause**: 6 layout viết theo "clone & tweak" — copy classic rồi điều chỉnh nhỏ.
**Counter**: "Chỉ cần sửa CSS?" → Bác bỏ: cần viết lại JSX structure.

---

# IV. Proposal — Thiết kế 6 layout

### 1. `classic` — 4-Column Grid
```
Desktop: Logo+Desc(3/12) | Col1(2/12) | Col2(2/12) | Col3(2/12) | Social(3/12)
Bottom:  © Copyright ──────────────────────────────── [BCT]
```
- Tablet: 2×2 | Mobile: stack dọc

### 2. `modern` — Info-Rich Asymmetric
```
Desktop: Brand+Contact+Social(4/12) | Links 2-col grid(5/12) | Newsletter+Payment(3/12)
Bottom:  © Copyright ─── PolicyLinks ─── [badges]
```
- Tablet: brand full → links 2col → CTA full | Mobile: stack

### 3. `corporate` — Split Horizontal Zones
```
Zone1:   Logo+Desc(4/12) | Payment(4/12) | Social(4/12)
─────────────────── border ───────────────────
Zone2:   Col1(3/12) | Col2(3/12) | Col3(3/12) | Col4(3/12)
Bottom:  © Copyright ──────────────────── [BCT]
```
- Tablet: zone1 stack, zone2 2×2 | Mobile: all stack

### 4. `minimal` — Compact Bar
```
Single row: © Brand | Cung cấp bởi X ──── [social icons]
```
- 1 dòng, không columns, không newsletter

### 5. `centered` — Dark Magazine 4-Column
```
Dark bg, 4 cột full-width đều:
Brand+Desc+Contact(3/12) | Col1(3/12) | Col2(3/12) | Social+BCT(3/12)
Bottom: © Copyright
```
- Dense info, editorial | Tablet: 2×2 | Mobile: stack

### 6. `stacked` — Wave Decorative
```
     ～～～ wave SVG overlay ～～～
Wave bg (brand color gradient):
Logo+Desc+Contact(4/12) | Col1(2/12) | Col2(2/12) | Newsletter+Social(4/12)
─── brand-colored bar ───
© Copyright
```
- Inline SVG wave, brand-colored bg | Tablet/Mobile: stack

### Responsive Rules

| BP | Width | Behavior |
|----|-------|----------|
| Mobile | <640px | Stack dọc, text-center, touch 44px |
| Tablet | 640–1024px | 2 cột, left-align |
| Desktop | >1024px | Full layout |

### Config Sharing

| Field | classic | modern | corporate | minimal | centered | stacked |
|-------|---------|--------|-----------|---------|----------|---------|
| logo/logoName | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| description | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| columns | max3 | max2 grid | max4 | ❌ | max3 | max2 |
| socialLinks | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| copyright | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| showBctLogo | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |

**Kết luận**: Không cần thêm field mới. Form admin giữ nguyên 100%.

---

# V. Files Impacted

| File | Vai trò | Thay đổi |
|------|---------|----------|
| `DynamicFooter.tsx` | Site rendering | Sửa: rewrite 6 layout blocks |
| `FooterPreview.tsx` | Admin preview | Sửa: sync JSX preview |
| `ComponentRenderer.tsx` | Snapshot demo | Sửa: sync FooterSection |
| `FooterForm.tsx` | Admin form | Không sửa |
| `_types/index.ts` | Types | Không sửa |

---

# VI. Execution Preview

1. Sửa `DynamicFooter.tsx` — từng layout block
2. Sửa `FooterPreview.tsx` — sync preview
3. Sửa `ComponentRenderer.tsx` — sync snapshot
4. Static review + `bunx tsc --noEmit`

---

# VIII. Todo

- [x] Phân tích 12 mẫu → 6 nhóm
- [x] Chọn 6 layout + mapping
- [x] Thiết kế responsive + config sharing
- [ ] Sửa `DynamicFooter.tsx`
- [ ] Sửa `FooterPreview.tsx`
- [ ] Sửa `ComponentRenderer.tsx`
- [ ] Static review + tsc

---

# IX. Acceptance Criteria

1. 6 layout có kiến trúc bố cục **khác biệt rõ ràng**
2. Cùng 1 config render đúng ở cả 6
3. Form admin không thay đổi
4. Responsive tốt trên 3 breakpoint
5. TypeScript compile pass

---

# X. Risk / Rollback

- Risk: ComponentRenderer ~5000 dòng, sửa sai ảnh hưởng snapshot
- Rollback: git revert từng file
- Mitigation: sửa DynamicFooter trước → verify → sync 2 file còn lại

---

# XI. Out of Scope

- Thêm field config mới
- Sửa FooterForm
- Backend newsletter logic
- Animation phức tạp
