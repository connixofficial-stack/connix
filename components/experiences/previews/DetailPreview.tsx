import React, { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Check, ChevronRight, Clock, Copy, Eye, FileText, Home, Image as ImageIcon, Link as LinkIcon, MessageSquare, Phone, Reply, Share2, Star, ThumbsUp, User } from 'lucide-react';
import Image from 'next/image';
import { getServiceDetailColors, type ServiceDetailColors } from '@/components/site/services/detail/_lib/colors';

type DetailLayoutStyle = 'classic' | 'modern' | 'minimal';
type DeviceType = 'desktop' | 'tablet' | 'mobile';

type PostDetailPreviewProps = {
  layoutStyle: DetailLayoutStyle;
  showAuthor?: boolean;
  showTags?: boolean;
  showRelated: boolean;
  showShare: boolean;
  showThumbnail?: boolean;
  showComments?: boolean;
  showCommentLikes?: boolean;
  showCommentReplies?: boolean;
  quickContactEnabled?: boolean;
  quickContactTitle?: string;
  quickContactDescription?: string;
  quickContactShowPrice?: boolean;
  quickContactButtonText?: string;
  quickContactButtonLink?: string;
  device?: DeviceType;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
};

type ServiceDetailPreviewProps = {
  layoutStyle: DetailLayoutStyle;
  showRelated: boolean;
  showShare: boolean;
  priceFieldEnabled?: boolean;
  quickContactEnabled?: boolean;
  quickContactTitle?: string;
  quickContactDescription?: string;
  quickContactShowPrice?: boolean;
  quickContactButtonText?: string;
  quickContactButtonLink?: string;
  modernContactEnabled?: boolean;
  modernContactShowPrice?: boolean;
  modernHeroCtaText?: string;
  modernHeroCtaLink?: string;
  modernCtaSectionTitle?: string;
  modernCtaSectionDescription?: string;
  modernCtaButtonText?: string;
  modernCtaButtonLink?: string;
  minimalCtaEnabled?: boolean;
  minimalShowPrice?: boolean;
  minimalCtaText?: string;
  minimalCtaButtonText?: string;
  minimalCtaButtonLink?: string;
  device?: DeviceType;
  brandColor?: string;
  secondaryColor?: string;
  colorMode?: 'single' | 'dual';
};

const isValidHexColor = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value.trim());

const resolveSecondary = (primary: string, secondary: string | undefined, mode: 'single' | 'dual' = 'single') => {
  if (mode === 'single') {
    return primary;
  }
  if (secondary && isValidHexColor(secondary)) {
    return secondary;
  }
  return primary;
};

const MOCK_POST = {
  title: 'Hướng dẫn sử dụng Next.js App Router trong dự án thực tế',
  categoryName: 'Technology',
  authorName: 'Nguyễn Minh Đức',
  publishedAt: new Date('2026-01-15').getTime(),
  views: 1234,
  thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
  excerpt: 'Next.js 14 ra mắt với nhiều cải tiến về performance và developer experience. Bài viết này sẽ hướng dẫn chi tiết cách sử dụng App Router trong dự án thực tế.',
  content: '<p>Next.js App Router là một trong những tính năng quan trọng nhất được giới thiệu trong phiên bản 13. Nó mang đến cách tổ chức routing hoàn toàn mới, linh hoạt và mạnh mẽ hơn.</p><p>Server Components cho phép rendering phía server một cách hiệu quả, giảm bundle size và cải thiện performance đáng kể.</p>',
};

const MOCK_TAGS = ['Next.js', 'App Router', 'Performance'];

