## Audit Summary

### Observation
- `ModuleConfigPage` hiển thị field từ `useModuleConfig()` → `api.admin.modules.listModuleFields`, tức là đọc **DB runtime**, không đọc trực tiếp từ file seeder/config.
- `SettingsSeeder` đã được sửa để có `contact_tax_id`, nhưng DB cũ không tự có field này vì seeder hiện tại chủ yếu theo pattern: **seed nếu chưa có dữ liệu**, hoặc một số module có thêm logic `ensure missing fields` cục bộ.
- `useModuleConfig` chỉ auto-heal khi `featuresData.length === 0 && fieldsData.length === 0`; nếu module đã có dữ liệu một phần thì **không heal field thiếu**.
- Trong `convex/seed.ts`, `posts` và `products` đã có pattern tốt hơn: **idempotent additive sync** (`if missing -> insert`), nhưng pattern này đang lặp lại thủ công theo từng module, chưa chuẩn hoá toàn hệ thống.
- `ModuleHeader` hiện chỉ có nút Lưu; chưa có action chủ động để sync cấu hình runtime từ định nghĩa nguồn.

### Expected vs Actual
- Expected: Khi dev thêm field mới vào module definition/seeder, runtime DB có cách đồng bộ an toàn mà không cần viết migration ad-hoc cho từng field.
- Actual: DB runtime giữ state cũ, field mới không xuất hiện nếu module đã được seed trước đó.

### Scope ảnh hưởng
- Toàn bộ `/system/modules/[moduleKey]`
- Convex runtime config tables: `moduleFields`, `moduleFeatures`, `moduleSettings`
- Tất cả module đang và sẽ tiếp tục phát triển trong SaaS này

### Repro tối thiểu
1. Module đã từng seed trước đó.
2. Dev thêm field mới vào seeder/definition.
3. Mở `/system/modules/settings`.
4. Field mới không xuất hiện vì DB không được sync bổ sung.

### Counter-hypothesis
- Không phải bug UI render vì `FieldsCard` render toàn bộ `localFields` lấy từ DB.
- Không phải filter riêng cho `contact_tax_id`; field đơn giản là chưa tồn tại trong `moduleFields` runtime.
- Không nên dùng reset/reseed full vì sẽ làm mất custom enabled/disabled state của tenant/admin.

## Root Cause Confidence
**High** — Evidence trực tiếp từ `ModuleConfigPage`, `useModuleConfig`, `SettingsSeeder`, và các pattern `ensure missing fields` đã tồn tại ở `posts/products`. Vấn đề là thiếu một cơ chế sync chuẩn hoá, idempotent, reusable cho toàn hệ thống.

## Proposal

### Mục tiêu thiết kế
Tạo cơ chế **Smart Sync / Additive Healing** theo best practice cho SaaS đang phát triển liên tục:
- Source of truth cho **structure**: code definition/seeder
- Source of truth cho **runtime state**: DB hiện tại
- Chỉ **thêm thiếu**, không tự ý xoá/overwrite các cấu hình runtime đang dùng
- User/dev có thể **chủ động sync** bằng nút ở UI
- Có thể tái sử dụng cho mọi module, không phải viết migration riêng cho từng field mới

---

## Thiết kế tối ưu đề xuất

### Option được recommend: Additive Smart Sync + Manual Trigger

#### Nguyên tắc merge
1. **Fields / Features / Settings mới trong code nhưng chưa có ở DB** → insert vào DB.
2. **Enabled state / runtime state đang có trong DB** → giữ nguyên, không overwrite.
3. **Metadata nhẹ có thể merge an toàn** (`name`, `description`, `group`, `order`, `type`, `required`, `linkedFeature`) → có thể cập nhật theo code nếu muốn đồng bộ nhãn/thứ tự.
4. **Không tự xoá** item dư trong DB ở phase đầu để tránh destructive behavior.
5. Sync phải **idempotent**: bấm nhiều lần ra cùng kết quả.

#### Vì sao đây là best practice hơn migration-per-field
- Migration riêng cho từng field rất tốn công và dễ quên khi số module tăng nhanh.
- Full reseed/reset phá runtime customization.
- Additive smart sync là pattern phổ biến hơn cho **config metadata** trong SaaS: backward-compatible, ít conflict, rollback dễ, không downtime.
- Phù hợp vì đây là **config tables** chứ không phải business data/schema migration kiểu SQL cứng.

---

## Implementation Plan

### 1. Chuẩn hoá “module config snapshot” từ code
**File gợi ý mới:** `lib/modules/runtime-config/getModuleRuntimeSeed.ts`

Tạo helper trả về snapshot chuẩn cho từng module:
- `features[]`
- `fields[]`
- `settings[]`

Nguồn dữ liệu:
- Ưu tiên dùng **module definition/config trong code** nếu đủ metadata
- Với module phức tạp đang chỉ có logic trong seeder, gom metadata tối thiểu ra helper dùng chung

Mục tiêu là tách **definition data** khỏi `ctx.db.insert(...)` để có thể dùng cho cả:
- seed lần đầu
- sync runtime về sau

### 2. Tạo Convex mutation generic để sync runtime config
**File gợi ý:** `convex/admin/modules.ts`

Thêm mutation kiểu:
- `syncModuleConfigFromDefinition({ moduleKey })`

