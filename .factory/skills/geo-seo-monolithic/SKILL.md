---
name: geo-seo-monolithic
description: Skill GEO-first SEO full scope (audit, citability, crawlers, llms.txt, brand mentions, platform optimization, schema, technical, content, report, report-pdf). Dùng khi user nói “geo”, “seo”, “audit”, “AI search”, “AI visibility”, “citability”, “llms.txt”, “schema”, “brand mentions” hoặc cung cấp URL cần phân tích.
allowed-tools: Read, Grep, Glob, WebSearch, FetchUrl
---

# GEO-SEO Monolithic Skill (2026)

**Triết lý:** GEO-first, SEO-supported. Tối ưu để nội dung được AI (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews) tìm thấy, hiểu, trích dẫn và khuyến nghị.

## Khi nào dùng
- User muốn audit GEO/SEO, đo citability, kiểm AI crawler, llms.txt, schema, E-E-A-T.
- User cung cấp URL website hoặc trang cụ thể cần đánh giá.

## Quick Reference

| Command | Mục đích | Output chính |
|---|---|---|
| `/geo audit <url>` | Full GEO + SEO audit | `GEO-AUDIT-REPORT.md` |
| `/geo quick <url>` | Snapshot nhanh (60s) | Inline summary |
| `/geo citability <url>` | Chấm điểm citability | `GEO-CITABILITY-SCORE.md` |
| `/geo crawlers <url>` | Kiểm robots.txt & AI crawler | `GEO-CRAWLER-ACCESS.md` |
| `/geo llmstxt <url>` | Phân tích/tạo llms.txt | `GEO-LLMSTXT-REPORT.md` + `llms.txt` |
| `/geo brands <url>` | Brand mentions | `GEO-BRAND-MENTIONS.md` |
| `/geo platforms <url>` | Tối ưu theo nền tảng AI | `GEO-PLATFORM-OPTIMIZATION.md` |
| `/geo schema <url>` | Schema analysis/generation | `GEO-SCHEMA-REPORT.md` + JSON-LD |
| `/geo technical <url>` | Technical SEO | `GEO-TECHNICAL-AUDIT.md` |
| `/geo content <url>` | Content + E-E-A-T | `GEO-CONTENT-ANALYSIS.md` |
| `/geo report <url>` | Client report tổng hợp | `GEO-CLIENT-REPORT.md` |
| `/geo report-pdf <url>` | PDF report | `GEO-REPORT.pdf` |

## Quy ước chung (bắt buộc)
1. **Respect robots.txt** trước khi crawl.
2. **Giới hạn crawl:** tối đa 50 trang, ưu tiên trang giá trị cao.
3. **Timeout:** 30s/trang, bỏ qua trang lỗi.
4. **Rate limit:** chờ 1s giữa các request.
5. **Chỉ phân tích HTML** (bỏ PDF, ảnh).
6. **Deduplicate URL** (http/https, www/non-www, trailing slash).

## Quy trình tổng quát (áp dụng cho /geo audit)
### Phase 1: Discovery
- Fetch homepage, nhận diện loại business: SaaS, Local, E-commerce, Publisher, Agency, Hybrid.
- Lấy sitemap (`/sitemap.xml` hoặc `/sitemap_index.xml`). Nếu không có, crawl internal links từ homepage.
- Lưu dữ liệu cơ bản: title, meta, H1-H6, word count, schema, links.

### Phase 2: Phân tích theo mô-đun (cùng trong 1 skill)
- **Citability:** chấm điểm passage theo rubric.
- **Crawlers:** check robots.txt cho AI crawler.
- **llms.txt:** kiểm tra/tạo file hướng dẫn AI.
- **Brand mentions:** presence trên Wikipedia, Reddit, YouTube, LinkedIn…
- **Platforms:** readiness theo ChatGPT, Perplexity, Google AIO, Gemini, Bing Copilot.
- **Schema:** phát hiện/đề xuất JSON-LD.
- **Technical:** SSR, CWV, HTTPS, indexability.
- **Content:** E-E-A-T, freshness, author credentials.

### Phase 3: Synthesis
- Tính **GEO Score** theo trọng số.
- Phân loại issue theo severity.
- Tạo action plan + quick wins.

