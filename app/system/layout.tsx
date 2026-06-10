'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Blocks, 
  BookOpen,
  ChevronRight, 
  Database, 
  Globe,
  Languages, 
  LayoutGrid,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Map,
  type LucideIcon,
  Menu,
  Moon,
  ExternalLink,
  Shield,
  Sun,
  Terminal
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CustomToaster } from '@/components/shared/CustomToaster';
import { I18nProvider, useI18n } from './i18n/context';
import type { Locale } from './i18n/translations';
import { SystemAuthProvider, useSystemAuth } from './auth/context';
import { SystemAuthGuard } from './auth/SystemAuthGuard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SystemGlobalSearch } from './components/SystemGlobalSearch';

const SidebarItem = ({ href, icon: Icon, label, collapsed }: { href: string, icon: LucideIcon, label: string, collapsed: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/system' && pathname.startsWith(href));
  
  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group mb-0.5
        ${isActive 
          ? 'bg-slate-200 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 border-l-2 border-cyan-500 dark:border-cyan-400' 
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border-l-2 border-transparent'}
      `}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    </Link>
  );
};

const SidebarGroup = ({ label, collapsed }: { label: string, collapsed: boolean }) => (
  <div className={`text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider mb-2 mt-6 px-3 ${collapsed ? 'hidden' : 'block'}`}>
    {label}
  </div>
);

const UserMenu = () => {
  const { logout } = useSystemAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() =>{  setIsOpen(!isOpen); }}
        className="flex items-center gap-2 pl-2"
      >
        <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
          <Shield size={16} />
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() =>{  setIsOpen(false); }} />
          <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Developer</p>
              <p className="text-xs text-slate-500">hieubkav</p>
            </div>
            <button
              onClick={async () => { await logout(); setIsOpen(false); }}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-red-500 transition-colors"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const LanguageSwitcher = () => {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'vi', flag: '🇻🇳', label: 'Tiếng Việt' },
    { code: 'en', flag: '🇺🇸', label: 'English' },
  ];

  const currentLang = languages.find(l => l.code === locale) ?? languages[0];

  return (
    <div className="relative">
      <button
        onClick={() =>{  setIsOpen(!isOpen); }}
        className="flex items-center gap-1.5 p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
        title={locale === 'vi' ? 'Chuyển ngôn ngữ' : 'Change language'}
      >
        <Languages size={18} />
        <span className="text-xs font-medium hidden sm:inline">{currentLang.flag}</span>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() =>{  setIsOpen(false); }} />
          <div className="absolute top-full right-0 mt-1 w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 overflow-hidden">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { setLocale(lang.code); setIsOpen(false); }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                  locale === lang.code ? 'bg-slate-50 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

function SystemLayoutContent({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') {return true;}
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  const getPageName = () => {
    if (pathname === '/system') {return t.pages.dashboard;}
    if (pathname.includes('huong-dan')) {return t.pages.guides;}
    if (pathname.includes('modules')) {return t.pages.moduleManagement;}
    if (pathname.includes('home-components')) {return t.pages.homeComponents;}
    if (pathname.includes('data')) {return 'Data Manager';}
    if (pathname.includes('experiences')) {return t.pages.experiences;}
    if (pathname.includes('integrations')) {return t.pages.analyticsIntegrations;}
    if (pathname.includes('seo')) {return t.pages.seoConfiguration;}
    if (pathname.includes('ia')) {return t.pages.informationArchitecture;}
    return 'System';
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-200 font-sans selection:bg-cyan-500/30 transition-colors duration-300">
      
      {/* Sidebar */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Terminal className="text-cyan-600 dark:text-cyan-400 shrink-0" size={24} />
          {!collapsed && (
            <div className="ml-3">
              <h1 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight">SYSTEM</h1>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
          <SidebarGroup label={t.sidebar.platform} collapsed={collapsed} />
          <SidebarItem href="/system" icon={LayoutDashboard} label={t.sidebar.overview} collapsed={collapsed} />
          
          <SidebarGroup label={t.sidebar.control} collapsed={collapsed} />
          <SidebarItem href="/system/huong-dan" icon={BookOpen} label={t.sidebar.guides} collapsed={collapsed} />
          <SidebarItem href="/system/modules" icon={Blocks} label={t.sidebar.modules} collapsed={collapsed} />
          <SidebarItem href="/system/experiences" icon={LayoutTemplate} label={t.sidebar.experiences} collapsed={collapsed} />
          <SidebarItem href="/system/home-components" icon={LayoutGrid} label={t.sidebar.homeComponents} collapsed={collapsed} />
          <SidebarItem href="/system/admin-config" icon={Shield} label="SuperAdmin" collapsed={collapsed} />
          <SidebarItem href="/system/data" icon={Database} label="Data Manager" collapsed={collapsed} />
          <SidebarItem href="/system/integrations" icon={BarChart3} label={t.sidebar.analytics} collapsed={collapsed} />
          <SidebarItem href="/system/seo" icon={Globe} label={t.sidebar.seo} collapsed={collapsed} />
          <SidebarItem href="/system/ia" icon={Map} label={t.sidebar.ia} collapsed={collapsed} />
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
          <button 
            onClick={() =>{  setCollapsed(!collapsed); }}
            className="w-full flex justify-center items-center p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors hidden md:flex"
          >
            {collapsed ? <ChevronRight size={16} /> : <span className="text-xs">{t.sidebar.collapse}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        
        {/* Header */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 sm:px-4 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              onClick={() =>{  setMobileMenuOpen(!mobileMenuOpen); }}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <span className="hidden sm:inline">System</span>
              <span className="hidden sm:inline">/</span>
              <span className="text-slate-800 dark:text-slate-100 font-medium">{getPageName()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SystemGlobalSearch />

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 mx-0.5 hidden sm:block"></div>

            <LanguageSwitcher />

            <button 
              onClick={toggleDarkMode}
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              title={darkMode ? t.header.lightMode : t.header.darkMode}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <a
              href="/admin"
              target="_blank"
              rel="noopener noreferrer"
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              title="Mở trang Admin"
            >
              <ExternalLink size={18} />
            </a>
            
            <UserMenu />
          </div>
        </header>

        {/* Page Content Scrollable Area - SYS-007: Wrapped with ErrorBoundary */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-100 dark:bg-slate-950">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() =>{  setMobileMenuOpen(false); }}
        />
      )}
    </div>
  );
}

function SystemLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Login page doesn't need full layout
  if (pathname === '/system/auth/login') {
    return <>{children}</>;
  }
  
  return (
    <SystemAuthGuard>
      <SystemLayoutContent>{children}</SystemLayoutContent>
    </SystemAuthGuard>
  );
}

export default function SystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SystemAuthProvider>
        <SystemLayoutWrapper>{children}</SystemLayoutWrapper>
        <CustomToaster position="top-right" richColors />
      </SystemAuthProvider>
    </I18nProvider>
  );
}
