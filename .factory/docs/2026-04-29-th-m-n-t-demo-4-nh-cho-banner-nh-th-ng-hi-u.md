# I. Primer

## 1. TL;DR kiểu Feynman
- Tôi đã kiểm tra `C:\Users\VTOS\Downloads\testimonials-component-showcase`: **không có file ảnh local**.
- Showcase đang dùng ảnh remote từ `https://picsum.photos/...` trong `app/page.tsx`.
- Hướng đúng: tải 4 ảnh demo từ các URL showcase về `public/demo/brand-banners/`, rồi dùng URL tương đối như `/demo/brand-banners/banner-1.webp`.
- Thêm nút **Dùng ảnh demo** tại `/admin/home-components/create/clients`; bấm một phát sẽ fill 4 item vào form và preview hiển thị ngay.
- Không đụng schema, không upload Convex, không lưu database cho đến khi user bấm tạo component như flow hiện tại.

## 2. Elaboration & Self-Explanation
Thư mục showcase không chứa ảnh thật; nó chỉ tham chiếu ảnh từ `picsum.photos` bằng URL remote. Vì user muốn “ảnh đó nên tải về dự án” và “url dạng link tương đối”, implementation cần tải 4 ảnh demo về thư mục `public`. Trong Next.js, file nằm trong `public/demo/brand-banners/banner-1.webp` sẽ được truy cập bằng URL tương đối `/demo/brand-banners/banner-1.webp`.

Nút demo sẽ không upload ảnh lên Convex Storage. Nó chỉ set state form `clientItems` trong trang create để preview nhìn thấy ngay 4 ảnh demo với kích thước thật. Khi user submit, config sẽ lưu các URL tương đối đó như các URL ảnh bình thường.

## 3. Concrete Examples & Analogies
Ví dụ state sau khi bấm nút demo:

```ts
setClientItems([
  { id: 'demo-1', inputMode: 'upload', url: '/demo/brand-banners/banner-1.webp', link: '' },
  { id: 'demo-2', inputMode: 'upload', url: '/demo/brand-banners/banner-2.webp', link: '' },
  { id: 'demo-3', inputMode: 'upload', url: '/demo/brand-banners/banner-3.webp', link: '' },
  { id: 'demo-4', inputMode: 'upload', url: '/demo/brand-banners/banner-4.webp', link: '' },
]);
```

Analogy: thay vì bắt user tự đi lấy 4 poster treo thử, ta để sẵn 4 poster mẫu trong kho `public`; nút demo chỉ lấy 4 poster đó đặt vào khung preview.

# II. Audit Summary (Tóm tắt kiểm tra)

- Observation: `Glob` ảnh trong `C:\Users\VTOS\Downloads\testimonials-component-showcase` không tìm thấy `png/jpg/jpeg/webp/avif/gif/svg`.
- Evidence: `C:\Users\VTOS\Downloads\testimonials-component-showcase\app\page.tsx` dùng `https://picsum.photos/seed/...` cho các banner.
- Evidence: trang create hiện tại ở `app/admin/home-components/create/clients/page.tsx` quản lý `clientItems` bằng `useState` và truyền vào `ClientsForm` + `ClientsPreview`.
- Evidence: repo có `public/seed_mau/...` nhiều ảnh sẵn, nhưng user nói “trong showcase” và muốn ảnh tải về dự án, nên nên dùng các URL remote từ showcase làm source tải.
- Inference: cần thêm static demo assets vào `public/demo/brand-banners` và thêm nút set state tại create page.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

## 1. Root Cause Confidence (Độ tin cậy nguyên nhân gốc)

**High.** Không có ảnh local trong showcase; ảnh demo hiện chỉ tồn tại qua remote URL. Muốn preview ổn định bằng link tương đối thì phải tải/copy ảnh vào `public` của dự án.

## 2. Counter-Hypothesis (Giả thuyết đối chứng)

- Dùng luôn ảnh sẵn trong `public/seed_mau/...`: nhanh hơn và không cần network, nhưng không đúng ý “ảnh trong showcase”.
- Dùng remote `picsum.photos` trực tiếp: không cần tải file, nhưng trái yêu cầu URL tương đối và có thể không ổn định.
- Thêm nút demo cả edit page: hữu ích, nhưng user chỉ yêu cầu create route nên không mở rộng scope.

# IV. Proposal (Đề xuất)

## 1. Source ảnh demo

Tải 4 ảnh từ showcase Layout 01 vì layout này dùng đúng 4 ảnh và phù hợp để test đủ mọi layout:

- `https://picsum.photos/seed/lay1a/1000/1000` → `/demo/brand-banners/banner-1.webp`
- `https://picsum.photos/seed/lay1b/500/500` → `/demo/brand-banners/banner-2.webp`
- `https://picsum.photos/seed/lay1c/500/500` → `/demo/brand-banners/banner-3.webp`
- `https://picsum.photos/seed/lay1d/1000/500` → `/demo/brand-banners/banner-4.webp`

