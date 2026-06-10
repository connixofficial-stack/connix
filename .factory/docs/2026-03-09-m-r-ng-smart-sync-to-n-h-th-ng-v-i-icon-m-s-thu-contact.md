## Audit Summary

### Observation
- `app/(site)/contact/page.tsx` và `components/experiences/previews/ContactPreview.tsx` đang dùng `MapPin` cho cả `Địa chỉ` lẫn `Mã số thuế`, nên đúng là icon đang bị trùng.
- Icon thay riêng cho tax id là thay đổi nhỏ, an toàn; `Receipt` từ Lucide là lựa chọn phù hợp nhất vì semantic gần với mã số thuế/chứng từ hơn `MapPin`.
- Cơ chế Smart Sync hiện tại mới ở mức **phase 1 cho settings**:
  - có `lib/modules/runtime-config/index.ts`
  - có `syncModuleConfigFromDefinition`
  - có nút `Đồng bộ từ định nghĩa`
  - nhưng registry runtime definition mới chỉ có `settings`.
- Nhiều seeder khác (`users`, `roles`, `menus`, `notifications`, `homepage`, `comments`, `promotions`, ...) vẫn còn hard-code `features/fields/settings` ngay trong từng `seedModuleConfig()`.
- Một số module trong `convex/seed.ts` từng có pattern “ensure missing fields” cục bộ (`posts`, `products`) nhưng chưa chuẩn hoá thành contract dùng chung cho toàn bộ seeders.
- `defineModule()` hiện mới cover `features/settings` ở mức UI config, **chưa có contract chính thức cho runtime fields/features/settings metadata** để smart sync generic có thể áp dụng tự nhiên cho module mới.

### Expected vs Actual
- Expected 1: `Mã số thuế` có icon riêng, rõ nghĩa hơn `Địa chỉ` ở preview và site.
- Actual 1: đang dùng cùng `MapPin`.
- Expected 2: Khi tạo module mới sau này, AI/dev đi đúng chuẩn smart sync mà không phải nhớ tay hoặc sửa `AGENTS.md`.
- Actual 2: hiện vẫn cần nhớ thêm runtime definition thủ công; nếu quên thì nút sync generic không có source of truth đầy đủ.

### Scope ảnh hưởng
- UI contact preview/site: 2 file
- Kiến trúc module system: `defineModule`, runtime-config, seeders, smart sync mutation, module config page
- Toàn bộ module mới trong tương lai

### Root Cause
1. Icon tax id trùng vì code hiện gắn `MapPin` trực tiếp tại 2 nơi.
2. Smart sync chưa scale toàn hệ thống vì **source of truth cho runtime config chưa được chuẩn hoá vào một contract bắt buộc**; dữ liệu runtime vẫn nằm rải rác trong nhiều seeder.

### Counter-hypothesis
- Không phải do Lucide thiếu icon phù hợp; `Receipt` là lựa chọn sẵn có và semantic tốt.
- Không phải do mutation sync yếu; mutation generic ổn, vấn đề chính là **definition coverage** chưa đủ và chưa có enforcement compile-time + runtime.

## Root Cause Confidence
**High** — Có evidence trực tiếp trong 2 file contact và nhiều seeder hiện tại. Vấn đề mở rộng không nằm ở UI mà ở contract kiến trúc cho module runtime metadata.

## Proposal

### Mục tiêu
1. Đổi icon `Mã số thuế` sang `Receipt` ở cả preview và site thực.
2. Nâng Smart Sync từ “chạy được cho settings” thành **kiến trúc chuẩn cho mọi module**, để module mới buộc phải có runtime definition và AI/dev khó đi lệch chuẩn.

---

## Phần A — Đổi icon tax id

### Thay đổi
**Files:**
- `app/(site)/contact/page.tsx`
- `components/experiences/previews/ContactPreview.tsx`

### Cách làm
- Import `Receipt` từ `lucide-react`
- Thay icon của `Mã số thuế` từ `MapPin` → `Receipt`
- Giữ nguyên `MapPin` cho địa chỉ/văn phòng

### Lý do chọn `Receipt`
- Semantic gần với “mã số thuế / hóa đơn / chứng từ”
- Không gây nhầm với location/address
- Có visual language rõ, hiện đại, dễ nhận biết

---

## Phần B — Smart Sync toàn hệ thống, scalable cho module mới

### Kết luận kiến trúc
**Recommend:** dùng cả hai lớp enforcement
1. **Compile-time contract** — module mới phải khai báo runtime definition rõ ràng
2. **Runtime guard** — nếu thiếu definition thì UI sync báo rõ lỗi/cảnh báo

Đây gần nhất với ý “kế thừa từ lớp cha” nhưng hợp TS/React hơn: thay vì inheritance nặng, dùng **factory/contract + registry + helper dùng chung**. Cách này nhẹ hơn, rõ hơn, hợp codebase hiện tại hơn OOP class inheritance thuần.

