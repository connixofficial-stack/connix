import { stripHtml, truncateText } from '../../seo';
import { getMacroTemplate } from './macro-templates';
import { buildInternalLinks } from './link-plan';
import { buildMediaPlan } from './media-plan';
import { REQUIRED_SLOTS, OPTIONAL_SLOTS } from './slot-families';
import { buildSlotVariant, estimateVariantCapacity } from './variant-synthesizer';
import { resolveThumbnail } from './thumbnail';
import { closingStatements, differentiatorPhrases, editorialCheckpoints, decisionBullets } from './phrase-banks';
import type {
  GeneratedArticlePayload,
  GeneratedContentBlock,
  GeneratorProduct,
  GeneratorSettings,
  GeneratorRequest,
  MacroTemplateKey,
  SaleMode,
  SlotKey,
  Tone,
} from './types';

const createSeededRng = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  let state = Math.abs(hash) + 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const resolveSlots = (settings: GeneratorSettings, rng: () => number): SlotKey[] => {
  const minSlots = Math.max(settings.minSlots, REQUIRED_SLOTS.length);
  const maxSlots = Math.max(settings.maxSlots, minSlots);
  const targetCount = Math.floor(rng() * (maxSlots - minSlots + 1)) + minSlots;

  const slots = new Set<SlotKey>(REQUIRED_SLOTS);
  const optional = [...OPTIONAL_SLOTS];

  while (slots.size < targetCount && optional.length > 0) {
    const index = Math.floor(rng() * optional.length);
    slots.add(optional.splice(index, 1)[0]);
  }

  return Array.from(slots);
};

const resolveBudgetLabel = (request: GeneratorRequest) => {
  if (request.budgetMin || request.budgetMax) {
    return 'ngân sách phù hợp';
  }
  return 'ngân sách hợp lý';
};

const truncateSentence = (value?: string, limit = 170) => {
  if (!value?.trim()) {return undefined;}
  const clean = stripHtml(value).replace(/\s+/g, ' ').trim();
  if (clean.length <= limit) {return clean;}
  return `${clean.slice(0, limit).trim()}...`;
};

const wrapParagraphs = (paragraphs: string[]) =>
  paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');

const SECTION_BASE_CLASS = 'space-y-3 py-2';

const buildSectionWrapper = ({
  id,
  title,
  body,
  slotKey,
  variant,
  extraClass,
  index,
  numbered,
}: {
  id: string;
  title: string;
  body: string;
  slotKey: SlotKey;
  variant?: string;
  extraClass?: string;
  index?: number;
  numbered?: boolean;
}) => {
  const heading = numbered && typeof index === 'number'
    ? `<span class="mr-2 text-sm font-semibold text-blue-600">${index + 1})</span>${title}`
    : title;
  return `
    <section id="${id}" data-slot="${slotKey}" data-variant="${variant ?? ''}" class="${SECTION_BASE_CLASS} ${extraClass ?? ''}">
      <h2 class="text-base md:text-lg font-semibold text-slate-900">${heading}</h2>
      ${body}
    </section>
  `;
};

const buildBadge = (label: string, tone: 'blue' | 'emerald' | 'slate' = 'slate') => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  };
  return `<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorMap[tone]}">${label}</span>`;
};

const buildButton = ({
  label,
  href,
  variant = 'primary',
}: {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
}) => {
  const className = variant === 'primary'
    ? 'inline-flex items-center justify-center rounded-md bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
    : 'inline-flex items-center justify-center rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
  return `<a href="${href}" class="${className}">${label}</a>`;
};

const escapeHtmlAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const buildGalleryStrip = ({ images, slotKey }: { images: string[]; slotKey: SlotKey }) => {
  if (images.length === 0) {return '';}
  const total = images.length;
  const gridClass = total === 1 ? 'grid-cols-1' : total === 2 ? 'grid-cols-2' : 'grid-cols-3';
  let visibleCount = total;
  let extraCount = 0;
  if (total <= 3) {
    visibleCount = total;
  } else if (total <= 5) {
    visibleCount = 3;
    extraCount = total - 3;
  } else if (total === 6) {
    visibleCount = 6;
  } else {
    visibleCount = 6;
    extraCount = total - 6;
  }
  const visibleImages = images.slice(0, visibleCount);
  const overlayIndex = extraCount > 0 ? visibleImages.length - 1 : -1;
  const galleryPayload = escapeHtmlAttribute(JSON.stringify(images));
  const tiles = visibleImages.map((image, index) => {
    const overlay = index === overlayIndex
      ? `<div class="absolute inset-0 bg-slate-900/55 flex items-center justify-center text-white text-sm font-semibold">+${extraCount}</div>`
      : '';
    return `
      <button type="button" class="group relative overflow-hidden rounded-lg border border-slate-100 bg-white aspect-[4/3] p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" data-gallery-open="${index}">
        <img src="${image}" alt="Ảnh minh hoạ" class="h-full w-full object-contain" />
        ${overlay}
      </button>
    `;
  }).join('');
  return `
    <div class="mt-3" data-gallery="${galleryPayload}" data-gallery-slot="${slotKey}">
      <div class="grid ${gridClass} gap-2">
        ${tiles}
      </div>
    </div>
  `;
};

const buildProductHref = (product: Pick<GeneratorProduct, 'slug' | 'categorySlug'>) => (
  product.categorySlug ? `/${product.categorySlug}/${product.slug}` : `/products/${product.slug}`
);

const renderProductCard = ({
  product,
  saleMode,
  className,
  imageClassName,
}: {
  product: GeneratorProduct;
  saleMode: SaleMode;
  className: string;
  imageClassName: string;
}) => {
  const summary = truncateSentence(product.description, 120) ?? 'Phù hợp nhu cầu cần lựa chọn ổn định, dễ triển khai.';
  const image = product.image ?? product.images?.[0] ?? product.categoryImage;
  const detailLink = buildProductHref(product);
  const primaryLink = saleMode === 'affiliate' ? product.affiliateLink?.trim() : detailLink;
  const secondaryLink = saleMode === 'affiliate' ? detailLink : undefined;
  const primaryLabel = saleMode === 'affiliate' ? 'Mua ngay' : 'Xem chi tiết';
  const secondaryLabel = saleMode === 'affiliate' ? 'Xem chi tiết' : 'Tư vấn';
  const overlayButton = primaryLink && saleMode === 'affiliate'
    ? `<div class="absolute top-3 right-3">${buildButton({ label: primaryLabel, href: primaryLink, variant: 'primary' })}</div>`
    : '';
  const actionButtons = [
    primaryLink ? buildButton({ label: primaryLabel, href: primaryLink, variant: saleMode === 'affiliate' ? 'primary' : 'secondary' }) : '',
    secondaryLink ? buildButton({ label: secondaryLabel, href: secondaryLink, variant: 'secondary' }) : '',
  ].filter(Boolean).join('');
  const badge = product.categoryName ? buildBadge(product.categoryName, 'slate') : '';
  return `
    <article class="${className}">
      <div class="relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50 p-2 ${imageClassName}">
        ${image ? `<img src="${image}" alt="${product.name}" class="h-full w-full object-contain"/>` : '<div class="flex h-full w-full items-center justify-center text-xs text-slate-400">Chưa có ảnh</div>'}
        ${overlayButton}
      </div>
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">${badge}</div>
        <h3 class="text-sm font-semibold text-slate-900 line-clamp-2">${product.name}</h3>
        <p class="text-xs text-slate-600 line-clamp-3">${summary}</p>
        ${actionButtons ? `<div class="flex flex-wrap gap-2">${actionButtons}</div>` : ''}
      </div>
    </article>
  `;
};

