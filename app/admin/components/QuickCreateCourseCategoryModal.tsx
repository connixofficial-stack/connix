'use client';

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Input, Label } from './ui';

type QuickCreateCourseCategoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
};

const generateSlug = (value: string) => value.toLowerCase()
  .normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '')
  .replaceAll(/[đĐ]/g, 'd')
  .replaceAll(/[^a-z0-9\s]/g, '')
  .replaceAll(/\s+/g, '-');

export function QuickCreateCourseCategoryModal({
  isOpen,
  onClose,
  onCreated,
}: QuickCreateCourseCategoryModalProps) {
  const createCategory = useMutation(api.courseCategories.create);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}

    setIsSubmitting(true);
    try {
      const id = await createCategory({
        name: name.trim(),
        slug: generateSlug(name.trim()),
      });
      toast.success('Đã tạo danh mục khóa học');
      onCreated(id);
      setName('');
      onClose();
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể tạo danh mục'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tạo danh mục khóa học</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Tên danh mục <span className="text-red-500">*</span></Label>
            <Input
              value={name}
              onChange={(e) =>{ setName(e.target.value); }}
              required
              placeholder="VD: Cơ bản, Luyện thi..."
              autoFocus
            />
            <p className="text-xs text-slate-500">Slug sẽ được tạo tự động từ tên.</p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
            <Button type="submit" variant="accent" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-500">
              {isSubmitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              Tạo danh mục
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
