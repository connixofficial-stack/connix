import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import { stripHtml, truncateText } from '@/lib/seo';
import { JsonLd, generateBreadcrumbSchema, generateProductSchema } from '@/components/seo/JsonLd';
import { buildDetailPath } from '@/lib/ia/route-mode';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

const resolveProductTitle = (value: string): string => truncateText(value.trim(), 70);

const resolveProductDescription = (params: {
  metaDescription?: string | null;
  description?: string | null;
  seoDescription?: string | null;
}): string => {
  if (params.metaDescription?.trim()) {
    return truncateText(params.metaDescription.trim(), 160);
  }
  if (params.description?.trim()) {
    return truncateText(stripHtml(params.description), 160);
  }
  if (params.seoDescription?.trim()) {
    return truncateText(params.seoDescription.trim(), 160);
  }
  return '';
};

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const client = getConvexClient();
  try {
    const productsModule = await client.query(api.admin.modules.getModuleByKey, { key: 'products' });
    if (productsModule?.enabled === false) {
      const [site, seo, contact, social] = await Promise.all([
        getSiteSettings(),
        getSEOSettings(),
        getContactSettings(),
        getSocialSettings(),
      ]);
      return buildSeoMetadata({
        contact,
        descriptionOverride: 'Trang sản phẩm hiện không khả dụng.',
        moduleEnabled: false,
        pathname: `/products/${slug}`,
        routeType: 'detail',
        seo,
        site,
        social,
        titleOverride: 'Không tìm thấy sản phẩm',
      });
    }

    const [product, site, seo, contact, social] = await Promise.all([
      client.query(api.products.getBySlug, { slug }),
      getSiteSettings(),
      getSEOSettings(),
      getContactSettings(),
      getSocialSettings(),
    ]);

    if (!product) {
      const resolvedContext = await client.query(api.ia.resolveProductLandingContext, {
        slugs: ['products', decodeURIComponent(slug)],
      });

      if (resolvedContext && resolvedContext.type === 'productTypeAttribute') {
        const title = resolvedContext.termName
          ? `${resolvedContext.termName} - ${resolvedContext.productTypeSlug.toUpperCase()}`
          : `${resolvedContext.groupName} - ${resolvedContext.productTypeSlug.toUpperCase()}`;

        return buildSeoMetadata({
          contact,
          descriptionOverride: seo.seo_description,
          pathname: `/products/${slug}`,
          routeType: 'list',
          seo,
          site,
          social,
          titleOverride: title,
          useTitleTemplate: true,
        });
      }

      return buildSeoMetadata({
        contact,
        descriptionOverride: 'Sản phẩm này không tồn tại hoặc đã bị xóa.',
        entityExists: false,
        pathname: `/products/${slug}`,
        routeType: 'detail',
        seo,
        site,
        social,
        titleOverride: 'Không tìm thấy sản phẩm',
      });
    }

    const category = await client.query(api.productCategories.getById, { id: product.categoryId });
    const canonicalPath = buildDetailPath({
      categorySlug: category?.slug,
      mode: 'unified',
      moduleKey: 'products',
      recordSlug: product.slug,
    });

    const title = resolveProductTitle(product.metaTitle ?? product.name);
    const description = resolveProductDescription({
      metaDescription: product.metaDescription,
      description: product.description,
      seoDescription: seo.seo_description,
    });

    const metadata = buildSeoMetadata({
      contact,
      descriptionOverride: description,
      entity: {
        description: product.description,
        image: product.image,
        images: product.images,
        metaDescription: product.metaDescription,
        metaTitle: product.metaTitle,
        name: product.name,
      },
      entityExists: true,
      pathname: canonicalPath,
      routeType: 'detail',
      seo,
      site,
      titleOverride: title,
      social,
    });

    return {
      ...metadata,
      robots: {
        ...(typeof metadata.robots === 'string' ? {} : metadata.robots),
        googleBot: {
          ...(typeof metadata.robots === 'string'
            ? { index: true, follow: true }
            : { index: metadata.robots?.index ?? true, follow: metadata.robots?.follow ?? true }),
          'max-snippet': -1,
          'max-image-preview': 'large',
          'max-video-preview': -1,
        },
      },
    };
  } catch {
    const [site, seo, contact, social] = await Promise.all([
      getSiteSettings(),
      getSEOSettings(),
      getContactSettings(),
      getSocialSettings(),
    ]);
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Thông tin sản phẩm đang được cập nhật.',
      entityExists: false,
      pathname: `/products/${slug}`,
      routeType: 'detail',
      seo,
      site,
      titleOverride: 'Sản phẩm',
      social,
    });
  }
}

export default async function ProductLayout({ params, children }: Props) {
  const { slug } = await params;
  const client = getConvexClient();
  try {
    const productsModule = await client.query(api.admin.modules.getModuleByKey, { key: 'products' });
    if (productsModule?.enabled === false) {
      notFound();
    }

    const [product, site, seo, enabledFields] = await Promise.all([
      client.query(api.products.getBySlug, { slug }),
      getSiteSettings(),
      getSEOSettings(),
      client.query(api.admin.modules.listEnabledModuleFields, { moduleKey: 'products' }),
    ]);

    if (!product) {return children;}

    const category = await client.query(api.productCategories.getById, { id: product.categoryId });
    if (category?.slug) {
      permanentRedirect(buildDetailPath({
        categorySlug: category.slug,
        mode: 'unified',
        moduleKey: 'products',
        recordSlug: product.slug,
      }));
    }

    const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';
    const productPath = buildDetailPath({
      categorySlug: category?.slug,
      mode: 'unified',
      moduleKey: 'products',
      recordSlug: product.slug,
    });
    const productUrl = `${baseUrl}${productPath}`;
    const image = (product.image ?? (product.images && product.images[0])) ?? seo.seo_og_image;
    const productImages = product.images && product.images.length > 0
      ? product.images
      : (product.image ? [product.image] : undefined);
    const productUpdatedAt = (product as { updatedAt?: number }).updatedAt;

    const ratingSummary = await client.query(api.comments.getRatingSummary, {
      targetId: product._id,
      targetType: 'product',
    });

    const showStock = enabledFields ? enabledFields.some((field) => field.fieldKey === 'stock') : true;

    const productSchema = generateProductSchema({
      aggregateRating: ratingSummary.count > 0
        ? { ratingValue: Number(ratingSummary.average.toFixed(2)), reviewCount: ratingSummary.count }
        : undefined,
      brand: site.site_name,
      description: resolveProductDescription({
        metaDescription: product.metaDescription,
        description: product.description,
        seoDescription: seo.seo_description,
      }),
      image,
      images: productImages,
      inStock: showStock ? product.stock > 0 : true,
      name: product.metaTitle ?? product.name,
      price: product.price,
      salePrice: product.salePrice,
      sku: product.sku,
      url: productUrl,
      createdAt: product._creationTime,
      updatedAt: productUpdatedAt,
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Trang chủ', url: baseUrl },
      {
        name: category?.name ?? 'Sản phẩm',
        url: category?.slug
          ? `${baseUrl}/${category.slug}`
          : `${baseUrl}/products`,
      },
      { name: product.name, url: productUrl },
    ]);

    return (
      <>
        <JsonLd data={productSchema} />
        <JsonLd data={breadcrumbSchema} />
        {children}
      </>
    );
  } catch {
    return children;
  }
}
