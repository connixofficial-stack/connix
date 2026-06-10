import { Image, FolderTree, Type, Ruler } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';
 
export const mediaModule = defineModuleWithRuntime({
   key: 'media',
   name: 'Thư viện Media',
   description: 'Quản lý hình ảnh, video, tài liệu',
   icon: Image,
   color: 'cyan',
 
   features: [
     { key: 'enableFolders', label: 'Thư mục', icon: FolderTree, linkedField: 'folder' },
     { key: 'enableAltText', label: 'Alt Text', icon: Type, linkedField: 'alt' },
     { key: 'enableDimensions', label: 'Kích thước ảnh', icon: Ruler, linkedField: 'dimensions' },
   ],
 
  settings: [
    { key: 'itemsPerPage', label: 'Số file / trang', type: 'number', default: 24 },
    { key: 'maxFileSize', label: 'Max file size (MB)', type: 'number', default: 5 },
    { key: 'allowedTypes', label: 'Allowed types', type: 'text', default: 'image/*,video/*,application/pdf' },
  ],
 
   conventionNote: 'File lưu trên Convex Storage. Size tính bằng bytes. Hỗ trợ image, video, pdf.',
 
  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'filename', isSystem: true, name: 'Tên file', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'mimeType', isSystem: true, name: 'Loại file', order: 1, required: true, type: 'text' },
      { enabled: true, fieldKey: 'size', isSystem: true, name: 'Kích thước', order: 2, required: true, type: 'number' },
      { enabled: true, fieldKey: 'storageId', isSystem: true, name: 'Storage ID', order: 3, required: true, type: 'text' },
      { enabled: true, fieldKey: 'folder', isSystem: false, linkedFeature: 'enableFolders', name: 'Thư mục', order: 4, required: false, type: 'select' },
      { enabled: true, fieldKey: 'alt', isSystem: false, linkedFeature: 'enableAltText', name: 'Alt Text', order: 5, required: false, type: 'text' },
      { enabled: true, fieldKey: 'width', isSystem: false, linkedFeature: 'enableDimensions', name: 'Chiều rộng', order: 6, required: false, type: 'number' },
      { enabled: true, fieldKey: 'height', isSystem: false, linkedFeature: 'enableDimensions', name: 'Chiều cao', order: 7, required: false, type: 'number' },
      { enabled: false, fieldKey: 'uploadedBy', isSystem: false, name: 'Người upload', order: 8, required: false, type: 'select' },
    ],
  },

  tabs: ['config'],
 });
