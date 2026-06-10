## Tóm tắt Research

Dựa trên nghiên cứu từ:
- **Anthropic Chain of Thought**: Structured thinking với `<thinking>` tags
- **Tree of Thoughts (ToT)**: Framework từ Princeton & DeepMind - dùng DFS/BFS để explore thoughts
- **DFSDT (Smurfs paper)**: Deep First Search Decision Tree cho multi-agent systems

## Prompt đề xuất thêm vào AGENTS.md

```markdown
# DFS Problem-Solving (Depth-First Root Cause Analysis)

Khi gặp vấn đề phức tạp, áp dụng quy trình DFS:

1. **Decompose** - Phân tách vấn đề thành cây con
   - Vấn đề 1 → 1.1, 1.2, 1.3
   - Nếu 1.1 có sub-problems → 1.1.1, 1.1.2

2. **Deep-First Explore** - Đào sâu đến gốc rễ
   - Đi sâu theo từng nhánh đến leaf node (không còn sub-problem)
   - Liệt kê TẤT CẢ vấn đề từ tầng sâu nhất trước khi xử lý

3. **Solve Bottom-Up** - Giải từ gốc rễ lên
   - Xử lý 1.1.1 → 1.1.2 → quay lên 1.1 → 1.2 → 1.3 → 1
   - Nếu stuck: backtrack và thử nhánh khác

4. **Validate** - Kiểm tra sau mỗi bước
   - Xác nhận vấn đề đã giải quyết trước khi lên tầng trên

**Format output:**
```
## Problem Tree
1. [Vấn đề gốc]
   1.1 [Sub-problem]
      1.1.1 [Leaf - ROOT CAUSE] ← Giải trước
      1.1.2 [Leaf]
   1.2 [Sub-problem]

## Execution Order
1. 1.1.1 → 2. 1.1.2 → 3. 1.1 → 4. 1.2 → 5. 1
```
```

## Vị trí chèn

Thêm section mới sau "# Prompt Best Practices" trong AGENTS.md

## Lý do thiết kế

- **Ngắn gọn**: ~200 từ, tuân thủ KISS
- **Actionable**: 4 bước rõ ràng (Decompose → Explore → Solve → Validate)
- **Format mẫu**: Cho agent biết cách output
- **Dựa trên Tree of Thoughts**: Sử dụng DFS traversal thay vì BFS
- **Backtracking**: Cho phép retry nhánh khác nếu stuck