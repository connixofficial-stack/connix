# Gate Matrix (Critical/Non-Critical)

**Policy:** Critical fail ⇒ block completion. Non-critical fail ⇒ cho phép hoàn tất với warning + remediation note.

| Gate ID | Severity | Rule | Pass Criteria | Evidence |
| --- | --- | --- | --- | --- |
| A1 | Critical | Schema chuẩn + fields bắt buộc | Table đúng naming + đủ fields bắt buộc | Schema path + diff | 
| A2 | Critical | Index cho mọi filter/sort | Có index phù hợp, compound đúng thứ tự | Index list + query usage |
| A3 | Critical | Validators đầy đủ | Query/mutation có validators cho inputs | Validator snippets |
| A4 | Critical | Pagination chuẩn | Dùng paginate/take + limit default + max | Pagination snippet |
| B1 | Critical | Admin list đọc `{module}PerPage` | itemsPerPage lấy từ settings | Admin list snippet |
| B2 | Critical | Default status từ settings | create/edit dùng defaultStatus | Admin create/edit snippet |
| B3 | Non-Critical | Feature toggle ảnh hưởng UI | Cột/filter/field ẩn hiện theo toggle | UI behavior notes |
| B4 | Non-Critical | Field toggle ảnh hưởng form | Form field render theo enabled set | Form snippet |
| C1 | Critical | Dependency 1-way | Experience chỉ đọc module state | Code reference |
| C2 | Non-Critical | Module disabled hiển thị phụ thuộc | UI state rõ ràng khi module off | UI snapshot |
| C3 | Critical | Preview parity | Preview ≈ renderer (layout + dữ liệu) | Preview/Renderer mapping |
| D1 | Non-Critical | Đủ 6 styles | 6 styles có render đầy đủ | Preview list |
| D2 | Critical | Fallback style ở cuối | default return đặt cuối | Renderer snippet |
| D3 | Non-Critical | Preview button type safety | `type="button"` cho actions | Preview snippet |
| D4 | Non-Critical | Config fields thay hardcode | Không hardcode nội dung đặc thù | Config mapping |
| E1 | Critical | Seed idempotent | Seed kiểm tra tồn tại | Seed snippet |
| E2 | Critical | Clear cleanup toàn phần | Xóa DB + storage + relations | Clear snippet |
| E3 | Critical | Wizard dependency rõ ràng | Dependency graph không circular | Registry snippet |
| E4 | Non-Critical | Reset order rõ | Reset = clear → seed | Wizard step note |

## Warning Handling (Non-Critical)

- Mọi non-critical fail phải ghi rõ:
  - Tác động (impact).
  - TODO fix.
  - Owner dự kiến.

## Definition of Done

- **Done khi:** tất cả Critical pass + warning list được khai báo đầy đủ.
- **Not done khi:** có bất kỳ Critical fail.
