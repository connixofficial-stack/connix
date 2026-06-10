import type { RelatedPageItem } from '@/lib/seo/internal-links';

interface RelatedPagesBlockProps {
  items: RelatedPageItem[];
  title?: string;
}

export function RelatedPagesBlock({ items, title = 'Xem thêm' }: RelatedPagesBlockProps) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t">
      <h2 className="text-xl font-bold mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <a
            key={item.slug}
            href={item.href}
            className="block border rounded-lg p-4 hover:border-primary hover:shadow-sm transition-all"
          >
            <h3 className="font-semibold mb-1">{item.title}</h3>
            {item.summary && (
              <p className="text-sm text-slate-500 line-clamp-2">{item.summary}</p>
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
