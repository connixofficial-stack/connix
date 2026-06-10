# I. Primer

## 1. TL;DR kiểu Feynman
* Chatbot AI khi nhận câu hỏi của khách (ví dụ: "tôi muốn mua websit3") sẽ mang toàn bộ câu này đi tìm trong database của trang web để làm tài liệu trả lời.
* Tuy nhiên, hệ thống tìm kiếm hiện tại (`autocomplete`) dùng bộ lọc khớp từ (`rankByFuzzyMatches`) rất chặt chẽ, vốn chỉ thiết kế cho việc gõ từ khóa ngắn trên thanh tìm kiếm (như "web", "logo").
* Khi so sánh cả câu hỏi dài của khách với tên sản phẩm (ví dụ: "Thiết kế website trọn gói"), bộ lọc tính ra điểm trùng khớp bằng 0 nên loại bỏ sản phẩm đó.
* Kết quả là chatbot luôn nhận được danh sách tài liệu trống rỗng từ database, trở nên "ngáo" và trả lời lung tung dựa vào trang hiện tại khách đang xem.
* Giải pháp: Nếu câu hỏi của khách dài (có nhiều từ), ta sẽ chuyển sang thuật toán so khớp từ khóa quan trọng (Token Overlap) thay vì so khớp nguyên câu, giúp tìm thấy dữ liệu liên quan ngay cả khi khách gõ câu dài hoặc có lỗi gõ sai nhẹ.

## 2. Elaboration & Self-Explanation
Hệ thống chatbot lấy ngữ cảnh bằng cách gọi hàm `api.search.autocomplete` của Convex. Hàm này thực hiện tìm kiếm full-text search trong cơ sở dữ liệu để tìm các bài viết, sản phẩm, dịch vụ liên quan, sau đó xếp hạng chúng bằng hàm `rankByFuzzyMatches` trong `convex/lib/search.ts`.

Hàm `rankByFuzzyMatches` sử dụng thang điểm chặt chẽ: nó so sánh toàn bộ chuỗi tìm kiếm (query) với từng từ đơn (token) trong tên sản phẩm/dịch vụ, hoặc kiểm tra xem query có phải là tiền tố, hoặc subsequence của tên sản phẩm/dịch vụ đó hay không. Với câu hỏi tự nhiên dài của người dùng chatbot, điều này hoàn toàn bất khả thi. Ví dụ, câu query "tôi muốn mua website" không thể là tiền tố hay subsequence của "Thiết kế website trọn gói", và cũng không thể có khoảng cách Levenshtein nhỏ hơn 2 khi so sánh với bất kỳ từ đơn nào trong tên sản phẩm. Vì vậy điểm số fuzzy trả về luôn là 0, thấp hơn ngưỡng tối thiểu là 42, dẫn đến việc toàn bộ dữ liệu khớp từ database bị lọc bỏ sạch sẽ.

Để khắc phục, chúng ta cần tối ưu hóa hàm tính điểm `scoreNormalizedText` trong `convex/lib/search.ts`:
- Nếu `query` chỉ là một từ đơn (không chứa khoảng trắng), giữ nguyên logic so khớp tiền tố/chứa/fuzzy nguyên bản để không ảnh hưởng đến tính năng gõ tìm kiếm autocomplete trên thanh tìm kiếm của website.
- Nếu `query` là một cụm từ/câu dài (có khoảng trắng), ta chuyển sang tính điểm theo tỷ lệ trùng khớp của các từ khóa quan trọng (Token Overlap). Ta sẽ lọc bỏ các từ dừng tiếng Việt phổ biến (như "tôi", "muốn", "mua", "bên", "bạn", "có", "là", "gì"...) và đếm xem có bao nhiêu từ khóa quan trọng trong câu hỏi của khách khớp (hoặc gần khớp fuzzy) với các từ trong tên sản phẩm/dịch vụ.

