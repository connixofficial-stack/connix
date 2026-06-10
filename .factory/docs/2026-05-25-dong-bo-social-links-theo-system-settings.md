# SPEC: Đồng bộ hiển thị mạng xã hội theo cấu hình hệ thống

# I. Primer

## 1. TL;DR kiểu Feynman
*   **Vấn đề:** Khi bạn tắt các tính năng mạng xã hội như Instagram, Youtube, TikTok ở trang cấu hình nhà phát triển `/system/modules/settings`, các biểu tượng này vẫn hiện ở trang liên hệ `/contact`.
*   **Tại sao:** Vì trang liên hệ chỉ kiểm tra xem trong cơ sở dữ liệu có giá trị URL cho các mạng xã hội đó hay không. Dù đã tắt trường nhập liệu đi, giá trị cũ (URL) vẫn nằm trong database và trang liên hệ vẫn lôi ra hiển thị.
*   **Giải pháp:** Chúng ta sẽ sửa lại trang liên hệ và footer để trước khi hiển thị, chúng phải kiểm tra xem các trường đó có đang được bật (`enabled === true`) trong cấu hình hệ thống hay không. Nếu trường đó bị tắt, icon tương ứng sẽ biến mất ngay lập tức.

## 2. Elaboration & Self-Explanation
Hệ thống quản lý của chúng ta được thiết kế theo dạng dynamic modular (cấu hình động). Mỗi trường dữ liệu nhập vào (ví dụ: `social_instagram`) được định nghĩa trong bảng `moduleFields` và có trạng thái `enabled` (bật/tắt) điều khiển thông qua trang cấu hình hệ thống `/system/modules/settings`.
Khi admin hệ thống tắt một trường dữ liệu (chuyển sang `disabled`), giao diện admin sẽ ẩn trường đó đi để tránh nhập liệu. Tuy nhiên, giá trị đã lưu trước đó của trường này trong bảng `settings` vẫn còn lưu giữ trong database.
Hiện tại, trang liên hệ `/contact` và Footer của trang web chỉ đọc giá trị từ bảng `settings` để quyết định có hiển thị icon hay không. Do không kiểm tra trạng thái `enabled` từ bảng `moduleFields`, các icon vẫn xuất hiện do giá trị lịch sử vẫn còn.
Để khắc phục triệt để, chúng ta cần liên kết logic hiển thị của frontend với trạng thái cấu hình của trường hệ thống. Cụ thể, ta sẽ truy vấn danh sách các trường đang được bật (`listEnabledModuleFields`) và đối chiếu với danh sách các link mạng xã hội trước khi render.

## 3. Concrete Examples & Analogies
*   **Ví dụ cụ thể:** Trong database, trường `social_instagram` đang lưu giá trị `"https://instagram.com/thienkimwine"`. Khi nhà phát triển vào `/system/modules/settings` tắt "Instagram" (tương ứng trường `social_instagram` có `enabled = false`). 
    *   *Hiện tại:* Trang `/contact` vẫn thấy có URL nên vẫn hiện nút Instagram.
    *   *Sau khi sửa:* Trang `/contact` thấy trường `social_instagram` có `enabled = false` nên sẽ ẩn nút Instagram đi ngay lập tức, bất kể trong DB có lưu URL hay không.
*   **Liên hệ thực tế:** Giống như một cửa hàng có bảng hiệu hiển thị danh sách các món ăn. Khi một món ăn hết nguyên liệu, chủ quán tắt công tắc đèn chiếu sáng của món đó trên bảng hiệu. Mặc dù tên món ăn vẫn được viết trên bảng, nhưng vì đèn đã tắt nên khách hàng không nhìn thấy và không gọi món đó nữa.

# II. Audit Summary (Tóm tắt kiểm tra)
*   **Trang liên hệ `/contact`:** Nhận dữ liệu thông qua hook `useContactPageData.ts`. Hook này hiện tại chỉ query bảng `settings` nhóm `social` và `contact` để render danh sách `socialLinks`.
*   **Footer trang web:** Nhận dữ liệu thông qua hook `useSocialLinks` trong `components/site/hooks.ts` để hiển thị các icon ở chân trang. Hook này cũng chỉ query bảng `settings` trực tiếp mà không check cấu hình trường.
*   **Bảng cấu hình `moduleFields`:** Lưu giữ trạng thái `enabled: true/false` cho từng trường. API `api.admin.modules.listEnabledModuleFields` có sẵn để lấy toàn bộ các trường đang được bật của một module.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
*   **Nguyên nhân gốc (Root Cause):** Cả hook `useContactPageData.ts` (dùng cho trang `/contact`) và hook `useSocialLinks` (dùng cho Footer) đều bị thiếu bước kiểm tra chéo (cross-reference) với trạng thái `enabled` của các trường cấu hình trong bảng `moduleFields` của module `settings`.
*   **Giả thuyết đối chứng (Counter-Hypothesis):** Nếu chúng ta xóa hoàn toàn giá trị URL trong database khi tắt trường thì sao? -> Không tối ưu vì nếu sau này admin muốn bật lại thì sẽ phải nhập lại URL từ đầu, làm giảm trải nghiệm người dùng và vi phạm nguyên tắc "dễ rollback". Do đó, việc ẩn/hiện ở frontend dựa trên trạng thái cấu hình là giải pháp hoàn hảo và an toàn nhất.

