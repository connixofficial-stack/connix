## Audit Summary
- Observation: Preview admin hiện đang dùng `app/admin/home-components/footer/_components/FooterPreview.tsx` với size social/BCT đã được tăng ở lần trước. Ví dụ: social hiện có các mức `h-7/w-7 + 17`, `h-6/w-6 + 14`, `h-8/w-8 + 17`; BCT render qua `renderBctLogo(32|28)` với height thực tế đang là `baseHeight * 1.2`.
- Observation: Site thật global dùng `components/site/DynamicFooter.tsx`; runtime footer khác còn dùng `components/site/ComponentRenderer.tsx` (`FooterSection`). Hai file này hiện cũng đã được tăng size ở lần trước.
- Observation: Nếu user muốn “tăng thêm 30%”, thì phải scale từ baseline hiện tại ở cả 3 nơi: preview, site thật global, và runtime footer section.
- Inference: Root cause của việc cần sửa tiếp là đang có 3 implementation footer riêng giữ size hard-code, nên muốn tăng thêm phải chỉnh đồng bộ cả 3 để tránh lệch preview/site/runtime.
- Decision: Tăng thêm ~30% cho social icon và logo BCT trên cả preview + site thật + runtime footer, giữ approach nhỏ gọn và rollback dễ.

## Root Cause Confidence
- High — evidence trực tiếp nằm ở 3 file đang hard-code size riêng:
  1. `app/admin/home-components/footer/_components/FooterPreview.tsx`
  2. `components/site/DynamicFooter.tsx`
  3. `components/site/ComponentRenderer.tsx`
- Counter-hypothesis đã loại trừ:
  - Không phải do route hay data save, vì cả preview và site đều đã dùng size mới của lần trước nhưng vẫn chưa đạt mức user mong muốn.
  - Không phải do chỉ một file bị sót, vì hiện có 3 implementation footer song song.

## Proposal
1. Chỉ sửa 3 file trên, không đổi schema/config.
2. Áp dụng tăng thêm ~30% từ size hiện tại cho social icon:
   - `h-6/w-6` -> `h-8/w-8`
   - `h-7/w-7` -> `h-9/w-9` hoặc utility gần nhất phù hợp
   - `h-8/w-8` -> `h-10/w-10`
   - `17` -> khoảng `22`
   - `14` -> khoảng `18`
3. Áp dụng tăng thêm ~30% cho logo BCT:
   - Preview: tăng các `baseHeight` hiện tại (`32`, `28`) thêm ~30% rồi làm tròn hợp lý.
   - Site thật/runtime: tăng utility hiện tại (`h-8`, `h-10`) lên utility gần nhất đủ gần 30%.
4. Nếu style compact (`corporate`, `minimal`, `stacked`) bị chật, chỉ nới nhẹ gap/alignment tối thiểu trong cùng file.
5. Sau khi sửa xong, verify tĩnh bằng `bunx tsc --noEmit` theo rule repo, rồi commit local kèm spec file.

## Post-Audit / Impact
- Phạm vi ảnh hưởng:
  - Preview admin footer
  - Site thật footer global
  - Runtime footer section trong renderer
- Không ảnh hưởng dữ liệu cũ, Convex, admin save flow, hay API.
- Rủi ro chính: style compact có thể hơi nặng thị giác hơn; sẽ giữ thay đổi đúng trọng tâm icon/BCT và tránh phình spacing quá mức.

## Verification Plan
- Static verify:
  1. Soát tất cả occurrences social/BCT trong 3 file để chắc không sót style nào.
  2. Kiểm tra parity giữa preview và site sau khi scale tiếp 30%.
  3. Chạy `bunx tsc --noEmit`.
- Repro/pass criteria:
  1. Preview admin footer hiển thị social/BCT lớn hơn rõ rệt so với bản hiện tại.
  2. Site thật `http://localhost:3000/` hiển thị cùng mức tăng đó.
  3. `FooterSection` runtime không lệch với preview/site.
  4. Không phát sinh type error.

## Root Cause Questions Answered
1. Triệu chứng: user muốn tăng thêm 30%, còn UI hiện tại mới chỉ ở mức tăng trước đó.
2. Phạm vi: preview admin + site thật + runtime footer.
3. Tái hiện: có, ổn định vì size đang hard-code trong 3 file.
4. Mốc thay đổi gần nhất: các commit tăng size trước đó cho preview và site.
5. Dữ liệu thiếu: không có blocker kỹ thuật đáng kể.
6. Giả thuyết thay thế: cache/data không phù hợp đã bị loại trừ vì audit code thấy size hard-code hiện tại.
7. Rủi ro fix sai: preview và site tiếp tục lệch nhau hoặc style compact bị chật.
8. Pass/fail: cả preview/site/runtime cùng tăng thêm ~30% và không lỗi type/layout nghiêm trọng.