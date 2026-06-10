import React from 'react';

/**
 * Parse heading text có cú pháp highlight `{text}` thành React elements.
 * Hỗ trợ:
 * - `{text}` → text được tô màu highlightColor
 * - `\n` (newline) → <br />
 *
 * Ví dụ: "Cùng Bean {Cargo}" → ["Cùng Bean ", <span style={{color}}>Cargo</span>]
 */
export function parseHighlightedHeading(
  text: string,
  highlightColor?: string
): React.ReactNode {
  if (!text) return null;
  const color = highlightColor || '#ef4444';

  // Split theo line breaks trước
  const lines = text.split('\n');

  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      elements.push(<br key={`br-${lineIdx}`} />);
    }

    // Parse {highlight} syntax trong mỗi dòng
    const parts = line.split(/(\{[^}]+\})/g);

    parts.forEach((part, partIdx) => {
      if (!part) return;

      const match = part.match(/^\{(.+)\}$/);
      if (match) {
        // Highlighted text
        elements.push(
          <span
            key={`${lineIdx}-${partIdx}`}
            style={{ color }}
          >
            {match[1]}
          </span>
        );
      } else {
        elements.push(part);
      }
    });
  });

  return <>{elements}</>;
}
