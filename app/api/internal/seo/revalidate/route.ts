import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const headerSecret = request.headers.get('x-seo-revalidate-secret') ?? '';
  const serverSecret =
    process.env.SEO_REVALIDATE_SECRET ?? process.env.NEXT_PUBLIC_SEO_REVALIDATE_SECRET ?? '';

  if (!serverSecret) {
    return NextResponse.json({ message: 'Missing SEO_REVALIDATE_SECRET.' }, { status: 500 });
  }

  if (headerSecret !== serverSecret) {
    return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
  }

  revalidatePath('/robots.txt');
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap/static.xml');
  revalidatePath('/sitemap/posts.xml');
  revalidatePath('/sitemap/products.xml');
  revalidatePath('/sitemap/services.xml');
  revalidatePath('/sitemap/landings.xml');

  return NextResponse.json({ revalidated: true });
}
