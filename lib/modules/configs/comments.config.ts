import { MessageSquare, ThumbsUp, Reply } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const commentsModule = defineModuleWithRuntime({
   key: 'comments',
   name: 'Bình luận',
   description: 'Cấu hình bình luận và đánh giá cho bài viết, sản phẩm',
   icon: MessageSquare,
   color: 'cyan',
   
  features: [
    { key: 'enableLikes', label: 'Lượt thích', icon: ThumbsUp, linkedField: 'likesCount', enabled: false },
    { key: 'enableReplies', label: 'Trả lời', icon: Reply, linkedField: 'parentId' },
  ],
   
   settings: [
     { key: 'commentsPerPage', label: 'Số bình luận / trang', type: 'number', default: 20 },
     { 
       key: 'defaultStatus', 
       label: 'Trạng thái mặc định', 
       type: 'select',
       default: 'Pending',
       options: [
         { value: 'Pending', label: 'Chờ duyệt' },
         { value: 'Approved', label: 'Tự động duyệt' },
       ],
     },
   ],
   
   conventionNote: 'Trường targetType xác định loại (post/product). status: Pending, Approved, Spam. Bình luận hỗ trợ polymorphic relationship.',
   
  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'content', isSystem: true, name: 'Nội dung', order: 0, required: true, type: 'textarea' },
      { enabled: true, fieldKey: 'authorName', isSystem: true, name: 'Tên người bình luận', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'authorEmail', isSystem: false, name: 'Email', order: 2, required: false, type: 'email' },
      { enabled: true, fieldKey: 'targetType', isSystem: true, name: 'Loại đối tượng', order: 3, required: true, type: 'select' },
      { enabled: true, fieldKey: 'targetId', isSystem: true, name: 'ID đối tượng', order: 4, required: true, type: 'text' },
      { enabled: true, fieldKey: 'status', isSystem: true, name: 'Trạng thái', order: 5, required: true, type: 'select' },
      { enabled: true, fieldKey: 'rating', isSystem: false, name: 'Đánh giá', order: 6, required: false, type: 'number' },
      { enabled: true, fieldKey: 'parentId', isSystem: false, linkedFeature: 'enableReplies', name: 'Bình luận cha', order: 7, required: false, type: 'select' },
      { enabled: false, fieldKey: 'authorIp', isSystem: false, name: 'IP', order: 8, required: false, type: 'text' },
      { enabled: false, fieldKey: 'likesCount', isSystem: false, linkedFeature: 'enableLikes', name: 'Số lượt thích', order: 9, required: false, type: 'number' },
    ],
  },

  tabs: ['config'],
 });
