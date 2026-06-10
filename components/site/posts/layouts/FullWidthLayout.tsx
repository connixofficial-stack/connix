'use client';

import React from 'react';
import Link from 'next/link';
import { PublicImage as Image } from '@/components/shared/PublicImage';
import { Eye, FileText } from 'lucide-react';
import type { Id } from '@/convex/_generated/dataModel';
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

interface FullWidthLayoutProps {
  posts: Post[];
  brandColor: string;
  tokens: PostsListColors;
  categoryMap: Map<string, string>;
  enabledFields: Set<string>;
  getDetailHref: (post: Post) => string;
  gridColumns?: number;
}

export function FullWidthLayout({ posts, brandColor: _brandColor, tokens, categoryMap, enabledFields, getDetailHref, gridColumns }: FullWidthLayoutProps) {
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
  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto mb-3" style={{ color: tokens.neutralTextLight }} />
        <h2 className="text-lg font-semibold mb-2" style={{ color: tokens.metaText }}>Không tìm thấy bài viết</h2>
        <p className="text-sm" style={{ color: tokens.neutralTextLight }}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  const gridCols = gridColumns ?? 3;
  const gridClass = gridCols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {posts.map((post) => {
        const showImage = Boolean(post.thumbnail) && !brokenThumbnails.has(String(post._id));

        return (
          <Link key={post._id} href={getDetailHref(post)} className="group">
            <article
              className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border h-full flex flex-col"
              style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
            >
              <div className="relative aspect-video overflow-hidden" style={{ backgroundColor: tokens.cardBorder }}>
                {showImage ? (
                  <Image
                    src={post.thumbnail as string}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
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
                    <FileText size={32} style={{ color: tokens.neutralTextLight }} />
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 mb-1.5">
                  {categoryMap.get(post.categoryId) && (
                    <span
                      className="text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: tokens.categoryBadgeBg,
                        color: tokens.categoryBadgeText,
                        borderColor: tokens.categoryBadgeBorder,
                      }}
                    >
                      {categoryMap.get(post.categoryId)}
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-semibold line-clamp-2 flex-1" style={{ color: tokens.bodyText }}>
                  {post.title}
                </h2>
                {showExcerpt && post.excerpt && (
                  <p className="text-xs line-clamp-2 mt-1.5" style={{ color: tokens.metaText }}>{post.excerpt}</p>
                )}
                <div
                  className="flex items-center justify-between text-xs mt-2.5 pt-2.5 border-t"
                  style={{ color: tokens.neutralTextLight, borderColor: tokens.cardBorder }}
                >
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('vi-VN') : ''}</span>
                  <span className="flex items-center gap-1">
                    <Eye size={11} />
                    {post.views.toLocaleString()}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
