# I. Primer

## 1. TL;DR kiểu Feynman
Giống như một ngôi nhà có nhiều phòng, mỗi phòng lại có một công tắc đèn riêng. Khi bạn muốn ra khỏi nhà, thay vì phải đi từng phòng tắt từng cái công tắc, bạn chỉ cần bấm một chiếc "Công tắc tổng" ở ngay cửa ra vào để tắt toàn bộ đèn trong nhà.
Trong giao diện chỉnh sửa (Form) của các Home Component, mỗi phần cấu hình (như Cấu hình hiển thị, Cấu hình nội dung, danh sách tính năng, v.v.) là một "căn phòng" (SubSection) có nút bấm thu gọn/mở rộng riêng. Chúng ta đang thiết lập một "Công tắc tổng" (Nút Toggle All ở thanh công cụ dưới cùng) để người dùng có thể đóng hoặc mở tất cả các phần cấu hình cùng một lúc chỉ với một lần bấm chuột.

## 2. Elaboration & Self-Explanation
Hiện tại, giao diện quản trị Admin UI của dự án có nhiều Form chỉnh sửa cho các Component trang chủ (Clients, Countdown, CTA, Faq, Features). Một số Form đang dùng thẻ `Card` tĩnh từ thư viện UI (không thể thu gọn), số khác đã dùng `SubSection` (thu gọn được) nhưng lại lưu trạng thái đóng/mở riêng lẻ, không có cơ chế đồng bộ hoặc nút bấm "Thu gọn tất cả / Mở rộng tất cả".
Việc refactor này nhằm mục đích:
- Thay thế các thẻ `Card` tĩnh bằng thành phần `SubSection` (CollapsibleSubSection) có khả năng thu gọn/mở rộng.
- Sử dụng hook dùng chung `useFormSectionsState` để quản lý tập trung trạng thái mở của tất cả các `SubSection` trong mỗi Form.
- Tích hợp nút `FormSectionsToggleAllButton` đẩy vào thanh tác vụ (Sticky Footer Portal) để kích hoạt hành động Toggle All đồng bộ.
- Bảo đảm tính đồng nhất trong thiết kế và nâng cao trải nghiệm người dùng (UX) khi tương tác với những Form dài có nhiều mục cấu hình.

## 3. Concrete Examples & Analogies
**Ví dụ thực tế:**
Trong `ClientsForm.tsx`, trước đây phần "Ảnh banner" là một `Card` cố định luôn chiếm dụng không gian hiển thị lớn trên màn hình:
```tsx
<Card className="mb-6">
  <CardHeader><CardTitle>Ảnh banner</CardTitle></CardHeader>
  <CardContent>...</CardContent>
</Card>
```
Sau khi refactor, nó sẽ trở thành một `SubSection` có thể thu gọn và được đồng bộ trạng thái mở/đóng thông qua key `banners`:
```tsx
<SubSection
  icon={ImageIcon}
  title={`Ảnh banner (${items.length}/${maxItems})`}
  open={openSections.banners}
  onOpenChange={(open) => toggleSection('banners', open)}
>
  ...
</SubSection>
```

---

# II. Audit Summary (Tóm tắt kiểm tra)

Chúng ta đã kiểm tra cấu trúc của 5 file Form cần chỉnh sửa:
1. `ClientsForm.tsx`: Có 1 `SubSection` (chưa gán key động) và 1 `Card` tĩnh chứa `MultiImageUploader`.
2. `CountdownForm.tsx`: Có 2 `Card` tĩnh gồm "Nội dung Countdown" và "Layout Countdown" (chuyển đổi layout).
3. `CTAForm.tsx`: Có 1 `SubSection` duy nhất nhưng trạng thái đóng/mở (`defaultOpen`) đang cứng theo `defaultExpanded` prop mà không có hook đồng bộ.
4. `FaqForm.tsx`: Có 1 `SubSection` "Câu hỏi thường gặp" được điều khiển qua `expanded`/`onExpandedChange` prop từ cha và 1 `Card` "Cấu hình layout Showcase" tĩnh.
5. `FeaturesForm.tsx`: Có 1 `Card` tĩnh "Danh sách tính năng" chứa danh sách kéo thả và cấu hình ẩn/hiện icon.