---

## Thiết kế tối ưu đề xuất

### 1. Nâng `defineModule()` thành source of truth mạnh hơn
**File:** `lib/modules/define-module.ts`

Mở rộng `ModuleDefinition` để có thêm phần runtime config chuẩn hoá, ví dụ:
- `runtimeConfig.features`
- `runtimeConfig.fields`
- `runtimeConfig.settings`

Mục tiêu:
- module config UI và runtime metadata đi cùng nhau trong **một definition**
- module mới muốn tạo chuẩn thì bắt buộc có runtime contract ngay từ đầu
- giảm duplicate giữa `settings.config.ts` và `runtime-config/index.ts`

### 2. Thay `runtime-config/index.ts` bằng registry build từ module definitions
**Files:**
- `lib/modules/runtime-config/index.ts`
- `lib/modules/index.ts`
- toàn bộ `lib/modules/configs/*.config.ts`

Cách làm:
- export tất cả module definitions từ `lib/modules/configs`
- build `MODULE_RUNTIME_DEFINITIONS` từ chính các module config
- nếu module có `runtimeConfig`, registry tự nhận
- tránh phải tạo thêm một object runtime rời chỉ cho sync

### 3. Tạo helper chuẩn hoá runtime config dùng chung
**File gợi ý mới:** `lib/modules/runtime-config/normalize.ts`

Nhiệm vụ:
- fill default cho `enabled`, `required`, `isSystem`, `group`
- derive `linkedFieldKey` từ feature nếu cần
- validate uniqueness theo `featureKey`, `fieldKey`, `settingKey`
- trả về snapshot sạch cho mutation sync và seeder

### 4. Tạo runtime validation bắt buộc cho module mới
**Compile-time direction:**
- Nếu module có `tabs: ['config']` hoặc là module có quản trị fields/features/settings thì `runtimeConfig` nên là required.
- Có thể dùng type helper kiểu:
  - `defineModuleWithRuntime(...)`
  - hoặc overload `defineModule(...)` để enforce module có config runtime

**Recommend practical path:**
- thêm helper mới `defineModuleWithRuntime()` để migrate dần, không phá toàn bộ code ngay
- module mới bắt buộc đi qua helper này
- module cũ migrate dần theo từng file

### 5. Runtime guard ở mutation sync + UI
**Files:**
- `convex/admin/modules.ts`
- `components/modules/ModuleConfigPage.tsx`

Cải tiến:
- nếu module không có runtime definition hợp lệ → trả lỗi rõ nghĩa
- nếu registry thiếu field/feature/setting definitions → trả warning summary
- UI có thể disable nút sync với tooltip/message rõ: `Module này chưa khai báo runtimeConfig chuẩn`

### 6. Refactor seeders để dùng chung runtime definition
**Files ảnh hưởng lớn:** phần lớn trong `convex/seeders/*.seeder.ts`

Thay vì mỗi seeder hard-code `seedModuleConfig()`, chuyển sang helper dùng chung:
- `seedModuleRuntimeConfig(ctx, moduleKey)`
- logic chung:
  - lấy runtime definition từ module registry
  - seed features nếu chưa có
  - seed fields nếu chưa có
  - seed settings nếu chưa có

Lợi ích:
- module mới không cần tự viết lại block seed features/fields/settings
- dev/AI chỉ cần khai báo module config đúng contract
- seeder giảm duplicate mạnh

### 7. Base helper / base seeder để “ép chuẩn” cho module mới
Bạn nói “kế thừa từ lớp cha” là ý rất đúng ở tầng seeder.

**Recommend:** thêm helper vào `BaseSeeder` hoặc utility song song, ví dụ:
- `protected async seedRuntimeConfig(): Promise<void>`

Hoặc an toàn hơn, ít phá hơn:
- utility: `syncRuntimeConfigOnSeed(ctx, moduleKey)`

Seeder nào có module config chỉ cần gọi 1 dòng:
```ts
await syncRuntimeConfigOnSeed(this.ctx, this.moduleName)
```

Với cách này:
- module mới kế thừa `BaseSeeder`
- gọi helper chung
- không phải copy-paste 30-50 dòng `seedModuleConfig()` nữa

### 8. Migrate full cho mọi module ở task này
Vì bạn chọn “full luôn”, scope triển khai đề xuất là:
- đổi icon tax id
- thêm contract runtime config vào module definition/helper
- migrate registry/runtime normalize
- refactor generic sync mutation để đọc từ contract mới
- refactor toàn bộ seeders module config sang helper chung hoặc ít nhất migrate tất cả seeders đang có `seedModuleConfig()` sang dùng source definition chung

