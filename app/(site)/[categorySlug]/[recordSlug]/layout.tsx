import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { getConvexClient } from '@/lib/convex';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';
import {
  JsonLd,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateProductSchema,
  generateServiceSchema,
} from '@/components/seo/JsonLd';
import { buildDetailPath } from '@/lib/ia/route-mode';

interface Props {
  params: Promise<{ categorySlug: string; recordSlug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, recordSlug } = await params;
  const client = getConvexClient();
  const [site, seo, contact, social, resolvedDetail] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
    client.query(api.ia.resolveUnifiedDetail, { categorySlug, recordSlug }),
  ]);

  const fallbackPath = `/${categorySlug}/${recordSlug}`;

  if (!resolvedDetail) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Nội dung không tồn tại hoặc đã bị xóa.',
      entityExists: false,
      pathname: fallbackPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy nội dung',
    });
  }

  const canonicalPath = buildDetailPath({
    categorySlug: resolvedDetail.categorySlug,
    mode: 'unified',
    moduleKey: resolvedDetail.moduleKey,
    recordSlug: resolvedDetail.recordSlug,
  });

  if (resolvedDetail.moduleKey === 'products') {
    const product = await client.query(api.products.getById, { id: resolvedDetail.recordId });
    if (!product) {
      return buildSeoMetadata({
        contact,
        descriptionOverride: 'Sản phẩm không tồn tại hoặc đã bị xóa.',
        entityExists: false,
        pathname: canonicalPath,
        routeType: 'detail',
        seo,
        site,
        social,
        titleOverride: 'Không tìm thấy sản phẩm',
      });
    }

    return buildSeoMetadata({
      contact,
      descriptionOverride: product.metaDescription ?? product.description ?? seo.seo_description,
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
      social,
      titleOverride: product.metaTitle ?? product.name,
    });
  }

  if (resolvedDetail.moduleKey === 'services') {
    const service = await client.query(api.services.getById, { id: resolvedDetail.recordId });
    if (!service) {
      return buildSeoMetadata({
        contact,
        descriptionOverride: 'Dịch vụ không tồn tại hoặc đã bị xóa.',
        entityExists: false,
        pathname: canonicalPath,
        routeType: 'detail',
        seo,
        site,
        social,
        titleOverride: 'Không tìm thấy dịch vụ',
      });
    }

    return buildSeoMetadata({
      contact,
      entity: {
        excerpt: service.excerpt,
        metaDescription: service.metaDescription,
        metaTitle: service.metaTitle,
        thumbnail: service.thumbnail,
        title: service.title,
      },
      entityExists: true,
      pathname: canonicalPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: service.metaTitle ?? service.title,
    });
  }

  if (resolvedDetail.moduleKey === 'courses') {
    const course = await client.query(api.courses.getById, { id: resolvedDetail.recordId as Id<'courses'> });
    if (!course) {
      return buildSeoMetadata({
        contact,
        descriptionOverride: 'Khóa học không tồn tại hoặc đã bị xóa.',
        entityExists: false,
        pathname: canonicalPath,
        routeType: 'detail',
        seo,
        site,
        social,
        titleOverride: 'Không tìm thấy khóa học',
      });
    }

    return buildSeoMetadata({
      contact,
      entity: {
        content: course.content,
        excerpt: course.excerpt,
        metaDescription: course.metaDescription,
        metaTitle: course.metaTitle,
        thumbnail: course.thumbnail,
        title: course.title,
      },
      entityExists: true,
      pathname: canonicalPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: course.metaTitle ?? course.title,
    });
  }

  if (resolvedDetail.moduleKey === 'projects') {
    const project = await client.query(api.projects.getById, { id: resolvedDetail.recordId as Id<'projects'> });
    if (!project) {
      return buildSeoMetadata({
        contact,
        descriptionOverride: 'Dự án không tồn tại hoặc đã bị xóa.',
        entityExists: false,
        pathname: canonicalPath,
        routeType: 'detail',
        seo,
        site,
        social,
        titleOverride: 'Không tìm thấy dự án',
      });
    }

    return buildSeoMetadata({
      contact,
      entity: {
        content: project.content,
        excerpt: project.excerpt,
        metaDescription: project.metaDescription,
        metaTitle: project.metaTitle,
        thumbnail: project.thumbnail,
        title: project.title,
      },
      entityExists: true,
      pathname: canonicalPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: project.metaTitle ?? project.title,
    });
  }

  if (resolvedDetail.moduleKey === 'resources') {
    const resource = await client.query(api.resources.getById, { id: resolvedDetail.recordId as Id<'resources'> });
    if (!resource) {
      return buildSeoMetadata({
        contact,
        descriptionOverride: 'Tài nguyên không tồn tại hoặc đã bị xóa.',
        entityExists: false,
        pathname: canonicalPath,
        routeType: 'detail',
        seo,
        site,
        social,
        titleOverride: 'Không tìm thấy tài nguyên',
      });
    }

    return buildSeoMetadata({
      contact,
      entity: {
        excerpt: resource.excerpt,
        metaDescription: resource.metaDescription,
        metaTitle: resource.metaTitle,
        thumbnail: resource.thumbnail,
        title: resource.title,
      },
      entityExists: true,
      pathname: canonicalPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: resource.metaTitle ?? resource.title,
    });
  }

  const post = await client.query(api.posts.getById, { id: resolvedDetail.recordId as Id<'posts'> });
  if (!post) {
    return buildSeoMetadata({
      contact,
      descriptionOverride: 'Bài viết không tồn tại hoặc đã bị xóa.',
      entityExists: false,
      pathname: canonicalPath,
      routeType: 'detail',
      seo,
      site,
      social,
      titleOverride: 'Không tìm thấy bài viết',
    });
  }

  return buildSeoMetadata({
    contact,
    entity: {
      content: post.content,
      excerpt: post.excerpt,
      metaDescription: post.metaDescription,
      metaTitle: post.metaTitle,
      thumbnail: post.thumbnail,
      title: post.title,
    },
    entityExists: true,
    openGraphType: 'article',
    pathname: canonicalPath,
    routeType: 'detail',
    seo,
    site,
    social,
    titleOverride: post.metaTitle ?? post.title,
  });
}