Hook và Component Toggle All dùng chung đã tồn tại và sẵn sàng hoạt động:
- `useFormSectionsState` nằm ở `app/admin/home-components/_shared/hooks/useFormSectionsState.ts`.
- `FormSectionsToggleAllButton` nằm ở `app/admin/home-components/_shared/components/FormSectionsToggleAllButton.tsx`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- **Nguyên nhân cần refactor:** Giao diện Form của các Home Component được phát triển ở các thời điểm khác nhau bởi nhiều lập trình viên, dẫn tới sự bất đồng bộ trong thiết kế: một số dùng `Card`, một số dùng `SubSection` tự do, chưa được liên kết với nút Toggle All chung ở thanh tác vụ cuối màn hình.
- **Giả thuyết đối chứng:** Nếu chỉ thay đổi component mà không quản lý đồng bộ trạng thái hoặc bỏ quên việc truyền prop `open`/`onOpenChange` cho `SubSection`, nút Toggle All ở Sticky Footer sẽ không thể nhận diện được section nào đang mở hay đóng, làm mất chức năng đồng bộ trạng thái tổng thể.

---

# IV. Proposal (Đề xuất)

1. **ClientsForm.tsx**:
   - Khai báo danh sách keys: `['settings', 'banners']`.
   - Dùng hook: `const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['settings', 'banners'], defaultExpanded)`.
   - Đổi `SubSection` "Cấu hình hiển thị" để liên kết với `openSections.settings` và `toggleSection('settings', open)`.
   - Đổi `Card` "Ảnh banner" thành `SubSection` với icon `ImageIcon` từ `lucide-react`, liên kết với `openSections.banners`.
   - Thêm `<FormSectionsToggleAllButton>` ở trên cùng JSX.

2. **CountdownForm.tsx**:
   - Khai báo danh sách keys: `['content', 'layout']`.
   - Bổ sung import `CollapsibleSubSection as SubSection` từ `../../_shared/components/CollapsibleSubSection`.
   - Chuyển `Card` "Nội dung Countdown" thành `SubSection` với icon `Settings2` (hoặc `CalendarClock`) và gán key `content`.
   - Chuyển `Card` "Layout Countdown" thành `SubSection` với icon `Layout` (hoặc `Palette`) và gán key `layout`.
   - Đưa nút chọn layout từ `CardHeader` thành `actions` của `SubSection` `layout` để giữ nguyên tính năng đổi layout cực kỳ tinh gọn.
   - Thêm `<FormSectionsToggleAllButton>` ở đầu JSX.

3. **CTAForm.tsx**:
   - Khai báo danh sách keys: `['cta']`.
   - Thêm hook `useFormSectionsState(['cta'], defaultExpanded)`.
   - Liên kết `SubSection` "Nội dung CTA" với `openSections.cta` và `toggleSection('cta', open)`.
   - Đưa nút `FormSectionsToggleAllButton` lên đầu JSX.

4. **FaqForm.tsx**:
   - Khai báo danh sách keys: `['faqItems', 'layoutConfig']`.
   - Chuyển `Card` "Cấu hình layout Showcase" thành `SubSection` với icon `Layout` (hoặc `LayoutGrid`) và gán key `layoutConfig`.
   - Đồng bộ `SubSection` "Câu hỏi thường gặp" với key `faqItems`.
   - Hỗ trợ prop `expanded` và `onExpandedChange` của cha bằng cách đồng bộ với hook nội bộ thông qua `React.useEffect` và `onOpenChange` callback.
   - Đưa nút `FormSectionsToggleAllButton` lên đầu JSX.

5. **FeaturesForm.tsx**:
   - Khai báo danh sách keys: `['features']`.
   - Bổ sung import `CollapsibleSubSection as SubSection` từ `../../_shared/components/CollapsibleSubSection`.
   - Chuyển `Card` "Danh sách tính năng" thành `SubSection` với icon `ListChecks` (hoặc `Layers`), gán key `features`.
   - Đưa nút AI Import và Thêm từ `CardHeader` vào prop `actions` của `SubSection`.
   - Đưa nút `FormSectionsToggleAllButton` lên đầu JSX.