Nếu tải WebP trực tiếp không ổn định theo content-type, sẽ tải về file ảnh với extension phù hợp hoặc dùng `ffmpeg`/tool sẵn có để chuẩn hóa sang `.webp`.

## 2. UI nút demo

Thêm nút **Dùng ảnh demo** gần khu vực `ClientsForm` hoặc trong một card nhỏ phía trên form ảnh.

Behavior:

- Bấm nút sẽ thay `clientItems` hiện tại bằng 4 item demo.
- Link của từng item mặc định rỗng.
- Giữ style preview hiện tại của user, không tự đổi style, để user tự xem 6 layout bằng switcher hiện có.
- Có thể thêm nút phụ **Xóa demo** không cần thiết; tránh mở rộng scope.

## 3. Data contract

Không đổi contract:

```ts
{ url: string; link: string }
```

Demo dùng URL tương đối:

```ts
/demo/brand-banners/banner-1.webp
```

```mermaid
flowchart TD
  A[Click demo] --> B[setClientItems]
  B --> C[ClientsForm]
  B --> D[ClientsPreview]
  D --> E[PreviewImage]
  E --> F[/public/demo]
```

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. Static assets

- Thêm: `public/demo/brand-banners/banner-1.webp` — ảnh demo chính từ showcase Layout 01.
- Thêm: `public/demo/brand-banners/banner-2.webp` — ảnh demo phụ vuông.
- Thêm: `public/demo/brand-banners/banner-3.webp` — ảnh demo phụ vuông.
- Thêm: `public/demo/brand-banners/banner-4.webp` — ảnh demo ngang.

## 2. Admin create page

- Sửa: `app/admin/home-components/create/clients/page.tsx` — thêm constant danh sách demo items và handler `handleUseDemoImages`, render nút demo trước `ClientsForm`.

## 3. Optional nếu cần tái dùng sạch hơn

- Có thể thêm nhỏ trong `app/admin/home-components/clients/_lib/constants.ts` constant `DEMO_CLIENTS_BANNER_ITEMS`; nhưng nếu chỉ dùng ở create page thì để local trong create page để KISS.

# VI. Execution Preview (Xem trước thực thi)

1. Tạo thư mục `public/demo/brand-banners`.
2. Tải 4 ảnh từ `picsum.photos` theo seed trong showcase về dự án.
3. Kiểm tra file tồn tại và đọc được.
4. Cập nhật `create/clients/page.tsx`:
   - thêm `DEMO_CLIENT_ITEMS`;
   - thêm handler set 4 item demo;
   - thêm nút `type="button"` để tránh submit form.
5. Static review:
   - button không submit form;
   - URL là relative URL;
   - không vượt quá 4 item;
   - không đổi save flow.
6. Chạy `bunx tsc --noEmit` vì có sửa TypeScript.
7. Commit thay đổi, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Verify asset:
  - 4 file ảnh tồn tại trong `public/demo/brand-banners`.
  - Đường dẫn tương đối bắt đầu bằng `/demo/brand-banners/`.
- Typecheck:
  - `bunx tsc --noEmit` pass.
- Manual tester checklist:
  - Mở `/admin/home-components/create/clients`.
  - Bấm **Dùng ảnh demo**.
  - Form có ngay 4 ảnh.
  - Preview hiển thị ảnh ở layout đang chọn.
  - Đổi qua 6 layout đều có ảnh để xem.
  - Submit tạo component vẫn lưu config như bình thường.

# VIII. Todo

- [ ] Tải 4 ảnh showcase vào `public/demo/brand-banners`.
- [ ] Thêm nút **Dùng ảnh demo** ở create clients.
- [ ] Set 4 URL tương đối vào `clientItems` khi bấm nút.
- [ ] Typecheck và commit.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- Showcase folder được xác nhận không có ảnh local; ảnh demo được lấy từ URL showcase.
- `/admin/home-components/create/clients` có nút demo.
- Bấm nút demo tạo ngay 4 ảnh trong form/preview.
- 4 ảnh dùng URL tương đối, không dùng remote URL.
- Không upload Convex khi bấm demo.
- `bunx tsc --noEmit` pass.
- Có commit mới sau khi hoàn tất.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro network: tải `picsum.photos` có thể fail hoặc trả ảnh ngẫu nhiên theo redirect. Mitigation: dùng seed cố định và verify file sau khi tải; nếu fail thì báo rõ hoặc dùng ảnh seed_mau làm fallback chỉ khi user đồng ý.
- Rủi ro binary assets làm repo tăng nhẹ dung lượng. Mitigation: chỉ 4 ảnh demo, có thể tối ưu WebP.
- Rollback: revert commit sẽ xóa nút demo và asset demo.

# XI. Out of Scope (Ngoài phạm vi)

- Không thêm demo button cho edit page.
- Không đổi layout/render 6 layout đã làm.
- Không upload ảnh demo vào Convex Storage.
- Không thay đổi schema hoặc data thật.

# XII. Open Questions (Câu hỏi mở)

Không có câu hỏi bắt buộc. Tôi sẽ dùng 4 ảnh từ showcase Layout 01 vì nó đủ đúng 4 ảnh để preview mọi layout.