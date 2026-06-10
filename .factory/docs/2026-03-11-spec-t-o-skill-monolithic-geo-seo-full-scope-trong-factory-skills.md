## Audit Summary
**Observation (evidence đã thu thập):**
- Đã websearch + đọc trực tiếp repo `zubair-trabzada/geo-seo-claude` và thư mục `skills`.
- Kiến trúc gốc gồm `geo/SKILL.md` (orchestrator) + 11 sub-skills; command set đầy đủ gồm `/geo audit`, `/geo quick`, `/geo citability`, `/geo crawlers`, `/geo llmstxt`, `/geo brands`, `/geo platforms`, `/geo schema`, `/geo technical`, `/geo content`, `/geo report`, `/geo report-pdf`.
- Mẫu SKILL gốc dùng frontmatter `name`, `description`, `allowed-tools` + nội dung workflow chi tiết, rubric scoring, output format markdown.
- Skill cục bộ của dự án (`docs-seeker`, `skill-writer`) yêu cầu: mô tả trigger rõ ràng, scope tập trung, format SKILL.md chuẩn, hướng dẫn theo bước, output rõ ràng.

**User decisions đã chốt:**
- Kiến trúc: **1 skill monolithic duy nhất**.
- Scope v1: **đầy đủ như geo-seo-claude**.
- Ngôn ngữ: **Tiếng Việt**.
- Vị trí: **`.factory/skills` (project)**.

## Root Cause Confidence
**High** — vì yêu cầu đã rõ ràng, không còn ambiguity về scope/kiến trúc/ngôn ngữ/vị trí.
- Không có xung đột kỹ thuật: repo đã có pattern skill markdown tương thích.
- Tradeoff đã được user chấp nhận: monolithic sẽ dài và khó tách module hơn, nhưng đúng theo yêu cầu hiện tại.

## Proposal (kế hoạch implement chi tiết)
1. **Tạo skill mới trong project skills**
   - Thư mục dự kiến: `.factory/skills/geo-seo-monolithic/`.
   - File chính: `.factory/skills/geo-seo-monolithic/SKILL.md`.

2. **Soạn frontmatter theo chuẩn skill-writer**
   - `name: geo-seo-monolithic`
   - `description`: mô tả rõ “GEO-first SEO full audit + 12 commands + khi nào nên dùng”.
   - `allowed-tools`: chỉ khai báo tool cần thiết cho workflow phân tích (Read/Grep/Glob/WebSearch/FetchUrl/Execute nếu cần scripts nội bộ).

3. **Port toàn bộ command set từ geo-seo-claude vào 1 SKILL.md (bản Việt hóa)**
   - Giữ đầy đủ 12 command tương đương:
     - `/geo audit <url>`
     - `/geo quick <url>`
     - `/geo citability <url>`
     - `/geo crawlers <url>`
     - `/geo llmstxt <url>`
     - `/geo brands <url>`
     - `/geo platforms <url>`
     - `/geo schema <url>`
     - `/geo technical <url>`
     - `/geo content <url>`
     - `/geo report <url>`
     - `/geo report-pdf <url>`
   - Do là monolithic: thay “delegate sub-skill/subagent” bằng các **section workflow nội bộ** trong cùng file.

4. **Nhúng rubric & scoring hợp nhất trong cùng skill**
   - Rubric citability (answer block, self-contained, structure, stats, uniqueness).
   - Composite GEO score có trọng số rõ ràng.
   - Severity taxonomy (Critical/High/Medium/Low).

5. **Định nghĩa output contract rõ ràng**
   - Tên file output theo từng command (GEO-AUDIT-REPORT.md, GEO-CITABILITY-SCORE.md, GEO-CLIENT-REPORT.md, GEO-REPORT.pdf...).
   - Mẫu markdown khung báo cáo để đảm bảo nhất quán.

6. **Tối ưu cho repo hiện tại**
   - Viết tiếng Việt có dấu, bám phong cách nội bộ.
   - Không tạo tài liệu ngoài scope (không README/docs phụ).
   - Chỉ tạo đúng 1 skill monolithic theo yêu cầu.

7. **Static self-review trước bàn giao**
   - Kiểm tra YAML frontmatter hợp lệ.
   - Kiểm tra name/description trigger khớp mục tiêu.
   - Kiểm tra tất cả command có workflow + output tương ứng.

8. **Commit theo guideline repo**
   - Commit local (không push), message ngắn gọn theo convention.

## Verification Plan
- **Typecheck/Test:** không áp dụng cho markdown skill (không chạy lint/test theo guideline hiện tại của repo).
- **Repro/Functional check (manual, tĩnh):**
  1. Mở SKILL.md xác nhận frontmatter parse được.
  2. Soát 12 command có mặt đầy đủ, không thiếu.
  3. Soát output filenames + scoring formulas + severity matrix.
  4. Soát trigger phrase trong `description` để skill dễ được gọi đúng ngữ cảnh.

Nếu bạn duyệt spec này, mình sẽ bắt đầu tạo ngay skill monolithic tại `.factory/skills/geo-seo-monolithic/SKILL.md`.