---

# V. Files Impacted (Tệp bị ảnh hưởng)

### Sửa đổi các file Form sau:
1. `app/admin/home-components/clients/_components/ClientsForm.tsx`
   - *Vai trò hiện tại*: Form chỉnh sửa banner các đối tác/khách hàng.
   - *Thay đổi*: Thay `Card` banner bằng `SubSection`, tích hợp hook `useFormSectionsState` với keys `['settings', 'banners']`, kết nối Toggle All button.
2. `app/admin/home-components/countdown/_components/CountdownForm.tsx`
   - *Vai trò hiện tại*: Form cấu hình đồng hồ đếm ngược sự kiện.
   - *Thay đổi*: Chuyển đổi 2 `Card` nội dung & layout sang `SubSection`, tích hợp hook `useFormSectionsState` với keys `['content', 'layout']`, thêm Toggle All button.
3. `app/admin/home-components/cta/_components/CTAForm.tsx`
   - *Vai trò hiện tại*: Form chỉnh sửa khối Kêu gọi hành động (Call To Action).
   - *Thay đổi*: Tích hợp hook `useFormSectionsState` với key `['cta']` và liên kết với Toggle All button.
4. `app/admin/home-components/faq/_components/FaqForm.tsx`
   - *Vai trò hiện tại*: Form quản lý các câu hỏi thường gặp.
   - *Thay đổi*: Thay thế Card cấu hình layout bằng `SubSection`, tích hợp hook `useFormSectionsState` với keys `['faqItems', 'layoutConfig']`, thêm Toggle All button.
5. `app/admin/home-components/features/_components/FeaturesForm.tsx`
   - *Vai trò hiện tại*: Form chỉnh sửa danh sách tính năng nổi bật.
   - *Thay đổi*: Chuyển đổi Card danh sách tính năng thành `SubSection`, tích hợp hook `useFormSectionsState` với key `['features']`, thêm Toggle All button.

---

# VI. Execution Preview (Xem trước thực thi)

1. **Bước 1: Refactor ClientsForm.tsx**
   - Thêm import `ImageIcon` từ `'lucide-react'`.
   - Thêm import `useFormSectionsState` và `FormSectionsToggleAllButton`.
   - Khai báo prop `defaultExpanded = true` trong `ClientsFormProps` để tương thích.
   - Khai báo hook `useFormSectionsState(['settings', 'banners'], defaultExpanded)`.
   - Cập nhật JSX: thay thế `Card` bằng `SubSection` và gắn `open`, `onOpenChange` cho cả 2 section.

2. **Bước 2: Refactor CountdownForm.tsx**
   - Thêm import `CollapsibleSubSection as SubSection`, `Settings2`, `Layout` (hoặc `Palette`).
   - Thêm import `useFormSectionsState` và `FormSectionsToggleAllButton`.
   - Khai báo prop `defaultExpanded = true` trong `CountdownFormProps`.
   - Khai báo hook `useFormSectionsState(['content', 'layout'], defaultExpanded)`.
   - Cập nhật JSX: chuyển 2 `Card` thành `SubSection`, đưa AI Import và Layout Switcher vào `actions`.

3. **Bước 3: Refactor CTAForm.tsx**
   - Chuyển `CTAForm` từ arrow function viết tắt sang block function hoàn chỉnh.
   - Thêm import `useFormSectionsState` và `FormSectionsToggleAllButton`.
   - Khai báo hook `useFormSectionsState(['cta'], defaultExpanded)`.
   - Cập nhật JSX: bọc phần hiển thị và liên kết `SubSection` với hook.

4. **Bước 4: Refactor FaqForm.tsx**
   - Thêm import `Layout` từ `'lucide-react'`.
   - Thêm import `useFormSectionsState` và `FormSectionsToggleAllButton`.
   - Khai báo hook `useFormSectionsState(['faqItems', 'layoutConfig'], expanded ?? true)`.
   - Đồng bộ thay đổi qua `React.useEffect` khi `expanded` đổi.
   - Cập nhật JSX: thay thế Card cấu hình bằng `SubSection`.

