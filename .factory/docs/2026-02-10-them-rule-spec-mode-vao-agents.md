
## Phan tich

Hien tai AGENTS.md co:
- Custom Rule (commit, lint...)
- Prompt Best Practices
- DARE Framework
- DB Bandwidth Optimization

**Thieu**: Khong co rule rieng cho **Spec Mode** -- khi agent o che do spec, khong co chi dan cu the ve cach lap plan.

## De xuat

Them 1 section moi `# Spec Mode Rules` ngay sau section `# Problem-Solving Framework (DARE)`, noi dung nhu sau:

```markdown
# Spec Mode Rules
Khi ở chế độ Spec (read-only planning):
* Bắt buộc dùng DARE framework: Decompose → Analyze → Reflect → Execute plan.
* Dùng AskUser để làm rõ mọi điểm mơ hồ TRƯỚC khi chốt spec; không đoán requirement.
* Plan phải chi tiết từng bước (step-by-step actionable), đủ để implement xong trong 1 lần — KHÔNG chia phase/giai đoạn.
* Mỗi bước ghi rõ: file nào, thay đổi gì, logic cụ thể; ai đọc plan cũng tự implement được.
* Ưu tiên full implement > incremental; nếu scope quá lớn thì AskUser để user quyết cắt scope, không tự ý chia phase.
```

## Giai thich tung dong

| Dong | Ly do | Source |
|------|-------|--------|
| Bat buoc DARE | Dam bao agent phan tich root cause truoc khi plan, tranh plan sai huong | DARE framework co san trong AGENTS.md |
| AskUser lam ro | Addy Osmani: "iterative planning, clarify before execute"; Anthropic: "plan in read-only first" | addyo.substack.com, docs.anthropic.com |
| Plan chi tiet, 1 lan | Addy Osmani: "single document focus", "high-level vision -> AI elaborate full detail"; Agentic Handbook: "constrain scope, prove correctness upfront" | addyo.substack.com, nibzard.com |
| Ghi ro file + logic | Best practice tu builder.io va OpenAI AGENTS.md standard: "specific, actionable items" | builder.io/blog/agents-md, github.com/openai/agents.md |
| Khong tu y chia phase | Research-Plan-Implement workflow: "clear boundaries"; user giu quyen quyet dinh scope | deepwiki.com/humanlayer |

## Vi tri chen

```
... (DARE section giu nguyen) ...

# Spec Mode Rules          <-- THEM MỚI Ở ĐÂY
...

# 7 Nguyên tắc DB Bandwidth Optimization:
... (giu nguyen) ...
```

Tong cong chi **5 dong rule**, gon nhung du manh de dieu khien hanh vi agent trong spec mode.
