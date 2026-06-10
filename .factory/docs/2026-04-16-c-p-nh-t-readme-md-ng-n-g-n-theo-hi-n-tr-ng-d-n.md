# I. Primer
## 1. TL;DR kiểu Feynman
- Mình sẽ viết lại `README.md` theo bản **ngắn gọn**, **100% tiếng Việt**, tập trung local/dev.
- Chỉ giữ thông tin cần để dev mới chạy dự án nhanh: yêu cầu, cài đặt, lệnh chính, đường dẫn chính.
- Loại bỏ phần dài dòng/roadmap/contributing không cần thiết cho mục tiêu hiện tại.
- Không thêm mục troubleshooting Vercel theo đúng yêu cầu của bạn.

## 2. Elaboration & Self-Explanation
- README hiện tại có nhiều phần hữu ích nhưng khá dài và chứa một số nội dung không còn “core setup”.
- Mục tiêu bạn chọn là “setup nhanh + lệnh chính”, nên README mới sẽ được tối giản để ai mở repo cũng chạy được trong vài phút.
- Mình sẽ bám đúng scripts có trong `package.json` (`dev`, `build`, `start`, `lint`) và mô tả lại cấu trúc chính ở mức vừa đủ.

## 3. Concrete Examples & Analogies
- Ví dụ nội dung sẽ giữ: `bun install` → `bunx convex dev` → `bun run dev` + route `/` và `/system`.
- Ví dụ nội dung sẽ bỏ: roadmap dài, phần đóng góp chi tiết, thông tin hỗ trợ không phục vụ setup local.
- Analogy: README mới giống “tờ checklist trước khi cất cánh”, chỉ giữ bước bắt buộc để máy bay bay được.

# II. Audit Summary (Tóm tắt kiểm tra)
- **Observation:** README hiện tại dài, gồm nhiều mục mở rộng (roadmap, migration, contributing, support).
- **Observation:** `package.json` xác nhận stack chính và script đang dùng thực tế.
- **Decision:** Viết lại README theo format tối giản, bám trạng thái repo hiện tại, ưu tiên onboarding nhanh.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)
- **Root Cause Confidence: High**
- Vấn đề chính không phải sai kỹ thuật, mà là **mismatch mục tiêu tài liệu**: README hiện tại thiên “đầy đủ”, trong khi nhu cầu hiện tại là “ngắn gọn để chạy nhanh”.
- **Giả thuyết đối chứng:** “Giữ README dài vì đầy đủ thông tin sẽ tốt hơn” — phù hợp cho docs tổng hợp, nhưng không phù hợp mục tiêu onboarding nhanh mà bạn vừa chọn.

# IV. Proposal (Đề xuất)
- Sửa `README.md` theo bố cục ngắn:
  1. Giới thiệu 1 đoạn ngắn về dự án.
  2. Tech stack (rút gọn).
  3. Yêu cầu môi trường.
  4. Cài đặt & chạy local (command copy-paste được ngay).
  5. Scripts chính.
  6. Cấu trúc thư mục chính (rút gọn).
- Không thêm troubleshooting Vercel.
- Không đụng code/app logic.

# V. Files Impacted (Tệp bị ảnh hưởng)
- **Sửa:** `README.md`
  - Vai trò hiện tại: tài liệu tổng hợp khá đầy đủ cho dự án.
  - Thay đổi: tinh gọn thành quickstart local/dev bằng tiếng Việt, bỏ các mục ngoài mục tiêu hiện tại.

# VI. Execution Preview (Xem trước thực thi)
1. Đọc lại README hiện tại để giữ thông tin còn đúng.
2. Viết lại cấu trúc README ngắn gọn theo yêu cầu đã chốt.
3. Đối chiếu script/route với `package.json` và cấu trúc repo.
4. Static self-review để tránh thông tin sai hoặc lệnh không tồn tại.

# VII. Verification Plan (Kế hoạch kiểm chứng)
- Kiểm chứng tài liệu (không chạy lint/test/build):
  1. Mọi lệnh trong README tồn tại trong dự án.
  2. Trình tự setup hợp lý cho dev mới.
  3. Nội dung đúng scope local/dev, không lan sang deployment troubleshooting.

# VIII. Todo
1. Tinh gọn README theo format quickstart.
2. Đồng bộ lệnh với `package.json`.
3. Rà soát ngôn ngữ 100% tiếng Việt, rõ ràng, ngắn.
4. Bàn giao nội dung README mới.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)
- README mới ngắn gọn, đọc trong ~2–5 phút là chạy local được.
- Nội dung 100% tiếng Việt.
- Có đủ lệnh setup/các script chính đang tồn tại thật.
- Không có mục Vercel troubleshooting.

# X. Risk / Rollback (Rủi ro / Hoàn tác)
- Rủi ro: lược bớt quá tay có thể thiếu thông tin cho một số luồng ít dùng.
- Hoàn tác: khôi phục README cũ từ git nếu team cần bản đầy đủ.

# XI. Out of Scope (Ngoài phạm vi)
- Không chỉnh code, không chỉnh cấu hình runtime.
- Không thêm tài liệu khác ngoài `README.md`.
- Không thêm hướng dẫn deploy/Vercel.

# XII. Open Questions (Câu hỏi mở)
- Không còn câu hỏi mở; yêu cầu đã đủ rõ để triển khai.