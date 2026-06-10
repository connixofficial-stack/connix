import { Briefcase, ExternalLink, Image as ImageIcon, PlayCircle } from 'lucide-react';

type DeviceType = 'desktop' | 'tablet' | 'mobile';
type ColorMode = 'single' | 'dual';

type ProjectsListPreviewProps = {
  layoutStyle: 'grid' | 'sidebar' | 'list';
  gridColumns?: number;
  filterPosition?: 'sidebar' | 'top' | 'none';
  showSearch?: boolean;
  showCategories?: boolean;
  showClientName?: boolean;
  showIntroVideo?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: ColorMode;
  device?: DeviceType;
};

type ProjectDetailPreviewProps = {
  layoutStyle: 'classic' | 'modern' | 'minimal';
  showClientName?: boolean;
  showGallery?: boolean;
  showIntroVideo?: boolean;
  showRelated?: boolean;
  showShare?: boolean;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: ColorMode;
  device?: DeviceType;
};

const sampleProjects = [
  { client: 'Dohy Co.', title: 'dịch vụ làm website', category: 'Website', excerpt: 'Thiết kế giao diện độc quyền, tối ưu tốc độ tải trang và SEO chuyên sâu.', featured: true },
  { client: 'Dohy Studio', title: 'CÂU CHUYỆN TÌNH YÊU', category: '2D Animation', excerpt: 'Dự án hoạt hình ngắn mang thông điệp ý nghĩa về tình yêu và cuộc sống.', featured: false },
  { client: 'VietAdmin', title: 'Hệ thống quản trị doanh nghiệp', category: 'Ứng dụng', excerpt: 'Nền tảng quản lý tập trung, tự động hóa quy trình vận hành nội bộ.', featured: false },
  { client: 'Factory Studio', title: 'Landing campaign', category: 'Marketing', excerpt: 'Chiến dịch tiếp thị sản phẩm mới tối ưu tỷ lệ chuyển đổi.', featured: false },
];

function getAccent(brandColor = '#7c3aed', secondaryColor = '', colorMode: ColorMode = 'single') {
  return colorMode === 'dual' && secondaryColor ? secondaryColor : brandColor;
}

