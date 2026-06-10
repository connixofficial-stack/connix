# I. Primer

## 1. TL;DR kiểu Feynman
Khi bạn nhấn nút "Clear Analytics", hệ thống muốn xóa sạch mọi dữ liệu thống kê lượt truy cập của trang web. 
Tuy nhiên, cách làm hiện tại giống như việc bạn muốn dọn sạch một ngôi nhà bằng cách đi gom từng hạt bụi, rồi chạy ra thùng rác vứt từng hạt một. Nếu nhà có hàng triệu hạt bụi (lượt truy cập lớn), bạn sẽ bị kiệt sức trước khi dọn xong (gây tràn bộ nhớ, hết thời gian chạy và treo hệ thống).
Giải pháp là chúng ta sẽ "dùng chổi quét một lần" (gọi lệnh xóa sạch toàn bộ bảng thống kê) và gom rác theo từng túi lớn (xóa dữ liệu thô theo lô - batching) để dọn dẹp nhanh chóng và nhẹ nhàng hơn.

## 2. Elaboration & Self-Explanation
Hiện tại, khi thực hiện hành động clear dữ liệu Analytics:
1. Hệ thống fetch **tất cả** bản ghi `pageViews` lên bộ nhớ RAM cùng một lúc (`.collect()`). Điều này gây nguy cơ vượt giới hạn bộ nhớ của môi trường Convex V8 khi dữ liệu lớn.
2. Với mỗi bản ghi, hệ thống gọi `deletePageViewAggregates` để trừ dần thống kê ở 6 chiều khác nhau (thiết bị, trình duyệt, hệ điều hành, nguồn truy cập, đường dẫn, thời gian). Điều này tạo ra hàng nghìn transaction write nhỏ không cần thiết trong cùng một mutation, dễ gây ra lỗi OCC (Optimistic Concurrency Control) hoặc Timeout của Convex.
3. Tương tự với bảng `pageViewSessionBuckets`.

**Giải pháp đề xuất:**
- Tận dụng hàm `.clearAll(ctx)` có sẵn của component `@convex-dev/aggregate` để xóa sạch toàn bộ các cây thống kê (thay vì trừ từng bản ghi).
- Xóa các bản ghi thô trong bảng `pageViews` và `pageViewSessionBuckets` bằng kỹ thuật batching (chia nhỏ ra để xóa bằng vòng lặp `.take(500)`), giúp giải phóng bộ nhớ và hoạt động trơn tru bất kể kích thước bảng.

## 3. Concrete Examples & Analogies
Giả sử website của bạn có **10,000 lượt truy cập** (`pageViews`).
- **Cách cũ:** Đọc 10,000 bản ghi vào RAM. Với mỗi bản ghi, gửi 6 yêu cầu cập nhật lên 6 bảng thống kê khác nhau để trừ đi 1. Tổng cộng hệ thống phải thực hiện **60,000 lần cập nhật** DB + 10,000 lần xóa bản ghi thô. Hàm này chắc chắn sẽ bị báo lỗi Timeout (quá thời gian xử lý) hoặc Transaction Limit.
- **Cách mới:** 
  - Gửi đúng 6 yêu cầu xóa sạch (gọi `clearAll` trên 6 chiều thống kê).
  - Chia 10,000 bản ghi thô thành 20 đợt (mỗi đợt 500 bản ghi) và xóa lần lượt trong vòng lặp. Cực kỳ nhanh và an toàn.

---

# II. Audit Summary (Tóm tắt kiểm tra)
- **Triệu chứng quan sát được:** Nút "Clear" cho module Analytics hoạt động bình thường với số lượng dữ liệu cực nhỏ (khi test), nhưng chứa rủi ro nghiêm trọng khi dữ liệu thực tế (production) tăng lên do thiết kế không tối ưu băng thông DB và transaction limits.
- **Root Cause Confidence (Độ tin cậy nguyên nhân gốc):** **High** (Đã xác minh qua cấu trúc code của [analytics.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/seeders/analytics.seeder.ts) và API của `@convex-dev/aggregate` trong [index.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/node_modules/@convex-dev/aggregate/src/client/index.ts)).

