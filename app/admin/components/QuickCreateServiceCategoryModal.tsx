'use client';

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { Button, Input, Label } from './ui';

interface QuickCreateServiceCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

export function QuickCreateServiceCategoryModal({ 
  isOpen, 
  onClose, 
  onCreated 
}: QuickCreateServiceCategoryModalProps) {
  const createCategory = useMutation(api.serviceCategories.create);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {return;}

    setIsSubmitting(true);
    try {
      const slug = name.toLowerCase()
        .normalize("NFD").replaceAll(/[\u0300-\u036F]/g, "")
        .replaceAll(/[đĐ]/g, "d")
        .replaceAll(/[^a-z0-9\s]/g, '')
        .replaceAll(/\s+/g, '-');
      
      const id = await createCategory({
        name: name.trim(),
        slug,
      });
      toast.success('Tao danh muc thanh cong');
      onCreated(id);
      setName('');
      onClose();
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Khong the tao danh muc'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tao danh muc dich vu</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ten danh muc <span className="text-red-500">*</span></Label>
              <Input 
                value={name} 
                onChange={(e) =>{  setName(e.target.value); }} 
                required 
                placeholder="VD: Tu van, Thiet ke..." 
                autoFocus 
              />
              <p className="text-xs text-slate-500">Slug se duoc tao tu dong tu ten</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="ghost" onClick={onClose}>Huy</Button>
            <Button type="submit" variant="accent" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-500">
              {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
              Tao danh muc
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
