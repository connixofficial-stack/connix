import Link from 'next/link';

import type { InternalLinkItem } from '@/lib/seo/internal-links';

type InternalLinkClusterProps = {
  links: InternalLinkItem[];
  title?: string;
};

export default function InternalLinkCluster({ links, title = 'Khám phá thêm' }: InternalLinkClusterProps) {
  if (!links || links.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">
        Các trang liên quan giúp AI và người dùng hiểu rõ cấu trúc nội dung của bạn.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-200 px-4 py-3 transition hover:border-primary/60"
          >
            <div className="text-base font-semibold text-slate-900">
              {link.title}
            </div>
            {link.description && (
              <div className="mt-1 text-sm text-slate-600">
                {link.description}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
