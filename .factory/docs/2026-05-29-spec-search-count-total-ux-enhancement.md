# I. Primer

## 1. TL;DR kiểu Feynman
Chúng ta sẽ nâng cấp tiếp hộp gợi ý tìm kiếm nhanh để nó thực sự thông minh và có ích cho khách hàng:
- Thay vì ghi chung chung là "5 gợi ý" (không có nhiều ý nghĩa vì khách hàng tự đếm được), chúng ta sẽ hiện số lượng thực tế: *"Hiển thị 5 trong số X kết quả"* (trong đó X là tổng số lượng kết quả tìm thấy trong cơ sở dữ liệu cho từ khóa đó).
- Chúng ta sẽ tối ưu hóa câu lệnh ở máy chủ (Backend Convex) để đếm số lượng kết quả một cách nhanh nhất bằng các bộ chỉ mục (Index) sẵn có, tuyệt đối không tải toàn bộ dữ liệu ra rồi đếm để tránh làm chậm trang web.
- Thay thế cái hình emoji kính lúp `🔍` ở dòng chữ hướng dẫn dưới cùng bằng một biểu tượng kính lúp thực sự của bộ thư viện Lucide React để giao diện đồng bộ, sắc sảo và hiện đại hơn.

## 2. Elaboration & Self-Explanation
Yêu cầu nâng cấp này tác động đến cả tầng Backend (API Convex) và Frontend (Client site):
1. **Tầng Backend (Convex):**
   - Chúng ta sẽ nâng cấp schema trả về của API `api.search.autocomplete` trong [search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/search.ts).
   - Đổi schema `searchResult` để mỗi nhóm phân loại (`posts`, `products`, `services`) không chỉ là mảng gợi ý nữa, mà trở thành một đối tượng chứa: `items` (mảng tối đa 5 gợi ý) và `total` (tổng số kết quả khớp tìm thấy).
   - Hàm `collectMatches` sẽ được tối ưu hóa để trả về cả danh sách đã cắt `items` và tổng số lượng khớp `total` từ tập dữ liệu được index lọc.
   - Việc lọc và đếm hoàn toàn diễn ra thông qua `withSearchIndex` kết hợp với tập `take(200)` fallback index giúp tối ưu băng thông database (đạt chuẩn 7 Nguyên tắc DB Bandwidth Optimization), tránh tình trạng load ALL gây sập server.
2. **Tầng Frontend (Client):**
   - Cập nhật [HeaderSearchAutocomplete.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/HeaderSearchAutocomplete.tsx) để đọc dữ liệu theo cấu trúc mới: `items: data?.products.items` và `total: data?.products.total`.
   - Cập nhật Badge tiêu đề nhóm hiển thị rõ ràng: *"Hiển thị {items.length} trong số {total} kết quả"* hoặc rút gọn đẹp mắt *"Hiển thị {items.length} / {total}"*.
   - Ở dòng chữ hướng dẫn dưới cùng, thay thế emoji `🔍` bằng `<Search size={13} className="inline-block text-slate-500 align-middle -mt-0.5 mx-0.5" />`.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng bạn hỏi thủ thư xem thư viện có sách về "Lập trình" không. Thủ thư bê ra cho bạn 5 cuốn sách tiêu biểu và nói: *"Đây là 5 cuốn nổi bật trong số 42 cuốn sách lập trình hiện có tại thư viện. Nếu anh muốn xem tất cả 42 cuốn, xin mời nhấn vào nút này!"*. Bạn sẽ biết ngay quy mô kho sách của thư viện và dễ dàng đưa ra quyết định tìm kiếm tiếp theo.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **API File:** [search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/search.ts)
  - `suggestionItem` định nghĩa kiểu gợi ý.
  - `searchResult` định nghĩa kết quả trả về của `autocomplete`.
  - Hàm `collectMatches` hiện tại chỉ `slice` và trả về `T[]`.
- **Component File:** [HeaderSearchAutocomplete.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/HeaderSearchAutocomplete.tsx)
  - Đang đọc trực tiếp `data?.products` dưới dạng array.
  - Footer hiện tại đang dùng emoji `🔍`.

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:**
  1. Giao diện trước chỉ hiển thị số lượng item hiện có trong mảng gợi ý nhanh (luôn tối đa là 5), không cung cấp tổng số kết quả lọc thực tế `X` từ máy chủ.
  2. Dùng emoji `🔍` nhìn không đồng bộ với các icon Lucide React trên Header.