# IV. Proposal (Đề xuất)
1.  **Cập nhật hook `useContactPageData.ts`:**
    *   Query thêm `listEnabledModuleFields` của module `settings`.
    *   Trong `socialLinks` `useMemo`, chỉ giữ lại các mạng xã hội có URL và có key nằm trong danh sách các trường đang được enable.
2.  **Cập nhật hook `useSocialLinks` trong `components/site/hooks.ts`:**
    *   Tương tự, query thêm `listEnabledModuleFields` của module `settings` (ngoại trừ trường hợp chạy Demo Snapshot).
    *   Chỉ trả về giá trị URL của mạng xã hội nếu trường tương ứng đang được enable trong hệ thống.

# V. Files Impacted (Tệp bị ảnh hưởng)
*   `Sửa:` [useContactPageData.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/useContactPageData.ts)
    *   *Vai trò:* Cung cấp dữ liệu (bao gồm social links) cho trang liên hệ `/contact`.
    *   *Thay đổi:* Query thêm `listEnabledModuleFields` của module `settings` và lọc các social link chưa được enable.
*   `Sửa:` [hooks.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_thienkim/components/site/hooks.ts)
    *   *Vai trò:* Cung cấp hook `useSocialLinks` dùng để hiển thị icons ở Footer và các nơi khác.
    *   *Thay đổi:* Lọc các social links trả về dựa trên các trường `enabled` của module `settings` thu được từ DB.

# VI. Execution Preview (Xem trước thực thi)
1.  Đọc kỹ mã nguồn hai file mục tiêu để xác định các import và vị trí viết code tối ưu.
2.  Sửa đổi `components/site/useContactPageData.ts` để tích hợp `listEnabledModuleFields` và lọc mạng xã hội.
3.  Sửa đổi `components/site/hooks.ts` tại hook `useSocialLinks` để áp dụng logic lọc tương ứng.
4.  Tiến hành rà soát tĩnh (static review) kiểm tra kiểu dữ liệu (TypeScript) và lỗi cú pháp.

# VII. Verification Plan (Kế hoạch kiểm chứng)
*   **Tự động kiểm tra Typecheck:** Chạy lệnh `bunx tsc --noEmit` để đảm bảo code biên dịch thành công mà không có lỗi TypeScript.
*   **Kiểm chứng thủ công (User thực hiện):**
    1.  Vào trang cấu hình hệ thống `/system/modules/settings`.
    2.  Bật/tắt thử các trường như Instagram, YouTube, TikTok.
    3.  F5 lại trang liên hệ `/contact` và Footer trang web để xác nhận các icon tương ứng ẩn/hiện chính xác theo cấu hình.

# VIII. Todo
- [x] Cập nhật `components/site/useContactPageData.ts`
- [x] Cập nhật hook `useSocialLinks` trong `components/site/hooks.ts`
- [x] Chạy `bunx tsc --noEmit` để typecheck

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
*   **Đạt:** Khi một trường mạng xã hội (ví dụ: Instagram) bị tắt (disabled) ở `/system/modules/settings`, icon Instagram phải biến mất hoàn toàn ở cả trang `/contact` và Footer của trang web. Khi được bật lại, icon phải xuất hiện lại với đúng URL đã cấu hình.
*   **Không đạt:** Icon vẫn hiển thị mặc dù trường tương ứng đã bị tắt trong hệ thống, hoặc xảy ra lỗi trắng trang/lỗi TypeScript.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
*   **Rủi ro:** Khi chạy snapshot demo (không dùng dữ liệu thật từ DB), các query Convex có thể trả về `undefined` hoặc bỏ qua.
*   *Giải pháp giảm thiểu:* Chúng ta đã thêm cơ chế kiểm tra `skipSocial && skipContact` để tự động giả định tất cả các trường đều được enable khi chạy demo snapshot, giúp giao diện demo luôn hiển thị đầy đủ và không bị lỗi.
*   **Rollback:** Dễ dàng hoàn tác bằng git checkout nếu có bất kỳ sự cố nào xảy ra.

# XI. Out of Scope (Ngoài phạm vi)
*   Không thay đổi cấu trúc dữ liệu hoặc schema của cơ sở dữ liệu.
*   Không can thiệp vào trang chỉnh sửa cấu hình `/system/modules/settings` và trang admin `/admin/settings`.
