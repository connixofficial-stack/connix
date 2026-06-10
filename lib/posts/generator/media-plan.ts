import type { GeneratorProduct, MediaPlan, SlotKey } from './types';

const IMAGE_SLOTS: SlotKey[] = ['hero', 'top_list', 'spotlight', 'comparison'];

export const buildMediaPlan = ({
  products,
  slots,
  rng,
}: {
  products: GeneratorProduct[];
  slots: SlotKey[];
  rng: () => number;
}): MediaPlan => {
  const heroProduct = products[0];
  const heroImage = heroProduct?.image ?? heroProduct?.images?.[0] ?? heroProduct?.categoryImage;
  const inlineImages: Record<string, string[]> = {};
  const inlineImageRoles: Record<string, 'hero' | 'card' | 'rail'> = {};
  const galleryImages: Record<string, string[]> = {};
  const imagePool = new Set<string>();

  const addImage = (image?: string) => {
    if (!image?.trim()) {return;}
    imagePool.add(image);
  };

  products.forEach((product) => {
    addImage(product.image);
    product.images?.forEach((image) => addImage(image));
    addImage(product.categoryImage);
    product.relatedProducts?.forEach((related) => {
      addImage(related.image);
    });
  });

  const availableImages = Array.from(imagePool);
  const used = new Set<string>();
  const pickImages = (count: number) => {
    const picks: string[] = [];
    const pool = availableImages.filter((image) => !used.has(image));
    const source = pool.length >= count ? pool : availableImages;
    for (let i = 0; i < count; i += 1) {
      if (source.length === 0) {break;}
      const index = Math.floor(rng() * source.length);
      const chosen = source[index];
      picks.push(chosen);
      used.add(chosen);
      source.splice(index, 1);
    }
    return picks;
  };

  slots.forEach((slot) => {
    if (!IMAGE_SLOTS.includes(slot)) {return;}
    if (availableImages.length === 0) {return;}
    const pickCount = Math.min(6, availableImages.length);
    const picks = pickImages(pickCount);
    inlineImages[slot] = picks;
    galleryImages[slot] = picks;
    inlineImageRoles[slot] = slot === 'top_list' ? 'card' : 'hero';
  });

  return {
    heroImage,
    inlineImages,
    inlineImageRoles,
    galleryImages,
  };
};
