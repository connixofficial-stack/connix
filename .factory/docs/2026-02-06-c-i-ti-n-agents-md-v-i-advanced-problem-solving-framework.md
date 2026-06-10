## Kết quả Research - So sánh các phương pháp

| Method | Ưu điểm | Nhược điểm | Best for |
|--------|---------|------------|----------|
| **DFS/ToT** | Đơn giản, dễ hiểu | Thiếu flexibility, không merge thoughts | Bài toán tuyến tính |
| **GoT (Graph of Thoughts)** | 62% tốt hơn ToT, merge/loop thoughts | Phức tạp hơn | Complex reasoning |
| **AoT (Algorithm of Thoughts)** | 100x ít API calls hơn ToT | Cần structured steps | Efficiency-focused |
| **ReAct** | Kết hợp reasoning + action + tools | Phụ thuộc external info | Real-world tasks |
| **Reflexion** | Self-critique, học từ lỗi | Cần self-evaluation tốt | Iterative improvement |
| **Self-Consistency** | Multiple paths → vote best | Tốn compute | High-stakes decisions |

## Đề xuất: Kết hợp Hybrid Approach

Thay vì DFS thuần túy, dùng **DARE Framework** (Decompose-Analyze-Reflect-Execute):

```markdown
# Problem-Solving Framework (DARE)

Khi gặp vấn đề phức tạp:

## 1. DECOMPOSE - Phân tách (GoT-style)
- Vẽ problem graph: nodes = sub-problems, edges = dependencies
- Xác định ROOT CAUSES (leaf nodes không có dependency)
- Cho phép merge/loop giữa các thoughts

## 2. ANALYZE - Phân tích (ReAct-style)
- Với mỗi sub-problem: Thought → Action → Observation
- Dùng tools/search khi cần external info
- Ghi lại reasoning trace

## 3. REFLECT - Tự đánh giá (Reflexion-style)
- Sau mỗi bước: tự critique output
- Nếu có lỗi: backtrack và thử approach khác
- Lưu lessons learned vào context

## 4. EXECUTE - Thực thi (Bottom-Up)
- Giải từ ROOT CAUSE → parents
- Validate mỗi bước trước khi tiếp
- Self-consistency: nếu uncertain, thử 2-3 approaches và vote

**Output Format:**
```
## Problem Graph
1. [Main] ← depends on 1.1, 1.2
   1.1 [Sub] ← depends on 1.1.1
      1.1.1 [ROOT CAUSE] ← Solve first
   1.2 [Sub]

## Execution (with reflection)
1. Solving 1.1.1...
   - Thought: ...
   - Action: ...
   - Reflection: ✓ Valid / ✗ Retry
2. ...
```
```

## Lý do thiết kế

1. **GoT > ToT > DFS**: Cho phép thoughts merge/loop, không bị giới hạn tree structure
2. **ReAct integration**: Kết hợp reasoning với action/tools - đây là best practice từ Anthropic
3. **Reflexion**: Tự critique để tránh error propagation - cải thiện 40% accuracy
4. **Self-consistency**: Khi uncertain, vote từ multiple attempts
5. **Gọn gàng**: ~250 từ, vẫn tuân thủ KISS

## So sánh với bản cũ

| Aspect | Bản cũ (DFS) | Bản mới (DARE) |
|--------|--------------|----------------|
| Structure | Tree only | Graph (merge/loop) |
| Reasoning | Static | Dynamic with tools |
| Error handling | Backtrack only | Reflect + retry |
| Validation | End of step | Continuous |
| Flexibility | Low | High |

## Vị trí chèn

Thay thế section "DFS Problem-Solving" hiện tại trong AGENTS.md