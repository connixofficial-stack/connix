---
name: qa-review
description: "QA Review Code trước khi commit - kiểm tra bugs, security, performance, database optimization, best practices. Sử dụng khi: (1) User muốn review code trước commit, (2) Kiểm tra code quality, (3) Tìm bugs và security issues, (4) Review pull request, (5) Audit codebase, (6) Database query optimization. Hỗ trợ: JavaScript/TypeScript, Python, PHP, Java, Go, Rust, C#, Ruby và nhiều ngôn ngữ khác."
version: 2.0.0
allowed-tools: Read, Grep, Glob, LS, Execute
---

# QA Review Code

Pre-commit code review để phát hiện bugs, security issues, performance problems, database optimization và vi phạm best practices.

## Khi nào sử dụng

- Trước khi commit code
- Review pull request
- Kiểm tra code quality
- Audit security vulnerabilities
- Tìm performance bottlenecks
- Review database queries và bandwidth optimization

## Quick Start

```bash
# Review staged changes
git diff --cached

# Review specific files
git diff HEAD -- path/to/files
```

## Review Workflow

### Phase 1: Thu thập thông tin

1. **Xác định scope review**
   ```bash
   git status                    # Xem files đã thay đổi
   git diff --cached --name-only # Files staged for commit
   git diff --name-only          # Files chưa staged
   ```

2. **Đọc các files cần review**
   - Sử dụng Read tool để đọc nội dung
   - Grep để tìm patterns nguy hiểm
   - Glob để tìm related files

### Phase 2: Security Review (CRITICAL)

**Checklist bắt buộc:**

| Issue | Pattern tìm kiếm | Severity |
|-------|------------------|----------|
| Hardcoded secrets | `password\s*=`, `api[_-]?key\s*=`, `secret\s*=` | 🔴 Critical |
| SQL Injection | Raw SQL queries without parameterization | 🔴 Critical |
| XSS vulnerabilities | `innerHTML`, `dangerouslySetInnerHTML`, unescaped output | 🔴 Critical |
| Command Injection | `exec()`, `eval()`, `system()` with user input | 🔴 Critical |
| Path Traversal | `../` patterns in file paths | 🟠 High |
| Insecure randomness | `Math.random()` for security | 🟠 High |
| Missing authentication | Unprotected endpoints | 🟠 High |
| Sensitive data exposure | Logging PII, tokens in URLs | 🟠 High |
| Weak cryptography | MD5, SHA-1 for passwords | 🔴 Critical |
| Missing HTTPS | HTTP endpoints cho sensitive data | 🟠 High |
| Insecure cookies | Missing HttpOnly, Secure, SameSite | 🟠 High |
| CSRF missing | Forms without CSRF tokens | 🟠 High |

**Commands kiểm tra:**
```bash
# Tìm hardcoded secrets
rg -i "(password|api_key|secret|token)\s*[=:]\s*['\"][^'\"]+['\"]"

# Tìm SQL injection risks
rg -i "query\(.*\+|execute\(.*\+|raw\(.*\$"

# Tìm eval/exec nguy hiểm
rg "eval\(|exec\(|Function\(|new Function"

# Tìm weak crypto
rg -i "md5\(|sha1\(|SHA1|MD5"

# Tìm insecure cookies
rg -i "cookie.*httponly.*false|secure.*false"
```

### Phase 2.1: Cryptography & Transport Security

**Cryptography Checklist:**

| Issue | Best Practice | Severity |
|-------|---------------|----------|
| Password hashing | Dùng bcrypt/Argon2/PBKDF2, KHÔNG MD5/SHA-1 | 🔴 Critical |
| Encryption | AES-128/256 với GCM mode | 🔴 Critical |
| Random values | crypto.randomBytes(), secrets module | 🟠 High |
| Key rotation | Có mechanism rotate keys | 🟡 Medium |
| IV/Nonce | Unique cho mỗi encryption | 🔴 Critical |

**Transport Security Checklist:**

| Issue | Best Practice | Severity |
|-------|---------------|----------|
| HTTPS enforcement | Redirect HTTP → HTTPS | 🔴 Critical |
| TLS version | Minimum TLS 1.2, prefer 1.3 | 🟠 High |
| HSTS header | Strict-Transport-Security | 🟠 High |
| No sensitive in URL | Không password/token trong query params | 🔴 Critical |

