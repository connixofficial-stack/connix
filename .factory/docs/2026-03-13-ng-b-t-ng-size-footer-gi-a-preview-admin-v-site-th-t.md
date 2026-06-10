## Audit Summary
- Observation: Footer ở site thật `http://localhost:3000/` đang render qua `components/site/DynamicFooter.tsx` (evidence: `components/site/SiteShell.tsx` import và mount `<DynamicFooter />`).
- Observation: Thay đổi trước đó chỉ sửa `app/admin/home-components/footer/_components/FooterPreview.tsx`, nên chỉ ảnh hưởng preview ở admin create/edit.
- Observation: Ngoài `DynamicFooter.tsx`, codebase còn có `FooterSection` trong `components/site/ComponentRenderer.tsx` với nhiều size footer hard-code riêng (`h-6 w-6`, `h-5 w-5`, `h-7 w-7`, icon `12/14/16`) và chưa đồng bộ với preview.
- Observation: `FooterSection` runtime trong `ComponentRenderer.tsx` hiện thậm chí chưa render logo Bộ Công Thương ở nhiều style, trong khi `DynamicFooter.tsx` có support `showBctLogo`, `bctLogoType`, `bctLogoLink`.
- Inference: Root cause không phải cache hay route localhost, mà là có ít nhất 2 runtime implementations footer riêng với sizing tách biệt; lần sửa trước chỉ chạm admin preview nên site thật không đổi.
- Decision: Đồng bộ tăng size 20% cho site thật tại `DynamicFooter.tsx` và đồng thời căn chỉnh `FooterSection` trong `ComponentRenderer.tsx` để tránh preview/site/runtime lệch nhau tiếp.

## Root Cause Confidence
- High — evidence trực tiếp:
  1. `components/site/SiteShell.tsx:18` dùng `<DynamicFooter />` cho site shell.
  2. `components/site/DynamicFooter.tsx` vẫn giữ size social/BCT cũ riêng.
  3. `components/site/ComponentRenderer.tsx:4844+` có `FooterSection` riêng với size hard-code khác và chưa được sửa.
- Counter-hypothesis đã loại trừ:
  - Không phải do admin save chưa áp dụng, vì user nói preview admin đã tăng nhưng site thật không tăng.
  - Không phải do create/edit route khác nhau, vì root issue nằm ở runtime site component khác file.

## Proposal
1. Sửa `components/site/DynamicFooter.tsx` để tăng social icon và logo BCT ~20% theo cùng rule đã áp cho preview:
   - `h-5/w-5` -> `h-6/w-6`
   - `h-6/w-6` -> `h-7/w-7`
   - `h-7/w-7` -> `h-8/w-8`
   - icon `14` -> `17`, `16` -> giữ/tăng hợp lý theo layout thực tế nếu cần.
   - Logo BCT dùng utility gần nhất theo lựa chọn user: `h-7` -> `h-8`, `h-8` -> `h-10` nếu đang cần round up rõ ràng.
2. Sửa `components/site/ComponentRenderer.tsx` trong `FooterSection` để đồng bộ các size social/logo với cùng mapping trên.
3. Với `FooterSection`, bổ sung render BCT nếu config có `showBctLogo`, để parity gần hơn với `DynamicFooter` và preview; giữ scope tối thiểu, không đổi schema.
4. Không sửa `FooterPreview.tsx` nữa trong task này trừ khi cần chỉnh parity nhỏ, vì preview admin đã đạt yêu cầu.
5. Sau khi code xong, verify tĩnh bằng `bunx tsc --noEmit` theo rule repo vì có đổi TS/TSX.
6. Commit local toàn bộ thay đổi, kèm file spec `.factory/docs`.

## Post-Audit / Impact
- Phạm vi ảnh hưởng:
  - Site thật footer global: `components/site/DynamicFooter.tsx`
  - Runtime footer khi render như home component: `components/site/ComponentRenderer.tsx`
- Không ảnh hưởng Convex schema, dữ liệu cũ, flow admin submit.
- Rủi ro:
  - Một vài style compact có thể bị chật sau khi tăng size; sẽ giữ thay đổi spacing tối thiểu nếu cần.
  - Nếu `FooterSection` thực tế không còn dùng trên homepage chính, việc đồng bộ vẫn đáng làm để tránh lệch ở các màn/runtime khác.

## Verification Plan
- Static verify:
  1. Soát toàn bộ size social/BCT trong `DynamicFooter.tsx` và `FooterSection` để không sót style.
  2. Kiểm tra parity với `FooterPreview.tsx` về mapping kích thước.
  3. Chạy `bunx tsc --noEmit`.
- Repro/pass criteria:
  1. Vào `http://localhost:3000/` thấy social icons và logo BCT ở footer lớn hơn rõ rệt ~20%.
  2. Các footer render qua `FooterSection` cũng dùng cùng scale mới.
  3. Không phát sinh type error và không vỡ layout nghiêm trọng ở style compact.

## Options considered
- Option A (Recommend) — Confidence 90%: sửa cả `DynamicFooter.tsx` + `ComponentRenderer.tsx` để parity runtime. Phù hợp nhất vì evidence cho thấy đang có 2 implementation riêng.
- Option B — Confidence 60%: chỉ sửa `DynamicFooter.tsx`. Nhanh hơn, đủ cho homepage hiện tại, nhưng vẫn để lại lệch ở `FooterSection` và dễ tái phát inconsistency.