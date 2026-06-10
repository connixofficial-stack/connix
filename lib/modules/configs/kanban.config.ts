import { LayoutGrid, ListTodo, Users } from 'lucide-react';
import { defineModuleWithRuntime } from '../define-module';

export const kanbanModule = defineModuleWithRuntime({
  key: 'kanban',
  name: 'Kanban Board',
  description: 'Quản lý công việc nội bộ theo dạng Kanban',
  icon: LayoutGrid,
  color: 'indigo',

  features: [
    { key: 'enableWipLimit', label: 'Giới hạn WIP', icon: ListTodo },
    { key: 'enableAssignee', label: 'Phân công người phụ trách', icon: Users },
  ],

  settings: [
    {
      key: 'defaultPriority',
      label: 'Ưu tiên mặc định',
      type: 'select',
      default: 'MEDIUM',
      options: [
        { value: 'LOW', label: 'Thấp' },
        { value: 'MEDIUM', label: 'Trung bình' },
        { value: 'HIGH', label: 'Cao' },
      ],
    },
  ],

  conventionNote: 'Kéo thả để sắp xếp task giữa các cột, hỗ trợ WIP limit và phân công.',

  runtimeConfig: {
    fields: [
      { enabled: true, fieldKey: 'title', isSystem: true, name: 'Tiêu đề', order: 0, required: true, type: 'text' },
      { enabled: true, fieldKey: 'description', isSystem: false, name: 'Mô tả', order: 1, required: false, type: 'textarea' },
      { enabled: true, fieldKey: 'priority', isSystem: true, name: 'Ưu tiên', order: 2, required: true, type: 'select' },
      { enabled: true, fieldKey: 'dueDate', isSystem: false, name: 'Hạn xử lý', order: 3, required: false, type: 'date' },
      { enabled: true, fieldKey: 'assigneeId', isSystem: false, linkedFeature: 'enableAssignee', name: 'Người phụ trách', order: 4, required: false, type: 'select' },
    ],
  },

  tabs: ['config'],
});