---

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Nguyên nhân gốc:**
  1. Sử dụng `.collect()` tải toàn bộ bảng `pageViews` và `pageViewSessionBuckets` vào RAM.
  2. Cập nhật denormalized aggregates bằng cách gọi `deleteIfExists` N+1 lần cho từng item đơn lẻ thay vì reset/clear toàn bộ.
- **Giả thuyết đối chứng:** 
  - Nếu ta chỉ xóa bản ghi thô trong DB và gọi `clearAll` trên TableAggregate, các con số thống kê trên UI của Analytics có hiển thị đúng về 0 hay không? Có, vì `clearAll` sẽ xóa sạch các nodes của btree trong component aggregate, đưa count và sum về 0.

---

# IV. Proposal (Đề xuất)
1. Thêm hàm `clearAllPageViewAggregates(ctx)` vào [pageViews.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/lib/aggregates/pageViews.ts) để dọn dẹp sạch toàn bộ các TableAggregate đồng thời.
2. Refactor hàm `clear()` trong [analytics.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/seeders/analytics.seeder.ts):
   - Gọi `clearAllPageViewAggregates` thay vì loop qua từng pageView để xóa aggregate.
   - Thay thế `.collect()` bằng vòng lặp `while` kết hợp `.take(500)` để xóa bản ghi thô theo lô (batch deletion) cho cả `pageViews` và `pageViewSessionBuckets`.

---

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** [pageViews.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/lib/aggregates/pageViews.ts)
  - *Vai trò:* Quản lý các cấu trúc TableAggregate của pageViews.
  - *Thay đổi:* Định nghĩa và export thêm hàm `clearAllPageViewAggregates`.
- **Sửa:** [analytics.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/seeders/analytics.seeder.ts)
  - *Vai trò:* Cung cấp phương thức seed và clear dữ liệu Analytics.
  - *Thay đổi:* Cập nhật logic trong hàm `clear()` để sử dụng dọn dẹp aggregate hàng loạt và xóa bản ghi thô theo lô.

---

# VI. Execution Preview (Xem trước thực thi)
1. Đọc kĩ code và import của [pageViews.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/lib/aggregates/pageViews.ts).
2. Thêm hàm `clearAllPageViewAggregates` vào cuối file.
3. Cập nhật [analytics.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/seeders/analytics.seeder.ts):
   - Thay đổi các import tương ứng.
   - Viết lại hàm `clear()` theo hướng tối ưu batching và clearAll.
4. Chạy kiểm tra tĩnh và TypeScript compiler (`bunx tsc --noEmit`).

---

# VII. Verification Plan (Kế hoạch kiểm chứng)
- **Typecheck:** Chạy lệnh `bunx tsc --noEmit` để đảm bảo code Convex tương thích tốt và không bị lỗi kiểu dữ liệu.
- **Manual Verification:** Bấm nút "Clear Analytics" trên UI `http://localhost:3000/system/data` để đảm bảo hệ thống xóa sạch dữ liệu pageViews thành công mà không gặp lỗi transaction abort.

---

# VIII. Todo
- [ ] Thêm `clearAllPageViewAggregates` vào [pageViews.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/lib/aggregates/pageViews.ts).
- [ ] Refactor logic clear trong [analytics.seeder.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thanshoes/convex/seeders/analytics.seeder.ts).
- [ ] Chạy typecheck `bunx tsc --noEmit` để xác nhận.

---

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- Hàm clear Analytics hoạt động tốt, dọn sạch dữ liệu trong bảng `pageViews`, `pageViewSessionBuckets` và các aggregates tương ứng.
- Không còn bất kỳ cuộc gọi `deletePageViewAggregates` đơn lẻ nào trong vòng lặp của seeder clear.
- Không còn sử dụng `.collect()` trong hàm clear của AnalyticsSeeder.

---

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- **Rủi ro:** Nếu aggregate component gặp trục trặc khi chạy `clearAll`, thống kê có thể bị lệch. Tuy nhiên, API `clearAll` của component `@convex-dev/aggregate` là API chính thức và rất ổn định.
- **Hoàn tác:** Khôi phục lại phiên bản cũ của 2 file bằng `git checkout`.

---

# XI. Out of Scope (Ngoài phạm vi)
- Không can thiệp vào các logic ghi nhận lượt truy cập (track page views) của storefront hay dashboard.
- Không refactor các seeder của các module khác trừ khi có yêu cầu thêm.
