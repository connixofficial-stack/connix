# I. Primer

## 1. TL;DR kiểu Feynman
- Máy chủ (Server) và trình duyệt (Client) cần vẽ ra giao diện ban đầu giống hệt nhau (gọi là Hydration).
- Hiện tại, máy chủ luôn vẽ 3 phần tử quan trọng (Critical Components). Nhưng trình duyệt khi màn hình nhỏ (< 768px) lại cố khởi tạo và vẽ chỉ 1 phần tử quan trọng ngay từ đầu.
- Sự lệch pha này khiến React bối rối vì HTML không khớp, dẫn đến lỗi "Hydration Mismatch".
- Giải pháp: Bắt cả máy chủ và trình duyệt đều vẽ 3 phần tử lúc đầu. Sau khi trang tải xong (mounted), trình duyệt mới tự động đo màn hình và thu gọn về 1 phần tử nếu cần.

## 2. Elaboration & Self-Explanation
Lỗi xảy ra do cơ chế Hydration của React/Next.js. Khi Next.js chạy ở chế độ SSR (Server-Side Rendering), nó chạy code trên Server để tạo HTML gửi về Client. Trên Server không có đối tượng `window`, nên `criticalCount` được đặt mặc định là `MAX_CRITICAL_COMPONENTS` (giá trị là 3).
Khi HTML về tới Client, React trên Client sẽ chạy lượt render đầu tiên (hydration) để liên kết sự kiện vào DOM hiện có. Tại lượt này, Client chạy dòng khởi tạo state:
`const [criticalCount, setCriticalCount] = useState(() => typeof window === 'undefined' ? 3 : window.innerWidth < 768 ? 1 : 3)`
Vì Client có `window` và nếu kích thước màn hình < 768px, `criticalCount` sẽ được khởi tạo là `1`.
Điều này làm cho HTML do Client sinh ra trong lần render hydration bị khác biệt so với HTML Server gửi về (Client chỉ có 1 component, Server có 3 component). Vị trí của thẻ trigger ẩn `deferredTriggerRef` bị đẩy lên sớm hơn trên client, gây lệch cấu trúc DOM và sinh lỗi Hydration Mismatch.

## 3. Concrete Examples & Analogies
Hãy tưởng tượng Server là một kiến trúc sư vẽ sẵn một bản thiết kế ngôi nhà có 3 phòng ngủ (3 components) và 1 cái hố ga ẩn ở cuối hành lang (deferredTrigger).
Khi thợ xây (React trên Client) nhận bản thiết kế này trên một khu đất hẹp (màn hình nhỏ < 768px), thợ xây tự ý quyết định ngôi nhà chỉ nên có 1 phòng ngủ và đặt hố ga ẩn ngay sau phòng ngủ thứ nhất.
Khi React đối chiếu bản thiết kế gốc (DOM từ Server) với thực tế xây dựng (DOM trên Client), React nhận ra hố ga (deferredTrigger) nằm đè lên vị trí đáng lẽ là phòng ngủ thứ hai. React báo lỗi "Hydration failed" và phải đập đi xây lại toàn bộ giao diện trên Client.

# II. Audit Summary (Tóm tắt kiểm tra)
- Phát hiện lỗi Hydration Mismatch tại component [HomePageClient](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx) dòng 211.
- Triệu chứng: DOM Server render component thứ 2 có className `font-active py-4 md:py-6`, nhưng Client mong muốn render `deferredTriggerRef` có className `h-px w-px`.
- Phạm vi ảnh hưởng: Người dùng truy cập trang chủ trên thiết bị di động hoặc khi thu nhỏ trình duyệt < 768px.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc**: Sử dụng kiểm tra động `window.innerWidth` ngay trong hàm khởi tạo state ban đầu `useState` (dòng 31-36). Điều này vi phạm nguyên tắc "server-client branch" vì máy chủ không có `window` (render ra 3 components), còn máy khách có `window` và màn hình nhỏ (render ra 1 component).
- **Giả thuyết đối chứng**: Nếu lỗi do dữ liệu từ Convex không khớp, thì hydration mismatch sẽ xảy ra trên cả màn hình lớn (desktop). Tuy nhiên, trên desktop (window.innerWidth >= 768px), `criticalCount` ở cả server và client đều là 3, hydration diễn ra bình thường không lỗi. Do đó giả thuyết lệch dữ liệu bị loại trừ. Nguyên nhân chắc chắn do sự lệch pha của `criticalCount` trên thiết bị di động.

# IV. Proposal (Đề xuất)
Sửa đổi hàm khởi tạo state `criticalCount` trong [HomePageClient](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx) dòng 31:
- Khởi tạo giá trị tĩnh cố định là `MAX_CRITICAL_COMPONENTS` (3) bất kể ở server hay client.
- Giữ nguyên `useEffect` chạy sau khi mount ở dòng 97-103 để cập nhật lại `criticalCount` chính xác theo kích thước màn hình thực tế của client.

# V. Files Impacted (Tệp bị ảnh hưởng)
- Sửa: [HomePageClient.tsx](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/app/(site)/_components/HomePageClient.tsx)
  - Thay đổi logic khởi tạo state `criticalCount` để tránh kiểm tra `window` trong pha render đầu tiên.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kỹ lại phạm vi dòng 31-36 trong file.
2. Thực hiện sửa đổi bằng công cụ `replace_file_content` hoặc `multi_replace_file_content`.
3. Kiểm tra tĩnh lỗi TypeScript bằng `bunx tsc --noEmit`.
4. Xác nhận sự thay đổi DOM an toàn.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm tra tĩnh: Chạy `bunx tsc --noEmit` để đảm bảo code không có lỗi kiểu dữ liệu.
- Kiểm tra thủ công:
  - F12 giả lập giao diện Mobile (chiều rộng < 768px).
  - Refresh trang chủ và quan sát tab Console. Không còn lỗi "Hydration failed" hay "Hydration mismatch".

# VIII. Todo
- [ ] Chỉnh sửa logic khởi tạo state `criticalCount` trong `HomePageClient.tsx`.
- [ ] Chạy `bunx tsc --noEmit` để kiểm tra kiểu dữ liệu TypeScript.
- [ ] Xác nhận kiểm chứng thành công và commit code.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Code compile thành công không có lỗi TypeScript.
- Lỗi Hydration Mismatch biến mất hoàn toàn trên cả môi trường Desktop và Mobile.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro cực thấp vì thay đổi chỉ ảnh hưởng đến giá trị khởi tạo ban đầu của một state trước khi mount.
- Hoàn tác bằng cách dùng `git checkout` khôi phục lại file `HomePageClient.tsx` ban đầu.

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào các logic trì hoãn tải khác (`showDeferred`, `IntersectionObserver`) hay các component con khác.
