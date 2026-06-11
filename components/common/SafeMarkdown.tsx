import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents: Components = {
  a: ({ children, href }) => (
    <a
      href={href ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-cyan-700 underline underline-offset-2 break-all dark:text-cyan-300"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-slate-300 pl-3 text-slate-600 dark:border-slate-700 dark:text-slate-300">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-200/70 px-1 py-0.5 text-[12px] text-slate-800 break-words dark:bg-slate-800 dark:text-slate-100">
      {children}
    </code>
  ),
  li: ({ children }) => <li className="pl-1">{children}</li>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  pre: ({ children }) => (
    <pre className="my-2 max-w-full overflow-x-auto rounded-md bg-slate-900 p-2 text-[12px] leading-relaxed text-slate-50">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 max-w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
      <table className="min-w-full border-collapse text-left text-[12px]">{children}</table>
    </div>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-slate-200 dark:divide-slate-800">{children}</tbody>,
  td: ({ children }) => <td className="px-2 py-1.5 align-top">{children}</td>,
  th: ({ children }) => <th className="bg-slate-100 px-2 py-1.5 font-semibold dark:bg-slate-800">{children}</th>,
  thead: ({ children }) => <thead>{children}</thead>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
};

export function SafeMarkdown({
  className = '',
  content,
  emptyText,
}: {
  className?: string;
  content: string;
  emptyText?: string;
}) {
  if (!content) {
    return emptyText ? <span className="text-slate-400">{emptyText}</span> : null;
  }

  return (
    <div className={`break-words leading-5 [overflow-wrap:anywhere] ${className}`}>
      <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]} skipHtml>
        {content}
      </ReactMarkdown>
    </div>
  );
}