Logic:
1. Resolve module definition snapshot từ code.
2. Query DB hiện tại của `moduleFeatures`, `moduleFields`, `moduleSettings` theo `moduleKey`.
3. Build map theo key (`featureKey`, `fieldKey`, `settingKey`).
4. Với mỗi item từ definition:
   - Nếu chưa có trong DB → insert
   - Nếu đã có → merge metadata an toàn (không đổi `enabled`/tenant custom state nếu policy là preserve-state)
5. Return summary:
   - `addedFeatures`, `addedFields`, `addedSettings`
   - `updatedFeatures`, `updatedFields`, `updatedSettings`
   - `skipped`

### 3. Policy merge rõ ràng để tránh conflict
**Recommend policy:**
- `enabled`: giữ theo DB
- `required`: theo code definition
- `name`, `description`, `group`, `order`, `type`, `linkedFeature`: theo code definition

Lý do:
- `enabled` là lựa chọn runtime của admin → phải preserve
- metadata structural cần bám code để UI nhất quán và predictable

Nếu muốn cực kỳ bảo thủ ở phase 1, có thể chỉ insert thiếu và chưa update metadata cũ. Tuy nhiên recommend vẫn cho update metadata structural vì dễ đồng bộ UI hơn và ít rủi ro hơn overwrite `enabled`.

### 4. Thêm nút UI “Sync từ định nghĩa” tại module config page
**Files:**
- `components/modules/shared/module-header.tsx`
- `components/modules/ModuleConfigPage.tsx`

Thiết kế:
- Thêm secondary action button cạnh nút Lưu
- Ví dụ label: `Đồng bộ từ định nghĩa`
- Chỉ xuất hiện ở tab config
- Khi bấm:
  - gọi mutation sync
  - toast kết quả: thêm mới bao nhiêu field/feature/setting, cập nhật bao nhiêu metadata
  - sau đó refresh query

### 5. Auto-heal tối thiểu, không gây bất ngờ
**Không recommend** auto-sync mỗi lần mở trang vì:
- khó đoán side-effect
- dễ làm user không hiểu vì sao config thay đổi
- có thể phát sinh write không cần thiết mỗi lần load

**Recommend:**
- giữ auto-heal hiện tại cho trường hợp module trống hoàn toàn
- bổ sung manual sync button cho partial drift
- tương lai có thể thêm badge “Có thay đổi định nghĩa chưa sync” nếu cần

### 6. Áp dụng ngay cho case Settings / tax id
Sau khi có generic sync:
- `contact_tax_id` trong definition sẽ được insert vào `moduleFields` runtime bằng nút sync
- Không cần mutation migration riêng cho field này
- Mô hình này dùng lại được cho mọi module sau này

---

## Kiến trúc đề xuất theo phase

### Phase 1 (Recommend triển khai ngay)
- Generic sync mutation cho `fields + features + settings`
- Nút `Đồng bộ từ định nghĩa`
- Preserve runtime enabled state
- Insert thiếu + update metadata an toàn
- Dùng ngay cho `settings`

### Phase 2 (Sau khi ổn định)
- Thêm diff preview trước khi sync
- Thêm badge `Có thay đổi chưa sync`
- Thêm mode `dry-run` để chỉ xem diff

### Phase 3 (Khi scale mạnh hơn)
- Version hoá module config (`configVersion`)
- Lưu lịch sử sync/audit log
- Có batch sync nhiều module cho admin system

---

## Tại sao không chọn các hướng khác

### Không chọn migration riêng từng field
- Tăng maintenance cost theo số module × số lần thay đổi
- Dễ quên và không scale với SaaS evolving nhanh

### Không chọn force reseed/reset
- Rủi ro mất custom enabled/disabled state
- Không phù hợp multi-tenant / runtime customization

### Không chọn auto-sync mỗi lần load trang
- Side effect ẩn
- Khó debug
- Tăng write không cần thiết

---

## Files dự kiến thay đổi
1. `convex/admin/modules.ts`
   - thêm mutation generic sync module config từ code definition
2. `lib/modules/runtime-config/getModuleRuntimeSeed.ts` hoặc helper tương đương
   - chuẩn hoá source definition cho sync
3. `components/modules/shared/module-header.tsx`
   - thêm secondary button action
4. `components/modules/ModuleConfigPage.tsx`
   - nối action UI với mutation sync + refresh/toast
5. Có thể cần chạm nhẹ vào `settings` module definition/seeder để đảm bảo `contact_tax_id` nằm trong source definition chung

---

## Verification Plan

### Static verification
- `bunx tsc --noEmit`

### Repro verification
1. Trước sync, vào `/system/modules/settings` xác nhận chưa có `contact_tax_id`
2. Bấm `Đồng bộ từ định nghĩa`
3. Xác nhận field `Mã số thuế` xuất hiện trong `Trường Cài đặt hệ thống`
4. Reload page, field vẫn còn
5. Bấm sync lần 2, kết quả không tạo duplicate
6. Toggle enabled/disabled field rồi sync lại, xác nhận state hiện tại không bị reset

### Cross-module verification
1. Chọn một module đã có pattern ensure riêng như `products/posts`
2. Thêm một field giả lập trong definition (ở task tương lai) hoặc dry-run diff
3. Xác nhận generic sync hoạt động giống nhau cho module khác

### Pass / Fail criteria
- Pass nếu sync thêm đúng field thiếu, không duplicate, không reset enabled state cũ
- Fail nếu sync overwrite runtime customization hoặc yêu cầu reset module để field mới xuất hiện

Nếu bạn duyệt spec này, tôi sẽ implement theo **Phase 1**: generic smart sync + button manual sync + dùng ngay để heal `settings/contact_tax_id`.