### Phase 2.2: Session & Authentication

**Session Management Checklist:**

| Issue | Best Practice | Severity |
|-------|---------------|----------|
| Secure cookies | HttpOnly, Secure, SameSite=Strict | 🔴 Critical |
| Session regeneration | Regenerate after login | 🟠 High |
| Session timeout | Reasonable expiration | 🟡 Medium |
| Logout invalidation | Destroy session server-side | 🟠 High |

**Authentication Checklist:**

| Issue | Best Practice | Severity |
|-------|---------------|----------|
| Login method | POST only, không GET | 🟠 High |
| MFA support | Enable cho sensitive ops | 🟡 Medium |
| Rate limiting | Brute force protection | 🟠 High |
| Account lockout | After failed attempts | 🟠 High |

### Phase 2.3: Authorization & Access Control

**Authorization Checklist:**

| Issue | Best Practice | Severity |
|-------|---------------|----------|
| RBAC/ABAC | Role-based access control | 🟠 High |
| Least privilege | Minimum permissions needed | 🟠 High |
| Centralized checks | Single authorization layer | 🟡 Medium |
| Re-auth sensitive ops | Confirm password for critical actions | 🟠 High |
| IDOR prevention | Validate resource ownership | 🔴 Critical |

### Phase 2.4: Dependency Management

**Dependency Checklist:**

| Issue | Best Practice | Severity |
|-------|---------------|----------|
| SBOM | Maintain Software Bill of Materials | 🟡 Medium |
| Vulnerability scan | npm audit, pip-audit, Snyk | 🟠 High |
| Outdated packages | Regular updates | 🟠 High |
| License compliance | Check licenses | 🟡 Medium |
| Lock files | package-lock.json, poetry.lock | 🟡 Medium |

**Commands kiểm tra dependencies:**
```bash
# JavaScript/Node.js
npm audit
yarn audit

# Python
pip-audit
safety check

# PHP
composer audit

# General
snyk test
```

### Phase 2.5: Business Logic Review

**Business Logic Checklist:**

| Issue | Check | Severity |
|-------|-------|----------|
| Race conditions | Concurrent request handling | 🟠 High |
| Price manipulation | Server-side price validation | 🔴 Critical |
| Quantity abuse | Negative/overflow checks | 🔴 Critical |
| Workflow bypass | Step validation | 🟠 High |
| Time-based attacks | TOCTOU vulnerabilities | 🟠 High |

```javascript
// ❌ BAD - Client-side price
const total = req.body.price * quantity;

// ✅ GOOD - Server-side price lookup
const product = await db.getProduct(productId);
const total = product.price * quantity;
```

### Phase 3: Bug Detection

**Common bugs theo ngôn ngữ:**

#### JavaScript/TypeScript
- `===` vs `==` comparison issues
- Missing `await` on async functions
- Null/undefined access without checks
- Array mutation trong loops
- Memory leaks (event listeners, intervals)
- Off-by-one errors
- Race conditions

#### Python
- Mutable default arguments
- Missing `self` in methods
- Integer division issues
- Missing exception handling
- Resource leaks (files, connections)
- Circular imports

#### PHP
- Missing input sanitization
- Type juggling issues
- SQL injection via concatenation
- CSRF token missing
- Session fixation

#### General
- Empty catch blocks
- Dead code / unreachable code
- Infinite loops potential
- Resource leaks
- Inconsistent return types

### Phase 4: Performance Review

**Patterns cần phát hiện:**

| Issue | Pattern | Fix |
|-------|---------|-----|
| N+1 queries | Loop with DB calls | Batch queries / Eager loading |
| Unnecessary re-renders | Missing memo/useMemo | Add memoization |
| Large bundle | Import entire library | Tree shaking / Code splitting |
| Memory leaks | Growing collections | Clear references |
| Blocking operations | Sync I/O on main thread | Async / Worker threads |
| Inefficient algorithms | O(n²) in nested loops | Optimize complexity |

### Phase 4.1: Database Optimization (CRITICAL for Cloud Costs)