## Công thức GEO Score
| Category | Weight |
|---|---|
| AI Citability & Visibility | 25% |
| Brand Authority | 20% |
| Content E-E-A-T | 20% |
| Technical Foundations | 15% |
| Structured Data | 10% |
| Platform Optimization | 10% |

```
GEO_Score = Citability*0.25 + Brand*0.20 + EEAT*0.20 + Technical*0.15 + Schema*0.10 + Platform*0.10
```

## Severity Taxonomy
| Level | Ý nghĩa |
|---|---|
| Critical | Chặn AI crawler, noindex, không có schema, SSR thiếu hoàn toàn |
| High | Thiếu llms.txt, thiếu author, AI bots chính bị block |
| Medium | Schema thiếu loại quan trọng, content mỏng |
| Low | Lỗi nhỏ về heading, OG tags, alt text |

---

## Chi tiết từng command

### /geo audit <url>
**Mục tiêu:** full GEO + SEO audit.

**Steps:**
1. Discovery (homepage + sitemap/internal links).
2. Chạy các mô-đun phân tích.
3. Tính GEO Score + action plan.

**Output:** `GEO-AUDIT-REPORT.md` gồm:
- Executive Summary + Score breakdown
- Critical/High/Medium/Low issues
- Category deep dives
- Quick wins + 30-day plan
- Appendix: pages analyzed

### /geo quick <url>
**Mục tiêu:** snapshot nhanh 60s.
**Output:** Inline summary (GEO Score ước lượng + 3 quick wins).

### /geo citability <url>
**Rubric (0-100):**
- Answer Block Quality (30%)
- Self-Containment (25%)
- Structural Readability (20%)
- Statistical Density (15%)
- Uniqueness & Original Data (10%)

**Output:** `GEO-CITABILITY-SCORE.md` (top/bottom blocks + rewrite suggestions).

### /geo crawlers <url>
**Mục tiêu:** kiểm robots.txt với AI crawler (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Bingbot...).
**Output:** `GEO-CRAWLER-ACCESS.md` bảng Allow/Block + khuyến nghị.

### /geo llmstxt <url>
**Mục tiêu:** kiểm/tạo llms.txt (mapping site structure, ưu tiên trang quan trọng).
**Output:** `GEO-LLMSTXT-REPORT.md` + file `llms.txt` sẵn sàng deploy.

### /geo brands <url>
**Mục tiêu:** đánh giá brand authority.
**Output:** `GEO-BRAND-MENTIONS.md` với presence map + hành động ưu tiên.

### /geo platforms <url>
**Mục tiêu:** tối ưu theo nền tảng AI.
**Output:** `GEO-PLATFORM-OPTIMIZATION.md` (score từng nền tảng + action).

### /geo schema <url>
**Mục tiêu:** phát hiện/đề xuất schema (Organization, LocalBusiness, Article, Product, WebSite + SearchAction).
**Output:** `GEO-SCHEMA-REPORT.md` + JSON-LD snippets.

### /geo technical <url>
**Mục tiêu:** technical SEO (SSR, CWV, HTTPS, indexability).
**Output:** `GEO-TECHNICAL-AUDIT.md`.

### /geo content <url>
**Mục tiêu:** E-E-A-T, freshness, author credentials, citations.
**Output:** `GEO-CONTENT-ANALYSIS.md`.

### /geo report <url>
**Mục tiêu:** tổng hợp báo cáo cho stakeholder.
**Output:** `GEO-CLIENT-REPORT.md` (business tone, action plan rõ ràng).

### /geo report-pdf <url>
**Mục tiêu:** xuất PDF chuyên nghiệp từ kết quả audit.
**Yêu cầu:** chạy `/geo audit` trước.
**Output:** `GEO-REPORT.pdf` (chart + score breakdown).

---

## Lưu ý triển khai
- Nếu dữ liệu thiếu (analytics/traffic), phải ghi rõ giả định.
- Không cam kết kết quả tuyệt đối; chỉ nêu ước lượng theo benchmark.
- Luôn ưu tiên “quick wins” có impact cao, effort thấp.