const renderTopListBody = ({
  products,
  saleMode,
  rng,
}: {
  products: GeneratorProduct[];
  saleMode: SaleMode;
  rng: () => number;
}) => {
  if (products.length === 0) {
    return { variant: 'empty', html: '<div class="text-sm text-slate-500">Chưa có sản phẩm phù hợp.</div>' };
  }
  const variants: Array<'featured' | 'grid' | 'rail'> = ['featured', 'grid', 'rail'];
  const pick = variants[Math.floor(rng() * variants.length)];

  if (pick === 'rail') {
    const cards = products.map((product) =>
      renderProductCard({
        product,
        saleMode,
        className: 'group flex-shrink-0 w-[220px] md:w-[260px] rounded-xl border border-slate-100 bg-white p-3 space-y-3',
        imageClassName: 'aspect-square',
      })
    ).join('');
    return {
      variant: 'rail',
      html: `
        <div class="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3">
          ${cards}
        </div>
        <div class="text-xs text-slate-500">Cuộn ngang để xem thêm sản phẩm.</div>
      `,
    };
  }

  if (pick === 'featured') {
    const [featured, ...others] = products;
    const featuredHref = featured ? buildProductHref(featured) : '';
    const featuredHtml = featured ? `
      <div class="group relative overflow-hidden rounded-xl border border-slate-100 bg-white">
        <div class="relative aspect-[4/3] overflow-hidden border-b border-slate-100 bg-slate-50 p-2">
          ${(featured.image ?? featured.images?.[0] ?? featured.categoryImage)
            ? `<img src="${featured.image ?? featured.images?.[0] ?? featured.categoryImage}" alt="${featured.name}" class="h-full w-full object-contain"/>`
            : '<div class="flex h-full w-full items-center justify-center text-xs text-slate-400">Chưa có ảnh</div>'
          }
          ${saleMode === 'affiliate' && featured.affiliateLink?.trim()
            ? `<div class="absolute top-4 right-4">${buildButton({ label: 'Mua ngay', href: featured.affiliateLink.trim(), variant: 'primary' })}</div>`
            : ''
          }
        </div>
        <div class="space-y-2 p-4">
          <div class="flex flex-wrap gap-2">${featured.categoryName ? buildBadge(featured.categoryName, 'slate') : ''}</div>
          <h3 class="text-base font-semibold text-slate-900">${featured.name}</h3>
          <p class="text-sm text-slate-600">${truncateSentence(featured.description, 140) ?? 'Tóm tắt lợi ích nổi bật của sản phẩm.'}</p>
          <div class="flex gap-2 flex-wrap">
            ${featured.affiliateLink?.trim()
              ? buildButton({ label: 'Mua ngay', href: featured.affiliateLink.trim(), variant: 'primary' })
              : buildButton({ label: 'Xem chi tiết', href: featuredHref, variant: 'secondary' })
            }
            ${saleMode === 'affiliate' ? buildButton({ label: 'Xem chi tiết', href: featuredHref, variant: 'secondary' }) : ''}
          </div>
        </div>
      </div>
    ` : '';
    const othersHtml = others.slice(0, 4).map((product) =>
      renderProductCard({
        product,
        saleMode,
        className: 'group rounded-xl border border-slate-100 bg-white p-4 space-y-3',
        imageClassName: 'aspect-[4/3]',
      })
    ).join('');
    return {
      variant: 'featured',
      html: `
        <div class="grid gap-4 md:grid-cols-[1.2fr_1fr]">
          ${featuredHtml}
          <div class="grid gap-4 md:grid-cols-2">
            ${othersHtml}
          </div>
        </div>
      `,
    };
  }

  const gridItems = products.map((product) =>
    renderProductCard({
      product,
      saleMode,
      className: 'group rounded-xl border border-slate-100 bg-white p-4 space-y-3',
      imageClassName: 'aspect-square',
    })
  ).join('');
  return {
    variant: 'grid',
    html: `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${gridItems}</div>`,
  };
};

