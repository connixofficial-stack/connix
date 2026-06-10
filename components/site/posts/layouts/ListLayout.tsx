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

interface ListLayoutProps {
  posts: Post[];
  brandColor: string;
  tokens: PostsListColors;
  categoryMap: Map<string, string>;
  enabledFields: Set<string>;
  getDetailHref: (post: Post) => string;
}

export function ListLayout({ posts, brandColor: _brandColor, tokens, categoryMap, enabledFields, getDetailHref }: ListLayoutProps) {
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

  return (
    <div className="space-y-3.5 w-full">
      {posts.map((post) => {
        const showImage = Boolean(post.thumbnail) && !brokenThumbnails.has(String(post._id));

        return (
          <Link key={post._id} href={getDetailHref(post)} className="group block">
            <article
              className="rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200 border"
              style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="sm:w-40 md:w-48 flex-shrink-0">
                  <div className="aspect-video sm:aspect-[4/3] sm:h-full overflow-hidden relative" style={{ backgroundColor: tokens.cardBorder }}>
                    {showImage ? (
                      <Image
                        src={post.thumbnail as string}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 192px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        mode="thumb"
                        onLoadingComplete={(img) => {
                          if (img.naturalWidth === 0) {
                            markThumbnailBroken(post._id);
                          }
                        }}
                        onError={() => { markThumbnailBroken(post._id); }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText size={28} style={{ color: tokens.neutralTextLight }} />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-1.5">
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
                  <h2 className="text-sm font-semibold line-clamp-2 mb-1.5 leading-snug" style={{ color: tokens.bodyText }}>
                    {post.title}
                  </h2>
                  {showExcerpt && post.excerpt && (
                    <p className="text-xs line-clamp-2 mb-2 leading-relaxed" style={{ color: tokens.metaText }}>{post.excerpt}</p>
                  )}
                  <div className="flex items-center gap-1 text-xs mt-1" style={{ color: tokens.neutralTextLight }}>
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
  );
}
