'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { ChevronDown, Eye, FileText, Folder, Search } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import type { SortOption } from '../PostsFilter';
import { getPostsListColors, type PostsListColors } from '../colors';

interface Post {
  _id: Id<"posts">;
  title: string;
  slug: string;
  excerpt?: string;
  thumbnail?: string;
  categoryId: Id<"postCategories">;
  views: number;
  publishedAt?: number;
}

interface Category {
  _id: Id<"postCategories">;
  name: string;
  slug: string;
}

interface SidebarLayoutProps {
  posts: Post[];
  brandColor: string;
  tokens: PostsListColors;
  categoryMap: Map<string, string>;
  categories: Category[];
  selectedCategory: Id<"postCategories"> | null;
  onCategoryChange: (categoryId: Id<"postCategories"> | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  enabledFields: Set<string>;
  showSearch?: boolean;
  showCategories?: boolean;
  getDetailHref: (post: Post) => string;
  displayMode?: 'grid' | 'list';
  gridColumns?: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Xem nhiều', value: 'popular' },
  { label: 'Theo tên A-Z', value: 'title' },
  { label: 'Theo tên Z-A', value: 'title_desc' },
];

export function SidebarLayout({
  posts,
  brandColor: _brandColor,
  tokens,
  categoryMap,
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  enabledFields,
  showSearch = true,
  showCategories = true,
  getDetailHref,
  displayMode = 'list',
  gridColumns,
}: SidebarLayoutProps) {
  const showExcerpt = enabledFields.has('excerpt');
  const [brokenThumbnails, setBrokenThumbnails] = React.useState<Set<string>>(new Set());

  const markThumbnailBroken = React.useCallback((id: Id<"posts">) => {
    setBrokenThumbnails((prev) => {
      const key = String(id);
      if (prev.has(key)) {return prev;}
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const gridCols = gridColumns ?? 3;
  const gridClass = gridCols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Sidebar */}
      <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
        <div className="lg:sticky lg:top-24 space-y-3">
          {/* Search Widget */}
          {showSearch && (
            <div className="rounded-lg border p-3" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: tokens.bodyText }}>
                <Search size={14} style={{ color: tokens.sidebarWidgetIcon }} />
                Tìm kiếm
              </h3>
              <input
                type="text"
                placeholder="Nhập từ khóa..."
                value={searchQuery}
                onChange={(e) =>{  onSearchChange(e.target.value); }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 placeholder:text-[var(--placeholder-color)]"
                style={{
                  '--tw-ring-color': tokens.inputRing,
                  '--placeholder-color': tokens.inputPlaceholder,
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                } as React.CSSProperties}
              />
            </div>
          )}

          {/* Categories Widget */}
          {showCategories && (
            <div className="rounded-lg border p-3" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2" style={{ color: tokens.bodyText }}>
                <Folder size={14} style={{ color: tokens.sidebarWidgetIcon }} />
                Danh mục
              </h3>
              <ul className="space-y-0.5">
                <li>
                  <button
                    onClick={() =>{  onCategoryChange(null); }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-sm ${
                      !selectedCategory ? 'font-medium' : ''
                    }`}
                    style={!selectedCategory ? {
                      backgroundColor: tokens.sidebarActiveItemBg,
                      color: tokens.sidebarActiveItemText,
                      borderColor: tokens.sidebarActiveItemBorder,
                    } : {
                      color: tokens.metaText,
                    }}
                  >
                    Tất cả
                  </button>
                </li>
                {categories.map((category) => (
                  <li key={category._id}>
                    <button
                      onClick={() =>{  onCategoryChange(category._id); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-sm ${
                        selectedCategory === category._id ? 'font-medium' : ''
                      }`}
                      style={selectedCategory === category._id ? {
                        backgroundColor: tokens.sidebarActiveItemBg,
                        color: tokens.sidebarActiveItemText,
                        borderColor: tokens.sidebarActiveItemBorder,
                      } : {
                        color: tokens.metaText,
                      }}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sort Widget */}
          <div className="rounded-lg border p-3" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
            <h3 className="font-semibold text-sm mb-2" style={{ color: tokens.bodyText }}>Sắp xếp</h3>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) =>{  onSortChange(e.target.value as SortOption); }}
                className="w-full appearance-none px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
                style={{
                  '--tw-ring-color': tokens.inputRing,
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                } as React.CSSProperties}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: tokens.inputIcon }} />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 order-1 lg:order-2">
        {posts.length === 0 ? (
        <div className="text-center py-10 rounded-lg border" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
            <FileText size={40} className="mx-auto mb-2" style={{ color: tokens.neutralTextLight }} />
            <h2 className="text-base font-semibold mb-1" style={{ color: tokens.metaText }}>Không tìm thấy bài viết</h2>
            <p className="text-sm" style={{ color: tokens.neutralTextLight }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : displayMode === 'grid' ? (
          <div className={`grid ${gridClass} gap-3`}>
            {posts.map((post) => {
              const showImage = Boolean(post.thumbnail) && !brokenThumbnails.has(String(post._id));
              return (
                <Link key={post._id} href={getDetailHref(post)} className="group block">
                  <article
                    className="rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 border h-full flex flex-col"
                    style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
                  >
                    <div className="aspect-video overflow-hidden relative" style={{ backgroundColor: tokens.cardBorder }}>
                      {showImage ? (
                        <Image
                          src={post.thumbnail as string}
                          alt={post.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          mode="thumb"
                          onLoadingComplete={(img) => {
                            if (img.naturalWidth === 0) { markThumbnailBroken(post._id); }
                          }}
                          onError={() => { markThumbnailBroken(post._id); }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText size={28} style={{ color: tokens.neutralTextLight }} />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        {categoryMap.get(post.categoryId) && (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: tokens.categoryBadgeBg,
                              color: tokens.categoryBadgeText,
                              borderColor: tokens.categoryBadgeBorder,
                            }}
                          >
                            {categoryMap.get(post.categoryId)}
                          </span>
                        )}
                        {post.publishedAt && (
                          <span className="text-xs" style={{ color: tokens.neutralTextLight }}>
                            {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <h2 className="text-sm font-semibold line-clamp-2 mb-1 flex-1" style={{ color: tokens.bodyText }}>
                        {post.title}
                      </h2>
                      {showExcerpt && post.excerpt && (
                        <p className="text-xs line-clamp-2 mb-1.5" style={{ color: tokens.metaText }}>{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs" style={{ color: tokens.neutralTextLight }}>
                        <Eye size={12} />
                        <span>{post.views.toLocaleString()}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {posts.map((post) => {
              const showImage = Boolean(post.thumbnail) && !brokenThumbnails.has(String(post._id));

              return (
                <Link key={post._id} href={getDetailHref(post)} className="group block">
                    <article
                    className="rounded-lg overflow-hidden hover:shadow-md transition-all duration-200 border"
                      style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
                    >
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-40 md:w-48 flex-shrink-0">
                          <div className="aspect-video sm:aspect-[4/3] sm:h-full overflow-hidden relative" style={{ backgroundColor: tokens.cardBorder }}>
                          {showImage ? (
                            <Image
                              src={post.thumbnail as string}
                              alt={post.title}
                              fill
                              sizes="96px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              mode="thumb"
                              onLoadingComplete={(img) => {
                                if (img.naturalWidth === 0) {
                                  markThumbnailBroken(post._id);
                                }
                              }}
                              onError={() =>{  markThumbnailBroken(post._id); }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <FileText size={28} style={{ color: tokens.neutralTextLight }} />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1">
                          {categoryMap.get(post.categoryId) && (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: tokens.categoryBadgeBg,
                                color: tokens.categoryBadgeText,
                                borderColor: tokens.categoryBadgeBorder,
                              }}
                            >
                              {categoryMap.get(post.categoryId)}
                            </span>
                          )}
                          {post.publishedAt && (
                              <span className="text-xs" style={{ color: tokens.neutralTextLight }}>
                              {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
                            </span>
                          )}
                        </div>
                          <h2 className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: tokens.bodyText }}>
                          {post.title}
                        </h2>
                        {showExcerpt && post.excerpt && (
                            <p className="text-xs line-clamp-2 mb-1.5" style={{ color: tokens.metaText }}>{post.excerpt}</p>
                        )}
                          <div className="flex items-center gap-1 text-xs" style={{ color: tokens.neutralTextLight }}>
                          <Eye size={12} />
                          <span>{post.views.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export function SidebarLayoutSkeleton({ tokens }: { tokens?: PostsListColors } = {}) {
  const palette = tokens ?? getPostsListColors('#3b82f6', undefined, 'single');

  return (
    <div className="flex flex-col lg:flex-row gap-5 animate-pulse">
      {/* Sidebar Skeleton */}
      <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
        <div className="lg:sticky lg:top-24 space-y-3">
          {/* Search Widget Skeleton */}
          <div className="rounded-lg border p-3" style={{ backgroundColor: palette.cardBackground, borderColor: palette.cardBorder }}>
            <div className="h-4 w-20 rounded mb-2" style={{ backgroundColor: palette.cardBorder }} />
            <div className="h-9 rounded-lg" style={{ backgroundColor: palette.cardBorder }} />
          </div>

          {/* Categories Widget Skeleton */}
          <div className="rounded-lg border p-3" style={{ backgroundColor: palette.cardBackground, borderColor: palette.cardBorder }}>
            <div className="h-4 w-16 rounded mb-2" style={{ backgroundColor: palette.cardBorder }} />
            <div className="space-y-0.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 rounded" style={{ backgroundColor: palette.cardBorder }} />
              ))}
            </div>
          </div>

          {/* Sort Widget Skeleton */}
          <div className="rounded-lg border p-3" style={{ backgroundColor: palette.cardBackground, borderColor: palette.cardBorder }}>
            <div className="h-4 w-16 rounded mb-2" style={{ backgroundColor: palette.cardBorder }} />
            <div className="h-9 rounded-lg" style={{ backgroundColor: palette.cardBorder }} />
          </div>
        </div>
      </aside>

      {/* Main Content Skeleton */}
      <main className="flex-1 order-1 lg:order-2">
        <div className="space-y-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-lg overflow-hidden border" style={{ backgroundColor: palette.cardBackground, borderColor: palette.cardBorder }}>
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-40 md:w-48 flex-shrink-0">
                  <div className="aspect-video sm:aspect-[4/3]" style={{ backgroundColor: palette.cardBorder }} />
                </div>
                <div className="p-3 flex-1 space-y-2">
                  <div className="h-4 w-16 rounded" style={{ backgroundColor: palette.cardBorder }} />
                  <div className="h-4 w-full rounded" style={{ backgroundColor: palette.cardBorder }} />
                  <div className="h-4 w-3/4 rounded" style={{ backgroundColor: palette.cardBorder }} />
                  <div className="h-3 w-12 rounded" style={{ backgroundColor: palette.cardBorder }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
