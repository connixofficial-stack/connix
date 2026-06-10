import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import clsx from "clsx";

const FORMAT_MARKER = /<!--\s*format:(markdown|html|richtext)\s*-->/i;
const IFRAME_TAG_REGEX = /<iframe\b[^>]*>/gi;
const IFRAME_SRC_REGEX = /src\s*=\s*["']([^"']+)["']/i;
const YOUTUBE_HOST_REGEX = /(youtube\.com|youtu\.be)/i;
const IFRAME_LOADING_REGEX = /\sloading\s*=\s*["']?lazy["']?/i;

function normalizeYouTubeIframes(html: string): string {
  if (!html) {
    return html;
  }
  return html.replace(IFRAME_TAG_REGEX, (tag) => {
    const srcMatch = tag.match(IFRAME_SRC_REGEX);
    if (!srcMatch?.[1] || !YOUTUBE_HOST_REGEX.test(srcMatch[1])) {
      return tag;
    }
    return tag.replace(IFRAME_LOADING_REGEX, '');
  });
}

function parseContent(raw?: string): { format: "markdown" | "html" | "richtext"; body: string } {
  if (!raw) {
    return { format: "richtext", body: "" };
  }
  const match = raw.match(FORMAT_MARKER);
  if (match && match.index === 0) {
    const format = match[1].toLowerCase() as "markdown" | "html" | "richtext";
    const body = raw.slice(match[0].length).trimStart();
    return { format, body };
  }
  return { format: "richtext", body: raw };
}

export interface RichContentProps {
  content?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function RichContent({ content, className, style }: RichContentProps) {
  const { format, body } = parseContent(content);

  if (!body) {
    return null;
  }

  const classTokens = (className ?? '').split(/\s+/).filter(Boolean);
  const richClassName = classTokens.filter((token) => !token.startsWith('prose'));
  const richClass = clsx(
    "editor-content max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_*]:break-words",
    richClassName,
  );
  const markdownClass = clsx(
    "prose max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_*]:break-words",
    className,
  );

  if (format === "markdown") {
    return (
      <div className={markdownClass} style={style}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
          {body}
        </ReactMarkdown>
      </div>
    );
  }

  const normalizedRich = useMemo(() => normalizeYouTubeIframes(body), [body]);

  const htmlPayload = useMemo(() => ({ __html: normalizedRich }), [normalizedRich]);

  if (format === "html") {
    return <div className={richClass} style={style} dangerouslySetInnerHTML={htmlPayload} />;
  }

  // richtext (default)
  return <div className={richClass} style={style} dangerouslySetInnerHTML={htmlPayload} />;
}

export function detectFormat(raw?: string): {
  format: "markdown" | "html" | "richtext";
  body: string;
  marker: string | null;
} {
  if (!raw) {
    return { format: "richtext", body: "", marker: null };
  }
  const match = raw.match(FORMAT_MARKER);
  if (match && match.index === 0) {
    const format = match[1].toLowerCase() as "markdown" | "html" | "richtext";
    const marker = match[0];
    const body = raw.slice(marker.length).trimStart();
    return { format, body, marker };
  }
  return { format: "richtext", body: raw, marker: null };
}

export function withFormatMarker(
  format: "markdown" | "html" | "richtext",
  body: string,
): string {
  return `<!--format:${format}-->\n${body}`;
}
