'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { changelogData } from './data';
import { Rocket, Wrench, Bug, Search, Calendar, History, ArrowRight } from 'lucide-react';

const FILTER_OPTIONS = [
  { id: 'all', label: 'Tất cả', icon: null, color: '' },
  { id: 'features', label: 'Tính năng mới', icon: Rocket, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
  { id: 'improvements', label: 'Cải tiến & Tối ưu', icon: Wrench, color: 'text-blue-700 bg-blue-50 border-blue-100' },
  { id: 'fixes', label: 'Sửa lỗi', icon: Bug, color: 'text-amber-700 bg-amber-50 border-amber-100' },
] as const;

export default function ChangelogClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'features' | 'improvements' | 'fixes'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [, startTransition] = useTransition();
  const ITEMS_PER_PAGE = 10;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    startTransition(() => {
      setSearchTerm(value);
      setCurrentPage(1);
    });
  };

  const handleFilterChange = (filterId: typeof activeFilter) => {
    startTransition(() => {
      setActiveFilter(filterId);
      setCurrentPage(1);
    });
  };

  // Lọc dữ liệu theo Search và Filter
  const filteredChangelog = changelogData.map(item => {
    const features = (activeFilter === 'all' || activeFilter === 'features') 
      ? item.categories.features.filter(f => f.toLowerCase().includes(searchTerm.toLowerCase())) 
      : [];
      
    const improvements = (activeFilter === 'all' || activeFilter === 'improvements')
      ? item.categories.improvements.filter(imp => imp.toLowerCase().includes(searchTerm.toLowerCase()))
      : [];
      
    const fixes = (activeFilter === 'all' || activeFilter === 'fixes')
      ? item.categories.fixes.filter(fix => fix.toLowerCase().includes(searchTerm.toLowerCase()))
      : [];

    const hasContent = features.length > 0 || improvements.length > 0 || fixes.length > 0;

    return {
      ...item,
      categories: { features, improvements, fixes },
      hasContent
    };
  }).filter(item => item.hasContent);

  const totalPages = Math.ceil(filteredChangelog.length / ITEMS_PER_PAGE);
  const paginatedChangelog = filteredChangelog.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased overflow-x-hidden pb-32">
      {/* Top Banner - Clean and Minimal */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto pt-16 pb-12 px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2.5 text-slate-400 mb-3">
                <History className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Core System Log</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Viet Admin Changelog
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-xl leading-relaxed">
                Nhật ký lưu trữ toàn bộ tiến trình cập nhật tính năng mới, cải tiến cấu trúc cốt lõi và sửa lỗi chính thức của Viet Admin.
              </p>
            </div>
            
            {/* Minimal Stat Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg shrink-0 self-start md:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600 font-mono">Core v0.1.0 Active</span>
            </div>
          </div>

          {/* Search & Filter - Sticky Ready and Flat */}
          <div className="mt-12 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm cập nhật..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 bg-white rounded-lg border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:ring-0 transition-all text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 justify-start">
              {FILTER_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = activeFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleFilterChange(opt.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-transparent'
                        : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Timeline Section */}
      <main className="max-w-5xl mx-auto px-6 mt-16 relative">
        {filteredChangelog.length > 0 ? (
          <>
            {/* Linear Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-[1px] bg-slate-200 pointer-events-none" />

            <div className="space-y-16">
              <AnimatePresence mode="popLayout">
                {paginatedChangelog.map((item) => (
                  <motion.article
                    key={item.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    layout
                    className="relative pl-12 flex flex-col md:flex-row gap-6 md:gap-12"
                  >
                    {/* Timeline Node Ring */}
                    <div className="absolute left-8 top-1.5 -translate-x-1/2 flex items-center justify-center z-10">
                      <div className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                      </div>
                    </div>

                    {/* Date Block */}
                    <div className="md:w-48 shrink-0 flex flex-col items-start gap-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <time className="text-sm font-bold tracking-tight text-slate-900 font-mono">
                          {item.date}
                        </time>
                      </div>
                      <span className="px-2 py-0.5 text-3xs font-semibold tracking-wider rounded-md bg-slate-100 text-slate-500 uppercase border border-slate-200 font-mono">
                        {item.phase}
                      </span>
                    </div>

                    {/* Flat Content Card */}
                    <div className="flex-1">
                      <div className="bg-white border border-slate-200/80 rounded-xl p-6 md:p-8 shadow-sm transition-all duration-200 hover:border-slate-300">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6">
                          {item.title}
                        </h2>

                        {/* Changelog Items Categories */}
                        <div className="space-y-6">
                          {/* Features */}
                          {item.categories.features.length > 0 && (
                            <div className="space-y-2">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-100">
                                <Rocket className="w-2.5 h-2.5" />
                                Tính năng mới
                              </div>
                              <ul className="space-y-2 pl-1">
                                {item.categories.features.map((feat, fidx) => (
                                  <li key={fidx} className="flex items-start text-sm text-slate-600 leading-relaxed gap-2.5">
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Improvements */}
                          {item.categories.improvements.length > 0 && (
                            <div className="space-y-2">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-100">
                                <Wrench className="w-2.5 h-2.5" />
                                Cải tiến & Tối ưu
                              </div>
                              <ul className="space-y-2 pl-1">
                                {item.categories.improvements.map((imp, iidx) => (
                                  <li key={iidx} className="flex items-start text-sm text-slate-600 leading-relaxed gap-2.5">
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span>{imp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Fixes */}
                          {item.categories.fixes.length > 0 && (
                            <div className="space-y-2">
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-100">
                                <Bug className="w-2.5 h-2.5" />
                                Sửa lỗi
                              </div>
                              <ul className="space-y-2 pl-1">
                                {item.categories.fixes.map((fix, fidx) => (
                                  <li key={fidx} className="flex items-start text-sm text-slate-600 leading-relaxed gap-2.5">
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span>{fix}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>

              {/* Pagination Flat Controls */}
              {totalPages > 1 && (
                <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-8">
                  <span className="text-xs text-slate-500 font-medium font-mono">
                    Hiển thị {Math.min(filteredChangelog.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}–{Math.min(filteredChangelog.length, currentPage * ITEMS_PER_PAGE)} của {filteredChangelog.length} ngày hoạt động
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      Trước
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, idx) => {
                      const pageNum = idx + 1;
                      const isNearCurrent = Math.abs(currentPage - pageNum) <= 1;
                      const isEdge = pageNum === 1 || pageNum === totalPages;
                      
                      if (!isNearCurrent && !isEdge) {
                        if (pageNum === 2 || pageNum === totalPages - 1) {
                          return <span key={pageNum} className="px-2 text-slate-400 text-xs">...</span>;
                        }
                        return null;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-slate-900 text-white border-transparent shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white text-slate-600 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Không tìm thấy kết quả</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Không tìm thấy cập nhật nào khớp với "{searchTerm}". Hãy thử bằng từ khóa khác.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
