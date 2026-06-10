## Audit Summary
- Evidence 1: Route `http://localhost:3000/admin/products/:id/edit` map vào file `E:\NextJS\persional_project\system-nhan\app\admin\products\[id]\edit\page.tsx`.
- Evidence 2: Ô `Tên sản phẩm` hiện đang là một `Input` đơn, chưa có action phụ để copy nhanh.
- Evidence 3: Codebase đã có pattern copy clipboard trong admin, ví dụ:
  - `app/admin/promotions/page.tsx`: dùng `navigator.clipboard.writeText(...)`, icon `Copy/Check`, `toast.success/error`, reset state bằng `setTimeout`.
  - `app/admin/media/[id]/edit/page.tsx`: đặt nút copy nhỏ cạnh `Input`, dùng `Button variant="outline" size="icon"`.
- Evidence 4: Trang edit product đã dùng `toast` từ `sonner` và `lucide-react`, nên không cần thêm library mới.
- Gap hiện tại: chưa thấy helper copy dùng chung; thay đổi nhỏ nhất, đúng KISS/YAGNI là implement cục bộ ngay trong `app/admin/products/[id]/edit/page.tsx`.

## Root Cause Confidence
- High — nguyên nhân rất rõ: UI của trường `Tên sản phẩm` chỉ render `Input`, không có affordance copy clipboard dù admin có nhu cầu copy tên nhanh. Pattern kỹ thuật đã tồn tại ở module khác, nên đây là thiếu sót UI chứ không phải issue data/backend.

## Problem Graph
1. [Thiếu thao tác copy nhanh tên sản phẩm trên trang edit] <- depends on 1.1, 1.2
   1.1 [Field Tên sản phẩm chỉ có Input] <- depends on 1.1.1
      1.1.1 [ROOT CAUSE] `app/admin/products/[id]/edit/page.tsx` chưa render nút copy + handler clipboard cạnh ô tên
   1.2 [Cần bám pattern admin hiện có để tránh lệch UI/UX]

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: Thêm action nhỏ ngay cạnh input tên là blast radius thấp nhất.
   - Action: Sửa `app/admin/products/[id]/edit/page.tsx` để bọc field tên sản phẩm trong layout `flex gap-2`, giữ `Input` là phần tử co giãn chính, thêm nút icon nhỏ ở cạnh phải.
   - Reflection: ✓ Valid, không đụng schema/data flow.
2. Reuse admin copy pattern...
   - Thought: Nên giữ cùng hành vi với promotions/media để user quen.
   - Action: Import thêm `Copy` và `Check` từ `lucide-react`, tạo state `isNameCopied` hoặc `copiedField`, viết `handleCopyName` dùng `navigator.clipboard.writeText(name.trim())`.
   - Reflection: ✓ Valid, tận dụng API/browser pattern sẵn có.
3. Handle UX/edge cases...
   - Thought: Không nên cho copy chuỗi rỗng, và nên có feedback rõ.
   - Action: Disable nút khi `!name.trim()`, `title="Copy tên sản phẩm"`, success thì đổi icon sang `Check` trong ~2 giây + `toast.success('Đã copy tên sản phẩm')`; fail thì `toast.error('Không thể copy, vui lòng copy thủ công')`.
   - Reflection: ✓ Valid, đúng expectation của admin UI hiện tại.
4. Preserve existing behavior...
   - Thought: Ô tên hiện đang auto-generate slug khi gõ; không được làm vỡ flow này.
   - Action: Giữ nguyên `onChange` hiện tại của `Input`, chỉ thêm wrapper layout và nút copy, không thay logic slug.
   - Reflection: ✓ Valid, blast radius thấp.

## Counter-Hypothesis Check
- Giả thuyết đối chứng: Có thể nên tạo component dùng chung kiểu `CopyableInput` rồi tái sử dụng toàn admin.
- Vì sao chưa chọn: scope user chỉ yêu cầu thêm nút nhỏ ở ô tên sản phẩm; tạo abstraction lúc này là over-engineering, tăng blast radius và trái KISS/YAGNI. Nếu sau này nhiều form cần pattern giống nhau mới nên trích component.

## Proposal
- File thay đổi: `E:\NextJS\persional_project\system-nhan\app\admin\products\[id]\edit\page.tsx`
- Thay đổi cụ thể:
  1. Thêm import `Copy`, `Check` từ `lucide-react`.
  2. Thêm state copy ngắn hạn, ví dụ `const [isNameCopied, setIsNameCopied] = useState(false);`.
  3. Thêm `handleCopyName`:
     - nếu `!name.trim()` thì return
     - `await navigator.clipboard.writeText(name.trim())`
     - set copied state `true`
     - `toast.success('Đã copy tên sản phẩm')`
     - `setTimeout(() => setIsNameCopied(false), 2000)`
     - catch => `toast.error('Không thể copy, vui lòng copy thủ công')`
  4. Đổi block field tên sản phẩm từ `Input` đơn thành `div.flex`:
     - `Input` giữ nguyên `value`, `onChange`, `required`, `placeholder`, `autoFocus`
     - thêm `Button type="button" variant="outline" size="icon" className="shrink-0" onClick={handleCopyName} disabled={!name.trim()} title="Copy tên sản phẩm" aria-label="Copy tên sản phẩm"`
     - icon hiển thị `Check` khi copied, ngược lại `Copy`
- Không cần sửa backend, không cần sửa create page, không cần thêm reusable component ở bước này.

## Post-Audit
- Blast radius: thấp, chỉ 1 field ở 1 page admin.
- Regression risk: thấp, vì không sửa submit payload, query, mutation, validation, slug generation.
- Cost/complexity: rất thấp; đúng KISS/YAGNI/DRY vì reuse pattern hành vi sẵn có thay vì tạo abstraction mới.

## Verification Plan
- Typecheck: chạy `bunx tsc --noEmit` sau khi sửa theo rule dự án.
- Repro/UI:
  1. Mở `/admin/products/:id/edit` với sản phẩm có tên.
  2. Xác nhận nút copy nhỏ xuất hiện cạnh ô `Tên sản phẩm`.
  3. Click nút: clipboard nhận đúng `name.trim()`, hiện toast success, icon đổi sang `Check` rồi tự reset.
  4. Xóa trống tên: nút bị disabled.
  5. Gõ đổi tên sản phẩm: slug auto-generate vẫn hoạt động như cũ.
  6. Submit form: cập nhật sản phẩm vẫn chạy bình thường.
- Nếu user xác nhận implement, bước cuối task sẽ gồm typecheck + commit local theo rule repo.