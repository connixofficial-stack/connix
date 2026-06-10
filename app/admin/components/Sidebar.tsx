'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { 
  Bell, Briefcase, CalendarDays, ChevronRight, ChevronsLeft, GraduationCap,
  ChevronsRight, FileText, Globe, Image as ImageIcon, Inbox, LayoutDashboard, LayoutGrid, Loader2,
  LogOut, Settings, ShoppingCart, Ticket, User, Users, X
} from 'lucide-react';
import { cn } from './ui';
import { api } from '@/convex/_generated/api';
import { useAdminModules } from '../context/AdminModulesContext';
import { useSidebarState } from '../context/SidebarContext';
import { useAdminAuth } from '../auth/context';
import { isValidImageSrc } from '@/lib/utils/image';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  active: boolean;
  subItems?: { label: string, href: string, moduleKey?: string, visible?: boolean }[];
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  isModuleEnabled: (key: string) => boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ 
  icon: Icon, 
  label, 
  href, 
  active, 
  subItems, 
  isCollapsed, 
  isExpanded, 
  onToggle,
  pathname,
  isModuleEnabled
}) => {
  const filteredSubItems = useMemo(() => {
    if (!subItems) {return [];}
    return subItems.filter((sub) => (sub.visible ?? true) && (!sub.moduleKey || isModuleEnabled(sub.moduleKey)));
  }, [subItems, isModuleEnabled]);

  const hasSub = filteredSubItems.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (hasSub) {
      e.preventDefault();
      onToggle();
    }
  };

  if (subItems && filteredSubItems.length === 0) {
    return null;
  }

  return (
    <div className="mb-1 group relative">
      {hasSub ? (
        <button 
          onClick={handleClick}
          className={cn(
            "w-full flex items-center transition-all duration-200 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            isCollapsed ? "justify-center p-2" : "justify-between px-3 py-2",
            active ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
          )}
          title={isCollapsed ? label : undefined}
        >
          <div className={cn("flex items-center", isCollapsed ? "gap-0" : "gap-3")}>
            <Icon size={isCollapsed ? 22 : 20} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <span className={cn("text-sm font-medium whitespace-nowrap transition-all duration-300 origin-left", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
              {label}
            </span>
          </div>
          {!isCollapsed && (
            <ChevronRight size={16} className={cn("transition-transform duration-200 opacity-70", isExpanded && "rotate-90")} />
          )}
        </button>
      ) : (
        <Link 
          href={href} 
          className={cn(
            "flex items-center transition-all duration-200 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
            active ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
          )}
          title={isCollapsed ? label : undefined}
        >
          <Icon size={isCollapsed ? 22 : 20} className="shrink-0 transition-transform duration-200 group-hover:scale-105" />
          <span className={cn("text-sm font-medium whitespace-nowrap transition-all duration-300 origin-left", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
            {label}
          </span>
        </Link>
      )}
      
      {hasSub && (
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isExpanded && !isCollapsed ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
        )}>
          <div className="ml-4 border-l-2 border-slate-100 dark:border-slate-800 pl-3 space-y-1 my-1">
            {filteredSubItems.map((sub) => (
              <Link 
                key={sub.href} 
                href={sub.href}
                className={cn(
                  "block px-3 py-1.5 rounded-md text-sm transition-colors truncate relative",
                  pathname === sub.href || pathname.startsWith(sub.href + '/')
                    ? "text-blue-600 bg-blue-500/5 font-medium dark:text-blue-400" 
                    : "text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebarState();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { isModuleEnabled, isLoading } = useAdminModules();
  const { logout, user } = useAdminAuth();
  const productSettings = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'products' });
  const userFeatures = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: 'users' });
  const siteSettings = useQuery(api.settings.getMultiple, { keys: ['site_logo', 'site_name'] });
  const trustPagesFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'settings', featureKey: 'enableTrustPages' });
  const courseFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'courses', featureKey: 'enableCourseFilters' });
  const resourceFiltersFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'resources', featureKey: 'enableResourceFilters' });

  const isActive = (route: string) => pathname.startsWith(route);

  const activeMenu = useMemo(() => {
    if (pathname.startsWith('/admin/posts') || pathname.startsWith('/admin/post-categories') || pathname.startsWith('/admin/comments')) {
      return 'Quản lý bài viết';
    }
    if (pathname.startsWith('/admin/courses') || pathname.startsWith('/admin/course-categories')) {
      return 'Khóa học';
    }
    if (pathname.startsWith('/admin/resources') || pathname.startsWith('/admin/resource-categories')) {
      return 'Tài nguyên';
    }
    if (pathname.startsWith('/admin/projects') || pathname.startsWith('/admin/project-categories')) {
      return 'Dự án';
    }
    if (
      pathname.startsWith('/admin/products') ||
      pathname.startsWith('/admin/categories') ||
      pathname.startsWith('/admin/product-options') ||
      pathname.startsWith('/admin/customers') ||
      pathname.startsWith('/admin/reviews') ||
      pathname.startsWith('/admin/orders') ||
      pathname.startsWith('/admin/wishlist')
    ) {
      return 'Bán hàng & sản phẩm';
    }
    if (pathname.startsWith('/admin/users') || pathname.startsWith('/admin/roles')) {
      return 'Người dùng';
    }
    if (pathname.startsWith('/admin/menus') || pathname.startsWith('/admin/home-components') || pathname.startsWith('/admin/trust-pages')) {
      return 'Website';
    }
    if (pathname.startsWith('/admin/settings')) {
      return 'Cài đặt';
    }
    if (pathname.startsWith('/admin/bookings')) {
      return 'Dịch vụ';
    }
    return null;
  }, [pathname]);

  const currentExpandedMenu = expandedMenu ?? activeMenu;

  const handleMenuToggle = (label: string) => {
    if (isSidebarCollapsed) {
      setIsSidebarCollapsed(false);
      setExpandedMenu(label);
    } else {
      setExpandedMenu(expandedMenu === label ? null : label);
    }
  };

  const showAnalyticsSection = isModuleEnabled('analytics');
  // Posts section: chỉ hiện khi posts bật (comments bài viết phụ thuộc vào posts)
  const showPostsSection = isModuleEnabled('posts');
  // Comments trong posts section chỉ hiện khi cả posts VÀ comments đều bật
  const showPostComments = isModuleEnabled('posts') && isModuleEnabled('comments');
  // Services section
  const showCoursesSection = isModuleEnabled('courses');
  const showResourcesSection = isModuleEnabled('resources');
  const showProjectsSection = isModuleEnabled('projects');
  const showServicesSection = isModuleEnabled('services');
  const showBookingsSection = isModuleEnabled('bookings');
  const showCommerceSection = isModuleEnabled('products') || isModuleEnabled('customers') || isModuleEnabled('orders') || isModuleEnabled('wishlist');
  // Product reviews chỉ hiện khi products VÀ comments đều bật  
  const showProductReviews = isModuleEnabled('products') && isModuleEnabled('comments');
  const showMediaSection = isModuleEnabled('media');
  const showUsersSection = isModuleEnabled('users') || isModuleEnabled('roles');
  const showWebsiteSection = isModuleEnabled('menus') || isModuleEnabled('homepage') || isModuleEnabled('settings');
  const showKanbanSection = isModuleEnabled('kanban');
  const showSubscriptionsSection = isModuleEnabled('subscriptions');
  const showSettingsSection = isModuleEnabled('settings');
  const showContactInboxSection = isModuleEnabled('contactInbox');
  const showNotificationsSection = isModuleEnabled('notifications');
  const showPromotionsSection = isModuleEnabled('promotions');
  const variantEnabled = Boolean(productSettings?.find(setting => setting.settingKey === 'variantEnabled')?.value);
  const productTypesEnabled = Boolean(productSettings?.find(setting => setting.settingKey === 'enableProductTypes')?.value);

  const analyticsSectionItemCount = showAnalyticsSection ? 1 : 0;
  const contentSectionItemCount = Number(showPostsSection) + Number(showCoursesSection) + Number(showResourcesSection) + Number(showProjectsSection) + Number(showServicesSection);
  const commerceSectionItemCount = showCommerceSection ? 1 : 0;
  const mediaSectionItemCount = showMediaSection ? 1 : 0;
  const marketingSectionItemCount = Number(showNotificationsSection) + Number(showPromotionsSection);
  const systemSectionItemCount = Number(showUsersSection) + Number(showWebsiteSection) + Number(showContactInboxSection) + Number(showKanbanSection) + Number(showSubscriptionsSection) + Number(showSettingsSection);

  const shouldShowGroupTitle = (itemCount: number) => !isSidebarCollapsed && itemCount > 0;
  const getSectionClassName = (showTitle: boolean) => cn('space-y-1', !showTitle && '-mt-2');

  const showAnalyticsTitle = shouldShowGroupTitle(analyticsSectionItemCount);
  const showContentTitle = shouldShowGroupTitle(contentSectionItemCount);
  const showCommerceTitle = shouldShowGroupTitle(commerceSectionItemCount);
  const showMediaTitle = shouldShowGroupTitle(mediaSectionItemCount);
  const showMarketingTitle = shouldShowGroupTitle(marketingSectionItemCount);
  const showSystemTitle = shouldShowGroupTitle(systemSectionItemCount);

  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    userFeatures?.forEach(feature => { features[feature.featureKey] = feature.enabled; });
    return features;
  }, [userFeatures]);

  const showAvatar = enabledFeatures.enableAvatar ?? true;

  const displayName = user?.name ?? 'Admin';
  const displayEmail = user?.email ?? '';
  const avatarUrl = showAvatar ? user?.avatar : undefined;
  const brandName = (siteSettings?.site_name as string)?.trim() || 'YourLogo';
  const brandLogo = (siteSettings?.site_logo as string)?.trim() || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (!showUserMenu) {return;}
    const handleClickOutside = (event: MouseEvent) => {
      if (!userMenuRef.current) {return;}
      if (!userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    router.push('/admin/auth/login');
  };

  return (
    <>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() =>{  setMobileMenuOpen(false); }}
        />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 transition-all duration-300 ease-in-out flex flex-col shadow-lg lg:shadow-none",
        isSidebarCollapsed ? "lg:w-[80px]" : "lg:w-[280px]",
        mobileMenuOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className={cn("h-16 flex items-center border-b border-slate-100 dark:border-slate-800 transition-all duration-300", isSidebarCollapsed ? "justify-center px-0" : "px-6 justify-between")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden">
              {brandLogo && isValidImageSrc(brandLogo) ? (
                <Image
                  src={brandLogo}
                  alt={brandName}
                  width={36}
                  height={36}
                  className="w-9 h-9 object-cover"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                  <span className="font-bold text-lg">Y</span>
                </div>
              )}
            </div>
            <span className={cn("font-bold text-xl text-slate-800 dark:text-slate-100 whitespace-nowrap transition-opacity duration-300", isSidebarCollapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto")}>
              {brandName}
            </span>
          </div>
          <button className="lg:hidden" onClick={() =>{  setMobileMenuOpen(false); }}>
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="admin-sidebar-scroll flex-1 py-4 px-3 space-y-3.5 overflow-y-auto scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            
            {/* Dashboard/Analytics */}
            {showAnalyticsSection && (
              <div className={getSectionClassName(showAnalyticsTitle)}>
                {showAnalyticsTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng quan</div>}
                <SidebarItem 
                  icon={LayoutDashboard} 
                  label="Tổng quan" 
                  href="/admin/dashboard" 
                  active={pathname === '/admin/dashboard' || pathname === '/admin'} 
                  isCollapsed={isSidebarCollapsed}
                  isExpanded={false}
                  onToggle={() => {}}
                  pathname={pathname}
                  isModuleEnabled={isModuleEnabled}
                />
              </div>
            )}

            {/* Posts Section */}
            {showPostsSection && (
              <div className={getSectionClassName(showContentTitle)}>
                {showContentTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung</div>}
                <SidebarItem 
                  icon={FileText} 
                  label="Quản lý bài viết" 
                  href="/admin/posts" 
                  active={isActive('/admin/posts') || isActive('/admin/post-categories') || isActive('/admin/comments')}
                  isCollapsed={isSidebarCollapsed}
                  isExpanded={currentExpandedMenu === 'Quản lý bài viết'}
                  onToggle={() =>{  handleMenuToggle('Quản lý bài viết'); }}
                  pathname={pathname}
                  isModuleEnabled={isModuleEnabled}
                  subItems={[
                    { href: '/admin/posts', label: 'Tất cả bài viết', moduleKey: 'posts' },
                    { href: '/admin/post-categories', label: 'Danh mục bài viết', moduleKey: 'posts' },
                    ...(showPostComments ? [{ href: '/admin/comments', label: 'Bình luận' }] : []),
                  ]}
                />
              </div>
            )}

            {/* Courses Section */}
            {showCoursesSection && (
              <div className={getSectionClassName(showContentTitle)}>
                {!showPostsSection && showContentTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung</div>}
                <SidebarItem
                  icon={GraduationCap}
                  label="Khóa học"
                  href="/admin/courses"
                  active={isActive('/admin/courses') || isActive('/admin/course-categories') || isActive('/admin/courses/filters')}
                  isCollapsed={isSidebarCollapsed}
                  isExpanded={currentExpandedMenu === 'Khóa học'}
                  onToggle={() =>{  handleMenuToggle('Khóa học'); }}
                  pathname={pathname}
                  isModuleEnabled={isModuleEnabled}
                  subItems={[
                    { href: '/admin/courses', label: 'Tất cả khóa học', moduleKey: 'courses' },
                    { href: '/admin/course-categories', label: 'Danh mục khóa học', moduleKey: 'courses' },
                    ...(courseFiltersFeature?.enabled ? [{ href: '/admin/courses/filters', label: 'Bộ lọc khóa học', moduleKey: 'courses' }] : []),
                    { href: '/admin/courses/students', label: 'Học viên', moduleKey: 'courses' },
                  ]}
                />
              </div>
            )}

            {/* Resources Section */}
            {showResourcesSection && (
              <div className={getSectionClassName(showContentTitle)}>
                {!showPostsSection && !showCoursesSection && showContentTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung</div>}
                <SidebarItem
                  icon={FileText}
                  label="Tài nguyên"
                  href="/admin/resources"
                  active={isActive('/admin/resources') || isActive('/admin/resource-categories')}
                  isCollapsed={isSidebarCollapsed}
                  isExpanded={currentExpandedMenu === 'Tài nguyên'}
                  onToggle={() =>{  handleMenuToggle('Tài nguyên'); }}
                  pathname={pathname}
                  isModuleEnabled={isModuleEnabled}
                  subItems={[
                    { href: '/admin/resources', label: 'Tất cả tài nguyên', moduleKey: 'resources' },
                    { href: '/admin/resource-categories', label: 'Danh mục tài nguyên', moduleKey: 'resources' },
                    ...(resourceFiltersFeature?.enabled ? [{ href: '/admin/resources/filters', label: 'Bộ lọc tài nguyên', moduleKey: 'resources' }] : []),
                    { href: '/admin/resources/customers', label: 'Người mua và tải', moduleKey: 'resources' },
                  ]}
                />
              </div>
            )}

            {/* Services Section */}
            {showProjectsSection && (
              <div className={getSectionClassName(showContentTitle)}>
                {!showPostsSection && !showCoursesSection && !showResourcesSection && showContentTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung</div>}
                <SidebarItem
                  icon={Briefcase}
                  label="Dự án"
                  href="/admin/projects"
                  active={isActive('/admin/projects') || isActive('/admin/project-categories')}
                  isCollapsed={isSidebarCollapsed}
                  isExpanded={currentExpandedMenu === 'Dự án'}
                  onToggle={() =>{  handleMenuToggle('Dự án'); }}
                  pathname={pathname}
                  isModuleEnabled={isModuleEnabled}
                  subItems={[
                    { href: '/admin/projects', label: 'Tất cả dự án', moduleKey: 'projects' },
                    { href: '/admin/project-categories', label: 'Danh mục dự án', moduleKey: 'projects' },
                  ]}
                />
              </div>
            )}

            {/* Services Section */}
            {showServicesSection && (
              <div className={getSectionClassName(showContentTitle)}>
                {!showPostsSection && !showCoursesSection && !showResourcesSection && !showProjectsSection && showContentTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Nội dung</div>}
                <SidebarItem 
                  icon={Briefcase} 
                  label="Dịch vụ" 
                  href="/admin/services" 
                  active={isActive('/admin/services') || isActive('/admin/service-categories') || isActive('/admin/bookings')}
                  isCollapsed={isSidebarCollapsed}
                  isExpanded={currentExpandedMenu === 'Dịch vụ'}
                  onToggle={() =>{  handleMenuToggle('Dịch vụ'); }}
                  pathname={pathname}
                  isModuleEnabled={isModuleEnabled}
                  subItems={[
                    { href: '/admin/services', label: 'Tất cả dịch vụ', moduleKey: 'services' },
                    { href: '/admin/service-categories', label: 'Danh mục dịch vụ', moduleKey: 'services' },
                    ...(showBookingsSection ? [{ href: '/admin/bookings', label: 'Đặt lịch', moduleKey: 'bookings' }] : []),
                    ...(showBookingsSection ? [{ href: '/admin/bookings/settings', label: 'Cài đặt lịch', moduleKey: 'bookings' }] : []),
                  ]}
                />
              </div>
            )}

            {/* Commerce Section */}
            {showCommerceSection && (
              <div className={getSectionClassName(showCommerceTitle)}>
                {showCommerceTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Bán hàng</div>}
                <SidebarItem 
                  icon={ShoppingCart} 
                  label="Bán hàng & sản phẩm" 
                  href="/admin/products"
                  active={isActive('/admin/products') || isActive('/admin/categories') || isActive('/admin/product-options') || isActive('/admin/customers') || isActive('/admin/reviews') || isActive('/admin/orders') || isActive('/admin/wishlist')}
                  isCollapsed={isSidebarCollapsed}
                  isExpanded={currentExpandedMenu === 'Bán hàng & sản phẩm'}
                  onToggle={() =>{  handleMenuToggle('Bán hàng & sản phẩm'); }}
                  pathname={pathname}
                  isModuleEnabled={isModuleEnabled}
                  subItems={[
                    { href: '/admin/products', label: 'Sản phẩm', moduleKey: 'products' },
                    { href: '/admin/categories', label: 'Danh mục sản phẩm', moduleKey: 'products' },
                    ...(productTypesEnabled ? [{ href: '/admin/product-types', label: 'Loại sản phẩm', moduleKey: 'products' }] : []),
                    ...(productTypesEnabled ? [{ href: '/admin/attribute-groups', label: 'Thuộc tính lọc', moduleKey: 'products' }] : []),
                    ...(variantEnabled ? [{ href: '/admin/product-options', label: 'Loại tùy chọn', moduleKey: 'products' }] : []),
                    { href: '/admin/orders', label: 'Đơn hàng', moduleKey: 'orders' },
                    { href: '/admin/cart', label: 'Giỏ hàng', moduleKey: 'cart' },
                    { href: '/admin/wishlist', label: 'Wishlist', moduleKey: 'wishlist' },
                    ...(showProductReviews ? [{ href: '/admin/reviews', label: 'Đánh giá sản phẩm' }] : []),
                    { href: '/admin/customers', label: 'Khách hàng', moduleKey: 'customers' },
                  ]}
                />
              </div>
            )}

            {/* Media Section */}
            {showMediaSection && (
              <div className={getSectionClassName(showMediaTitle)}>
                {showMediaTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Media</div>}
                <SidebarItem 
                  icon={ImageIcon} 
                  label="Thư viện Media" 
                  href="/admin/media" 
                  active={isActive('/admin/media')} 
                  isCollapsed={isSidebarCollapsed}
                  isExpanded={false}
                  onToggle={() => {}}
                  pathname={pathname}
                  isModuleEnabled={isModuleEnabled}
                />
              </div>
            )}

            {/* Marketing Section */}
            {(showNotificationsSection || showPromotionsSection) && (
              <div className={getSectionClassName(showMarketingTitle)}>
                {showMarketingTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Marketing</div>}
                {showNotificationsSection && (
                  <SidebarItem 
                    icon={Bell} 
                    label="Thông báo" 
                    href="/admin/notifications" 
                    active={isActive('/admin/notifications')} 
                    isCollapsed={isSidebarCollapsed}
                    isExpanded={false}
                    onToggle={() => {}}
                    pathname={pathname}
                    isModuleEnabled={isModuleEnabled}
                  />
                )}
                {showPromotionsSection && (
                  <SidebarItem 
                    icon={Ticket} 
                    label="Khuyến mãi" 
                    href="/admin/promotions" 
                    active={isActive('/admin/promotions')} 
                    isCollapsed={isSidebarCollapsed}
                    isExpanded={false}
                    onToggle={() => {}}
                    pathname={pathname}
                    isModuleEnabled={isModuleEnabled}
                  />
                )}
              </div>
            )}

            {/* System Section */}
            {(showUsersSection || showWebsiteSection || showSettingsSection || showKanbanSection || showSubscriptionsSection || showContactInboxSection) && (
              <div className={getSectionClassName(showSystemTitle)}>
                {showSystemTitle && <div className="px-3 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Hệ thống</div>}
                
                {showUsersSection && (
                  <SidebarItem 
                    icon={Users} 
                    label="Người dùng" 
                    href="/admin/users"
                    active={isActive('/admin/users') || isActive('/admin/roles')}
                    isCollapsed={isSidebarCollapsed}
                    isExpanded={currentExpandedMenu === 'Người dùng'}
                    onToggle={() =>{  handleMenuToggle('Người dùng'); }}
                    pathname={pathname}
                    isModuleEnabled={isModuleEnabled}
                    subItems={[
                      { href: '/admin/users', label: 'Danh sách User', moduleKey: 'users' },
                      { href: '/admin/roles', label: 'Phân quyền', moduleKey: 'roles' },
                    ]}
                  />
                )}
                
                {showWebsiteSection && (
                  <SidebarItem 
                    icon={Globe} 
                    label="Website" 
                    href="/admin/menus"
                    active={isActive('/admin/menus') || isActive('/admin/home-components') || isActive('/admin/trust-pages')}
                    isCollapsed={isSidebarCollapsed}
                    isExpanded={currentExpandedMenu === 'Website'}
                    onToggle={() =>{  handleMenuToggle('Website'); }}
                    pathname={pathname}
                    isModuleEnabled={isModuleEnabled}
                    subItems={[
                      { href: '/admin/menus', label: 'Menu', moduleKey: 'menus' },
                      { href: '/admin/home-components', label: 'Giao diện trang chủ', moduleKey: 'homepage' },
                      { href: '/admin/trust-pages', label: 'Trang tin cậy', moduleKey: 'settings', visible: trustPagesFeature?.enabled ?? true },
                    ]}
                  />
                )}

                {showContactInboxSection && (
                  <SidebarItem
                    icon={Inbox}
                    label="Tin nhắn liên hệ"
                    href="/admin/contact-inbox"
                    active={isActive('/admin/contact-inbox')}
                    isCollapsed={isSidebarCollapsed}
                    isExpanded={false}
                    onToggle={() => {}}
                    pathname={pathname}
                    isModuleEnabled={isModuleEnabled}
                  />
                )}

                {showKanbanSection && (
                  <SidebarItem
                    icon={LayoutGrid}
                    label="Kanban Board"
                    href="/admin/kanban"
                    active={isActive('/admin/kanban')}
                    isCollapsed={isSidebarCollapsed}
                    isExpanded={false}
                    onToggle={() => {}}
                    pathname={pathname}
                    isModuleEnabled={isModuleEnabled}
                  />
                )}

                {showSubscriptionsSection && (
                  <SidebarItem
                    icon={CalendarDays}
                    label="Subscriptions"
                    href="/admin/subscriptions"
                    active={isActive('/admin/subscriptions')}
                    isCollapsed={isSidebarCollapsed}
                    isExpanded={false}
                    onToggle={() => {}}
                    pathname={pathname}
                    isModuleEnabled={isModuleEnabled}
                  />
                )}
                
                {showSettingsSection && (
                  <SidebarItem 
                    icon={Settings} 
                    label="Cài đặt" 
                    href="/admin/settings" 
                    active={isActive('/admin/settings')} 
                    isCollapsed={isSidebarCollapsed}
                    isExpanded={currentExpandedMenu === 'Cài đặt'}
                    onToggle={() =>{  handleMenuToggle('Cài đặt'); }}
                    pathname={pathname}
                    isModuleEnabled={isModuleEnabled}
                    subItems={[
                      { href: '/admin/settings/general', label: 'Thông tin chung', moduleKey: 'settings' },
                      { href: '/admin/settings/contact', label: 'Liên hệ', moduleKey: 'settings' },
                      { href: '/admin/settings/seo', label: 'SEO', moduleKey: 'settings' },
                      { href: '/admin/settings/advanced', label: 'Nâng cao', moduleKey: 'settings' },
                    ]}
                  />
                )}
              </div>
            )}
          </div>
        )}

        <div className="px-3 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
          <button 
            onClick={() =>{  setIsSidebarCollapsed(!isSidebarCollapsed); }}
            className="hidden lg:flex items-center justify-center w-full h-8 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={isSidebarCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isSidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setShowUserMenu((prev) => !prev)}
              className={cn("w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors", isSidebarCollapsed ? "justify-center" : "")}
              aria-expanded={showUserMenu}
            >
              <div className="relative">
                {avatarUrl && isValidImageSrc(avatarUrl) && !avatarError ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={36}
                    height={36}
                    onError={() => setAvatarError(true)}
                    className="w-9 h-9 rounded-full ring-2 ring-white dark:ring-slate-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center ring-2 ring-white dark:ring-slate-700">
                    {initials || 'AD'}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
              </div>

              {!isSidebarCollapsed && (
                <div className="flex-1 overflow-hidden text-left">
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{displayName}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</div>
                </div>
              )}
            </button>

            {showUserMenu && (
              <div
                className={cn(
                  "absolute z-50 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900",
                  isSidebarCollapsed ? "left-full bottom-0 ml-2 w-56" : "left-0 bottom-full mb-2 w-full"
                )}
              >
                <Link
                  href="/admin/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <User size={16} />
                  Hồ sơ
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <LogOut size={16} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

