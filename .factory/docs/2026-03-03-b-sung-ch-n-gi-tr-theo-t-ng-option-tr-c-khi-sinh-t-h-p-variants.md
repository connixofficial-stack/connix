## Problem Graph
1. [Giảm bùng nổ số tổ hợp khi option values lớn] <- depends on 1.1, 1.2
   1.1 [Thiếu bước chọn value theo từng option trước khi build cartesian]
   1.2 [Popup hiện build toàn bộ values active nên 10 màu x 3 size bị nặng UX]

## Execution (with reflection)
1. Thêm state chọn value theo từng option trong popup tạo nhanh
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Tạo state `selectedValueIdsByOption: Record<optionId, Set<valueId>>`.
  - Khi mở popup:
    - Mặc định chọn tất cả values active của từng option (theo quyết định của bạn).
  - Utility handlers:
    - toggle 1 value
    - chọn tất cả / bỏ chọn tất cả theo từng option
- Reflection: ✓ vẫn giữ hành vi cũ mặc định nhưng cho phép thu hẹp phạm vi tổ hợp.

2. Thêm khối UI “Chọn giá trị để sinh tổ hợp” ngay trên bảng
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Render 1 block mới đặt ngay trên bảng tổ hợp.
  - Mỗi option (Màu/Size/...) hiển thị:
    - tên option
    - danh sách checkbox values
    - nút nhanh “Chọn tất cả / Bỏ chọn” cho option đó.
  - Hiển thị badge/summary số value đang chọn mỗi option để user thấy nhanh.
- Reflection: ✓ đúng vị trí UX bạn yêu cầu, thao tác trực tiếp không qua modal phụ.

3. Đổi logic sinh tổ hợp: chỉ lấy values đã tick
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Trong `combinations` useMemo, thay vì dùng toàn bộ `optionValuesByOption`, lọc theo `selectedValueIdsByOption[optionId]`.
  - Nếu option nào không có value được chọn => `combinations=[]` và hiện cảnh báo ngắn trong popup.
- Reflection: ✓ giải quyết triệt để case 10 màu x 3 size bằng cách giới hạn ngay từ đầu vào.

4. Áp dụng rule reset rows khi thay đổi tick values
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - Giữ đúng quyết định của bạn: khi selected values đổi => reset lại rows theo tổ hợp mới.
  - Dựa vào `useEffect` hiện có phụ thuộc `combinations`; đảm bảo không cố preserve dữ liệu cũ.
  - Thêm copy nhỏ cảnh báo “Đổi bộ lọc sẽ làm mới danh sách tổ hợp”.
- Reflection: ✓ hành vi rõ ràng, tránh dữ liệu stale sai tổ hợp.

5. Đồng bộ summary counters
- File: `app/admin/products/[id]/variants/page.tsx`
- Thay đổi:
  - `selectionSummary.total` phản ánh số tổ hợp sau lọc.
  - Bổ sung dòng helper ngắn: `Đang lọc: X màu × Y size ...` (nếu nhiều option thì join động theo option name).
- Reflection: ✓ user hiểu ngay impact của việc tick/bỏ tick.

6. Kiểm thử
- Chạy: `bunx tsc --noEmit`.
- Test tay:
  - 10 màu x 3 size:
    - bỏ chọn 7 màu => tổng tổ hợp giảm đúng.
  - bỏ chọn toàn bộ 1 option => không tạo tổ hợp, có cảnh báo.
  - đổi tick values => rows reset đúng theo rule.
  - flow ghi đè/tạo mới và helper giá vẫn hoạt động.

7. Commit
- `git status` + `git diff --cached` để rà soát.
- Commit message đề xuất: `feat(products): add value-based combination filters for quick variant generation`
- Add kèm `.factory/docs` theo rule repo.

## Checklist
- [ ] Có khối chọn value theo từng option ngay trên bảng
- [ ] Mặc định chọn tất cả values active
- [ ] Sinh tổ hợp chỉ dựa trên values đã tick
- [ ] Đổi tick values sẽ reset rows theo tổ hợp mới
- [ ] Typecheck pass (`bunx tsc --noEmit`)