export default async function UnifiedDetailLayout({ params, children }: Props) {
  const { categorySlug, recordSlug } = await params;
  const client = getConvexClient();
  const [site, seo, resolvedDetail] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    client.query(api.ia.resolveUnifiedDetail, { categorySlug, recordSlug }),
  ]);

  if (!resolvedDetail) {
    notFound();
  }

  const canonicalPath = buildDetailPath({
    categorySlug: resolvedDetail.categorySlug,
    mode: 'unified',
    moduleKey: resolvedDetail.moduleKey,
    recordSlug: resolvedDetail.recordSlug,
  });

  if (`/${categorySlug}/${recordSlug}` !== canonicalPath) {
    permanentRedirect(canonicalPath);
  }

  const baseUrl = (site.site_url || process.env.NEXT_PUBLIC_SITE_URL) ?? '';

  if (resolvedDetail.moduleKey === 'products') {
    const [product, category, enabledFields] = await Promise.all([
      client.query(api.products.getById, { id: resolvedDetail.recordId }),
      client.query(api.productCategories.getById, { id: resolvedDetail.categoryId }),
      client.query(api.admin.modules.listEnabledModuleFields, { moduleKey: 'products' }),
    ]);
    if (!product) {return children;}

    const productUrl = `${baseUrl}${canonicalPath}`;
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
      description: product.metaDescription ?? product.description ?? seo.seo_description,
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
      { name: category?.name ?? 'Sản phẩm', url: `${baseUrl}/${resolvedDetail.categorySlug}` },
      { name: product.name, url: productUrl },
    ]);

    return (
      <>
        <JsonLd data={productSchema} />
        <JsonLd data={breadcrumbSchema} />
        {children}
      </>
    );
  }

  if (resolvedDetail.moduleKey === 'services') {
    const [service, category] = await Promise.all([
      client.query(api.services.getById, { id: resolvedDetail.recordId }),
      client.query(api.serviceCategories.getById, { id: resolvedDetail.categoryId }),
    ]);
    if (!service) {return children;}

    const serviceUrl = `${baseUrl}${canonicalPath}`;
    const image = service.thumbnail ?? seo.seo_og_image;
    const ratingSummary = await client.query(api.comments.getRatingSummary, {
      targetId: service._id,
      targetType: 'service',
    });

    const serviceSchema = generateServiceSchema({
      aggregateRating: ratingSummary.count > 0
        ? { ratingValue: Number(ratingSummary.average.toFixed(2)), reviewCount: ratingSummary.count }
        : undefined,
      description: (service.metaDescription ?? service.excerpt) ?? seo.seo_description,
      image,
      name: service.metaTitle ?? service.title,
      price: service.price,
      providerName: site.site_name,
      providerUrl: baseUrl,
      url: serviceUrl,
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Trang chủ', url: baseUrl },
      { name: category?.name ?? 'Dịch vụ', url: `${baseUrl}/${resolvedDetail.categorySlug}` },
      { name: service.title, url: serviceUrl },
    ]);

    return (
      <>
        <JsonLd data={serviceSchema} />
        <JsonLd data={breadcrumbSchema} />
        {children}
      </>
    );
  }

  if (resolvedDetail.moduleKey === 'courses') {
    const [course, category] = await Promise.all([
      client.query(api.courses.getById, { id: resolvedDetail.recordId as Id<'courses'> }),
      client.query(api.courseCategories.getById, { id: resolvedDetail.categoryId as Id<'courseCategories'> }),
    ]);
    if (!course) {return children;}

    const courseUrl = `${baseUrl}${canonicalPath}`;
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Trang chủ', url: baseUrl },
      { name: category?.name ?? 'Khóa học', url: `${baseUrl}/${resolvedDetail.categorySlug}` },
      { name: course.title, url: courseUrl },
    ]);

    return (
      <>
        <JsonLd data={breadcrumbSchema} />
        {children}
      </>
    );
  }

  if (resolvedDetail.moduleKey === 'projects') {
    const [project, category] = await Promise.all([
      client.query(api.projects.getById, { id: resolvedDetail.recordId as Id<'projects'> }),
      client.query(api.projectCategories.getById, { id: resolvedDetail.categoryId as Id<'projectCategories'> }),
    ]);
    if (!project) {return children;}

    const projectUrl = `${baseUrl}${canonicalPath}`;
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Trang chủ', url: baseUrl },
      { name: category?.name ?? 'Dự án', url: `${baseUrl}/${resolvedDetail.categorySlug}` },
      { name: project.title, url: projectUrl },
    ]);

    return (
      <>
        <JsonLd data={breadcrumbSchema} />
        {children}
      </>
    );
  }

  if (resolvedDetail.moduleKey === 'resources') {
    const [resource, category] = await Promise.all([
      client.query(api.resources.getById, { id: resolvedDetail.recordId as Id<'resources'> }),
      client.query(api.resourceCategories.getById, { id: resolvedDetail.categoryId as Id<'resourceCategories'> }),
    ]);
    if (!resource) {return children;}

    const resourceUrl = `${baseUrl}${canonicalPath}`;
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Trang chủ', url: baseUrl },
      { name: category?.name ?? 'Tài nguyên', url: `${baseUrl}/${resolvedDetail.categorySlug}` },
      { name: resource.title, url: resourceUrl },
    ]);

    return (
      <>
        <JsonLd data={breadcrumbSchema} />
        {children}
      </>
    );
  }

  const post = await client.query(api.posts.getById, { id: resolvedDetail.recordId as Id<'posts'> });
  if (!post) {return children;}

  const category = await client.query(api.postCategories.getById, { id: post.categoryId });
  const postUrl = `${baseUrl}${canonicalPath}`;
  const image = post.thumbnail ?? seo.seo_og_image;
  const articleSchema = generateArticleSchema({
    description: (post.metaDescription ?? post.excerpt) ?? seo.seo_description,
    image,
    publishedAt: post.publishedAt,
    siteName: site.site_name,
    title: post.metaTitle ?? post.title,
    authorName: post.authorName,
    url: postUrl,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Trang chủ', url: baseUrl },
    { name: category?.name ?? 'Bài viết', url: `${baseUrl}/${resolvedDetail.categorySlug}` },
    { name: post.title, url: postUrl },
  ]);

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbSchema} />
      {children}
    </>
  );
}
