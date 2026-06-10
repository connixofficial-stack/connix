---
name: convex-data-contract-audit
description: Quét và xử lý data/schema drift trong Convex bằng Expand → Migrate → Contract. Dùng khi nâng code cho dự án cũ, thấy legacy fallback, thiếu field, dư field, deprecated field, backfill, migration debt, hoặc cần check dữ liệu thật trước/sau deploy.
---

# Convex Data Contract Audit

Skill này giúp AI agent/dev không vá legacy fallback mãi. Mục tiêu là đưa dữ liệu thật về contract hiện tại rồi để runtime đọc source-of-truth sạch.

## Khi nào dùng

- Nâng code/schema cho dự án có dữ liệu cũ.
- Runtime lỗi vì record thiếu field mới.
- Code đang có fallback kiểu `oldField ?? newField`, `field ?? default`, hoặc filter phải né data cũ.
- Cần kiểm tra field dư, thiếu, deprecated, recommended/backfill trước khi deploy.
- Cần trả nợ kỹ thuật dữ liệu trong Convex.

## Pattern bắt buộc: Expand → Migrate → Contract

1. **Expand**
   - Thêm field/schema/code ghi format mới.
   - Nếu cần giữ hệ thống sống, fallback chỉ là bridge tạm thời.
   - Ghi rõ fallback sẽ bị gỡ sau migration.

2. **Migrate**
   - Dùng Convex CLI hoặc `/system/data` → **Data Contract Check** để xác định record lệch contract.
   - Chạy backfill/migration theo batch, đọc trước ghi sau, patch tối thiểu.
   - Verify bằng query đúng source-of-truth.

3. **Contract**
   - Bỏ fallback legacy khỏi runtime.
   - Code chỉ đọc field/source-of-truth mới.
   - Cập nhật data contract scan để lần sau agents phát hiện thiếu/dư field sớm.

## Quy trình thao tác

1. Đọc context:
   - `convex/_generated/ai/guidelines.md`
   - `convex/schema.ts`
   - function/site/admin surface đang dùng field đó
   - `convex/dataManager.ts` nếu cần cập nhật contract scan

2. Quét dữ liệu thật:
   - Ưu tiên UI: `/system/data` → **Data Contract Check**.
   - Hoặc CLI:
     ```powershell
     bunx convex run dataManager:scanDataContracts '{"sampleSize":100}'
     ```

3. Phân loại issue:
   - `missingRequired`: phải migrate trước khi contract strict.
   - `missingRecommended`: field phục vụ runtime/index/filter, nên backfill để bỏ fallback.
   - `extraFields`: field dư hoặc contract scan chưa được cập nhật.
   - `deprecatedFields`: field cũ còn tồn tại, cần kế hoạch cleanup.

4. Sửa đúng lớp:
   - Nếu data thiếu: viết/chạy migration/backfill, không thêm fallback lâu dài.
   - Nếu contract thiếu: cập nhật registry scan.
   - Nếu schema thật đổi: widen → migrate → narrow theo `convex-migration-helper`.

5. Verify:
   - Query lại đúng data surface.
   - Chạy lại `dataManager:scanDataContracts`.
   - Chỉ giữ fallback nếu còn đang trong cửa sổ migration và có tiêu chí gỡ bỏ rõ ràng.

## Guardrails

- Không sửa dữ liệu thật diện rộng khi chưa đọc trước phạm vi record/field.
- Không overwrite cả object nếu chỉ cần patch field.
- Không dùng fallback legacy như thiết kế cuối cùng.
- Không bắt user “sống chung” với data cũ sau khi đã có migration path.
- Với bảng lớn, dùng batch/pagination; tránh `.collect()` bừa bãi.

## Output khi bàn giao

- Contract nào đã quét.
- Số bảng/record đã scan.
- Missing/recommended/extra/deprecated nổi bật.
- Migration/backfill đã chạy hoặc cần chạy.
- Fallback nào đã gỡ hoặc còn tạm giữ.
- Verify command/UI đã thực hiện.
