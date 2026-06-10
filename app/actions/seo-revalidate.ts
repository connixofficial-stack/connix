'use server';

import { revalidatePath } from 'next/cache';

export const revalidateSeoPaths = async () => {
  revalidatePath('/robots.txt');
  revalidatePath('/sitemap.xml');
  revalidatePath('/sitemap/static.xml');
  revalidatePath('/sitemap/posts.xml');
  revalidatePath('/sitemap/products.xml');
  revalidatePath('/sitemap/services.xml');
  revalidatePath('/sitemap/landings.xml');
};