**THẢM HỌA Anti-Patterns - Phải sửa ngay:**

| Pattern | Risk Level | Impact | Fix |
|---------|------------|--------|-----|
| `.collect()` no filter | 🔴 CRITICAL | Fetch ALL records | Add index + filter |
| Loop với DB calls | 🔴 CRITICAL | N+1 problem | Batch load |
| `Array.find()` in map | 🟠 HIGH | O(n²) complexity | Use Map lookup |
| No pagination | 🟠 HIGH | Memory overflow | Add pagination |
| Missing index | 🟠 HIGH | Full table scan | Create index |
| No query limit | 🟠 MEDIUM | Unlimited data | Add limit |
| Count by fetching all | 🔴 CRITICAL | Massive bandwidth | Use aggregation |

**Commands phát hiện Database Anti-Patterns:**
```bash
# Find .collect() without filters (Convex)
rg "\.collect\(\)" --type ts

# Find potential N+1 in loops
rg "for.*await.*db\.|forEach.*await.*db\." --type ts

# Find Array.find() in map (potential O(n²))
rg "\.map\(.*\.find\(" --type ts

# Find queries without limit
rg "query\([^)]+\)(?!.*\.take|.*\.first|.*\.paginate)" --type ts

# Find potential full table scans
rg "findMany\(\s*\)" --type ts
rg "find\(\s*\{\s*\}\s*\)" --type ts
```

**Database Anti-Pattern Examples:**

```typescript
// ❌ THẢM HỌA #1: Fetch ALL rồi filter JS
const allUsers = await db.query("users").collect();
const activeUsers = allUsers.filter(u => u.status === "active");

// ✅ FIX: Filter ở database với index
const activeUsers = await db
  .query("users")
  .withIndex("by_status", q => q.eq("status", "active"))
  .collect();
```

```typescript
// ❌ THẢM HỌA #2: N+1 Problem - 101 queries!
const posts = await db.query("posts").take(100);
for (const post of posts) {
  post.author = await db.get(post.authorId);
}

// ✅ FIX: Batch loading - 2 queries
const posts = await db.query("posts").take(100);
const authorIds = [...new Set(posts.map(p => p.authorId))];
const authors = await Promise.all(authorIds.map(id => db.get(id)));
const authorMap = new Map(authors.map(a => [a._id, a]));
posts.forEach(p => p.author = authorMap.get(p.authorId));
```

```typescript
// ❌ THẢM HỌA #3: Fetch ALL để count
const allOrders = await db.query("orders").collect();
const count = allOrders.length; // Fetch 100K records để đếm!

// ✅ FIX: Dùng counter table
const stats = await db.query("orderStats").first();
const count = stats?.totalOrders ?? 0;
```

```typescript
// ❌ THẢM HỌA #4: Array.find() O(n²)
posts.map(p => ({
  ...p,
  author: authors.find(a => a._id === p.authorId) // N*M lookups!
}));

// ✅ FIX: Map lookup O(n)
const authorMap = new Map(authors.map(a => [a._id, a]));
posts.map(p => ({
  ...p,
  author: authorMap.get(p.authorId)
}));
```

**Index Strategy Checklist:**

| Rule | Description |
|------|-------------|
| Foreign keys | Luôn có index cho FK relationships |
| Filter fields | Index cho mọi field dùng trong WHERE |
| Sort fields | Index cho fields dùng trong ORDER BY |
| Compound index | Equality fields trước, range/sort sau |
| Selectivity | Ưu tiên index có high selectivity |

**Performance Comparison:**

| Pattern | Before | After | Improvement |
|---------|--------|-------|-------------|
| Filter at DB vs JS | 10,000 records | 100 records | 99% less |
| N+1 → Batch | 101 queries | 2 queries | 98% less |
| find() → Map | O(n²) | O(n) | Quadratic → Linear |
| Full scan → Index | O(n) | O(log n) | Logarithmic |
| Count all → Aggregation | 100K reads | 1 read | 99.999% less |

**Cost Estimation trước Deploy:**
```
Daily Bandwidth = Records × Size × Requests/Day
  
Example: 10K records × 1KB × 1000 requests = 10 GB/day
With proper filtering (100 records): 0.1 GB/day
Savings: 99%!
```