const renderHeroBody = ({
  product,
  saleMode,
  paragraphs,
}: {
  product?: GeneratorProduct;
  saleMode: SaleMode;
  paragraphs: string[];
}) => {
  if (!product) {
    return { html: wrapParagraphs(paragraphs), variant: 'hero-text' };
  }
  const image = product.image ?? product.images?.[0] ?? product.categoryImage;
  const detailLink = buildProductHref(product);
  const primaryLink = saleMode === 'affiliate' ? product.affiliateLink?.trim() : detailLink;
  const primaryLabel = saleMode === 'affiliate' ? 'Mua ngay' : 'Xem chi tiết';
  const secondaryLink = saleMode === 'affiliate' ? detailLink : undefined;
  const secondaryLabel = 'Xem chi tiết';
  return {
    variant: 'hero-card',
    html: `
      <div class="grid gap-4 md:grid-cols-[1.1fr_1fr] items-center">
        <div class="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 aspect-[4/3] p-2">
          ${image ? `<img src="${image}" alt="${product.name}" class="h-full w-full object-contain"/>` : '<div class="flex h-full w-full items-center justify-center text-xs text-slate-400">Chưa có ảnh</div>'}
          ${saleMode === 'affiliate' && primaryLink ? `<div class="absolute top-4 right-4">${buildButton({ label: primaryLabel, href: primaryLink, variant: 'primary' })}</div>` : ''}
        </div>
        <div class="space-y-3">
          <div class="flex flex-wrap gap-2">${product.categoryName ? buildBadge(product.categoryName, 'slate') : ''}</div>
          <h3 class="text-xl font-semibold text-slate-900">${product.name}</h3>
          ${wrapParagraphs(paragraphs)}
          <div class="flex flex-wrap gap-2">
            ${primaryLink ? buildButton({ label: primaryLabel, href: primaryLink, variant: saleMode === 'affiliate' ? 'primary' : 'secondary' }) : ''}
            ${secondaryLink ? buildButton({ label: secondaryLabel, href: secondaryLink, variant: 'secondary' }) : ''}
          </div>
        </div>
      </div>
    `,
  };
};

const buildComparisonHtml = (products: GeneratorProduct[]) => {
  const [first, second] = products;
  const firstLabel = first?.name ?? 'Sản phẩm A';
  const secondLabel = second?.name ?? 'Sản phẩm B';
  const firstSummaryRaw = stripHtml(first?.description ?? '').replace(/\s+/g, ' ').trim();
  const secondSummaryRaw = stripHtml(second?.description ?? '').replace(/\s+/g, ' ').trim();
  const minSummaryLength = 60;
  const isWeak = !first || !second || firstSummaryRaw.length < minSummaryLength || secondSummaryRaw.length < minSummaryLength;

  if (isWeak) {
    return {
      variant: 'comparison-text',
      html: wrapParagraphs([
        `${firstLabel} phù hợp nếu bạn cần lựa chọn dễ triển khai, ít rủi ro và muốn chốt nhanh theo tiêu chí thực dụng.`,
        `${secondLabel} hợp với người cần tối ưu dài hạn, muốn cân nhắc kỹ từng tiêu chí trước khi ra quyết định.`,
      ]),
    };
  }

  const firstSummary = truncateSentence(firstSummaryRaw) ?? 'Tóm tắt lợi ích nổi bật của sản phẩm.';
  const secondSummary = truncateSentence(secondSummaryRaw) ?? 'Tóm tắt lợi ích nổi bật của sản phẩm.';
  return {
    variant: 'comparison-table',
    html: `
      <div class="overflow-x-auto rounded-xl border border-slate-100">
        <table class="min-w-[640px] w-full text-sm">
          <thead class="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="p-3">Tiêu chí</th>
              <th class="p-3">${firstLabel}</th>
              <th class="p-3">${secondLabel}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr class="bg-slate-50/40">
              <td class="p-3 font-medium text-slate-700">Tóm tắt</td>
              <td class="p-3 text-slate-600">${firstSummary}</td>
              <td class="p-3 text-slate-600">${secondSummary}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul class="mt-3 list-disc pl-5 text-xs text-slate-600 space-y-1">
        <li>Chọn ${firstLabel} nếu bạn ưu tiên tốc độ triển khai và độ ổn định.</li>
        <li>Chọn ${secondLabel} khi cần tối ưu vận hành dài hạn hoặc tính linh hoạt.</li>
        <li>So sánh lại theo nhu cầu thực tế để tránh mua dư tính năng.</li>
      </ul>
    `,
  };
};

