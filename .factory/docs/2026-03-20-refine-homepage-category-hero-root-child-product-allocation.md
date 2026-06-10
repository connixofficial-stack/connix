## TL;DR kiểu Feynman
- Dữ liệu thực tế của anh không giống giả định cũ: nhiều root cha có sản phẩm, còn category con lại gần như rỗng.
- Vì vậy rule hiện tại “có child thì chỉ nhìn child” là sai với dữ liệu thật, nên nút sinh tạo ra menu trống hoặc rất bậy.
- Cách tốt nhất theo pattern SaaS/ecommerce là: ưu tiên giữ cấu trúc category, nhưng nếu subtree con không có hàng thì phải fallback về sản phẩm của root cha.
- `Ẩn mục không có SP` phải dựa trên **tổng hàng có thể hiển thị cho root đó**, không chỉ nhìn child node.
- Tôi sẽ sửa generator để phân bổ item theo “nguồn dữ liệu hiển thị tốt nhất” thay vì cứng nhắc chỉ child hoặc chỉ root.

## Audit Summary
### Observation
- Ảnh categories admin cho thấy nhiều root cha như `Thiết bị truyền động`, `Thiết bị thủy lực`, `Thiết bị trao đổi nhiệt` có `Số sản phẩm > 0`, nhưng các category con phía dưới lại có `0`. Evidence: ảnh `C:\Users\VTOS\Downloads\screencapture-localhost-3000-admin-categories-2026-03-20-17_40_15.png`.
- Ảnh edit hero cho thấy sau khi bấm sinh, hệ thống báo `Đã sinh 5 danh mục`, nhưng phần `Menu danh mục` hầu hết root đều `0 nhóm • 0 link`, chỉ có đúng 1 root có `1 nhóm • 1 link`. Evidence: ảnh `...17_40_39.png`.
- Khi bật `Ẩn mục không có SP`, ảnh cho thấy toast `Không có danh mục hoặc sản phẩm phù hợp để sinh menu.` dù ở trang categories vẫn có root cha có sản phẩm trực tiếp. Evidence: ảnh `...17_40_57.png` + ảnh categories.
- Generator hiện tại với `hierarchyEnabled = true` đang dùng rule: root có level 1 thì chỉ xét từng level 1; nếu level 1 không có level 2 thì fallback sang products của **level 1 đó**, không nhìn products trực tiếp của root cha nữa. Evidence: `app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts` đoạn `const levelOne = ...`, `const levelTwo = ...`, `productsMap.get(groupCategory._id)`.
- Điều này tạo mismatch với dữ liệu thật của anh: sản phẩm đang nằm ở root cha, nên root có child nhưng toàn child rỗng => generator kết luận sai là không có gì để hiển thị.

### Root cause answers (theo protocol)
1. Triệu chứng: sinh menu ra root trống/ít link, hoặc báo không có dữ liệu dù categories root có sản phẩm thật.
2. Phạm vi: admin generate, preview và runtime auto mode vì đều phụ thuộc cùng generator.
3. Tái hiện tối thiểu: dùng cây category mà root cha có productCount > 0 nhưng children productCount = 0; bấm `Sinh ngay`, đặc biệt khi bật `Ẩn mục không có SP`.
4. Mốc thay đổi gần nhất: generator vừa được rewrite deterministic theo tầng, nhưng vẫn giữ giả định dữ liệu “hàng nằm ở leaf hoặc level 1”, chưa cover dữ liệu “hàng nằm ở root cha”.
5. Dữ liệu còn thiếu: chưa cần thêm; ảnh user gửi đã đủ chứng minh data allocation thực tế.
6. Giả thuyết thay thế: có thể product count ở admin list là aggregate chứ không phải direct count; nhưng dù vậy generator hiện tại vẫn fail vì nó không có branch xử lý root-direct/root-display fallback khi children không usable.
7. Rủi ro nếu fix sai: menu tiếp tục sinh trống, user phải sửa tay, tính năng auto-generate gần như vô dụng.
8. Tiêu chí pass/fail: root có sản phẩm trực tiếp phải sinh được item hợp lệ ngay cả khi child rỗng; `Ẩn mục không có SP` không được loại nhầm root có hàng hiển thị được.