### Phase 5: Code Quality & Best Practices

**Checklist:**

- [ ] **Naming**: Variables/functions có descriptive names
- [ ] **Single Responsibility**: Mỗi function làm 1 việc
- [ ] **DRY**: Không có code duplicate > 3 lines
- [ ] **Error Handling**: Try/catch đầy đủ, error messages clear
- [ ] **Comments**: Complex logic được explain
- [ ] **Type Safety**: Types/interfaces defined (cho typed languages)
- [ ] **Constants**: Magic numbers được extract thành constants
- [ ] **Validation**: Input validation ở boundaries
- [ ] **Logging**: Sufficient logs cho debugging
- [ ] **Tests**: Unit tests cho critical paths

### Phase 5.1: Test Coverage & Quality (Testing Pyramid)

**Testing Pyramid Strategy:**

```
        /\
       /  \     E2E Tests (ít nhất)
      /----\    - User journeys
     /      \   - Critical flows
    /--------\  Integration Tests (vừa)
   /          \ - API contracts
  /------------\ - Component interactions
 /              \ Unit Tests (nhiều nhất)
/----------------\ - Functions, methods, classes
```

**Test Coverage Checklist:**

| Test Type | Mục đích | Coverage Target |
|-----------|----------|-----------------|
| Unit Tests | Test isolated functions/methods | 80%+ lines |
| Integration Tests | Test API contracts, DB queries | Critical paths |
| E2E Tests | Test user journeys | Happy paths + error flows |
| Smoke Tests | Quick sanity check | Core features |
| Regression Tests | Prevent bugs from returning | All fixed bugs |

**Test Quality Review:**

| Issue | Check | Severity |
|-------|-------|----------|
| Missing tests cho new code | PR không có tests | 🟠 High |
| Test không có assertions | Test chạy nhưng không verify | 🟠 High |
| Flaky tests | Tests fail intermittently | 🟡 Medium |
| Slow tests | Test > 5s không có lý do | 🟡 Medium |
| Test dependencies | Tests không independent | 🟡 Medium |
| Missing edge cases | Chỉ test happy path | 🟠 High |
| Hardcoded test data | Test data không flexible | 🟢 Low |

**Commands kiểm tra Test Coverage:**
```bash
# JavaScript/TypeScript
npm run test -- --coverage
npx jest --coverage --coverageReporters=text

# Python
pytest --cov=src --cov-report=term-missing
coverage run -m pytest && coverage report

# PHP
./vendor/bin/phpunit --coverage-text

# Go
go test -cover ./...
```

**Test Patterns - Best Practices:**

```typescript
// ✅ GOOD: Clear test structure (AAA pattern)
describe('UserService', () => {
  it('should create user with valid data', async () => {
    // Arrange
    const userData = { name: 'John', email: 'john@test.com' };
    
    // Act
    const user = await userService.create(userData);
    
    // Assert
    expect(user.id).toBeDefined();
    expect(user.name).toBe('John');
  });
  
  it('should throw error for duplicate email', async () => {
    // Arrange
    await userService.create({ name: 'John', email: 'dup@test.com' });
    
    // Act & Assert
    await expect(
      userService.create({ name: 'Jane', email: 'dup@test.com' })
    ).rejects.toThrow('Email already exists');
  });
});
```

```typescript
// ❌ BAD: Test without proper assertions
it('should work', async () => {
  const result = await doSomething();
  console.log(result); // No assertion!
});

// ❌ BAD: Tests with dependencies
let sharedState;
it('test 1', () => { sharedState = 'value'; });
it('test 2', () => { expect(sharedState).toBe('value'); }); // Depends on test 1!
```

**E2E Testing Checklist:**

| Scenario | Status |
|----------|--------|
| User registration flow | ☐ |
| Login/logout | ☐ |
| Core business workflow | ☐ |
| Payment/checkout (nếu có) | ☐ |
| Error handling (404, 500) | ☐ |
| Form validation | ☐ |
| Cross-browser (Chrome, Firefox, Safari) | ☐ |
| Mobile responsive | ☐ |