## 3. Concrete Examples & Analogies
* **Ví dụ cụ thể**:
  * Người dùng hỏi: "tôi muốn mua websit3" (có lỗi gõ sai chữ "website" thành "websit3").
  * Câu này được chuẩn hóa và tách từ quan trọng thành: `["websit3"]` (sau khi lọc bỏ từ dừng "toi", "muon", "mua").
  * Sản phẩm trong database: "Thiết kế website trọn gói" -> tách từ: `["thiet", "ke", "website", "tron", "goi"]`.
  * Thuật toán mới so sánh từ "websit3" với các từ trong sản phẩm. Từ "website" và "websit3" có khoảng cách Levenshtein là 1 (chữ 'e' thay bằng '3'). Do khoảng cách <= 1, thuật toán coi đây là một từ khớp fuzzy thành công.
  * Tỉ lệ khớp từ quan trọng: 1 / 1 = 100% (100 điểm) -> Vượt qua ngưỡng 42 điểm -> chatbot tìm thấy sản phẩm "Thiết kế website trọn gói" và sử dụng thông tin này để tư vấn cho khách.

* **Hình ảnh đời thường (Analogy)**:
  * Giống như bạn đi thư viện và hỏi thủ thư: "Tôi đang có nhu cầu tìm đọc cuốn sách dạy nấu ăn ngon".
  * **Thủ thư cũ (Fuzzy Match cũ)**: Bắt buộc tựa đề sách phải chứa nguyên cụm từ "Tôi đang có nhu cầu tìm đọc cuốn sách dạy nấu ăn ngon" hoặc tiêu đề sách phải là một từ giống hệt câu hỏi đó. Kết quả: Thủ thư bảo "Không có sách nào như vậy cả!" và chỉ cho bạn cuốn sách bạn đang cầm trên tay (Trang hiện tại).
  * **Thủ thư mới (Token Overlap)**: Bỏ qua các từ rác ("tôi", "đang", "có", "nhu", "cầu"...), giữ lại từ khóa quan trọng là "sách", "dạy", "nấu", "ăn". Sau đó tìm thấy cuốn "Nghệ thuật nấu ăn gia đình" vì có chứa từ "nấu", "ăn". Thủ thư gợi ý ngay cuốn sách đó cho bạn.

# II. Audit Summary (Tóm tắt kiểm tra)

* **Hiện trạng**:
  * Widget chatbot AI gọi API route `/api/ai-chat` ở Next.js, chuyển tiếp câu hỏi của user tới Convex action `api.aiChat.sendMessage`.
  * Convex action này gọi query `api.search.autocomplete` để tìm kiếm dữ liệu.
  * Hàm `autocomplete` sử dụng `rankByFuzzyMatches` để lọc kết quả tìm được từ full-text search index của các bảng `posts`, `products`, `services`, `courses`, `projects`, `resources`.
  * Ngưỡng lọc tối thiểu `minScore` là 42. Khi câu hỏi dài, điểm số luôn trả về 0 khiến toàn bộ kết quả biến mất.
  * Khi không có suggestions, Gemini API chỉ dựa vào `sourcePath` (ví dụ: `/resources/plasticity`) để trả lời dẫn đến câu trả lời lạc đề, ngớ ngẩn.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

* **Nguyên nhân gốc (Root Cause)**:
  * Thuật toán fuzzy match `scoreNormalizedText` trong [convex/lib/search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/search.ts#L60) được thiết kế khắt khe để phục vụ autocomplete ô tìm kiếm (nơi query rất ngắn). Khi nhận câu hỏi chatbot tự nhiên dài (query chứa nhiều từ), thuật toán so sánh cả câu query với các từ đơn của candidate, làm điểm số luôn bằng 0 và lọc bỏ sạch các kết quả tìm kiếm đúng từ database.

* **Giả thuyết đối chứng (Counter-Hypothesis)**:
  * Nếu nguyên nhân là do lỗi kết nối database hay cấu hình API key, chatbot sẽ báo lỗi 500 hoặc ném ra exception rõ ràng như "Chatbot AI đang tắt" hoặc "API key không hợp lệ". Thực tế chatbot vẫn trả lời bình thường nhưng nội dung trả lời lạc đề và báo "trang hiện tại bạn đang xem là về..." chứng tỏ kết nối db và API key hoàn toàn bình thường, chỉ có dữ liệu ngữ cảnh (suggestions) truyền vào prompt bị trống rỗng.

# IV. Proposal (Đề xuất)

* **Giải pháp**:
  * Bổ sung hàm `scoreNormalizedOverlap` vào [convex/lib/search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/search.ts). Hàm này sẽ:
    a) Tách câu query và tên sản phẩm/dịch vụ thành mảng các từ đơn (tokens).
    b) Lọc bỏ các từ dừng phổ biến trong tiếng Việt (tôi, muốn, mua, có, là, gì, bên, bạn...).
    c) So khớp từng từ quan trọng trong query với các từ trong tên sản phẩm/dịch vụ (cho phép sai lệch Levenshtein <= 1 đối với các từ dài >= 3 ký tự).
    d) Tính điểm dựa trên tỷ lệ phần trăm từ quan trọng khớp được: `(số từ khớp / tổng số từ quan trọng) * 100`.
  * Cập nhật `scoreNormalizedText` để phân nhánh logic:
    - Nếu query chứa khoảng trắng (tức là nhiều từ), sử dụng `scoreNormalizedOverlap`.
    - Ngược lại, giữ nguyên thuật toán so khớp nguyên bản của hệ thống.