## Root Cause Confidence
**High** — Evidence từ ảnh categories + ảnh edit + code generator khớp nhau rất rõ: vấn đề nằm ở allocation logic giữa root và child, không phải do UI preview.

## Counter-Hypothesis
- **Medium**: Có thể chỉ cần tắt `Ẩn mục không có SP`. Không đúng, vì ngay cả khi tắt thì kết quả vẫn nhiều root `0 nhóm • 0 link`, nghĩa là logic phân bổ item đã sai từ trước.
- **Low**: Có thể phải ép người dùng dồn sản phẩm xuống leaf category. Không phù hợp SaaS thực tế vì data catalog thường không sạch tuyệt đối; generator tốt phải chịu được dữ liệu không chuẩn.

## Proposal
### Option A (Recommend) — Confidence 95%
Đổi generator sang rule **display-source aware**:
1. Ưu tiên dùng category structure để render nhóm khi subtree con thực sự có item hiển thị được.
2. Nếu root có child nhưng toàn child không sinh được item, fallback sang sản phẩm trực tiếp của root cha.
3. Nếu một số child có item, một số child rỗng, chỉ giữ các child có item; không tạo group rỗng.
4. `Ẩn mục không có SP` đánh giá theo **final display payload** của root/group, không chỉ aggregate theo child path.
5. Khi hierarchy off vẫn giữ mỗi category = 1 root + fallback products như hiện tại.

**Vì sao đây là tối ưu nhất cho SaaS/ecommerce:** các hệ CMS/catalog tốt không giả định dữ liệu taxonomy luôn sạch. Họ ưu tiên “render cái user bán được” thay vì cố trung thành với cây danh mục đến mức sinh ra menu rỗng.

### Option B — Confidence 63%
Giữ rule cứng theo tầng, nhưng yêu cầu dữ liệu phải chuẩn: root không được có sản phẩm trực tiếp nếu đã có child.

**Khi nào phù hợp:** team có data governance rất chặt và sẵn sàng migrate lại toàn bộ catalog. Không hợp với tình huống hiện tại của anh.

