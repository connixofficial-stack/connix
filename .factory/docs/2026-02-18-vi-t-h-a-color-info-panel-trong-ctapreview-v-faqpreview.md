
## Vấn đề

Admin (không có kiến thức tech) đang thấy các nhãn tiếng Anh khó hiểu trong phần "color info panel" phía dưới preview:

**Hiện tại (khó hiểu):**
- `Primary (mono)` / `Primary` / `Secondary`
- `Accent: P 32% / S 9% / N 59%`
- `Harmony warning` / `Accessibility warning` + tiếng Anh kỹ thuật
- `info` badge: `SINGLE` / `DUAL • analogous`

**Mục tiêu:** Việt hóa hoàn toàn, dùng ngôn ngữ Feynman — đơn giản như giải thích cho người không biết gì về tech.

---

## Scope

Chỉ 2 file cần sửa (Hero đã Việt hóa rồi, Stats không có color panel):

1. `app/admin/home-components/cta/_components/CTAPreview.tsx`
2. `app/admin/home-components/faq/_components/FaqPreview.tsx`

---

## Thay đổi cụ thể

### 1. `CTAPreview.tsx`

**Color info panel (bottom):**

| Cũ | Mới |
|---|---|
| `Primary (mono)` | `Màu thương hiệu` |
| `Primary` | `Màu chính` |
| `Secondary` | `Màu phụ` |
| `Accent: P 32% / S 9% / N 59%` | `Tỉ lệ màu: Chính 32% · Phụ 9% · Nền 59%` |

**Warning boxes:**

| Cũ | Mới |
|---|---|
| `Harmony warning` | `Hai màu quá giống nhau` |
| `Primary/Secondary quá giống nhau nên sẽ bị chặn lưu.` | `Màu chính và màu phụ đang quá giống nhau (deltaE = X). Hệ thống sẽ chặn lưu cho đến khi bạn chọn màu khác biệt hơn.` |
| `Accessibility warning` | `Màu chữ khó đọc` |
| `minLc: X • fail: ... • sẽ bị chặn lưu.` | `Một số cặp màu chữ/nền chưa đủ độ tương phản (minLc: X). Hệ thống sẽ chặn lưu cho đến khi bạn chọn màu khác.` |

**`info` badge trên PreviewWrapper:**

| Cũ | Mới |
|---|---|
| `SINGLE` | `1 màu` |
| `` `DUAL • ${harmony}` `` | `2 màu` |

### 2. `FaqPreview.tsx`

**Color info panel (bottom):**

| Cũ | Mới |
|---|---|
| `Primary` | `Màu chính` |
| `Secondary` | `Màu phụ` |
| `Accent: P X% / S X% / N X%` | `Tỉ lệ màu: Chính X% · Phụ X% · Nền X%` |

**Warning boxes:**

| Cũ | Mới |
|---|---|
| `Harmony warning` | `Hai màu quá giống nhau` |
| `Primary/Secondary đang quá giống nhau.` | `Màu chính và màu phụ đang quá giống nhau (deltaE = X). Nếu lưu, màu phụ sẽ bị tự động điều chỉnh.` |
| `Accessibility warning` | `Màu chữ khó đọc` |
| `minLc: X • fail: X` | `Một số cặp màu chữ/nền chưa đủ độ tương phản (minLc: X).` |

**`info` badge trên PreviewWrapper (trong FaqPreview):**

| Cũ | Mới |
|---|---|
| `` `${items.length} câu hỏi • ${mode.toUpperCase()}${mode === 'dual' ? ` • ${harmony}` : ''}` `` | `` `${items.length} câu hỏi • ${mode === 'dual' ? '2 màu' : '1 màu'}` `` |

---

## Không thay đổi
- Logic validation, màu sắc, accessibility check
- Các file khác (Stats, Hero, Partners... đã ổn hoặc không có panel)
- PreviewWrapper component
