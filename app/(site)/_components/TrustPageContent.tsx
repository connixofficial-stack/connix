import { RichContent, withFormatMarker } from '@/components/common/RichContent';

type TrustPageContentProps = {
  title: string;
  description?: string | null;
  content?: string | null;
  renderType?: 'content' | 'markdown' | 'html' | null;
  markdownRender?: string | null;
  htmlRender?: string | null;
};

const resolveContent = ({
  renderType,
  content,
  markdownRender,
  htmlRender,
}: Pick<TrustPageContentProps, 'renderType' | 'content' | 'markdownRender' | 'htmlRender'>) => {
  if (renderType === 'markdown') {
    return markdownRender ? withFormatMarker('markdown', markdownRender) : '';
  }
  if (renderType === 'html') {
    return htmlRender ? withFormatMarker('html', htmlRender) : '';
  }
  return content ? withFormatMarker('richtext', content) : '';
};

export function TrustPageContent({
  title,
  description,
  content,
  renderType,
  markdownRender,
  htmlRender,
}: TrustPageContentProps) {
  const resolvedContent = resolveContent({ renderType, content, markdownRender, htmlRender });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {description ? <p className="text-slate-600 leading-relaxed">{description}</p> : null}
      </header>

      {resolvedContent ? (
        <RichContent
          content={resolvedContent}
          className="max-w-none text-slate-700"
        />
      ) : (
        <p className="text-slate-500">Nội dung đang được cập nhật.</p>
      )}
    </div>
  );
}