5. **Bước 5: Refactor FeaturesForm.tsx**
   - Thêm import `ListChecks` từ `'lucide-react'` và `CollapsibleSubSection as SubSection`.
   - Thêm import `useFormSectionsState` và `FormSectionsToggleAllButton`.
   - Thêm prop `defaultExpanded = true` vào `FeaturesFormProps`.
   - Khai báo hook `useFormSectionsState(['features'], defaultExpanded)`.
   - Cập nhật JSX: thay `Card` tính năng bằng `SubSection`.

---

# VII. Verification Plan (Kế hoạch kiểm chứng)

### A. Kiểm chứng Tĩnh (Static Verification)
- Sau khi hoàn thành refactor cả 5 file, chạy lệnh `bunx tsc --noEmit` để đảm bảo không có lỗi biên dịch TypeScript hay lỗi import sai đường dẫn tương đối.
- Giới hạn hiển thị kết quả bằng lệnh:
  `bunx tsc --noEmit 2>&1 | Select-Object -First 10`

### B. Tiêu chí Đạt/Không đạt (Pass/Fail Criteria)
- **Đạt**: Nút Toggle All ở Sticky Footer xuất hiện đúng trên các trang cấu hình của 5 Home Component này. Click vào nút này sẽ đóng hoặc mở đồng loạt tất cả các section con tương ứng một cách mượt mà và đồng bộ.
- **Không đạt**: Gây ra lỗi biên dịch TypeScript, import sai file, hoặc các section không đóng/mở tương thích khi click nút Toggle All.

---

# VIII. Todo

- [ ] Refactor `ClientsForm.tsx` (Keys: `['settings', 'banners']`)
- [ ] Refactor `CountdownForm.tsx` (Keys: `['content', 'layout']`)
- [ ] Refactor `CTAForm.tsx` (Keys: `['cta']`)
- [ ] Refactor `FaqForm.tsx` (Keys: `['faqItems', 'layoutConfig']`)
- [ ] Refactor `FeaturesForm.tsx` (Keys: `['features']`)
- [ ] Thực hiện kiểm chứng static compile bằng `bunx tsc --noEmit`
- [ ] Tiến hành Commit code kèm file Spec tài liệu.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

1. **Khả năng đóng mở đầy đủ**: 100% các card cấu hình cũ trong 5 Form này được chuyển đổi thành `SubSection` đóng/mở thành công.
2. **Toggle All hoạt động hoàn hảo**: Nút bấm Toggle All tại footer điều khiển đồng loạt các section con đúng theo mong đợi.
3. **TypeScript hoàn toàn sạch**: Không có bất kỳ lỗi biên dịch nào do kiểu dữ liệu hay đường dẫn import.
4. **Không làm hỏng luồng dữ liệu**: Các trường nhập liệu, trình upload ảnh, danh sách kéo thả và nút AI Import vẫn hoạt động bình thường, không bị ảnh hưởng bởi việc bọc component.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- **Rủi ro**: Đường dẫn tương đối khi import hook/component từ thư mục `_shared` có thể bị sai nếu tính toán độ sâu thư mục không chuẩn xác.
- **Biện pháp giảm thiểu rủi ro**: Kiểm tra kỹ sơ đồ thư mục trước khi sửa đổi, sử dụng import tương đối chính xác.
- **Hoàn tác**: Sử dụng `git checkout -- <file>` để phục hồi trạng thái nguyên bản của file nếu gặp lỗi nghiêm trọng không thể khắc phục nhanh.

---

# XI. Out of Scope (Ngoài phạm vi)

- Sửa đổi giao diện hiển thị phía client-facing (Public Frontend) của các Home Component này.
- Thêm mới hoặc thay đổi các trường dữ liệu (Schema/Data fields) trong database hoặc Convex backend.
- Thay đổi logic nghiệp vụ lưu trữ dữ liệu (Save/Delete actions) trên trang admin.
