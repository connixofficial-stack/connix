import type { Id } from '@/convex/_generated/dataModel';
import type { BlogConfig, DemoBlogItem } from '../_types';

export const BLOG_STYLES = [
  { id: 'layout1', label: '(1) Lưới thẻ' },
  { id: 'layout2', label: '(2) Bài lớn' },
  { id: 'layout3', label: '(3) Xếp dọc' },
  { id: 'layout4', label: '(4) Trượt ngang' },
  { id: 'layout5', label: '(5) Ô ghép' },
  { id: 'layout6', label: '(6) Tin chính' },
  { id: 'layout7', label: '(7) Tối giản' }
];

export const DEFAULT_BLOG_CONFIG: BlogConfig = {
  itemCount: 8,
  selectedPostIds: [],
  selectionMode: 'auto',
  demoPosts: [],
  showAuthor: true,
  showDate: true,
  showExcerpt: true,
  sortBy: 'newest',
  spacing: 'normal',
  desktopColumns: 4,
  cornerRadius: 'lg',
  style: 'layout1',
  subtitle: '',
};

export const DEFAULT_DEMO_BLOG_POSTS: DemoBlogItem[] = [
  { id: 'demo-1', title: 'Xu hướng thiết kế web hiện đại năm 2026', excerpt: 'Những xu hướng thiết kế website nổi bật giúp tăng trải nghiệm người dùng.', thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop', category: 'Thiết kế', date: '15/04/2026', author: 'Admin' },
  { id: 'demo-2', title: 'Tối ưu SEO cho website doanh nghiệp', excerpt: 'Các chiến lược SEO on-page và technical SEO để đạt thứ hạng cao.', thumbnail: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=500&fit=crop', category: 'SEO', date: '12/04/2026', author: 'Admin' },
  { id: 'demo-3', title: 'React 19: Những tính năng mới cần biết', excerpt: 'Khám phá các cập nhật quan trọng trong React 19 và cách áp dụng.', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=500&fit=crop', category: 'Frontend', date: '10/04/2026', author: 'Admin' },
  { id: 'demo-4', title: 'Bảo mật website: 10 lỗi phổ biến cần tránh', excerpt: 'Những lỗ hổng bảo mật thường gặp và biện pháp phòng tránh hiệu quả.', thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=500&fit=crop', category: 'Bảo mật', date: '08/04/2026', author: 'Admin' },
  { id: 'demo-5', title: 'Performance tối ưu: Core Web Vitals', excerpt: 'Hướng dẫn tối ưu LCP, FID, CLS để cải thiện trải nghiệm.', thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop', category: 'Performance', date: '05/04/2026', author: 'Admin' },
  { id: 'demo-6', title: 'Thiết kế landing page tăng tỷ lệ chuyển đổi', excerpt: 'Nguyên tắc thiết kế landing page hiệu quả cho chiến dịch marketing.', thumbnail: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&h=500&fit=crop', category: 'Marketing', date: '02/04/2026', author: 'Admin' },
  { id: 'demo-7', title: 'Hướng dẫn chọn hosting phù hợp cho doanh nghiệp', excerpt: 'So sánh shared hosting, VPS và cloud để chọn giải pháp phù hợp.', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop', category: 'Hạ tầng', date: '28/03/2026', author: 'Admin' },
  { id: 'demo-8', title: 'Chiến lược nội dung giúp tăng traffic tự nhiên', excerpt: 'Lập kế hoạch content marketing bền vững để thu hút khách hàng.', thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=500&fit=crop', category: 'Content', date: '25/03/2026', author: 'Admin' },
];

export interface BlogSortablePost {
  _id: Id<'posts'>;
  _creationTime: number;
  publishedAt?: number;
  views?: number;
}

export const sortBlogPosts = <T extends BlogSortablePost>(
  posts: T[],
  sortBy: BlogConfig['sortBy'],
  randomSeed = 'blog-random-seed',
): T[] => {
  if (sortBy === 'popular') {
    return [...posts].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
  }

  if (sortBy === 'random') {
    const seed = randomSeed
      .split('')
      .reduce((acc, char, index) => acc + char.charCodeAt(0) * (index + 1), 0);

    return [...posts]
      .map((post) => ({
        post,
        weight: (post._id.length * 97 + seed + post._creationTime) % 997,
      }))
      .sort((a, b) => a.weight - b.weight)
      .map((entry) => entry.post);
  }

  return [...posts].sort((a, b) => {
    const aTime = a.publishedAt ?? a._creationTime;
    const bTime = b.publishedAt ?? b._creationTime;
    return bTime - aTime;
  });
};
