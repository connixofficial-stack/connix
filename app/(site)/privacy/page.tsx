import { notFound } from 'next/navigation';
import { TrustPageContent } from '@/app/(site)/_components/TrustPageContent';
import { getIASettings } from '@/lib/ia/settings';
import { findTrustPageSlot } from '@/lib/ia/trust-pages';
import { getTrustPagePost, isTrustPostVisible } from '@/lib/ia/trust-pages-runtime';

export const revalidate = 60; // trust pages: tái render sau 60 giây, không cache lâu như layout (1800s)

export default async function PrivacyPage() {
  const iaSettings = await getIASettings();
  if (!iaSettings.pages.privacy) {
    notFound();
  }

  const slot = findTrustPageSlot('privacy');
  const postId = iaSettings.trustPages.privacy;
  if (!slot || !postId) {
    notFound();
  }

  const post = await getTrustPagePost(postId);
  if (!post || !isTrustPostVisible(post)) {
    notFound();
  }

  return (
    <TrustPageContent
      title={post.title || slot.defaultTitle}
      description={post.excerpt ?? post.metaDescription ?? null}
      content={post.content}
      renderType={post.renderType ?? 'content'}
      markdownRender={post.markdownRender ?? null}
      htmlRender={post.htmlRender ?? null}
    />
  );
}
