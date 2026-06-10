# I. Primer

## 1. TL;DR kiểu Feynman

- Commit chưa push `8f9b5f37` vừa sửa một lỗi FLS: file đang được home-component dùng nhưng cleanup vẫn có thể hiểu nhầm là “không ai dùng”.
- Còn vài chỗ có cùng “mùi lỗi”: upload có `storageId` nhưng type/form/serializer làm rơi `storageId`, hoặc UI gọi xóa storage trực tiếp trước khi save.
- Em sẽ sửa nhóm rủi ro rõ nhất: `Team`, `Stats`, `Process`, `ProductList`, và harden thêm cổng cleanup trong `convex/storage.ts`.
- Em cũng nâng các skill FLS/home-component/module để sau này agent gặp upload media sẽ bắt buộc audit `storageId` end-to-end.
- Sau khi sửa code TypeScript, chỉ chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10` theo rule repo; không chạy lint/unit test/build.

## 2. Elaboration & Self-Explanation

Lỗi gốc không chỉ là “xóa file”, mà là hệ thống không luôn giữ được **file identity (định danh file)**. URL ảnh có thể hiển thị đúng, nhưng cleanup an toàn cần biết `storageId` để sync `fileReferences`, commit draft upload, và chỉ xóa khi chắc chắn không còn record nào dùng.

Commit `8f9b5f37` đã vá backend bằng cách resolve legacy URL và check nested config, nên nhiều case URL-only đã bớt nguy hiểm. Nhưng nếu form mới tiếp tục bỏ `storageId`, hoặc UI tự gọi `deleteImage` trước khi save, hệ thống vẫn phụ thuộc vào fallback và dễ tái diễn bug. Vì vậy hướng sửa là: preserve `storageId` ở các component rủi ro rõ, harden cleanup gateway, và nâng skill để agent không sinh lại pattern cũ.

## 3. Concrete Examples & Analogies

Ví dụ sát repo: `ProductCategories` đã được sửa để `CategoryImageSelector` trả `onChange(value, mode, storageId)` và save config giữ `storageId`. `Team` hiện upload avatar có `storageId`, nhưng `AvatarUpload` chỉ gọi `onChange(result.url ?? '')`, nên config chỉ còn URL; em sẽ đưa nó về cùng contract như `ProductCategories`.

Analogy: URL ảnh giống địa chỉ tạm để xem ảnh; `storageId` giống số căn cước của file. Muốn xóa an toàn thì không nên hỏi “địa chỉ này còn ai nhớ không?”, mà phải hỏi “căn cước file này còn record nào sở hữu không?”.

# II. Audit Summary (Tóm tắt kiểm tra)

- Branch đang ahead `origin/master` 4 commit; commit liên quan trực tiếp là `8f9b5f37 fix(home-components): prevent cleanup of referenced media`.
- Evidence từ commit:
  - `PopupForm` đã lưu thêm `storageId` khi `SettingsImageUploader` trả về.
  - `ProductCategories` đã preserve `storageId` ở create/edit/form/type.
  - `convex/homeComponents.ts` đã resolve cả `storageId` trong config lẫn legacy URL qua `resolveStorageIdsFromLegacyUrls`.
  - `convex/storage.ts` đã thêm check `homeComponents`/`settings` trong `cleanupStorageIfUnreferenced`.
- Rủi ro còn thấy qua audit tĩnh:
  - `app/admin/home-components/team/_components/TeamForm.tsx`: upload avatar register draft nhưng chỉ lưu URL; type/serializer không có `storageId`.
  - `app/admin/home-components/stats/_components/StatsForm.tsx`: upload icon/background image có thể làm rơi `storageId` khi lưu config.
  - `app/admin/home-components/process/_components/ProcessForm.tsx` + `_lib/normalize.ts`: upload icon chỉ lưu URL vào `icon`.
  - `app/admin/home-components/product-list/_components/ProductListForm.tsx`: đang gọi `api.storage.deleteImage` trực tiếp khi replace demo image.
  - `.factory/skills/module-creator/SKILL.md`, `.factory/skills/module-qa-tester/SKILL.md`, `.factory/skills/system-extension-guideline/TEMPLATES.md`: còn ví dụ/template khuyến khích `ctx.storage.delete` trực tiếp trong vài ngữ cảnh.

# III. Root Cause & Counter-Hypothesis (Nguyên nhân gốc & Giả thuyết đối chứng)

- Root Cause Confidence (Độ tin cậy nguyên nhân gốc): **High cho pattern**, **Medium cho mức độ gây bug runtime hiện tại**.
  - High vì code evidence cho thấy nhiều form thật sự làm rơi `storageId` hoặc gọi delete trực tiếp.
  - Medium vì backend mới đã có fallback resolve URL, nên không phải mọi URL-only surface đều chắc chắn gây mất file ngay.
- Triệu chứng expected vs actual:
  - Expected: upload → save → config giữ `storageId`, server sync `fileReferences`, replace/delete cleanup sau khi save.
  - Actual: một số form upload xong chỉ save URL, hoặc UI xóa file cũ trước khi record mới save thành công.
- Phạm vi ảnh hưởng: home-components có media upload, media cleanup, và skill/template tạo/refactor module sau này.
- Tái hiện tối thiểu dự kiến:
  - Upload avatar/icon trong `Team`/`Stats`/`Process`, save, kiểm config thấy thiếu `storageId`.
  - Replace demo image trong `ProductList`, thấy UI gọi `deleteImage` trước save.
- Giả thuyết đối chứng chưa loại trừ hoàn toàn:
  - `resolveStorageIdsFromLegacyUrls` có thể đã che phần lớn lỗi URL-only.
  - `deleteImage` hiện có `hasFileReferences`, nên file có reference hiện đại có thể không bị xóa.
- Rủi ro nếu fix sai nguyên nhân: có thể giữ lại file cũ nhiều hơn cần thiết, hoặc đổi shape config khiến preview/site đọc thiếu fallback.
- Tiêu chí pass/fail: config preserve `storageId`; cleanup không xóa file đang được reference; skill ghi rõ fail critical cho pattern làm rơi `storageId`.

# IV. Proposal (Đề xuất)

## 1. Sửa code risk rõ nhất

- `Team`:
  - Thêm `storageId?: string | null` vào `TeamMember`/`TeamEditorMember`.
  - Đổi `AvatarUpload` để callback trả `(url, storageId)`.
  - Preserve `storageId` trong normalize/load/save (`toTeamEditorMembers`, `toTeamPersistMembers`).
  - Khi user nhập URL ngoài hoặc clear avatar, set `storageId: null`.

- `Stats`:
  - Thêm `storageId?: string | null` cho từng `StatsItem` dùng icon upload.
  - Nếu xử lý background image trong scope file hiện tại, thêm `backgroundImageStorageId?: string | null` vào config để không làm rơi `storageId` của ảnh nền.
  - Đổi `IconUpload` và `SettingsImageUploader` usage liên quan để nhận/lưu `storageId`.
  - Preserve `storageId` ở create/edit load/save payload.

- `Process`:
  - Thêm `storageId?: string | null` vào `ProcessStep`/`ProcessFormStep`.
  - Đổi icon upload callback trả `(url, storageId)`.
  - Preserve `storageId` trong `normalizeProcessFormSteps` và `serializeProcessFormSteps`.

- `ProductList`:
  - Gỡ `api.storage.deleteImage` khỏi `DemoItemImageUploader` khi replace ảnh.
  - Giữ behavior: ảnh mới vẫn save `storageId`; ảnh cũ sẽ được backend `homeComponents.update` so sánh previous/next config rồi cleanup qua FLS sau save.

- `convex/storage.ts`:
  - Harden `deleteImage` và các cleanup mutation cũ để không chỉ dựa vào `fileReferences`.
  - Reuse logic check nested usage (`products`, `posts`, `services`, `settings`, `homeComponents`) trước khi xóa.
  - Không xóa nếu hit scan limit hoặc còn match qua URL/`storageId`.

## 2. Nâng skill liên quan FLS

- `.factory/skills/file-lifecycle-service/SKILL.md`:
  - Thêm “FLS audit matrix”: uploader → callback props → editor type → normalizer → create/edit payload → backend sync.
  - Thêm rule fail critical: `registerDraftUpload` mà config/payload không preserve `storageId`.
  - Thêm grep checklist: `onChange={(url)`, `deleteImage`, `ctx.storage.delete`, `storageId: undefined`.

- `.factory/skills/create-home-component/SKILL.md`:
  - Nâng từ “storageId hoặc backend resolve legacy” thành “new upload phải persist `storageId`; legacy resolver chỉ là fallback”.
  - Thêm acceptance: load → edit → save không làm rơi `storageId`.

- `.factory/skills/refactor-home-component/SKILL.md`:
  - Khi tách từ legacy editor, bắt buộc audit `.map(...)`/serializer có strip `storageId` không.

- `.factory/skills/home-component-parity-guard/SKILL.md`:
  - Phase File Lifecycle Guard thành fail critical nếu upload component chỉ trả URL hoặc serializer bỏ `storageId`.

- `.factory/skills/module-creator/SKILL.md`, `.factory/skills/module-qa-tester/SKILL.md`, `.factory/skills/system-extension-guideline/TEMPLATES.md`:
  - Thay ví dụ “good” dùng `ctx.storage.delete` trực tiếp bằng safe cleanup/FLS gateway.
  - Nếu là seed/reset cô lập thì ghi rõ exception, không copy sang business mutation.

# V. Files Impacted (Tệp bị ảnh hưởng)

## 1. UI / home-components

- Sửa: `app/admin/home-components/team/_types/index.ts` — hiện khai báo member không có `storageId`; sẽ thêm field optional.
- Sửa: `app/admin/home-components/team/_components/TeamForm.tsx` — hiện avatar upload trả URL-only; sẽ trả và preserve `storageId`.
- Sửa: `app/admin/home-components/team/_lib/constants.ts` — hiện normalize/persist strip `storageId`; sẽ giữ field này.
- Sửa: `app/admin/home-components/stats/_types/index.ts` — hiện item/background chưa có storage identity rõ; sẽ thêm field storage phù hợp.
- Sửa: `app/admin/home-components/stats/_components/StatsForm.tsx` — hiện upload icon/background có chỗ chỉ dùng URL; sẽ nhận và lưu `storageId`.
- Sửa: `app/admin/home-components/stats/[id]/edit/page.tsx` — hiện load/save stats item strip `storageId`; sẽ preserve.
- Sửa: `app/admin/home-components/create/stats/page.tsx` — hiện create payload chỉ lưu URL; sẽ preserve `storageId` cho media trong create flow.
- Sửa: `app/admin/home-components/process/_types/index.ts` — hiện step chỉ có `icon`; sẽ thêm `storageId` optional.
- Sửa: `app/admin/home-components/process/_components/ProcessForm.tsx` — hiện icon upload trả URL-only; sẽ trả `storageId`.
- Sửa: `app/admin/home-components/process/_lib/normalize.ts` — hiện serialize strip `storageId`; sẽ preserve.
- Sửa: `app/admin/home-components/product-list/_components/ProductListForm.tsx` — hiện replace image gọi `deleteImage` trực tiếp; sẽ remove direct-delete path.

## 2. Server / Convex

- Sửa: `convex/storage.ts` — hiện một số cleanup/delete path cũ xóa trực tiếp hoặc chỉ check một phần; sẽ harden bằng safe reference checks trước khi delete.

## 3. Skills / guardrails

- Sửa: `.factory/skills/file-lifecycle-service/SKILL.md` — thêm audit matrix và fail-critical rules.
- Sửa: `.factory/skills/create-home-component/SKILL.md` — thêm contract persist `storageId` cho upload mới.
- Sửa: `.factory/skills/refactor-home-component/SKILL.md` — thêm check strip `storageId` khi refactor legacy.
- Sửa: `.factory/skills/home-component-parity-guard/SKILL.md` — nâng File Lifecycle Guard thành tiêu chí fail.
- Sửa: `.factory/skills/module-creator/SKILL.md` — thay direct delete template bằng FLS-safe pattern.
- Sửa: `.factory/skills/module-qa-tester/SKILL.md` — sửa ví dụ “good” direct delete thành safe cleanup.
- Sửa: `.factory/skills/system-extension-guideline/TEMPLATES.md` — ghi rõ exception seed/reset và tránh copy direct delete.

## 4. Spec record

- Thêm: `.factory/docs/2026-05-27-nang-fls-skill-va-fix-media-cleanup-risk.md` — lưu tóm tắt spec/decision theo rule repo.

# VI. Execution Preview (Xem trước thực thi)

1. Đọc lại các file UI liên quan để giữ style hiện tại.
2. Patch `Team`, `Stats`, `Process` theo hướng preserve `storageId` từ upload callback đến payload save.
3. Patch `ProductList` để bỏ direct `deleteImage` khi replace demo image.
4. Patch `convex/storage.ts` để các path delete/cleanup cũ dùng safe reference guard.
5. Update các skill FLS/home-component/module theo guardrails mới.
6. Tự review tĩnh: type shape, backward compatibility với config cũ, null/undefined handling, không làm hỏng preview/site.
7. Chạy typecheck theo repo rule.
8. Commit toàn bộ thay đổi, không push.

# VII. Verification Plan (Kế hoạch kiểm chứng)

- Static review bắt buộc:
  - Không còn custom upload risk rõ nhất kiểu `onChange(result.url ?? '')` tại `Team/Stats/Process`.
  - Không còn direct `deleteImage` trong `ProductList` replace path.
  - Skill không còn khuyến nghị `ctx.storage.delete` trực tiếp như “good pattern” cho business cleanup.
- Typecheck:
  - Chạy đúng command repo yêu cầu: `bunx tsc --noEmit 2>&1 | Select-Object -First 10`.
- Không chạy lint/unit test/build vì `AGENTS.md` cấm tự chạy lint/unit test và chỉ cho phép tsc trước commit khi có thay đổi TS.
- Nếu typecheck fail: sửa lỗi type, rerun command trên.

# VIII. Todo

1. Patch UI preserve `storageId` cho `Team`.
2. Patch UI preserve `storageId` cho `Stats`.
3. Patch UI preserve `storageId` cho `Process`.
4. Remove direct delete path ở `ProductList`.
5. Harden safe cleanup trong `convex/storage.ts`.
6. Nâng các skill liên quan FLS.
7. Lưu spec record trong `.factory/docs`.
8. Chạy `bunx tsc --noEmit 2>&1 | Select-Object -First 10`.
9. Commit thay đổi, không push.

# IX. Acceptance Criteria (Tiêu chí chấp nhận)

- `Team`, `Stats`, `Process` upload media mới và save config vẫn giữ được `storageId` cạnh URL tương ứng.
- Replace ảnh trong `ProductList` không gọi xóa storage trực tiếp từ UI trước save.
- Cleanup/delete server không xóa file nếu còn reference qua `fileReferences`, nested `storageId`, hoặc legacy URL trong các bảng đã guard.
- Skills FLS/home-component/module có checklist đủ mạnh để agent tương lai bắt lỗi “upload có storageId nhưng serializer bỏ mất”.
- Typecheck pass hoặc không còn lỗi mới liên quan thay đổi.
- Có commit local, không push.

# X. Risk / Rollback (Rủi ro / Hoàn tác)

- Rủi ro: thêm `storageId` vào config có thể làm JSON config rộng hơn nhưng backward-compatible vì renderer bỏ qua field lạ.
- Rủi ro: harden cleanup quá bảo thủ có thể giữ lại file đáng lẽ xóa; tradeoff này an toàn hơn xóa nhầm file đang dùng.
- Rollback: revert commit local sau khi hoàn tất; các thay đổi tập trung trong vài file UI, `convex/storage.ts`, và `.factory/skills`.

# XI. Out of Scope (Ngoài phạm vi)

- Không migrate toàn bộ legacy URL-only data thật.
- Không fix mọi `SettingsImageUploader` URL-only surface trong toàn bộ home-components nếu không nằm trong nhóm risk rõ nhất ở trên.
- Không chạy cleanup dữ liệu thật trên Convex.
- Không push remote.

# XII. Open Questions (Câu hỏi mở)

- Không còn câu hỏi mở cho Option B; em sẽ triển khai theo scope trên nếu anh approve.