## Files Impacted
### Generator / shared
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/auto-generate.ts`
  - Vai trò hiện tại: generator deterministic theo tầng nhưng chưa xử lý root-direct-products khi child rỗng.
  - Thay đổi: thêm bước đánh giá `displayable groups/items` cho từng root; nếu child-path không sinh được item thì fallback về root products.

### Hook / admin
- `Sửa: app/admin/home-components/homepage-category-hero/_lib/useHomepageCategoryHeroAutoGenerate.ts`
  - Vai trò hiện tại: gọi generator và trả meta.
  - Thay đổi: giữ wiring, nhưng summary nên phản ánh rõ bao nhiêu root dùng child-path và bao nhiêu root dùng root-product fallback để debug dễ hơn.

### Runtime / preview
- `Sửa: components/site/HomepageCategoryHeroSection.tsx`
  - Vai trò hiện tại: render output generator.
  - Thay đổi: chủ yếu hưởng lợi từ output mới; không cần đổi lớn UI, chỉ đảm bảo root-product fallback render ổn.

## Execution Preview
1. Audit lại generator theo dữ liệu thật trong ảnh user.
2. Tạo helper xác định “root này có display groups từ child không?”.
3. Nếu không có, thử root-product fallback trước khi loại root.
4. Loại bỏ hoàn toàn các group rỗng khỏi payload sinh ra.
5. Điều chỉnh hide-empty để dựa trên output cuối cùng có hiển thị được hay không.
6. Cập nhật summary/meta để dễ thấy generator đã chọn nguồn nào.
7. Chạy `bunx tsc --noEmit`, rồi commit local kèm spec doc.

## Rule logic sẽ implement
### 1) Khi hierarchy bật
Với mỗi root:
- Lấy danh sách child level 1.
- Với từng child:
  - nếu child có level 2 hiển thị được -> group = level 2 categories.
  - nếu child không có level 2 nhưng có products trực tiếp -> group = products của child.
  - nếu child không sinh được gì -> bỏ child đó.
- Sau khi quét xong toàn bộ child:
  - nếu root có ít nhất 1 group hợp lệ -> dùng các group đó.
  - nếu root không có group nào hợp lệ nhưng root có products trực tiếp -> tạo 1 group fallback từ root products.
  - nếu root cũng không có products hiển thị được -> mới loại root khi hide-empty bật.

### 2) Khi hierarchy tắt
- Giữ nguyên: mỗi category active là một root, nhóm duy nhất lấy từ products trực tiếp của category đó.

### 3) Nguyên tắc hide-empty đúng
- `hideEmptyCategories = true` không nên hỏi “node này aggregate count bao nhiêu?” một cách mù quáng.
- Nó phải hỏi: “root/group này sau khi áp đủ rule sinh menu có tạo ra item hiển thị được không?”.
- Tức là hide-empty chạy theo **display result**, không chỉ theo raw tree stats.

### 4) UX/result mong muốn
- Root nào có hàng bán được thì phải sinh ra thứ gì đó để user thấy hữu ích.
- Không tạo `0 nhóm • 0 link` rồi vẫn giữ root trong editor.
- Không báo `Không có danh mục hoặc sản phẩm phù hợp` nếu thực tế root cha đang có sản phẩm hiển thị được.

## Acceptance Criteria
- Với dữ liệu hiện tại trong ảnh, các root cha có `Số sản phẩm > 0` phải sinh ra item hợp lệ dù child của chúng rỗng.
- Khi tắt `Ẩn mục không có SP`, không còn root kiểu `0 nhóm • 0 link`.
- Khi bật `Ẩn mục không có SP`, các root có sản phẩm hiển thị được vẫn phải tồn tại; chỉ root thật sự không sinh được gì mới bị loại.
- Nếu child có dữ liệu thật thì ưu tiên child-path; chỉ fallback root products khi child-path không usable.
- Preview/site/admin dùng cùng một output logic.

## Out of Scope
- Ép migrate lại toàn bộ dữ liệu category/product.
- Viết validator backend mới để cấm gắn sản phẩm vào root cha.
- Thay đổi UI editor ngoài phần dữ liệu sinh ra.

## Risk / Rollback
- Risk trung bình: output generate sẽ thay đổi trên data thật, nhưng đây là thay đổi mong muốn để sát business hơn.
- Rollback: revert generator/meta nếu cần; không đụng schema dữ liệu lưu nên rollback tương đối an toàn.

## Verification Plan
- Static review:
  - case root có child nhưng products nằm ở root;
  - case child có level 2 thật;
  - case child có products trực tiếp;
  - case toàn bộ root/child đều rỗng.
- Typecheck:
  - chạy `bunx tsc --noEmit` sau khi implement.
- Repro plan cho tester:
  1. Dùng đúng dataset trong ảnh của anh.
  2. Bấm sinh với `Ẩn mục không có SP` tắt -> không còn root trống.
  3. Bật `Ẩn mục không có SP` -> root có sản phẩm trực tiếp vẫn sinh ra bình thường.
  4. Mở preview/site -> cấu trúc khớp output mới.

Nếu anh duyệt spec này, tôi sẽ sửa logic theo hướng SaaS/ecommerce thực dụng: ưu tiên cấu trúc category, nhưng luôn fallback về nguồn hàng hiển thị tốt nhất thay vì để menu trống.