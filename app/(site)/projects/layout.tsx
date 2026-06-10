import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';
import { getContactSettings, getSEOSettings, getSiteSettings, getSocialSettings } from '@/lib/get-settings';
import { buildSeoMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const client = getConvexClient();
  const [site, seo, contact, social, projectsModule] = await Promise.all([
    getSiteSettings(),
    getSEOSettings(),
    getContactSettings(),
    getSocialSettings(),
    client.query(api.admin.modules.getModuleByKey, { key: 'projects' }),
  ]);

  return buildSeoMetadata({
    contact,
    descriptionOverride: projectsModule?.enabled ? (seo.seo_description || `Danh sách dự án từ ${site.site_name}`) : 'Trang dự án hiện không khả dụng.',
    moduleEnabled: Boolean(projectsModule?.enabled),
    pathname: '/projects',
    routeType: 'list',
    seo,
    site,
    social,
    titleOverride: projectsModule?.enabled ? 'Dự án' : 'Không tìm thấy dự án',
    useTitleTemplate: true,
  });
}

export default async function ProjectsListLayout({ children }: { children: React.ReactNode }) {
  const client = getConvexClient();
  const projectsModule = await client.query(api.admin.modules.getModuleByKey, { key: 'projects' });

  if (!projectsModule?.enabled) {
    notFound();
  }

  return <>{children}</>;
}