# V. Files Impacted (Tệp bị ảnh hưởng)

* **Sửa**:
  * [convex/lib/search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/search.ts): Vai trò hiện tại là chứa các helper phục vụ tìm kiếm fuzzy. Sẽ được sửa để bổ sung hàm `scoreNormalizedOverlap` và cập nhật logic phân nhánh trong `scoreNormalizedText`.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc kỹ file [convex/lib/search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/search.ts).
2. Viết mã nguồn cho hàm `scoreNormalizedOverlap` và chèn vào trước `scoreNormalizedText`.
3. Thay đổi logic của `scoreNormalizedText` để kiểm tra số từ của query và phân nhánh.
4. Review tĩnh để đảm bảo cú pháp TypeScript chính xác, không dùng `any` và an toàn, không có lỗi runtime.

# VII. Verification Plan (Kế hoạch kiểm chứng)

### Automated Tests
* (Không tự chạy test do quy tắc cấm tự chạy lint/unit test).

### Manual Verification
* Người dùng có thể kiểm tra trực tiếp trên trình duyệt hoặc chạy thử trên môi trường dev:
  * Gõ hỏi chatbot câu hỏi dài: "Tôi muốn mua websit3" hoặc "tôi muốn mua website".
  * Chatbot hiển thị suggestions là dịch vụ/sản phẩm thiết kế website (nếu có trong db) và trả lời đúng trọng tâm về việc bán website, thay vì nói về trang hiện tại.

# VIII. Todo

- [ ] Tạo hàm `scoreNormalizedOverlap` trong [convex/lib/search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/search.ts).
- [ ] Cập nhật `scoreNormalizedText` trong [convex/lib/search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/search.ts) để phân nhánh xử lý câu hỏi nhiều từ.
- [ ] Review tĩnh toàn bộ thay đổi.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

* **Đạt**:
  * Chatbot tìm thấy các suggestions chính xác từ database đối với câu hỏi dài của người dùng.
  * Thuật toán tìm kiếm thông thường (autocomplete trên ô tìm kiếm khi gõ từ ngắn như "web") không bị ảnh hưởng, vẫn trả về kết quả khớp chính xác như cũ.
* **Không đạt**:
  * Chatbot vẫn trả về suggestions rỗng khi hỏi câu dài có chứa từ khóa của sản phẩm/dịch vụ có trong database.
  * Hoặc việc gõ tìm kiếm từ ngắn trên website bị lỗi hoặc không ra kết quả.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

* **Rủi ro**: Thay đổi nhỏ trong thuật toán tính điểm tìm kiếm, rủi ro thấp.
* **Hoàn tác**: Hoàn tác file [convex/lib/search.ts](file:///e:/NextJS/job/job_from_system_vietadmin/system_dohy/convex/lib/search.ts) về phiên bản trước thông qua git.

# XI. Out of Scope (Ngoài phạm vi)
* Thay đổi cấu trúc cơ sở dữ liệu (schema) hoặc giao diện widget chatbot (CSS/HTML).
* Thay đổi cách thức gọi API hoặc cấu hình Gemini trong admin panel.