const buildIntroHtml = ({
  title,
  tone,
  useCase,
}: {
  title: string;
  tone: Tone;
  useCase?: string;
}) => {
  const focus = useCase?.trim() ? ` cho nhu cầu ${useCase}` : '';
  const toneNote = tone === 'sales'
    ? 'Tập trung lựa chọn thực dụng, dễ chốt.'
    : tone === 'expert'
      ? 'Góc nhìn chuyên gia, ưu tiên dữ liệu thật.'
      : 'Tổng hợp dễ hiểu, ưu tiên hữu ích.';
  return `
  <header class="rounded-xl border border-slate-100 bg-white p-6 md:p-8 space-y-3">
      <h1 class="text-2xl md:text-3xl font-bold text-slate-900">${title}</h1>
      <p class="text-sm md:text-base text-slate-600">${toneNote} Bài viết này giúp bạn lọc nhanh các lựa chọn đáng cân nhắc${focus}.</p>
    </header>
  `;
};

const buildTocHtml = (blocks: GeneratedContentBlock[]) => `
  <nav class="rounded-xl border border-slate-100 bg-white p-4 md:p-5">
    <div class="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Mục lục</div>
    <ol class="mt-3 space-y-2">
      ${blocks.map((block, index) => `
        <li class="flex gap-3">
          <span class="text-xs font-semibold text-blue-600">${index + 1}</span>
          <a href="#section-${index}" class="text-sm text-slate-700 hover:text-blue-700">${block.title}</a>
        </li>
      `).join('')}
    </ol>
  </nav>
`;

const pickRandomItems = <T,>(items: T[], count: number, rng: () => number) => {
  const pool = [...items];
  const result: T[] = [];
  while (pool.length > 0 && result.length < count) {
    const index = Math.floor(rng() * pool.length);
    result.push(pool.splice(index, 1)[0]);
  }
  return result;
};

const buildBulletList = (items: string[]) => `
  <ul class="list-disc pl-5 text-sm text-slate-600 space-y-1">
    ${items.map((item) => `<li>${item}</li>`).join('')}
  </ul>
`;

const buildHashtagHtml = (options: {
  categoryName?: string;
  keyword?: string;
  useCase?: string;
  productNames?: string[];
}) => {
  const base = new Set<string>();
  const normalizeTag = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '');
  const addFromText = (value?: string) => {
    if (!value?.trim()) {return;}
    const normalized = normalizeTag(value);
    if (!normalized) {return;}
    base.add(`#${normalized}`);
  };
  addFromText(options.categoryName);
  addFromText(options.keyword);
  addFromText(options.useCase);
  options.productNames?.forEach((name) => addFromText(name));
  const tags = Array.from(base).slice(0, 8);
  return `
    <div class="flex flex-wrap gap-2">
      ${tags.map((tag) => `<span class="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">${tag}</span>`).join('')}
    </div>
  `;
};

const buildCtaClusterHtml = (links: Array<{ label: string; href: string }>, saleMode: SaleMode) => {
  if (links.length === 0) {
    return '<p class="text-sm text-slate-600">Liên hệ để được tư vấn lựa chọn phù hợp nhất.</p>';
  }
  const label = saleMode === 'affiliate' ? 'Mua nhanh' : 'Xem nhanh';
  const primaryIndex = saleMode === 'affiliate' ? 0 : -1;
  return `
    <div class="space-y-3">
      <p class="text-sm text-slate-600">${label} các lựa chọn nổi bật để tiết kiệm thời gian ra quyết định:</p>
      <div class="flex flex-wrap gap-2">
        ${links.map((link, index) => buildButton({
          label: link.label,
          href: link.href,
          variant: index === primaryIndex ? 'primary' : 'secondary',
        })).join('')}
      </div>
    </div>
  `;
};