### 9. Giữ backward-compatible
Để tránh rủi ro lớn, nên làm theo chiến lược:
- bước 1: thêm contract mới + helper + registry
- bước 2: migrate module configs sang contract mới
- bước 3: seeders dùng helper chung nhưng vẫn giữ logic data seeding riêng
- bước 4: xóa dần hard-coded config cũ khi verify xong

---

## Kiến trúc recommend cuối cùng

### Source of truth chuẩn
- **Module UI + Runtime Config metadata** nằm trong `lib/modules/configs/*.config.ts`
- **Seeder** chỉ seed data nghiệp vụ + gọi helper seed runtime config
- **Smart Sync mutation** chỉ đọc từ module runtime definition chung

### Enforcements
- **Compile-time**: helper `defineModuleWithRuntime` / typed contract bắt buộc
- **Runtime**: validation + error rõ ràng ở sync/seed

### Outcome mong muốn
Khi AI/dev tạo module mới sau này:
1. tạo `*.config.ts` bằng helper chuẩn
2. khai báo runtime fields/features/settings ở đó
3. seeder chỉ gọi helper chung để seed runtime config
4. nút sync tự hoạt động
5. không cần nhớ thêm rule trong AGENTS.md

Nghĩa là ta **ép hành vi bằng code architecture**, không ép bằng prompt/instruction.

---

## Files dự kiến đổi lớn

### UI nhỏ
1. `app/(site)/contact/page.tsx`
2. `components/experiences/previews/ContactPreview.tsx`

### Kiến trúc module
3. `lib/modules/define-module.ts`
4. `lib/modules/index.ts`
5. `lib/modules/runtime-config/index.ts`
6. `lib/modules/runtime-config/normalize.ts` (mới)
7. Có thể thêm helper mới như `lib/modules/runtime-config/seed-runtime-config.ts`

### Smart sync runtime
8. `convex/admin/modules.ts`

### Seeders
9. Hầu hết `convex/seeders/*.seeder.ts` có `seedModuleConfig()` sẽ được refactor sang helper chung
   - users
   - roles
   - settings
   - subscriptions
   - promotions
   - notifications
   - menus
   - media
   - kanban
   - homepage
   - contactInbox
   - comments
   - và các module khác có config tương tự

### Có thể cần chạm thêm
10. `lib/modules/configs/*.config.ts` cho tất cả module để bổ sung runtimeConfig/contract

---

## Rủi ro và cách giảm rủi ro

### Rủi ro
- Scope refactor lớn, nhiều file
- Có thể lệch metadata giữa config hiện tại và seeder cũ
- Một số module hiện có logic đặc thù (group, linkedFeature, category fields, setting groups)

### Guardrails
- Không đổi logic data seeding nghiệp vụ
- Chỉ gom phần runtime config metadata về một source of truth
- Giữ smart sync additive, không xóa dữ liệu runtime hiện có
- Typecheck cuối cùng bằng `bunx tsc --noEmit`
- Ưu tiên migrate các module system/user/content đang có `seedModuleConfig()` trước, giữ hành vi cũ

---

## Verification Plan

### Static verification
- `bunx tsc --noEmit`

### Repro verification cho icon
1. Mở `/system/experiences/contact`
2. Xác nhận `Mã số thuế` dùng `Receipt`, không còn trùng `MapPin`
3. Mở `/contact`
4. Xác nhận runtime site cũng dùng `Receipt`

### Repro verification cho smart sync
1. Chọn các module tiêu biểu: `settings`, `users`, `posts`, `products`
2. Xác nhận nút `Đồng bộ từ định nghĩa` chỉ hiện khi module có runtime contract hợp lệ
3. Sync mỗi module, kiểm tra không duplicate, không reset enabled state
4. Với `settings`, xác nhận `contact_tax_id` xuất hiện nếu thiếu
5. Thử sync lần 2 → không sinh thêm record dư

### Future-proof verification
1. Tạo 1 module config mới theo helper chuẩn (hoặc kiểm tra bằng type system)
2. Nếu thiếu runtimeConfig → compile-time hoặc runtime phải báo rõ
3. Seeder module mới gọi helper chung và smart sync hoạt động không cần viết migration tay

### Pass / Fail criteria
- Pass nếu icon tax id đổi đúng ở cả preview/site và kiến trúc smart sync được chuẩn hoá để module mới có thể đi đúng chuẩn nhờ contract code.
- Fail nếu vẫn còn phải nhớ quy ước ngoài code hoặc module mới có thể dễ dàng bỏ qua runtime definition mà không bị cảnh báo/lỗi.

Nếu bạn duyệt, tôi sẽ implement theo hướng full: đổi icon `Receipt` + refactor Smart Sync thành contract chung, có enforcement compile-time + runtime, rồi migrate rộng cho các module hiện có.