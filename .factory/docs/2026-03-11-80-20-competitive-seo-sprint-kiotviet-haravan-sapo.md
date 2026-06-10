## Audit Summary

### Observation (evidence)
- Đối thủ đều đẩy mạnh **content hub + multi-landing theo intent/ngành**:
  - Haravan: cụm `/features`, `/solutions`, `/use-cases`, `/integrations`, blog + theme catalog rất dày.
  - Sapo: cụm solution pages theo ngành/nghiệp vụ + blog + help center tách riêng.
  - KiotViet: WordPress content volume lớn, sitemap rất sâu theo tháng/năm, phủ intent rộng.
- Cả 3 đều có **robots/sitemap rõ ràng** và cấu trúc crawl-friendly.
- Dự án hiện tại của anh đã có nền kỹ thuật SEO khá tốt:
  - `app/robots.ts`, `app/sitemap.ts`
  - `lib/seo/schema-policy.ts`, `lib/seo/llms.ts`, `lib/seo/internal-links.ts`
  => Nền đã có, cơ hội 80/20 là **tăng coverage + chất lượng tín hiệu**, không cần rewrite kiến trúc.

### Inference
- Thứ đối thủ đang hơn chủ yếu không phải “kỹ thuật quá đặc biệt”, mà là:
  1) Độ phủ URL theo intent,
  2) Internal linking theo cụm,
  3) Freshness content liên tục,
  4) Tín hiệu trust/commercial rõ trên từng landing.
- Với mục tiêu anh chọn (**tăng organic traffic**) + chấp nhận đổi code linh hoạt theo ROI, hướng tốt nhất là tăng tín hiệu kỹ thuật ngay trên khung có sẵn.

### Decision (80/20: dễ học, hiệu quả cao, ít đổi code)
Ưu tiên sprint theo thứ tự ROI:
1. **Sitemap segmentation + freshness chính xác** (cao impact, thấp effort)
2. **Schema nâng chất lượng rich results** (cao impact, thấp-trung bình effort)
3. **Internal-link automation theo hub/funnel** (cao impact, effort thấp vì đã có `internal-links.ts`)
4. **Indexability hygiene** (canonical/noindex/robots đồng bộ toàn route)

---

## Root Cause Confidence
**High**

**Lý do:**
- Evidence trực tiếp từ public site đối thủ cho thấy họ thắng nhờ coverage + structure + crawl clarity hơn là kỹ thuật phức tạp.
- Repo của anh đã có sẵn các khối nền SEO; do đó “khoảng cách” chủ yếu là tuning & mở rộng policy, không phải thiếu platform.
- Counter-hypothesis đã xét: “thua vì tốc độ thuần frontend”. Đúng một phần nhưng chưa phải đòn bẩy 80/20 nhanh nhất cho traffic trong bối cảnh hiện tại (vì nền technical SEO đã có, còn room lớn ở coverage + linking + structured data consistency).

---

## Proposal (implementation-ready, ít đổi code)

### Phase 1 (tuần 1) — Technical SEO quick wins
1. `app/sitemap.ts`
   - Tách sitemap index theo nhóm (`posts/products/services/landings`) để crawler cập nhật nhanh hơn.
   - Bổ sung `lastModified` nhất quán cho static hubs (khi có thay đổi content nguồn).
2. `app/robots.ts`
   - Chuẩn hóa rule cho crawl budget (giữ disallow route không public, tránh chặn nhầm route SEO).
3. `lib/seo/schema-policy.ts`
   - Bổ sung/siết điều kiện schema cho list pages (ItemList rõ hơn), article/product/service đầy đủ field khuyến nghị.
   - Ưu tiên các schema ít rủi ro, dễ đạt rich results.

### Phase 2 (tuần 2) — Internal links theo cụm intent
4. `lib/seo/internal-links.ts`
   - Tăng logic “hub -> spoke -> conversion page” theo từng cụm (`features/use-cases/solutions/...`).
   - Cân bằng số link điều hướng và link chuyển đổi để tăng crawl depth + session quality.

### Phase 3 (tuần 3) — Coverage tăng traffic
5. (Không đổi kiến trúc lớn) thêm rule phát sinh landing theo intent có sẵn từ hệ thống landing types (`feature/use-case/solution/compare/integration/template/guide`), ưu tiên các URL đã có dữ liệu.
6. Đồng bộ metadata/canonical policy để tránh trùng lặp index giữa hub/list/detail.

---

## Những gì học từ KiotViet/Haravan/Sapo nên áp dụng ngay (80/20)
- **Làm dày cụm trang theo intent** thay vì chỉ dày blog.
- **Liên kết nội bộ có chủ đích thương mại** (không chỉ “bài liên quan”).
- **Sitemap + robots cực rõ** để Google crawl đúng URL có giá trị.
- **Schema đủ và nhất quán** để tăng CTR qua rich snippets.

---

## Verification Plan
- Static verification (không chạy lint/test theo guideline repo):
  1. Soát diff từng file SEO để đảm bảo không phá route hiện có.
  2. Kiểm tra null-safety cho settings/site_url/social/contact trong schema & llms.
  3. Đảm bảo canonical/sitemap URL không tạo duplicate slash, không trả `example.com`.
- Repro checklist (cho tester runtime):
  1. Mở `/robots.txt`, `/sitemap.xml` và các sitemap con, xác nhận URL hợp lệ.
  2. Test 3 loại trang: hub/list/detail xem schema JSON-LD hợp lệ.
  3. Crawl mẫu 20 URL để xác nhận internal links đi đúng funnel.
- KPI sau triển khai (30–90 ngày):
  - Số URL valid indexed,
  - Impressions/clicks organic ở hub + landing,
  - CTR của trang có rich result.

Nếu anh chốt spec này, em sẽ triển khai theo đúng thứ tự Phase 1 → 3 để đạt traffic nhanh nhất với mức đổi code thấp.