export const generateArticlePayload = ({
  request,
  products,
  settings,
  saleMode,
}: {
  request: GeneratorRequest;
  products: GeneratorProduct[];
  settings: GeneratorSettings;
  saleMode: SaleMode;
}): GeneratedArticlePayload => {
  const template = getMacroTemplate(request.templateKey as MacroTemplateKey);
  const tone: Tone = request.tone ?? settings.defaultTone;
  const seed = request.seed;
  const rng = createSeededRng(seed);
  const slots = resolveSlots(settings, rng);
  const mediaPlan = buildMediaPlan({ products, slots, rng });
  const internalLinks = buildInternalLinks({ products, density: settings.internalLinkDensity, saleMode });
  const budgetRange = resolveBudgetLabel(request);

  const rawBlocks = slots.map((slotKey) => {
    const primaryProduct = products[0];
    const secondaryProduct = products[1];
    const { title, paragraphs } = buildSlotVariant({
      slotKey,
      rng,
      tone,
      primaryProduct,
      secondaryProduct,
      budgetRange,
    });

    const variantCapacity = estimateVariantCapacity(slotKey);
    const images = mediaPlan.galleryImages?.[slotKey] ?? mediaPlan.inlineImages[slotKey] ?? [];
    const galleryHtml = images.length > 0 ? buildGalleryStrip({ images, slotKey }) : '';
    let html = wrapParagraphs(paragraphs);
    let sectionVariant: string | undefined = 'text';
    if (slotKey === 'problem' || slotKey === 'criteria' || slotKey === 'budget') {
      const source = slotKey === 'problem' ? decisionBullets : editorialCheckpoints;
      const bullets = pickRandomItems(source, 3, rng);
      html = `${wrapParagraphs(paragraphs)}${buildBulletList(bullets)}`;
      sectionVariant = 'editorial-bullets';
    }
    if (slotKey === 'hero') {
      const hero = renderHeroBody({ product: primaryProduct, saleMode, paragraphs });
      html = hero.html;
      sectionVariant = hero.variant;
    }
    if (slotKey === 'top_list') {
      const topList = renderTopListBody({ products, saleMode, rng });
      html = `${wrapParagraphs(paragraphs)}${topList.html}`;
      sectionVariant = `top-${topList.variant}`;
    }
    if (slotKey === 'comparison') {
      const comparison = buildComparisonHtml(products);
      html = `${wrapParagraphs(paragraphs)}${comparison.html}`;
      sectionVariant = comparison.variant;
    }
    if (slotKey === 'cta') {
      html = `${wrapParagraphs(paragraphs)}${buildCtaClusterHtml(internalLinks, saleMode)}`;
      sectionVariant = 'cta-actions';
    }
    if (slotKey === 'disclaimer') {
      return null;
    }
    if (galleryHtml && !['top_list', 'cta', 'disclaimer'].includes(slotKey)) {
      html = `${html}${galleryHtml}`;
    }

    return {
      slotKey,
      title,
      html,
      images,
      variantCapacity,
      sectionVariant,
    };
  });
  const blocks = rawBlocks.filter((block) => block !== null) as GeneratedContentBlock[];

  const categoryLabel = products[0]?.categoryName ?? request.keyword ?? 'sản phẩm';
  const differentiator = differentiatorPhrases[Math.floor(rng() * differentiatorPhrases.length)] ?? 'phù hợp nhu cầu';
  const useCaseLabel = request.useCase ?? request.keyword ?? 'nhu cầu thực tế';
  const budgetLabel = resolveBudgetLabel(request);
  const titleTemplate = template.titlePatterns[Math.floor(rng() * template.titlePatterns.length)];
  const title = titleTemplate
    .replace('{count}', String(products.length))
    .replace('{useCase}', useCaseLabel)
    .replace('{category}', categoryLabel)
    .replace('{differentiator}', differentiator)
    .replace('{budgetMin}', budgetLabel)
    .replace('{budgetMax}', budgetLabel)
    .replace('{productA}', products[0]?.name ?? 'Sản phẩm A')
    .replace('{productB}', products[1]?.name ?? 'Sản phẩm B');

  const tocHtml = buildTocHtml(blocks);

  const sectionsHtml = blocks
    .map((block, index) => buildSectionWrapper({
      id: `section-${index}`,
      title: block.title,
      body: block.html,
      slotKey: block.slotKey,
      variant: block.sectionVariant,
      index,
      numbered: true,
      extraClass: block.slotKey === 'hero' ? 'rounded-xl border border-blue-100 bg-blue-50/20 p-5 md:p-6' : undefined,
    }))
    .join('\n');

  const conclusion = closingStatements[Math.floor(rng() * closingStatements.length)];
  const conclusionHtml = buildSectionWrapper({
    id: 'section-conclusion',
    title: 'Kết luận nhanh',
    body: `<p class="text-sm text-slate-600">${conclusion}</p>`,
    slotKey: 'cta',
    variant: 'conclusion',
    numbered: false,
    extraClass: 'rounded-xl border border-slate-100 bg-slate-50/60 p-4',
  });
  const ctaClusterHtml = buildSectionWrapper({
    id: 'section-cta',
    title: 'Hành động ngay',
    body: buildCtaClusterHtml(internalLinks, saleMode),
    slotKey: 'cta',
    variant: 'cta-cluster',
    numbered: false,
    extraClass: 'rounded-xl border border-slate-100 bg-white p-4',
  });
  const hashtagHtml = buildSectionWrapper({
    id: 'section-hashtags',
    title: 'Hashtag',
    body: buildHashtagHtml({
      categoryName: products[0]?.categoryName,
      keyword: request.keyword,
      useCase: request.useCase,
      productNames: products.slice(0, 4).map((product) => product.name).filter(Boolean),
    }),
    slotKey: 'cta',
    variant: 'hashtags',
    numbered: false,
    extraClass: 'rounded-xl border border-slate-100 bg-white p-4',
  });

  const contentHtml = [
    '<article class="space-y-5 generated-article">',
    buildIntroHtml({ title, tone, useCase: request.useCase ?? request.keyword }),
    tocHtml,
    sectionsHtml,
    conclusionHtml,
    ctaClusterHtml,
    hashtagHtml,
    '</article>',
  ].join('\n');

  const excerpt = truncateText(stripHtml(contentHtml), 160);
  const metaTitle = truncateText(title, 60);
  const metaDescription = truncateText(excerpt, 160);
  const thumbnail = resolveThumbnail(products) ?? mediaPlan.heroImage;

  const variantCapacities = blocks.reduce((acc, block) => {
    acc[block.slotKey] = block.variantCapacity;
    return acc;
  }, {} as Record<SlotKey, number>);

  const qualityWarnings: string[] = [];
  const missingDesc = products.filter((product) => !product.description?.trim()).length;
  const missingImage = products.filter((product) => !(product.image ?? product.images?.[0])).length;
  const missingAffiliate = saleMode === 'affiliate'
    ? products.filter((product) => !product.affiliateLink?.trim()).length
    : 0;
  if (missingDesc > 0) {
    qualityWarnings.push(`${missingDesc} sản phẩm thiếu mô tả`);
  }
  if (missingImage > 0) {
    qualityWarnings.push(`${missingImage} sản phẩm thiếu ảnh`);
  }
  if (missingAffiliate > 0) {
    qualityWarnings.push(`${missingAffiliate} sản phẩm thiếu affiliate link`);
  }

  return {
    templateKey: request.templateKey,
    seed,
    tone,
    title,
    excerpt,
    contentHtml,
    metaTitle,
    metaDescription,
    thumbnail,
    blocks,
    internalLinks,
    mediaPlan,
    variantCapacities,
    products,
    qualityWarnings,
    layoutMeta: {
      tocStyle: 'sidebar-numbered',
      articleVariant: 'editorial-v2',
    },
  };
};
