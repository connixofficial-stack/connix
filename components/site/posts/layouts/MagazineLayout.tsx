'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { Bookmark, ChevronDown, Eye, FileText, Search } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
import type { SortOption } from '../PostsFilter';
import type { PostsListColors } from '../colors';

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

interface MagazineLayoutProps {
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
  featuredPosts: Post[];
  enabledFields: Set<string>;
  showSearch?: boolean;
  showCategories?: boolean;
  getDetailHref: (post: Post) => string;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Cũ nhất', value: 'oldest' },
  { label: 'Xem nhiều', value: 'popular' },
  { label: 'Theo tên A-Z', value: 'title' },
  { label: 'Theo tên Z-A', value: 'title_desc' },
];

export function MagazineLayout({
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
  featuredPosts,
  enabledFields,
  showSearch = true,
  showCategories = true,
  getDetailHref,
}: MagazineLayoutProps) {
  const showExcerpt = enabledFields.has('excerpt');
  const [brokenThumbnails, setBrokenThumbnails] = React.useState<Set<string>>(new Set());
  const selectedCategoryLabel = selectedCategory ? categoryMap.get(selectedCategory) : undefined;

  const markThumbnailBroken = React.useCallback((id: Id<"posts">) => {
    setBrokenThumbnails((prev) => {
      const key = String(id);
      if (prev.has(key)) {return prev;}
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);
  // Separate featured and regular posts
  const mainFeatured = featuredPosts[0];
  const secondaryFeatured = featuredPosts.slice(1, 3);

  return (
    <div className="space-y-5">
      {/* Hero Section - Featured Stories Widget */}
      {!selectedCategory && !searchQuery && mainFeatured && (
        <section className="grid lg:grid-cols-3 gap-4">
          {/* Main Featured - Large Card */}
          <Link href={getDetailHref(mainFeatured)} className="lg:col-span-2 group">
            <article
              className="relative h-full min-h-[280px] lg:min-h-[360px] rounded-xl overflow-hidden"
              style={{ backgroundColor: tokens.overlaySurface }}
            >
              {mainFeatured.thumbnail && !brokenThumbnails.has(String(mainFeatured._id)) ? (
                <Image
                  src={mainFeatured.thumbnail}
                  alt={mainFeatured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  mode="thumb"
                  onLoadingComplete={(img) => {
                    if (img.naturalWidth === 0) {
                      markThumbnailBroken(mainFeatured._id);
                    }
                  }}
                  onError={() =>{  markThumbnailBroken(mainFeatured._id); }}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${tokens.overlaySurfaceMuted}, ${tokens.overlaySurface})` }}
                >
                  <FileText size={56} style={{ color: tokens.overlayTextSoft }} />
                </div>
              )}
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to top, ${tokens.overlaySurface}, ${tokens.overlaySurfaceMuted})` }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: tokens.featuredBadgeBg, color: tokens.featuredBadgeText }}>
                    {categoryMap.get(mainFeatured.categoryId) ?? 'Nổi bật'}
                  </span>
                </div>
                <h2 className="text-xl lg:text-2xl font-bold mb-2 leading-tight line-clamp-2" style={{ color: tokens.overlayTextStrong }}>
                  {mainFeatured.title}
                </h2>
                {showExcerpt && mainFeatured.excerpt && (
                  <p className="text-sm line-clamp-2 mb-2" style={{ color: tokens.overlayTextMuted }}>{mainFeatured.excerpt}</p>
                )}
                <div className="flex items-center gap-3 text-xs" style={{ color: tokens.overlayTextSoft }}>
                  <span>{mainFeatured.publishedAt ? new Date(mainFeatured.publishedAt).toLocaleDateString('vi-VN') : ''}</span>
                  <span className="flex items-center gap-1"><Eye size={12} />{mainFeatured.views.toLocaleString()}</span>
                </div>
              </div>
            </article>
          </Link>

          {/* Secondary Featured - Stacked Cards */}
          <div className="flex flex-col gap-4">
            {secondaryFeatured.map((post) => (
              <Link key={post._id} href={getDetailHref(post)} className="group flex-1">
                <article
                  className="relative h-full min-h-[140px] lg:min-h-0 rounded-lg overflow-hidden"
                  style={{ backgroundColor: tokens.overlaySurface }}
                >
                  {post.thumbnail && !brokenThumbnails.has(String(post._id)) ? (
                    <Image
                      src={post.thumbnail}
                      alt={post.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
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
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${tokens.overlaySurfaceMuted}, ${tokens.overlaySurface})` }}
                    >
                      <FileText size={28} style={{ color: tokens.overlayTextSoft }} />
                    </div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(to top, ${tokens.overlaySurface}, ${tokens.overlaySurfaceMuted})` }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {categoryMap.get(post.categoryId) && (
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-1" style={{ backgroundColor: tokens.featuredBadgeBg, color: tokens.featuredBadgeText }}>
                        {categoryMap.get(post.categoryId)}
                      </span>
                    )}
                    <h3 className="text-base font-semibold line-clamp-2" style={{ color: tokens.overlayTextStrong }}>{post.title}</h3>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Filter Bar - Search, Category, Sort */}
      <section className="rounded-lg border p-3 shadow-sm" style={{ backgroundColor: tokens.filterBarBackground, borderColor: tokens.cardBorder }}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search Input */}
          {showSearch && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: tokens.inputIcon }} />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) =>{  onSearchChange(e.target.value); }}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm placeholder:text-[var(--placeholder-color)]"
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

          {/* Category Dropdown */}
          {showCategories && (
            <div className="relative">
              <select
                value={selectedCategory ?? ''}
                onChange={(e) =>{  onCategoryChange(e.target.value ? e.target.value as Id<"postCategories"> : null); }}
                className="appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer min-w-[140px]"
                style={{
                  '--tw-ring-color': tokens.inputRing,
                  borderColor: tokens.inputBorder,
                  backgroundColor: tokens.inputBackground,
                  color: tokens.inputText,
                } as React.CSSProperties}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: tokens.inputIcon }} />
            </div>
          )}

          {/* Spacer */}
          <div className="hidden sm:block flex-1" />

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) =>{  onSortChange(e.target.value as SortOption); }}
              className="appearance-none pl-3 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 cursor-pointer"
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
      </section>

      {/* Main Posts Grid - Clean Card Design */}
      {posts.length === 0 ? (
        <div className="text-center py-10 rounded-lg border" style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}>
          <Bookmark size={40} className="mx-auto mb-2" style={{ color: tokens.neutralTextLight }} />
          <h2 className="text-base font-semibold mb-1" style={{ color: tokens.bodyText }}>Không tìm thấy bài viết</h2>
          <p className="text-sm" style={{ color: tokens.metaText }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-3">
            {selectedCategoryLabel && (
              <h2 className="text-base font-bold" style={{ color: tokens.sectionHeadingColor }}>
                {selectedCategoryLabel}
              </h2>
            )}
            <span className="text-sm" style={{ color: tokens.metaText }}>{posts.length} bài viết</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {posts.map((post) => {
              const categoryLabel = categoryMap.get(post.categoryId);
              return (
                <Link key={post._id} href={getDetailHref(post)} className="group">
                <article
                  className="h-full flex flex-col rounded-lg overflow-hidden border hover:shadow-md transition-shadow duration-200"
                  style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
                >
                  <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: tokens.cardBorder }}>
                    {post.thumbnail && !brokenThumbnails.has(String(post._id)) ? (
                      <Image
                        src={post.thumbnail}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
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
                  <div className="flex-1 flex flex-col p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {categoryLabel && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: tokens.categoryBadgeBg,
                            color: tokens.categoryBadgeText,
                            borderColor: tokens.categoryBadgeBorder,
                          }}
                        >
                          {categoryLabel}
                        </span>
                      )}
                      {post.publishedAt && (
                        <>
                          <span style={{ color: tokens.neutralTextLight }}>•</span>
                          <span className="text-xs" style={{ color: tokens.neutralTextLight }}>{new Date(post.publishedAt).toLocaleDateString('vi-VN')}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold line-clamp-2 mb-1" style={{ color: tokens.bodyText }}>
                      {post.title}
                    </h3>
                    {showExcerpt && post.excerpt && (
                      <p className="text-xs line-clamp-2 mb-2 flex-1" style={{ color: tokens.metaText }}>{post.excerpt}</p>
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
        </section>
      )}
    </div>
  );
}
