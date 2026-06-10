# SPEC: Refactor Contact Experience E2E (Admin Experience ↔ Frontend Contact) — No-QA Manual

## 1) Mục tiêu
- Triệt tiêu nhu cầu QA/test thủ công bằng cách làm đúng kiến trúc ngay từ gốc.
- Đồng bộ 100% giữa preview trong `/system/experiences/contact` và UI thực tại `/contact`.
- Loại bỏ drift do trùng lặp type/config/parse logic.
- Chuẩn hóa route module liên quan và luồng dữ liệu contact.

## 2) Nguyên tắc No-QA/Test Manual
1. **Single Source of Truth**: schema/config `contact_ui` chỉ tồn tại 1 nơi.
2. **Runtime parity**: preview dùng **UI thật** (LivePreview), không dùng mock preview.
3. **No duplicate parser**: logic merge default + raw chỉ tồn tại 1 hàm.
4. **No ambiguous data shape**: trả dữ liệu typed, không còn type guard tạm bợ.
5. **No dead path**: route module liên quan phải đúng ngay từ đầu.

> Khi đủ 5 nguyên tắc trên, phần lớn lỗi do “lệch logic” sẽ bị chặn từ thiết kế, không cần QA thủ công.

## 3) Phạm vi
### In scope
- `app/system/experiences/contact/page.tsx`
- `components/experiences/previews/ContactPreview.tsx`
- `app/(site)/contact/page.tsx`
- `components/site/hooks.ts`
- `lib/experiences/*` (bổ sung module con cho contact)

### Out of scope (YAGNI)
- Backend gửi email thật từ form contact.
- Tạo Contact Module mới.
- Redesign giao diện lớn.

## 4) Vấn đề gốc cần xử lý
1. Preview admin đang là mock tĩnh, không phải UI thật.
2. Type/config contact lặp giữa admin và site.
3. Parse/merge config lặp ở nhiều nơi.
4. Link module liên quan bị sai route (`/system/settings`).
5. Luồng data frontend contact bị phân mảnh nhiều hook.

## 5) Thiết kế đích (Target Design)

## 5.1 Shared Contact Config Foundation
Tạo file mới:
- `lib/experiences/contact/config.ts`

Chứa:
- `CONTACT_EXPERIENCE_KEY = 'contact_ui'`
- `ContactLayoutStyle`
- `LayoutConfig`
- `ContactExperienceConfig`
- `DEFAULT_CONTACT_CONFIG`
- `parseContactExperienceConfig(raw)`

Ràng buộc:
- Admin + Site chỉ import từ file này.
- Cấm định nghĩa lại type/config/parser ở page-level.

## 5.2 Unified Contact Page Data
Tạo hook mới:
- `components/site/hooks/useContactPageData.ts`

Output chuẩn:
- `{ isLoading, brandColor, config, contactData, socialLinks }`

Ràng buộc:
- Không dùng `'address' in contact`.
- Không để parse config rải rác ở page.

## 5.3 Runtime Parity cho Experience Preview
Trong `/system/experiences/contact`:
- Chuyển preview mock sang `LivePreview` URL `/contact`.
- Add `ExampleLinks` để mở `/contact` trực tiếp.

Ràng buộc:
- Không dùng preview giả làm nguồn xác nhận chính.

## 5.4 Route và Dependency sạch
- Sửa link module từ `/system/settings` -> `/system/modules/settings`.
- Ghi rõ Contact là **Experience phụ thuộc Settings**, không phải module độc lập.

## 6) Implementation Plan chi tiết

## Phase 1 — Foundation (bắt buộc)
### Task 1.1
- Tạo `lib/experiences/contact/config.ts`.
- Khai báo toàn bộ type/default/parser/key.

### Task 1.2
- Refactor `app/system/experiences/contact/page.tsx` dùng shared config.

### Task 1.3
- Refactor `app/(site)/contact/page.tsx` dùng shared parser/default.

