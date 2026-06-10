import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { notFound } from 'next/navigation';
import InternalLinkCluster from '@/components/seo/InternalLinkCluster';
import { RelatedPagesBlock } from '@/components/seo/RelatedPagesBlock';
import { getFunnelInternalLinks, getRelatedLandingPages } from '@/lib/seo/internal-links';
import LandingHeroImage from '@/components/seo/LandingHeroImage';
import { RichContent } from '@/components/common/RichContent';

interface Props { params: Promise<{ slug: string }> }

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const page = await getConvexClient().query(api.landingPages.getBySlug, { slug });
  if (!page || page.landingType !== 'guide') notFound();
  const relatedPages = await getRelatedLandingPages({
    currentSlug: slug,
    landingType: page.landingType,
    relatedSlugs: page.relatedSlugs,
    limit: 6,
  });
  const funnelLinks = getFunnelInternalLinks('guides');
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {page.heroImage && <LandingHeroImage alt={page.title} src={page.heroImage} variant="hero" />}
      <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
      <p className="text-xl text-slate-600 mb-8">{page.summary}</p>
      {page.content && <RichContent content={page.content} className="max-w-none" />}
      {page.faqItems && page.faqItems.length > 0 && (
        <div className="mt-12"><h2 className="text-2xl font-bold mb-6">Câu hỏi thường gặp</h2>
          <div className="space-y-4">{page.faqItems.map((faq, i) => (
            <details key={i} className="border rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">{faq.question}</summary>
              <p className="mt-2 text-slate-600">{faq.answer}</p>
            </details>))}</div>
        </div>
      )}
      <RelatedPagesBlock items={relatedPages} title="Hướng dẫn liên quan" />
      <InternalLinkCluster links={funnelLinks} title="Bước tiếp theo" />
    </div>
  );
}