const MOCK_RELATED = [
  { _id: '1', slug: 'post-1', title: 'React Server Components: Tương lai của React', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200', publishedAt: new Date('2026-01-10').getTime() },
  { _id: '2', slug: 'post-2', title: 'TypeScript Best Practices cho Next.js', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200', publishedAt: new Date('2026-01-08').getTime() },
  { _id: '3', slug: 'post-3', title: 'Tối ưu performance với Image Optimization', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200', publishedAt: new Date('2026-01-05').getTime() },
];

type MockComment = {
  _id: string;
  authorName: string;
  avatarUrl?: string;
  content: string;
  createdAt: number;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  replies?: MockComment[];
};

const MOCK_COMMENTS: MockComment[] = [
  { 
    _id: 'c1', 
    authorName: 'Nguyễn Văn A', 
    content: 'Bài viết rất hay và hữu ích! Cảm ơn admin đã chia sẻ thông tin chi tiết.', 
    createdAt: new Date('2026-01-16').getTime(),
    timestamp: '2 giờ trước',
    likes: 12,
    isLiked: true,
  },
  { 
    _id: 'c2', 
    authorName: 'Trần Thị B', 
    content: 'Mình đã áp dụng và thấy hiệu quả ngay. Tuyệt vời! Hóng thêm bài viết mới.', 
    createdAt: new Date('2026-01-17').getTime(),
    timestamp: '5 giờ trước',
    likes: 5,
    replies: [
      {
        _id: 'c2-r1',
        authorName: 'Support Team',
        content: 'Cảm ơn bạn đã ủng hộ! Chúng tôi sẽ tiếp tục chia sẻ thêm nhiều nội dung hữu ích.',
        createdAt: new Date('2026-01-17').getTime(),
        timestamp: '1 giờ trước',
        likes: 2,
      }
    ]
  },
  {
    _id: 'c3',
    authorName: 'Hoàng Minh',
    content: 'Có thể chia sẻ thêm về phần nâng cao không ạ?',
    createdAt: new Date('2026-01-18').getTime(),
    timestamp: '1 ngày trước',
    likes: 0,
  }
];

const MOCK_SERVICE = {
  title: 'Tư vấn chiến lược kinh doanh',
  categoryName: 'Tư vấn',
  publishedAt: new Date('2026-01-18').getTime(),
  views: 1860,
  thumbnail: 'https://images.unsplash.com/photo-1507207611509-ec012433ff52?w=1200',
  excerpt: 'Xây dựng chiến lược tăng trưởng bền vững, tối ưu mô hình vận hành và nâng cao lợi thế cạnh tranh.',
  content: '<p>Chúng tôi đồng hành cùng doanh nghiệp từ nghiên cứu thị trường, định vị thương hiệu đến xây dựng kế hoạch tăng trưởng dài hạn.</p><p>Quy trình tư vấn tập trung vào dữ liệu, giúp tối ưu hiệu suất vận hành và cải thiện lợi nhuận.</p>',
  price: 12000000,
  duration: '6 tuần',
  featured: true,
};

const MOCK_RELATED_SERVICES = [
  { _id: '1', slug: 'service-1', title: 'Tái cấu trúc mô hình vận hành', thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400', price: 18000000 },
  { _id: '2', slug: 'service-2', title: 'Tư vấn chuyển đổi số', thumbnail: undefined, price: 25000000 },
  { _id: '3', slug: 'service-3', title: 'Thiết kế chiến lược marketing', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400', price: 14000000 },
];

const formatPrice = (price?: number): string => {
  if (!price) {return 'Liên hệ';}
  return new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
};

const formatDate = (timestamp?: number): string => {
  if (!timestamp) {return '';}
  return new Date(timestamp).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

function ServiceThumbFallback({ tokens }: { tokens: ServiceDetailColors }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: tokens.fallbackThumbBg, color: tokens.fallbackThumbIcon }}
    >
      <ImageIcon size={24} />
    </div>
  );
}

function RelatedServiceThumb({ title, thumbnail, tokens }: { title: string; thumbnail?: string; tokens: ServiceDetailColors }) {
  if (!thumbnail) {
    return <ServiceThumbFallback tokens={tokens} />;
  }
  return (
    <Image
      src={thumbnail}
      alt={title}
      fill
      sizes="(max-width: 768px) 100vw, 33vw"
      className="object-cover"
    />
  );
}

function QuickContactButtonsPreview({ tokens, label }: { tokens: ServiceDetailColors; label: string }) {
  return (
    <div className="w-full">
      <button
        type="button"
        className="w-full min-h-11 px-6 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
        style={{ backgroundColor: tokens.ctaPrimaryBg, color: tokens.ctaPrimaryText }}
      >
        <Phone size={18} />
        {label}
      </button>
    </div>
  );
}

export function CommentsPreview({
  showComments,
  showLikes,
  showReplies,
  brandColor = '#3b82f6',
}: {
  showComments?: boolean;
  showLikes?: boolean;
  showReplies?: boolean;
  brandColor?: string;
}) {
  if (!showComments) {return null;}

  const visibleComments = MOCK_COMMENTS.slice(0, 2);

  return (
    <section className="mt-10 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" style={{ color: brandColor }} />
          <h3 className="text-base font-semibold">
            Bình luận <span className="text-muted-foreground text-sm font-normal">({MOCK_COMMENTS.length})</span>
          </h3>
        </div>
        <button 
          type="button" 
          className="text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
          style={{ backgroundColor: `${brandColor}15`, color: brandColor }}
        >
          Viết bình luận
        </button>
      </div>

      {/* Comments List - Compact */}
      <div className="space-y-3">
        {visibleComments.map((comment) => (
          <CommentItem key={comment._id} comment={comment} showLikes={showLikes} showReplies={showReplies} brandColor={brandColor} isCompact />
        ))}
      </div>

      {/* Show more */}
      {MOCK_COMMENTS.length > 2 && (
        <button 
          type="button" 
          className="w-full text-center text-sm font-medium py-2 rounded-lg border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          Xem thêm {MOCK_COMMENTS.length - 2} bình luận
        </button>
      )}
    </section>
  );
}

function CommentItem({ comment, isReply = false, showLikes, showReplies, brandColor, isCompact = false }: { comment: MockComment; isReply?: boolean; showLikes?: boolean; showReplies?: boolean; brandColor: string; isCompact?: boolean }) {
  const initials = comment.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];
  const avatarColor = avatarColors[comment._id.charCodeAt(1) % avatarColors.length];
  
  return (
    <div className={`flex gap-3 ${isReply ? 'mt-3 ml-6 pl-3 border-l-2' : ''} ${isCompact ? 'py-2' : 'py-3'}`} style={isReply ? { borderColor: `${brandColor}30` } : undefined}>
      <div 
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm"
        style={{ backgroundColor: isReply ? brandColor : avatarColor }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">• {comment.timestamp}</span>
        </div>

        <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
          {comment.content}
        </p>

        {(showLikes || showReplies) && (
          <div className="flex items-center gap-3 mt-1.5">
            {showLikes && (
              <button 
                type="button" 
                className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${comment.isLiked ? '' : 'text-muted-foreground hover:text-foreground'}`}
                style={comment.isLiked ? { color: brandColor } : undefined}
              >
                <ThumbsUp className={`h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                {comment.likes > 0 ? comment.likes : 'Thích'}
              </button>
            )}
            {showReplies && (
              <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Reply className="h-3 w-3" />
                Trả lời
              </button>
            )}
          </div>
        )}

        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            {comment.replies.map(reply => (
              <CommentItem key={reply._id} comment={reply} isReply showLikes={showLikes} showReplies={showReplies} brandColor={brandColor} isCompact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Classic Style Preview - Extracted from ClassicStyle
function ClassicStylePreview({
  showRelated,
  showShare,
  showThumbnail = true,
  showAuthor = true,
  showTags = true,
  showComments = true,
  showCommentLikes = true,
  showCommentReplies = true,
  brandColor = '#3b82f6',
  secondaryColor,
}: Omit<PostDetailPreviewProps, 'layoutStyle' | 'device' | 'quickContactEnabled' | 'quickContactTitle' | 'quickContactDescription' | 'quickContactShowPrice' | 'quickContactButtonText' | 'quickContactButtonLink'>) {
  const readingTime = 5;
  const [isCopied] = React.useState(false);
  const visibleTags = showTags ? MOCK_TAGS : [];
  const accentColor = secondaryColor || brandColor;

  return (
    <div className="min-h-screen bg-background">
      <div
        className="fixed top-0 left-0 h-1 z-50 transition-all duration-300"
        style={{ backgroundColor: brandColor, width: '45%' }}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center text-sm text-muted-foreground">
          <ol className="flex items-center space-x-2">
            <li>
              <div className="flex items-center hover:text-foreground transition-colors">
                <Home className="h-4 w-4" />
              </div>
            </li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li>
              <div className="hover:text-foreground transition-colors">Bài viết</div>
            </li>
            <li><ChevronRight className="h-4 w-4" /></li>
            <li className="font-medium text-foreground truncate max-w-[150px] sm:max-w-xs">
              {MOCK_POST.title}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <article className="lg:col-span-9 space-y-8">
            <header className="space-y-4">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.15]" style={{ color: brandColor }}>
                {MOCK_POST.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pt-2">
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30`, color: accentColor }}
                >
                  {MOCK_POST.categoryName}
                </span>
                {showAuthor && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <div className="flex items-center gap-1.5">
                      <User className="h-4 w-4" />
                      <span>{MOCK_POST.authorName}</span>
                    </div>
                  </>
                )}
                <span className="text-muted-foreground/40">•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(MOCK_POST.publishedAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <span className="text-muted-foreground/40">•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  <span>{readingTime} phút đọc</span>
                </div>
                <span className="text-muted-foreground/40">•</span>
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>{MOCK_POST.views.toLocaleString()} lượt xem</span>
                </div>
              </div>

              {visibleTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visibleTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                      style={{ borderColor: `${accentColor}20`, color: accentColor }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {showThumbnail && MOCK_POST.thumbnail && (
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted/60 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
                <Image
                  src={MOCK_POST.thumbnail}
                  alt={MOCK_POST.title}
                  fill
                  sizes="100vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            )}

            <div className="prose prose-zinc prose-lg max-w-none">
              <div dangerouslySetInnerHTML={{ __html: MOCK_POST.content }} />
            </div>

            <div className="border-t pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4" />
                  Tất cả bài viết
                </div>
              </div>

              {showShare && (
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors h-10 px-4 py-2 w-full sm:w-auto min-w-[140px]"
                    style={{ backgroundColor: isCopied ? `${brandColor}15` : brandColor, color: isCopied ? brandColor : '#fff' }}
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {isCopied ? 'Đã copy link' : 'Chia sẻ'}
                  </button>
                </div>
              )}
            </div>

            <CommentsPreview
              showComments={showComments}
              showLikes={showCommentLikes}
              showReplies={showCommentReplies}
              brandColor={brandColor}
            />
          </article>

          {showRelated && MOCK_RELATED.length > 0 && (
            <aside className="lg:col-span-3 space-y-6">
              <div className="h-fit sticky top-24 rounded-lg bg-muted/30">
                <div className="flex flex-col space-y-1.5 p-6 px-0 sm:px-6">
                  <h3 className="text-base font-semibold">Bài viết liên quan</h3>
                </div>
                <div className="p-6 pt-0 px-0 sm:px-6 gap-3 flex flex-col">
                  {MOCK_RELATED.map((p) => (
                    <div key={p._id} className="group flex gap-3 items-start">
                      <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted/60">
                        {p.thumbnail ? (
                          <Image
                            src={p.thumbnail}
                            alt={p.title}
                            fill
                            sizes="80px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FileText size={20} className="text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:opacity-80 transition-colors">
                          {p.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(p.publishedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

// Modern Style Preview - Extracted from ModernStyle
function ModernStylePreview({ showRelated, showShare, showThumbnail = true, showAuthor = true, showTags = true, showComments = true, showCommentLikes = true, showCommentReplies = true, brandColor = '#3b82f6', secondaryColor }: Omit<PostDetailPreviewProps, 'layoutStyle' | 'device' | 'quickContactEnabled' | 'quickContactTitle' | 'quickContactDescription' | 'quickContactShowPrice' | 'quickContactButtonText' | 'quickContactButtonLink'>) {
  const readingTime = 5;
  const [isCopied] = React.useState(false);
  const visibleTags = showTags ? MOCK_TAGS : [];
  const accentColor = secondaryColor || brandColor;

  return (
    <div className="min-h-screen bg-background pb-12 selection:bg-accent/30">
      <main className="container mx-auto max-w-7xl px-4 py-6 md:py-10 space-y-8 md:space-y-12">
        <div className="flex flex-col gap-4">
          <nav className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
            <ol className="flex items-center gap-2">
              <li>
                <div className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                  <Home className="h-4 w-4" />
                </div>
              </li>
              <li><ChevronRight className="h-4 w-4 text-muted-foreground/50" /></li>
              <li>
                <div className="hover:text-foreground transition-colors">Bài viết</div>
              </li>
              <li><ChevronRight className="h-4 w-4 text-muted-foreground/50" /></li>
              <li className="font-medium text-foreground truncate max-w-[200px] md:max-w-[360px]">
                {MOCK_POST.title}
              </li>
            </ol>
            {showShare && (
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-input bg-background px-4 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
                aria-label="Copy link"
              >
                {isCopied ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                {isCopied ? 'Đã copy' : 'Copy link'}
              </button>
            )}
          </nav>

          <section className="max-w-7xl mx-auto w-full space-y-4">
            <h1 className="text-[clamp(1.75rem,4vw,3rem)] font-semibold tracking-tight text-foreground leading-[1.2] text-balance" style={{ color: brandColor }}>
              {MOCK_POST.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}25`, color: accentColor }}
              >
                {MOCK_POST.categoryName}
              </span>
              {showAuthor && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{MOCK_POST.authorName}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time className="font-medium">{new Date(MOCK_POST.publishedAt).toLocaleDateString('vi-VN')}</time>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{readingTime} phút đọc</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="font-medium">{MOCK_POST.views.toLocaleString()} lượt xem</span>
              </div>
            </div>

            {visibleTags.length > 0 && (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                    style={{ borderColor: `${accentColor}20`, color: accentColor }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {showThumbnail && MOCK_POST.thumbnail && (
          <section className="relative overflow-hidden rounded-2xl bg-muted aspect-[16/9] md:aspect-[21/9] max-w-7xl mx-auto">
            <Image
              src={MOCK_POST.thumbnail}
              alt={MOCK_POST.title}
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          </section>
        )}

        <article className="max-w-7xl mx-auto space-y-6">
          {MOCK_POST.excerpt && (
            <p
              className="text-[clamp(1.125rem,2vw,1.5rem)] leading-relaxed text-foreground/90 font-medium border-l-4 pl-4"
              style={{ borderColor: brandColor }}
            >
              {MOCK_POST.excerpt}
            </p>
          )}

          <div className="prose prose-lg prose-zinc max-w-none text-muted-foreground leading-loose">
            <div dangerouslySetInnerHTML={{ __html: MOCK_POST.content }} />
          </div>
        </article>

        <CommentsPreview showComments={showComments} showLikes={showCommentLikes} showReplies={showCommentReplies} brandColor={brandColor} />

        {showRelated && MOCK_RELATED.length > 0 && (
          <section className="pt-6 pb-2">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-semibold tracking-tight">Bài viết cùng chủ đề</h2>
                <div className="text-sm font-medium" style={{ color: accentColor }}>
                  Xem thêm
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {MOCK_RELATED.map((p) => (
                  <div
                    key={p._id}
                    className="group rounded-lg border bg-background p-4 shadow-sm transition-colors duration-200 flex flex-col"
                    style={{ borderColor: `${brandColor}25` }}
                  >
                    <div className="aspect-[4/3] rounded-md overflow-hidden bg-muted mb-3 relative">
                      {p.thumbnail ? (
                        <Image
                          src={p.thumbnail}
                          alt={p.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <FileText size={28} className="text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
                      {p.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(p.publishedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <span
                      className="mt-auto pt-3 self-end inline-flex items-center justify-center rounded-md py-2.5 px-4 text-sm font-medium text-white transition-colors"
                      style={{ backgroundColor: brandColor }}
                    >
                      Xem ngay
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// Minimal Style Preview - Extracted from MinimalStyle
function MinimalStylePreview({ showRelated, showShare, showThumbnail = true, showAuthor = true, showTags = true, showComments = true, showCommentLikes = true, showCommentReplies = true, brandColor = '#3b82f6', secondaryColor }: Omit<PostDetailPreviewProps, 'layoutStyle' | 'device' | 'quickContactEnabled' | 'quickContactTitle' | 'quickContactDescription' | 'quickContactShowPrice' | 'quickContactButtonText' | 'quickContactButtonLink'>) {
  const [isCopied] = React.useState(false);
  const readingTime = 5;
  const visibleTags = showTags ? MOCK_TAGS : [];
  const accentColor = secondaryColor || brandColor;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pb-16">
        {showThumbnail && MOCK_POST.thumbnail ? (
          <section className="relative w-full overflow-hidden bg-muted">
            <div className="relative h-[clamp(220px,45vh,520px)] w-full">
              <Image
                src={MOCK_POST.thumbnail}
                alt={MOCK_POST.title}
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 top-0 z-10">
                <div className="container max-w-7xl mx-auto px-4 md:px-6">
                  <div className="flex items-center justify-between pt-4">
                    <div className="group inline-flex h-11 items-center gap-2 rounded-md border border-white/30 bg-white/15 px-3 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20">
                      <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                      Danh sách
                    </div>

                    {showShare && (
                      <button
                        type="button"
                        className="h-11 w-11 inline-flex items-center justify-center border-white/30 bg-white/15 text-white hover:bg-white/20 rounded-md"
                        aria-label="Chia sẻ"
                      >
                        {isCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="container max-w-7xl mx-auto h-full px-4 md:px-6 flex items-end pb-6 md:pb-8">
                <div className="w-full max-w-7xl border-border/70 bg-background/90 shadow-sm backdrop-blur-sm rounded-lg">
                  <div className="space-y-3 p-4 md:p-6">
                    <h1 className="text-[clamp(1.6rem,4vw,2.9rem)] font-semibold leading-[1.2] text-foreground" style={{ color: brandColor }}>
                      {MOCK_POST.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                        {MOCK_POST.categoryName}
                      </span>
                      {showAuthor && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          <span>{MOCK_POST.authorName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <time>{new Date(MOCK_POST.publishedAt).toLocaleDateString('vi-VN')}</time>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{readingTime} phút đọc</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{MOCK_POST.views.toLocaleString()} lượt xem</span>
                      </div>
                    </div>
                    {visibleTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {visibleTags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                            style={{ borderColor: `${accentColor}20`, color: accentColor }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="container max-w-7xl mx-auto px-4 md:px-6 pt-6 md:pt-10">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="group inline-flex h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted/60">
                  <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                  Danh sách
                </div>
                {showShare && (
                  <button
                    type="button"
                    className="h-11 w-11 inline-flex items-center justify-center rounded-md border hover:bg-muted/60"
                    aria-label="Chia sẻ"
                  >
                    {isCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
              <h1 className="text-[clamp(1.6rem,4vw,2.9rem)] font-semibold leading-[1.2] text-foreground" style={{ color: brandColor }}>
                {MOCK_POST.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                  {MOCK_POST.categoryName}
                </span>
                {showAuthor && (
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5" />
                    <span>{MOCK_POST.authorName}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <time>{new Date(MOCK_POST.publishedAt).toLocaleDateString('vi-VN')}</time>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{readingTime} phút đọc</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{MOCK_POST.views.toLocaleString()} lượt xem</span>
                </div>
              </div>
              {visibleTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visibleTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ borderColor: `${accentColor}20`, color: accentColor }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <section className="container max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-6">
          {MOCK_POST.excerpt && (
            <p className="text-[clamp(1rem,2vw,1.25rem)] text-muted-foreground leading-relaxed">
              {MOCK_POST.excerpt}
            </p>
          )}
          <div className="prose prose-slate prose-lg max-w-none text-muted-foreground prose-headings:text-foreground prose-strong:text-foreground prose-img:rounded-lg">
            <div dangerouslySetInnerHTML={{ __html: MOCK_POST.content }} />
          </div>

          <CommentsPreview showComments={showComments} showLikes={showCommentLikes} showReplies={showCommentReplies} brandColor={brandColor} />
        </section>

        {showRelated && MOCK_RELATED.length > 0 && (
          <section className="container max-w-7xl mx-auto px-4 md:px-6 pb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-foreground">Bài viết liên quan</h2>
              <div
                className="text-sm font-semibold transition-colors hover:text-foreground"
                style={{ color: accentColor }}
              >
                Xem thêm
              </div>
            </div>
            <div className="space-y-4">
              {MOCK_RELATED.map((p) => (
                <div
                  key={p._id}
                  className="block rounded-lg"
                >
                  <div className="transition-colors hover:bg-muted/40 border rounded-lg">
                    <div className="flex items-center justify-between gap-4 px-4 py-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                          {p.thumbnail ? (
                            <Image
                              src={p.thumbnail}
                              alt={p.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FileText size={20} className="text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                            {p.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(p.publishedAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// Main Preview Component
export function PostDetailPreview({
  layoutStyle,
  showAuthor = true,
  showTags = true,
  showComments = true,
  showCommentLikes = true,
  showCommentReplies = true,
  showRelated,
  showShare,
  showThumbnail = true,
  device = 'desktop',
  brandColor = '#3b82f6',
  secondaryColor,
  colorMode = 'single',
}: PostDetailPreviewProps) {
  const resolvedSecondary = resolveSecondary(brandColor, secondaryColor, colorMode);
  const props = { showAuthor, showTags, showComments, showCommentLikes, showCommentReplies, showRelated, showShare, showThumbnail, brandColor, secondaryColor: resolvedSecondary, device };

  return (
    <div className="w-full">
      {layoutStyle === 'classic' && <ClassicStylePreview {...props} />}
      {layoutStyle === 'modern' && <ModernStylePreview {...props} />}
      {layoutStyle === 'minimal' && <MinimalStylePreview {...props} />}
    </div>
  );
}

function ClassicServicePreview({
  showRelated,
  showShare,
  brandColor: _brandColor = '#3b82f6',
  tokens,
  device = 'desktop',
  priceFieldEnabled,
  quickContactEnabled,
  quickContactTitle,
  quickContactDescription,
  quickContactShowPrice,
  quickContactButtonText,
  quickContactButtonLink,
}: ServiceDetailPreviewProps & { tokens: ServiceDetailColors }) {
  const isDesktop = device === 'desktop';
  const isMobile = device === 'mobile';
  const relatedServices = showRelated ? MOCK_RELATED_SERVICES : [];
  const showPrice = priceFieldEnabled ?? true;
  const showDuration = true;
  const showFeatured = true;
  const quickContactConfig = {
    enabled: quickContactEnabled ?? true,
    title: quickContactTitle ?? 'Liên hệ nhanh',
    description: quickContactDescription ?? 'Tư vấn miễn phí, báo giá trong 24h.',
    showPrice: quickContactShowPrice ?? true,
    buttonText: quickContactButtonText ?? 'Liên hệ tư vấn',
    buttonLink: quickContactButtonLink ?? '',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.pageBackground }}>
      <div className="border-b" style={{ borderColor: tokens.border }}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <nav className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: tokens.breadcrumbText }}>
            <div className="transition-colors" style={{ color: tokens.breadcrumbText }}>Trang chủ</div>
            <ChevronRight size={14} />
            <div className="transition-colors" style={{ color: tokens.breadcrumbText }}>Dịch vụ</div>
            <ChevronRight size={14} />
            <span className="font-medium truncate max-w-[200px]" style={{ color: tokens.breadcrumbActive }}>{MOCK_SERVICE.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className={isDesktop ? 'grid grid-cols-4 gap-12' : ''}>
          <div className={isDesktop ? 'col-span-3' : ''}>
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
              {showFeatured && MOCK_SERVICE.featured && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full"
                    style={{ backgroundColor: tokens.featuredBadgeBg, color: tokens.featuredBadgeText }}
                  >
                    <Star size={14} className="fill-current" />
                    Dịch vụ nổi bật
                  </span>
                )}
                <div
                  className="px-3 py-1 text-sm font-medium rounded-full border"
                  style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}
                >
                  {MOCK_SERVICE.categoryName}
                </div>
              </div>

              <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold leading-tight mb-4`} style={{ color: tokens.headingColor }}>
                {MOCK_SERVICE.title}
              </h1>

              {MOCK_SERVICE.excerpt && (
                <p className="text-lg leading-relaxed max-w-[60ch]" style={{ color: tokens.metaText }}>
                  {MOCK_SERVICE.excerpt}
                </p>
              )}

              {showPrice && (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wide" style={{ color: tokens.metaText }}>Chi phí dự kiến</p>
                  <p className="text-3xl font-bold" style={{ color: tokens.priceColor }}>
                    {formatPrice(MOCK_SERVICE.price)}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t" style={{ borderColor: tokens.border }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: tokens.metaText }}>
                  <Eye size={16} />
                  <span>{MOCK_SERVICE.views.toLocaleString()} lượt xem</span>
                </div>
                {MOCK_SERVICE.publishedAt && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: tokens.metaText }}>
                    <Calendar size={16} />
                    <span>{formatDate(MOCK_SERVICE.publishedAt)}</span>
                  </div>
                )}
                {showDuration && MOCK_SERVICE.duration && (
                  <div className="flex items-center gap-2 text-sm" style={{ color: tokens.metaText }}>
                    <Clock size={16} />
                    <span>{MOCK_SERVICE.duration}</span>
                  </div>
                )}
              </div>
            </header>

            {MOCK_SERVICE.thumbnail && (
              <div className="mb-8 rounded-2xl overflow-hidden relative aspect-[16/9]" style={{ backgroundColor: tokens.surfaceSoft }}>
                <Image
                  src={MOCK_SERVICE.thumbnail}
                  alt={MOCK_SERVICE.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 800px"
                  className="object-cover"
                />
              </div>
            )}

            <article
              className="prose prose-lg max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
              style={{ '--tw-prose-body': tokens.bodyText, '--tw-prose-headings': tokens.headingColor, '--tw-prose-links': tokens.linkColor, '--tw-prose-bold': tokens.bodyText } as React.CSSProperties}
            >
              <div dangerouslySetInnerHTML={{ __html: MOCK_SERVICE.content }} />
            </article>

            <div className="mt-12 pt-8 border-t" style={{ borderColor: tokens.border }}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                {showShare && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: tokens.metaText }}>Chia sẻ:</span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 min-h-11 px-4 rounded-full border text-sm font-medium transition-colors"
                      style={{ backgroundColor: tokens.shareButtonBg, color: tokens.shareButtonText, borderColor: tokens.shareButtonBorder }}
                    >
                      <Copy size={16} />
                      Copy dịch vụ
                    </button>
                  </div>
                )}
                <div
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
                  style={{ color: tokens.linkColor }}
                >
                  <ArrowLeft size={16} />
                  Xem tất cả dịch vụ
                </div>
              </div>
            </div>
          </div>

          <div className={isDesktop ? '' : 'mt-8'}>
            <div className={`${isDesktop ? 'sticky top-8' : ''} space-y-6`}>
              {relatedServices.length > 0 && (
                <div className="rounded-2xl p-6" style={{ backgroundColor: tokens.sectionBackground }}>
                  <h3 className="font-bold mb-4" style={{ color: tokens.sectionHeadingColor }}>Dịch vụ liên quan</h3>
                  <div className="space-y-4">
                    {relatedServices.map((s) => (
                      <div key={s._id} className="flex gap-4 group">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 relative" style={{ backgroundColor: tokens.surface }}>
                          <RelatedServiceThumb title={s.title} thumbnail={s.thumbnail} tokens={tokens} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:opacity-70 transition-opacity" style={{ color: tokens.relatedTitle }}>
                            {s.title}
                          </h4>
                          {showPrice && (
                            <p className="text-sm font-semibold mt-1" style={{ color: tokens.relatedPrice }}>
                              {formatPrice(s.price)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {quickContactConfig.enabled && (
                <div className="rounded-xl border px-4 py-3" style={{ borderColor: tokens.quickContactBorder, backgroundColor: tokens.quickContactBg }}>
                  <div className="min-w-0 mb-3">
                    <p className="text-sm font-semibold" style={{ color: tokens.quickContactTitle }}>{quickContactConfig.title}</p>
                    {quickContactConfig.description && (
                      <p className="text-sm" style={{ color: tokens.quickContactDescription }}>{quickContactConfig.description}</p>
                    )}
                  </div>
                  <QuickContactButtonsPreview tokens={tokens} label={quickContactConfig.buttonText} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModernServicePreview({
  showRelated,
  brandColor: _brandColor = '#3b82f6',
  tokens,
  device = 'desktop',
  priceFieldEnabled,
  modernContactEnabled,
  modernContactShowPrice,
  modernHeroCtaText,
  modernHeroCtaLink,
  modernCtaSectionTitle,
  modernCtaSectionDescription,
  modernCtaButtonText,
  modernCtaButtonLink,
}: ServiceDetailPreviewProps & { tokens: ServiceDetailColors }) {
  const isTablet = device === 'tablet';
  const isMobile = device === 'mobile';
  const relatedServices = showRelated ? MOCK_RELATED_SERVICES : [];
  const showDuration = true;
  const showFeatured = true;
  const headingSize = isMobile ? 'text-xl' : isTablet ? 'text-3xl' : 'text-4xl';
  
  const contactEnabled = modernContactEnabled ?? true;
  const showPrice = (priceFieldEnabled ?? true) && (modernContactShowPrice ?? true);
  
  const modernConfig = {
    heroCtaText: modernHeroCtaText ?? 'Liên hệ tư vấn',
    heroCtaLink: modernHeroCtaLink ?? '',
    ctaSectionTitle: modernCtaSectionTitle ?? 'Sẵn sàng bắt đầu?',
    ctaSectionDescription: modernCtaSectionDescription ?? 'Liên hệ ngay để được tư vấn miễn phí và nhận báo giá chi tiết cho dự án của bạn.',
    ctaButtonText: modernCtaButtonText ?? 'Liên hệ tư vấn',
    ctaButtonLink: modernCtaButtonLink ?? '',
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.pageBackground }}>
      <section className="relative overflow-hidden" style={{ backgroundColor: tokens.sectionBackground }}>
        <div className={`relative max-w-6xl mx-auto px-4 ${isMobile ? 'py-6' : 'py-10'}`}>
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {showFeatured && MOCK_SERVICE.featured && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full"
                  style={{ backgroundColor: tokens.featuredBadgeBg, color: tokens.featuredBadgeText }}
                >
                  <Star size={12} className="fill-current" />
                  Nổi bật
                </span>
              )}
              <span
                className="px-3 py-1 border text-xs font-medium rounded-full"
                style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}
              >
                {MOCK_SERVICE.categoryName}
              </span>
            </div>

            <h1 className={`${headingSize} font-bold leading-[1.15]`} style={{ color: tokens.headingColor }}>
              {MOCK_SERVICE.title}
            </h1>

            {MOCK_SERVICE.excerpt && (
              <p className={`${isMobile ? 'text-base' : 'text-lg'} leading-relaxed max-w-2xl`} style={{ color: tokens.metaText }}>
                {MOCK_SERVICE.excerpt}
              </p>
            )}

            {contactEnabled && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {showPrice && (
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl border" style={{ backgroundColor: tokens.surface, borderColor: tokens.border }}>
                    <div>
                      <p className="text-xs" style={{ color: tokens.metaText }}>Chỉ từ</p>
                      <p className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold leading-none`} style={{ color: tokens.priceColor }}>
                        {formatPrice(MOCK_SERVICE.price)}
                      </p>
                    </div>
                  </div>
                )}
                <div className="min-w-[180px]">
                  <QuickContactButtonsPreview tokens={tokens} label={modernConfig.heroCtaText} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: tokens.metaText }}>
              <div className="flex items-center gap-2">
                <Eye size={16} style={{ color: tokens.softText }} />
                <span>{MOCK_SERVICE.views.toLocaleString()} lượt xem</span>
              </div>
              {showDuration && MOCK_SERVICE.duration && (
                <div className="flex items-center gap-2">
                  <Clock size={16} style={{ color: tokens.softText }} />
                  <span>{MOCK_SERVICE.duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {MOCK_SERVICE.thumbnail && (
        <div className="max-w-6xl mx-auto px-4 -mt-4 relative z-10">
          <div className="relative rounded-xl overflow-hidden border aspect-[16/9]" style={{ borderColor: tokens.border }}>
            <Image
              src={MOCK_SERVICE.thumbnail}
              alt={MOCK_SERVICE.title}
              fill
              sizes="(max-width: 1024px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <section className={`max-w-4xl mx-auto px-4 ${isMobile ? 'py-8' : 'py-12'}`}>
        <article
          className="prose max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
          style={{ '--tw-prose-body': tokens.bodyText, '--tw-prose-headings': tokens.headingColor, '--tw-prose-links': tokens.linkColor, '--tw-prose-bold': tokens.bodyText } as React.CSSProperties}
        >
          <div dangerouslySetInnerHTML={{ __html: MOCK_SERVICE.content }} />
        </article>
      </section>

      {relatedServices.length > 0 && (
        <section className="py-10" style={{ backgroundColor: tokens.sectionBackground }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: tokens.sectionHeadingColor }}>Dịch vụ liên quan</h2>
              <div className="text-sm font-medium flex items-center gap-1 transition-colors" style={{ color: tokens.linkMuted }}>
                Xem tất cả
                <ArrowRight size={16} />
              </div>
            </div>
            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-5`}>
              {relatedServices.map((s) => (
                <div
                  key={s._id}
                  className="group rounded-xl overflow-hidden border transition-colors"
                  style={{ backgroundColor: tokens.cardBackground, borderColor: tokens.cardBorder }}
                >
                  <div className="aspect-video overflow-hidden relative" style={{ backgroundColor: tokens.surfaceSoft }}>
                    <RelatedServiceThumb title={s.title} thumbnail={s.thumbnail} tokens={tokens} />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold mb-2 line-clamp-2 group-hover:opacity-70 transition-opacity" style={{ color: tokens.relatedTitle }}>
                      {s.title}
                    </h3>
                    {showPrice && (
                      <p className="text-base font-bold" style={{ color: tokens.relatedPrice }}>
                        {formatPrice(s.price)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="inline-flex items-center gap-2 text-sm font-medium transition-colors" style={{ color: tokens.linkColor }}>
          <ArrowLeft size={16} />
          Quay lại danh sách dịch vụ
        </div>
      </div>
    </div>
  );
}

function MinimalServicePreview({
  showRelated,
  brandColor: _brandColor = '#3b82f6',
  tokens,
  device = 'desktop',
  priceFieldEnabled,
  minimalCtaEnabled,
  minimalShowPrice,
  minimalCtaText,
  minimalCtaButtonText,
  minimalCtaButtonLink,
}: ServiceDetailPreviewProps & { tokens: ServiceDetailColors }) {
  const isTablet = device === 'tablet';
  const isMobile = device === 'mobile';
  const relatedServices = showRelated ? MOCK_RELATED_SERVICES : [];
  const showDuration = true;
  const showFeatured = true;
  
  const ctaEnabled = minimalCtaEnabled ?? true;
  const showPrice = (priceFieldEnabled ?? true) && (minimalShowPrice ?? true);
  
  const minimalConfig = {
    ctaText: minimalCtaText ?? 'Quan tâm đến dịch vụ này?',
    ctaButtonText: minimalCtaButtonText ?? 'Liên hệ tư vấn',
    ctaButtonLink: minimalCtaButtonLink ?? '',
  };
  const headingSize = isMobile ? 'text-3xl' : isTablet ? 'text-4xl' : 'text-5xl';

  return (
    <div className="min-h-screen" style={{ backgroundColor: tokens.pageBackground }}>
      <article className={`max-w-7xl mx-auto px-4 ${isMobile ? 'py-12' : 'py-18'}`}>
        <div className="inline-flex items-center gap-2 text-sm mb-10 transition-colors" style={{ color: tokens.metaText }}>
          <ArrowLeft size={16} />
          Tất cả dịch vụ
        </div>

        <header className="mb-12 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            {showFeatured && MOCK_SERVICE.featured && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: tokens.featuredBadgeBg, color: tokens.featuredBadgeText }}
              >
                <Star size={12} className="fill-current" />
                Nổi bật
              </span>
            )}
            <span
              className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: tokens.categoryBadgeBg, color: tokens.categoryBadgeText, borderColor: tokens.categoryBadgeBorder }}
            >
              {MOCK_SERVICE.categoryName}
            </span>
          </div>

          <h1 className={`${headingSize} font-bold leading-tight`} style={{ color: tokens.headingColor }}>
            {MOCK_SERVICE.title}
          </h1>

          {MOCK_SERVICE.excerpt && (
            <p className="text-lg leading-relaxed" style={{ color: tokens.metaText }}>
              {MOCK_SERVICE.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            {showPrice && (
              <div className="min-w-[160px]">
                <p className="text-xs uppercase tracking-wide" style={{ color: tokens.metaText }}>Chi phí dự kiến</p>
                <p className="text-2xl font-bold" style={{ color: tokens.priceColor }}>
                  {formatPrice(MOCK_SERVICE.price)}
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: tokens.metaText }}>
              {showDuration && MOCK_SERVICE.duration && (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: tokens.chipBg, color: tokens.chipText }}>
                  <Clock size={14} style={{ color: tokens.chipIcon }} />
                  {MOCK_SERVICE.duration}
                </span>
              )}
              <span className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: tokens.chipBg, color: tokens.chipText }}>
                <Eye size={14} style={{ color: tokens.chipIcon }} />
                {MOCK_SERVICE.views.toLocaleString()} lượt xem
              </span>
              {MOCK_SERVICE.publishedAt && (
                <span className="inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ backgroundColor: tokens.chipBg, color: tokens.chipText }}>
                  <Calendar size={14} style={{ color: tokens.chipIcon }} />
                  {formatDate(MOCK_SERVICE.publishedAt)}
                </span>
              )}
            </div>
          </div>
        </header>

        {MOCK_SERVICE.thumbnail && (
          <figure className="mb-12">
            <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border" style={{ borderColor: tokens.border }}>
              <Image
                src={MOCK_SERVICE.thumbnail}
                alt={MOCK_SERVICE.title}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
              />
            </div>
          </figure>
        )}

        <div
          className="prose max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-blockquote:border-l-2 prose-blockquote:not-italic"
          style={{ '--tw-prose-body': tokens.bodyText, '--tw-prose-headings': tokens.headingColor, '--tw-prose-links': tokens.linkColor, '--tw-prose-bold': tokens.bodyText, '--tw-prose-quote-borders': tokens.linkColor } as React.CSSProperties}
        >
          <div dangerouslySetInnerHTML={{ __html: MOCK_SERVICE.content }} />
        </div>

        {ctaEnabled && (
          <div className="mt-14 rounded-2xl border p-6 text-center" style={{ borderColor: tokens.border, backgroundColor: tokens.surface }}>
            <p className="mb-5" style={{ color: tokens.metaText }}>{minimalConfig.ctaText}</p>
            <div className="max-w-xs mx-auto">
              <QuickContactButtonsPreview tokens={tokens} label={minimalConfig.ctaButtonText} />
            </div>
          </div>
        )}

        {relatedServices.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-6 text-center" style={{ color: tokens.metaText }}>
              Có thể bạn quan tâm
            </h3>
            <div className="space-y-2">
              {relatedServices.map((s, index) => (
                <div
                  key={s._id}
                  className="group flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-colors"
                  style={{ borderColor: tokens.cardBorder, backgroundColor: tokens.cardBackground }}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono" style={{ color: tokens.softText }}>{String(index + 1).padStart(2, '0')}</span>
                    <h4 className="font-medium group-hover:opacity-70 transition-opacity" style={{ color: tokens.relatedTitle }}>
                      {s.title}
                    </h4>
                  </div>
                  {showPrice && (
                    <span className="text-sm font-semibold" style={{ color: tokens.relatedPrice }}>
                      {formatPrice(s.price)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}

export function ServiceDetailPreview({
  layoutStyle,
  showRelated,
  showShare,
  priceFieldEnabled,
  quickContactEnabled,
  quickContactTitle,
  quickContactDescription,
  quickContactShowPrice,
  quickContactButtonText,
  quickContactButtonLink,
  modernContactEnabled,
  modernContactShowPrice,
  modernHeroCtaText,
  modernHeroCtaLink,
  modernCtaSectionTitle,
  modernCtaSectionDescription,
  modernCtaButtonText,
  modernCtaButtonLink,
  minimalCtaEnabled,
  minimalShowPrice,
  minimalCtaText,
  minimalCtaButtonText,
  minimalCtaButtonLink,
  brandColor = '#3b82f6',
  secondaryColor,
  colorMode = 'single',
  device = 'desktop',
}: ServiceDetailPreviewProps) {
  const tokens = useMemo(
    () => getServiceDetailColors(brandColor, secondaryColor, colorMode),
    [brandColor, secondaryColor, colorMode]
  );

  const props = {
    showRelated,
    showShare,
    priceFieldEnabled,
    brandColor,
    tokens,
    device,
    layoutStyle,
    quickContactEnabled,
    quickContactTitle,
    quickContactDescription,
    quickContactShowPrice,
    quickContactButtonText,
    quickContactButtonLink,
    modernContactEnabled,
    modernContactShowPrice,
    modernHeroCtaText,
    modernHeroCtaLink,
    modernCtaSectionTitle,
    modernCtaSectionDescription,
    modernCtaButtonText,
    modernCtaButtonLink,
    minimalCtaEnabled,
    minimalShowPrice,
    minimalCtaText,
    minimalCtaButtonText,
    minimalCtaButtonLink,
  };

  return (
    <div className="w-full">
      {layoutStyle === 'classic' && <ClassicServicePreview {...props} />}
      {layoutStyle === 'modern' && <ModernServicePreview {...props} />}
      {layoutStyle === 'minimal' && <MinimalServicePreview {...props} />}
    </div>
  );
}