function ProjectCard({
  project,
  accent: _accent,
  showClientName,
  showIntroVideo,
  isList = false,
}: {
  project: typeof sampleProjects[number];
  accent: string;
  showClientName: boolean;
  showIntroVideo: boolean;
  isList?: boolean;
}) {
  if (isList) {
    return (
      <div className="group flex overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-zinc-800 dark:bg-[#161617]">
        <div className="w-32 sm:w-40 shrink-0 relative overflow-hidden bg-slate-100 dark:bg-[#1c1c1e] aspect-video sm:aspect-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-slate-400" />
          </div>
          {showIntroVideo && (
            <span className="absolute right-2 top-2 rounded-full bg-white/90 p-1 text-slate-700">
              <PlayCircle size={12} />
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col justify-center space-y-2 p-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-[#1c1c1e] dark:text-[#f5f5f7]">{project.category}</span>
            {showClientName && project.client && <span className="text-xs text-slate-400 truncate max-w-[120px]">{project.client}</span>}
          </div>
          <h3 className="line-clamp-2 text-base font-semibold text-slate-950 transition group-hover:opacity-90 dark:text-[#f5f5f7]">{project.title}</h3>
          <p className="line-clamp-2 text-sm leading-5 text-slate-600 dark:text-[#86868b]">{project.excerpt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-[#161617]">
      <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-[#1c1c1e]">
        <div className="absolute inset-0 flex items-center justify-center">
          <Briefcase className="h-8 w-8 text-slate-400" />
        </div>
        {showIntroVideo && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5 text-slate-700">
            <PlayCircle size={14} />
          </span>
        )}
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-[#1c1c1e] dark:text-zinc-350">{project.category}</span>
          {showClientName && project.client && <span className="truncate text-xs text-slate-400">{project.client}</span>}
        </div>
        <h3 className="line-clamp-2 text-xl font-semibold text-slate-950 transition group-hover:opacity-90 dark:text-[#f5f5f7]">{project.title}</h3>
        <p className="line-clamp-2 text-sm leading-6 text-slate-650 dark:text-[#86868b]">{project.excerpt}</p>
      </div>
    </div>
  );
}

export function ProjectsListPreview({
  layoutStyle,
  gridColumns,
  filterPosition: _filterPosition = 'top',
  showSearch = true,
  showCategories = true,
  showClientName = true,
  showIntroVideo = true,
  brandColor = '#7c3aed',
  secondaryColor = '',
  colorMode = 'single',
  device = 'desktop',
}: ProjectsListPreviewProps) {
  const accent = getAccent(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';
  const gridCols = gridColumns ?? 3;
  const gridClass = device === 'mobile'
    ? (gridCols === 4 ? 'grid-cols-2' : 'grid-cols-1')
    : device === 'tablet'
      ? (gridCols === 4 ? 'grid-cols-2' : 'grid-cols-3')
      : (gridCols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3');
  const showSidebar = (layoutStyle === 'sidebar' || layoutStyle === 'list') && !isMobile;

  const pageHeader = (
    <div className="mx-auto max-w-3xl text-center pb-2">
      <h1 className="text-3xl font-bold text-slate-950 dark:text-[#f5f5f7] md:text-5xl">Dự án đã thực hiện</h1>
    </div>
  );

  const topFilterBar = (showSearch || showCategories) && (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#161617] w-full">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {showSearch && (
          <div className="relative max-w-sm flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              disabled
              placeholder="Tìm kiếm dự án..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] pl-9 pr-3 text-sm outline-none transition dark:border-zinc-700 dark:text-[#f5f5f7]"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {showCategories && (
            <select disabled className="h-10 rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] px-3 text-sm dark:border-zinc-700 dark:text-[#f5f5f7]">
              <option>Tất cả danh mục</option>
              <option>Website</option>
              <option>2D Animation</option>
              <option>Ứng dụng</option>
            </select>
          )}
          <select disabled className="h-10 rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] px-3 text-sm dark:border-zinc-700 dark:text-[#f5f5f7]">
            <option>Mới nhất</option>
            <option>Cũ nhất</option>
            <option>Xem nhiều</option>
            <option>Theo tên</option>
          </select>
        </div>
      </div>
    </div>
  );

  const sidebarFilter = (
    <aside className="w-full space-y-4 lg:w-60 lg:flex-shrink-0">
      {showSearch && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#161617]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Tìm kiếm</p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              disabled
              placeholder="Tìm dự án..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] pl-8 pr-3 text-sm outline-none dark:border-zinc-700 dark:text-[#f5f5f7]"
            />
          </div>
        </div>
      )}
      {showCategories && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#161617]">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Danh mục</p>
          <ul className="space-y-0.5">
            <li>
              <button
                disabled
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold"
                style={{ backgroundColor: `${accent}18`, color: accent }}
              >
                Tất cả
              </button>
            </li>
            {['Website', '2D Animation', 'Ứng dụng'].map((category) => (
              <li key={category}>
                <button
                  disabled
                  type="button"
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-500 dark:text-zinc-400"
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-[#161617]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Sắp xếp</p>
        <select disabled className="h-9 w-full rounded-xl border border-slate-200 bg-white dark:bg-[#1c1c1e] px-3 text-sm dark:border-zinc-700 dark:text-[#f5f5f7]">
          <option>Mới nhất</option>
          <option>Cũ nhất</option>
          <option>Xem nhiều</option>
          <option>Theo tên</option>
        </select>
      </div>
    </aside>
  );

  const paginationBar = (
    <div className="flex items-center justify-between pt-4 w-full">
      <span className="text-sm text-slate-500">{sampleProjects.length} dự án</span>
      <div className="flex gap-2">
        <button disabled className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-400 dark:border-zinc-800 dark:bg-[#161617]">
          Trước
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-[520px] bg-slate-50 p-4 dark:bg-black font-active text-slate-700 dark:text-[#f5f5f7] transition-colors duration-200">
      <div className="mx-auto max-w-5xl space-y-6">
        {pageHeader}
        
        {!showSidebar ? (
          // Grid Layout
          <div className="space-y-6">
            {topFilterBar}
            <div className={`grid gap-6 ${gridClass}`}>
              {sampleProjects.map((project) => (
                <ProjectCard key={project.title} project={project} accent={accent} showClientName={showClientName} showIntroVideo={showIntroVideo} isList={false} />
              ))}
            </div>
            {paginationBar}
          </div>
        ) : (
          // Sidebar or List Layout
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {sidebarFilter}
            <div className="min-w-0 flex-1 space-y-6">
              {layoutStyle === 'sidebar' ? (
                <div className={`grid gap-6 ${gridClass}`}>
                  {sampleProjects.map((project) => (
                    <ProjectCard key={project.title} project={project} accent={accent} showClientName={showClientName} showIntroVideo={showIntroVideo} isList={false} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {sampleProjects.map((project) => (
                    <ProjectCard key={project.title} project={project} accent={accent} showClientName={showClientName} showIntroVideo={showIntroVideo} isList={true} />
                  ))}
                </div>
              )}
              {paginationBar}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProjectDetailPreview({
  layoutStyle,
  showClientName = true,
  showGallery = true,
  showIntroVideo = true,
  showRelated = true,
  showShare = true,
  brandColor = '#7c3aed',
  secondaryColor = '',
  colorMode = 'single',
  device = 'desktop',
}: ProjectDetailPreviewProps) {
  const accent = getAccent(brandColor, secondaryColor, colorMode);
  const isMobile = device === 'mobile';

  return (
    <div className="min-h-[620px] bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className={`mx-auto max-w-5xl space-y-6 p-5 ${layoutStyle === 'minimal' ? 'max-w-3xl' : ''}`}>
        <div className={layoutStyle === 'modern' && !isMobile ? 'grid grid-cols-[1.1fr_.9fr] gap-6 items-center' : 'space-y-5'}>
          <div className="space-y-4">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">Website</span>
            <h1 className="text-3xl font-bold">Website thương hiệu Dohy Co.</h1>
            {showClientName && <p className="text-sm text-slate-500">Khách hàng: Dohy Co.</p>}
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Thiết kế và phát triển website tập trung vào tốc độ, nhận diện thương hiệu và chuyển đổi khách hàng.</p>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>
                Xem dự án <ExternalLink size={14} />
              </button>
              {showShare && <button className="rounded-full border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">Chia sẻ</button>}
            </div>
          </div>
          <div className="aspect-video rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            <div className="flex h-full items-center justify-center">
              <Briefcase className="h-10 w-10 text-slate-400" />
            </div>
          </div>
        </div>

        {showIntroVideo && (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><PlayCircle size={18} style={{ color: accent }} /> Video giới thiệu</div>
            <div className="aspect-video rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        <div className="grid gap-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          <p>Đội ngũ triển khai wireframe, thiết kế UI, phát triển frontend và kết nối quản trị nội dung.</p>
          <p>Kết quả là hệ thống dễ vận hành, thể hiện đúng tinh thần thương hiệu và sẵn sàng mở rộng.</p>
        </div>

        {showGallery && (
          <div>
            <h2 className="mb-3 text-lg font-bold">Thư viện ảnh</h2>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="aspect-video rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon size={20} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showRelated && (
          <div>
            <h2 className="mb-3 text-lg font-bold">Dự án liên quan</h2>
            <div className="grid gap-3 md:grid-cols-3">
              {sampleProjects.slice(1, 4).map((project) => (
                <ProjectCard key={project.title} project={project} accent={accent} showClientName={showClientName} showIntroVideo={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
