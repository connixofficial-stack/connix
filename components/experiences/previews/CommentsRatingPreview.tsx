import React from 'react';
import { MessageSquare, Reply, Star, ThumbsUp } from 'lucide-react';

type CommentsRatingPreviewProps = {
  ratingDisplayStyle: 'stars' | 'numbers' | 'both';
  commentsSortOrder: 'newest' | 'oldest' | 'highest-rating' | 'most-liked';
  showLikes: boolean;
  showReplies: boolean;
  showModeration: boolean;
  device?: 'desktop' | 'tablet' | 'mobile';
  brandColor?: string;
};

const mockComments = [
  { id: 1, user: 'Nguyễn Văn A', rating: 5, content: 'Sản phẩm rất tốt, đóng gói cẩn thận. Giao hàng nhanh, nhân viên nhiệt tình!', likes: 24, date: '2 ngày trước', pending: false },
  { id: 2, user: 'Trần Thị B', rating: 4, content: 'Chất lượng ổn so với giá tiền. Chỉ tiếc là ship hơi lâu.', likes: 12, date: '5 ngày trước', pending: true },
];

const adminReply = { user: 'Shop Admin', content: 'Cảm ơn bạn đã tin tưởng và ủng hộ shop!', date: '1 ngày trước' };

type RatingDisplayProps = {
  score?: number;
  size?: 'small' | 'normal';
  displayStyle: 'stars' | 'numbers' | 'both';
};

function RatingDisplay({ score = 4.5, size = 'normal', displayStyle }: RatingDisplayProps) {
  const starSize = size === 'small' ? 14 : 18;
  if (displayStyle === 'numbers') {
    return <span className="font-semibold text-amber-600">{score}/5</span>;
  }
  if (displayStyle === 'stars') {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={starSize} className={i < Math.floor(score) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={starSize} className={i < Math.floor(score) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'} />
        ))}
      </div>
      <span className="font-semibold text-amber-600">{score}</span>
    </div>
  );
}

export function CommentsRatingPreview({
  ratingDisplayStyle,
  commentsSortOrder,
  showLikes,
  showReplies,
  showModeration,
  device = 'desktop',
  brandColor = '#a855f7',
}: CommentsRatingPreviewProps) {
  const sortLabels: Record<string, string> = {
    'newest': 'Mới nhất',
    'oldest': 'Cũ nhất',
    'highest-rating': 'Đánh giá cao nhất',
    'most-liked': 'Nhiều like nhất',
  };
  const isMobile = device === 'mobile';

  return (
    <div className="py-6 px-4 min-h-[300px]">
      <div className={`${isMobile ? 'max-w-xl' : 'max-w-3xl'} mx-auto`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <MessageSquare size={24} style={{ color: brandColor }} />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Đánh giá sản phẩm</h2>
              <p className="text-sm text-slate-500">{mockComments.length} đánh giá</p>
            </div>
          </div>
          <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" disabled>
            <option>{sortLabels[commentsSortOrder]}</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold" style={{ color: brandColor }}>4.5</div>
              <RatingDisplay score={4.5} size="small" displayStyle={ratingDisplayStyle} />
              <div className="text-xs text-slate-500 mt-1">trên 5</div>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map(stars => (
                <div key={stars} className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-3">{stars}</span>
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ backgroundColor: brandColor, width: stars === 5 ? '60%' : stars === 4 ? '30%' : '10%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {mockComments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-medium">
                  {comment.user.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{comment.user}</span>
                      {showModeration && comment.pending && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Chờ duyệt</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{comment.date}</span>
                  </div>
                  <div className="mt-1">
                    <RatingDisplay score={comment.rating} size="small" displayStyle={ratingDisplayStyle} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-3">
                    {showLikes && (
                      <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
                        <ThumbsUp size={14} />
                        <span>{comment.likes}</span>
                      </button>
                    )}
                    {showReplies && (
                      <button className="flex items-center gap-1.5 text-sm hover:opacity-80" style={{ color: brandColor }}>
                        <Reply size={14} />
                        <span>Trả lời</span>
                      </button>
                    )}
                  </div>
                  {showReplies && comment.id === 1 && (
                    <div className="mt-4 ml-4 pl-4 border-l-2" style={{ borderColor: `${brandColor}40` }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: brandColor }}>A</div>
                        <span className="font-medium text-sm" style={{ color: brandColor }}>{adminReply.user}</span>
                        <span className="text-xs text-slate-400">{adminReply.date}</span>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-600">{adminReply.content}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}