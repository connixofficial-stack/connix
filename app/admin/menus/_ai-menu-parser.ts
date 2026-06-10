/**
 * Parse AI/user input into menu items.
 *
 * Supported formats:
 * 1. Nested JSON: { "items": [{ "label": "A", "children": [{ "label": "B" }] }] }
 * 2. Flat JSON array: [{ "label": "A", "depth": 0 }, { "label": "B", "depth": 1 }]
 * 3. JSON array of strings: ["Trang chủ", "Sản phẩm"]
 * 4. Plain text (each line = 1 label, indent = depth)
 * 5. Markdown-style with dashes
 */

export type AiMenuLine = {
  label: string;
  depth: number;
};

export type AiMenuParseResult = {
  lines: AiMenuLine[];
  error: string;
};

/* ── JSON helpers ── */

const cleanJsonInput = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

/** Flatten nested { label, children[] } into flat AiMenuLine[] */
function flattenNested(items: unknown[], depth = 0): AiMenuLine[] {
  const result: AiMenuLine[] = [];
  for (const item of items) {
    if (typeof item === 'string') {
      if (item.trim()) result.push({ label: item.trim(), depth });
      continue;
    }
    if (typeof item !== 'object' || item === null) continue;
    const obj = item as Record<string, unknown>;
    const label = typeof obj.label === 'string' ? obj.label.trim()
      : typeof obj.name === 'string' ? obj.name.trim()
      : typeof obj.title === 'string' ? obj.title.trim()
      : '';
    if (!label) continue;
    result.push({ label, depth });
    if (Array.isArray(obj.children)) {
      result.push(...flattenNested(obj.children, depth + 1));
    }
  }
  return result;
}

function tryParseJson(raw: string): AiMenuLine[] | null {
  const cleaned = cleanJsonInput(raw);
  if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  // { "items": [...] }
  if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.items)) {
      return flattenNested(obj.items);
    }
    // Try first array-like key
    const firstArr = Object.values(obj).find(Array.isArray);
    if (firstArr) return flattenNested(firstArr as unknown[]);
    return null;
  }

  // Direct array
  if (Array.isArray(parsed)) {
    // Flat with depth?
    const hasDepth = parsed.some(
      (item: unknown) => typeof item === 'object' && item !== null && 'depth' in (item as Record<string, unknown>)
    );
    if (hasDepth) {
      return parsed
        .map((item: unknown) => {
          if (typeof item !== 'object' || item === null) return null;
          const obj = item as Record<string, unknown>;
          const label = typeof obj.label === 'string' ? obj.label.trim()
            : typeof obj.name === 'string' ? obj.name.trim()
            : '';
          const depth = typeof obj.depth === 'number' ? obj.depth : 0;
          return label ? { label, depth } : null;
        })
        .filter((item): item is AiMenuLine => item !== null);
    }
    // Nested with children
    return flattenNested(parsed);
  }

  return null;
}

/* ── Text parser ── */

function detectIndentDepth(line: string): { depth: number; text: string } {
  const match = line.match(/^(\s*)/);
  const whitespace = match?.[1] ?? '';
  const tabCount = (whitespace.match(/\t/g) || []).length;
  const spaceCount = whitespace.replace(/\t/g, '').length;
  const depth = tabCount + Math.floor(spaceCount / 2);

  let text = line.slice(whitespace.length);
  // Strip leading list markers: -, *, •, numbered (1. 2.)
  text = text.replace(/^[-*•]\s*/, '');
  text = text.replace(/^\d+[.)]\s*/, '');
  return { depth, text: text.trim() };
}

/* ── Main parser ── */

export function parseAiMenuInput(raw: string): AiMenuParseResult {
  const trimmed = raw.trim();
  if (!trimmed) return { lines: [], error: '' };

  // Try JSON first
  const jsonResult = tryParseJson(trimmed);
  if (jsonResult !== null) {
    if (jsonResult.length === 0) {
      return { lines: [], error: 'Danh sách JSON trống.' };
    }
    return { lines: normalizeDepths(jsonResult), error: '' };
  }

  // Parse as plain text lines
  const rawLines = trimmed.split('\n');
  const lines: AiMenuLine[] = [];

  for (const rawLine of rawLines) {
    if (!rawLine.trim()) continue;
    const { depth, text } = detectIndentDepth(rawLine);
    if (!text) continue;
    lines.push({ label: text, depth });
  }

  if (lines.length === 0) {
    return { lines: [], error: 'Không tìm thấy label menu nào.' };
  }

  return { lines: normalizeDepths(lines), error: '' };
}

/** Normalize depths: first item = 0, no jumps > 1 */
function normalizeDepths(lines: AiMenuLine[]): AiMenuLine[] {
  if (lines.length === 0) return lines;

  // Offset so first item is depth 0
  if (lines[0].depth !== 0) {
    const offset = lines[0].depth;
    for (const line of lines) {
      line.depth = Math.max(0, line.depth - offset);
    }
  }

  // No depth jumps > 1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].depth > lines[i - 1].depth + 1) {
      lines[i].depth = lines[i - 1].depth + 1;
    }
  }

  return lines;
}