**DoD Phase 1**
- Không còn khai báo type/config contact cục bộ ở 2 page.
- Parser chỉ còn đúng 1 hàm.

---

## Phase 2 — Data Unification (bắt buộc)
### Task 2.1
- Tạo `useContactPageData.ts` gom config + contact + social + brandColor.

### Task 2.2
- Refactor site contact page dùng hook mới.

**DoD Phase 2**
- Site page không còn branch type guard thủ công.
- Mọi dữ liệu contact render từ 1 data contract rõ ràng.

---

## Phase 3 — Preview Runtime Parity (bắt buộc)
### Task 3.1
- Đổi sang `LivePreview` route `/contact`.

### Task 3.2
- Thêm `ExampleLinks` mở route thật.

### Task 3.3
- Cleanup `ContactPreview` nếu không còn dùng.

**DoD Phase 3**
- Preview trong Experience phản chiếu runtime thật.
- Không còn nguồn preview mock làm chuẩn.

---

## Phase 4 — Dependency Cleanup (bắt buộc)
### Task 4.1
- Fix route module settings.

### Task 4.2
- Chuẩn hóa wording về dependency “Settings module”.

**DoD Phase 4**
- Không còn link sai.
- Context dependency rõ ràng cho dev/admin.

## 7) Detailed TODO Checklist

### TODO-A: Shared Config
- [ ] Tạo `lib/experiences/contact/config.ts`.
- [ ] Define `ContactLayoutStyle`.
- [ ] Define `LayoutConfig`.
- [ ] Define `ContactExperienceConfig`.
- [ ] Add `CONTACT_EXPERIENCE_KEY`.
- [ ] Add `DEFAULT_CONTACT_CONFIG`.
- [ ] Add `parseContactExperienceConfig(raw)`.
- [ ] Export qua `lib/experiences/index.ts` (nếu cần).

### TODO-B: Admin Refactor
- [ ] Xóa type/config local ở contact experience page.
- [ ] Import shared key/config/parser.
- [ ] Giữ nguyên flow Save hiện tại.
- [ ] Fix module link đến `/system/modules/settings`.

### TODO-C: Site Refactor
- [ ] Tạo `useContactPageData.ts`.
- [ ] Gom brand/contact/social/config vào hook mới.
- [ ] Refactor `app/(site)/contact/page.tsx` dùng hook.
- [ ] Bỏ type guard runtime thủ công.

### TODO-D: Runtime Preview Alignment
- [ ] Đổi `ContactPreview` mock -> `LivePreview` route `/contact`.
- [ ] Add `ExampleLinks` cho `/contact`.
- [ ] Cleanup export/import `ContactPreview` nếu dư thừa.

### TODO-E: Structural Hardening (không QA/test manual)
- [ ] Bảo đảm chỉ còn 1 parser cho `contact_ui`.
- [ ] Bảo đảm chỉ còn 1 source type/config contact.
- [ ] Bảo đảm preview trỏ route thật.
- [ ] Bảo đảm dependency route đúng.

## 8) Acceptance Criteria (không cần QA manual)
1. Không còn duplicate type/config/parser contact trong codebase mục tiêu.
2. Preview contact trong Experience chạy từ route thật `/contact`.
3. Site contact dùng 1 data contract typed duy nhất.
4. Link module liên quan chính xác.
5. Không còn quyết định logic dựa trên type guard tạm (`'x' in obj`).

## 9) Rollback Plan
- Revert theo phase gần nhất (4 -> 3 -> 2 -> 1).
- Giữ lại shared config foundation nếu rollback UI wiring.
- Nếu LivePreview gặp sự cố bất ngờ, tạm bật fallback nhưng giữ parser/type chung.

## 10) Ước lượng effort
- Phase 1: 0.5 ngày
- Phase 2: 0.5 ngày
- Phase 3: 0.4 ngày
- Phase 4: 0.1 ngày

Tổng: ~1.5 ngày triển khai tập trung (không gồm QA/test manual).