- **Giả thuyết đối chứng:** Có nên dùng `ctx.db.query().filter().collect().length` để đếm tổng?
  - *Đánh giá:* **Tuyệt đối cấm** vì sẽ vi phạm nguyên tắc DB Bandwidth Optimization (quét cạn bảng gây lãng phí RAM/CPU ở server Convex). Cách lấy `total` trực tiếp từ danh sách merged đã được lọc qua Index/Take(200) là tối ưu nhất, vừa chính xác tương đối vừa giữ vững tốc độ phản hồi cực nhanh cho autocomplete.

---

# IV. Proposal (Đề xuất)
1. **Sửa `convex/search.ts`:**
   - Thay đổi kiểu dữ liệu trả về `searchResult`:
     ```typescript
     const suggestionGroup = v.object({
       items: v.array(suggestionItem),
       total: v.number(),
     });
     const searchResult = v.object({
       posts: suggestionGroup,
       products: suggestionGroup,
       services: suggestionGroup,
     });
     ```
   - Sửa hàm `collectMatches`:
     ```typescript
     const collectMatches = <T extends { _id: string }>(
       initial: T[],
       fallback: T[],
       getSearchTexts: (item: T) => string[],
     ) => {
       const merged: T[] = [];
       const seen = new Set<string>();
       for (const item of [...initial, ...fallback]) {
         if (seen.has(item._id)) continue;
         seen.add(item._id);
         merged.push(item);
       }
       const ranked = rankByFuzzyMatches(merged, rawQuery, getSearchTexts, 42);
       return {
         items: ranked.slice(0, limit).map((entry) => entry.item),
         total: ranked.length,
       };
     };
     ```
   - Sửa cấu trúc trả về ở cuối API `autocomplete` để đóng gói dạng `{ items: buildSuggestions(...), total: productsResult.total }`.
2. **Sửa `components/site/HeaderSearchAutocomplete.tsx`:**
   - Cập nhật định nghĩa kiểu `AutocompleteResult`:
     ```typescript
     type SuggestionGroup = {
       items: SuggestionItem[];
       total: number;
     };
     type AutocompleteResult = {
       posts: SuggestionGroup;
       products: SuggestionGroup;
       services: SuggestionGroup;
     };
     ```
   - Cập nhật dòng map `sections`:
     ```typescript
     const sections = useMemo(() => ([
       { key: 'products', label: 'Sản phẩm', icon: Package, items: data?.products?.items ?? [], total: data?.products?.total ?? 0 },
       { key: 'posts', label: 'Bài viết', icon: FileText, items: data?.posts?.items ?? [], total: data?.posts?.total ?? 0 },
       { key: 'services', label: 'Dịch vụ', icon: Briefcase, items: data?.services?.items ?? [], total: data?.services?.total ?? 0 },
     ]), [data?.posts, data?.products, data?.services]);
     ```
   - Cập nhật Badge hiển thị tiêu đề nhóm:
     ```tsx
     <span>{section.label}</span>
     <span className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 rounded px-1.5 py-0.5 tracking-normal normal-case">
       Hiển thị {section.items.length} / {section.total} kết quả
     </span>
     ```
   - Thay thế emoji `🔍` bằng icon `<Search size={11} className="inline-block text-slate-500 align-middle -mt-0.5 mx-0.5" />`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa đổi:** [search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/search.ts)
  - *Thay đổi:* Nâng cấp kiểu trả về và tối ưu hóa logic fuzzy search trả về count.
- **Sửa đổi:** [HeaderSearchAutocomplete.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/components/site/HeaderSearchAutocomplete.tsx)
  - *Thay đổi:* Nhận kiểu dữ liệu mới, hiển thị nhãn gợi ý dạng "Hiển thị 5 / 12 kết quả", và đổi emoji kính lúp thành icon Lucide React.

---

# VI. Execution Preview (Xem trước thực thi)
1. Cập nhật schema và logic trong `convex/search.ts`.
2. Đồng bộ kiểu dữ liệu, badge label và thay đổi emoji thành Lucide icon trong `HeaderSearchAutocomplete.tsx`.
3. Kiểm tra kiểu tĩnh TypeScript (`bunx tsc --noEmit`).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
### Automated Verification
- Chạy typecheck: `bunx tsc --noEmit`.

### Manual Verification
- Gõ từ khóa tìm kiếm (ví dụ "hi"):
  - Xem bên cạnh tiêu đề nhóm `SẢN PHẨM` và `BÀI VIẾT` có hiển thị nhãn đẹp mắt: *"Hiển thị 5 / 12 kết quả"* hoặc tương tự không.
  - Xem dòng chữ hướng dẫn dưới cùng có hiển thị icon kính lúp Lucide sắc nét thay vì emoji `🔍` cũ không.
  - Nhấp vào nút footer hướng dẫn hoặc click kính lúp 🔍 để kiểm tra chuyển hướng hoạt động tốt.