**Test Automation Integration:**

| Practice | Description |
|----------|-------------|
| CI/CD Integration | Tests chạy trong pipeline |
| Pre-commit hooks | Lint + Unit tests trước commit |
| Parallel testing | Chạy tests đồng thời |
| Test reporting | Coverage reports, test results |
| Shift-left testing | Test sớm trong development |

### Phase 6: Framework-Specific Checks

#### React/Next.js
- Keys trong lists
- useEffect dependencies đầy đủ
- useState batching
- Server/client component boundary
- Missing loading/error states

#### Laravel/PHP
- Mass assignment protection
- CSRF protection
- Query builder thay vì raw SQL
- Validation rules
- Route model binding

#### Node.js/Express
- Async error handling
- Rate limiting
- Input sanitization
- CORS configuration
- Helmet security headers

#### Django/FastAPI
- ORM queries optimization
- Authentication decorators
- CSRF middleware
- Input validation
- Response serialization

## Output Format

Sau khi review, output theo format sau:

```markdown
# 🔍 QA Review Report

## 📊 Summary
- Files reviewed: [số]
- Issues found: [số]
- Severity breakdown: 🔴 Critical: [n] | 🟠 High: [n] | 🟡 Medium: [n] | 🟢 Low: [n]

## 🔴 Critical Issues
### [Issue Title]
- **File**: `path/to/file.js:line`
- **Type**: Security / Bug / Performance / Database
- **Description**: Mô tả vấn đề
- **Code**:
```language
// Problematic code
```
- **Fix**: Cách sửa đề xuất
```language
// Fixed code
```

## 🟠 High Priority Issues
[Same format]

## 🟡 Medium Priority Issues
[Same format]

## 🟢 Suggestions (Low)
[Same format]

## 🗄️ Database Performance
- Queries reviewed: [số]
- N+1 patterns found: [số]
- Missing indexes: [số]
- Estimated bandwidth impact: [GB/day]

## 🧪 Test Coverage
- Unit test coverage: [%]
- New code covered: [Yes/No]
- Missing test scenarios: [list]
- E2E tests status: [Pass/Fail/Missing]

## ✅ Positive Observations
- [Good practices found]

## 📋 Recommendations
1. [Action item 1]
2. [Action item 2]
```

## Severity Definitions

| Level | Icon | Definition | Action |
|-------|------|------------|--------|
| Critical | 🔴 | Security vulnerabilities, data loss risk | Block commit |
| High | 🟠 | Bugs affecting functionality | Fix before commit |
| Medium | 🟡 | Code quality issues | Fix soon |
| Low | 🟢 | Style, suggestions | Optional |

## Quick Commands

```bash
# Full review workflow
git diff --cached > /tmp/changes.diff
# Then review the diff

# Security-focused scan
rg -i "password|secret|key|token|credential" --type-not lock

# Find TODO/FIXME/HACK
rg "TODO|FIXME|HACK|XXX" --type-add 'code:*.{js,ts,py,php,java,go,rs}'

# Find console.log/print statements
rg "console\.(log|debug|info)|print\(|var_dump|dd\(" 

# Check for debug code
rg "debugger|breakpoint\(\)"

# Database anti-patterns
rg "\.collect\(\)|\.findAll\(\)|\.toArray\(\)" --type ts --type js
rg "for.*await.*db\." --type ts --type js
rg "\.map\(.*\.find\(" --type ts --type js

# Weak cryptography
rg -i "md5\(|sha1\(|DES|RC4"

# Dependency audit
npm audit 2>/dev/null || yarn audit 2>/dev/null || pip-audit 2>/dev/null

# Test coverage
npm run test -- --coverage 2>/dev/null
pytest --cov=src --cov-report=term-missing 2>/dev/null
./vendor/bin/phpunit --coverage-text 2>/dev/null
```

## Best Practices Checklist

### Before Every Commit
- [ ] Chạy linter/formatter
- [ ] Chạy type checker (nếu có)
- [ ] Chạy unit tests
- [ ] Review own changes với `git diff`
- [ ] Remove debug code
- [ ] Check cho hardcoded values
- [ ] Verify error handling

### Security Must-Haves
- [ ] Không có hardcoded credentials
- [ ] Input được sanitize
- [ ] Output được escape
- [ ] Authentication/authorization đúng
- [ ] Sensitive data không log
- [ ] HTTPS enforced
- [ ] Dependencies không có known vulnerabilities
- [ ] Strong cryptography (bcrypt/Argon2, AES-GCM)
- [ ] Secure cookies (HttpOnly, Secure, SameSite)
- [ ] CSRF protection enabled
- [ ] Rate limiting cho auth endpoints

### Database Performance Must-Haves
- [ ] Tất cả queries có indexes phù hợp
- [ ] Không có N+1 patterns
- [ ] Pagination cho list queries
- [ ] Limits cho tất cả queries
- [ ] Batch loading cho relations
- [ ] Không fetch ALL rồi filter JS
- [ ] Map thay vì Array.find() cho lookups
- [ ] Counter tables thay vì count by fetch all

### Test Coverage Must-Haves
- [ ] Unit tests cho new/modified code
- [ ] Test coverage >= 80% cho critical paths
- [ ] Tests follow AAA pattern (Arrange-Act-Assert)
- [ ] Tests independent (không depend on other tests)
- [ ] Edge cases và error paths covered
- [ ] No flaky tests
- [ ] Integration tests cho API contracts
- [ ] E2E tests cho critical user journeys
- [ ] Regression tests cho fixed bugs

## Language-Specific Patterns

### JavaScript/TypeScript Danger Patterns
```javascript
// ❌ BAD
eval(userInput)
innerHTML = userInput
document.write(userInput)
$.html(userInput)
new Function(userInput)

// ❌ BAD - Missing await
async function getData() {
  const result = fetchData(); // Missing await!
  return result;
}

// ❌ BAD - Memory leak
useEffect(() => {
  const interval = setInterval(fn, 1000);
  // Missing cleanup!
}, []);
```

### Python Danger Patterns
```python
# ❌ BAD
eval(user_input)
exec(user_input)
os.system(f"ls {user_input}")
pickle.loads(untrusted_data)
yaml.load(data)  # Use yaml.safe_load

# ❌ BAD - SQL injection
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")

# ❌ BAD - Mutable default
def append_to(element, to=[]):  # Shared mutable!
    to.append(element)
    return to
```

### PHP Danger Patterns
```php
// ❌ BAD
eval($userInput);
shell_exec($userInput);
include($userInput);
$_GET['id'] in SQL query without binding
echo $userInput; // Without htmlspecialchars

// ❌ BAD - SQL injection
$query = "SELECT * FROM users WHERE id = " . $_GET['id'];
```

## Integration với Git Hooks

Có thể setup pre-commit hook để tự động review:

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Check for debug statements
if rg "console\.log|debugger|var_dump" --type-add 'code:*.{js,ts,py,php}' $(git diff --cached --name-only); then
    echo "⚠️  Debug statements found. Remove before commit."
    exit 1
fi

# Check for secrets
if rg -i "password\s*=\s*['\"]|api_key\s*=\s*['\"]" $(git diff --cached --name-only); then
    echo "🔴 Potential secrets detected. Review before commit."
    exit 1
fi

echo "✅ Pre-commit checks passed"
```

## References

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [SANS Top 25](https://www.sans.org/top25-software-errors/)
- [Secure Coding Guidelines](https://wiki.sei.cmu.edu/confluence/display/seccode)
- [OWASP Secure Code Review](https://owasp.org/www-project-code-review-guide/)
- [NIST Cryptography Guidelines](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines)

### Database & Performance
- [Database Bandwidth Optimization Skill](../db-bandwidth-optimization/SKILL.md)
- [Use The Index, Luke](https://use-the-index-luke.com/)
- [High Performance MySQL](https://www.oreilly.com/library/view/high-performance-mysql/9781492080503/)

### Code Quality
- [Clean Code by Robert C. Martin](https://www.oreilly.com/library/view/clean-code-a/9780136083238/)
- [Google Engineering Practices](https://google.github.io/eng-practices/)
- [Microsoft Code Review Guidelines](https://learn.microsoft.com/en-us/azure/devops/repos/git/review-pull-requests)
