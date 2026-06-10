'use client';

import React, { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, GripVertical, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { CopyableInput } from '../../../components/CopyTextButton';

const MENU_ITEMS_LIMIT = 500;

interface MenuItem {
  _id: Id<"menuItems">;
  _creationTime: number;
  menuId: Id<"menus">;
  label: string;
  url: string;
  order: number;
  depth: number;
  parentId?: Id<"menuItems">;
  icon?: string;
  openInNewTab?: boolean;
  active: boolean;
}

export default function MenuEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const menu = useQuery(api.menus.getMenuById, { id: id as Id<"menus"> });
  const menuItemsData = useQuery(api.menus.listMenuItems, menu ? { menuId: menu._id } : "skip");
  
  const updateMenu = useMutation(api.menus.updateMenu);
  const createMenuItem = useMutation(api.menus.createMenuItem);
  const updateMenuItem = useMutation(api.menus.updateMenuItem);
  const removeMenuItem = useMutation(api.menus.removeMenuItem);
  const reorderMenuItems = useMutation(api.menus.reorderMenuItems);

  const [formData, setFormData] = useState({ location: '', name: '' });
  const [localItems, setLocalItems] = useState<Map<string, { label: string; url: string }>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const items = useMemo(() => menuItemsData ? [...menuItemsData].sort((a, b) => a.order - b.order) : [], [menuItemsData]);
  const isAtMenuLimit = items.length >= MENU_ITEMS_LIMIT;

  // Initialize form when menu loads
  React.useEffect(() => {
    if (menu) {
      setFormData({ location: menu.location, name: menu.name });
    }
  }, [menu]);

  const isLoading = menu === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card className="p-8 text-center">
          <p className="text-slate-500 mb-4">Không tìm thấy menu</p>
          <Link href="/admin/menus" className="text-orange-600 hover:underline">Quay lại danh sách</Link>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateMenu({ 
        id: menu._id, 
        location: formData.location, 
        name: formData.name 
      });
      
      // Update edited items
      for (const [itemId, values] of localItems.entries()) {
        await updateMenuItem({ 
          id: itemId as Id<"menuItems">, 
          label: values.label, 
          url: values.url 
        });
      }
      
      toast.success('Đã cập nhật menu');
    } catch {
      toast.error('Có lỗi khi cập nhật menu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = async () => {
    if (isAtMenuLimit) {
      toast.error(`Tối đa ${MENU_ITEMS_LIMIT} menu items`);
      return;
    }
    try {
      await createMenuItem({
        active: true,
        depth: 0,
        label: 'Liên kết mới',
        menuId: menu._id,
        url: '/',
      });
      toast.success('Đã thêm mục menu');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi thêm');
    }
  };

  const handleDeleteItem = async (itemId: Id<"menuItems">) => {
    if (!confirm('Xóa mục menu này?')) {return;}
    try {
      await removeMenuItem({ id: itemId });
      setLocalItems(prev => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
      toast.success('Đã xóa mục menu');
    } catch {
      toast.error('Có lỗi khi xóa');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === items.length - 1)) {return;}
    
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const updates = [
      { id: items[index]._id, order: items[swapIndex].order },
      { id: items[swapIndex]._id, order: items[index].order },
    ];
    
    try {
      await reorderMenuItems({ items: updates });
    } catch {
      toast.error('Có lỗi khi sắp xếp');
    }
  };

  const updateLocalItem = (itemId: string, field: 'label' | 'url', value: string) => {
    setLocalItems(prev => {
      const newMap = new Map(prev);
      const item = items.find(i => i._id === itemId);
      const current = newMap.get(itemId) ?? { label: item?.label ?? '', url: item?.url ?? '' };
      newMap.set(itemId, { ...current, [field]: value });
      return newMap;
    });
  };

  const getItemValue = (item: MenuItem, field: 'label' | 'url') => {
    const local = localItems.get(item._id);
    return local ? local[field] : item[field];
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chỉnh sửa menu</h1>
        <Link href="/admin/menus" className="text-sm text-orange-600 hover:underline">← Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên menu <span className="text-red-500">*</span></Label>
                <CopyableInput
                  value={formData.name} 
                  onChange={(e) =>{  setFormData(prev => ({ ...prev, name: e.target.value })); }}
                  copyLabel="tên menu"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Vị trí hiển thị</Label>
                <select 
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={formData.location}
                  onChange={(e) =>{  setFormData(prev => ({ ...prev, location: e.target.value })); }}
                >
                  <option value="header">Header</option>
                  <option value="footer">Footer</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Các mục trong menu ({items.length}/{MENU_ITEMS_LIMIT})</CardTitle>
            <Button type="button" size="sm" variant="outline" className="gap-2" onClick={handleAddItem} disabled={isAtMenuLimit}>
              <Plus size={14} /> {isAtMenuLimit ? `Đã đạt giới hạn ${MENU_ITEMS_LIMIT}` : 'Thêm mục'}
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {items.map((item, index) => (
                <div 
                  key={item._id} 
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  style={{ marginLeft: item.depth * 24 }}
                >
                  <div className="flex flex-col gap-0.5 text-slate-400">
                    <button 
                      type="button" 
                      onClick={ async () => handleMove(index, 'up')} 
                      className="hover:text-orange-600 disabled:opacity-30" 
                      disabled={index === 0}
                    >
                      <ArrowUp size={12}/>
                    </button>
                    <GripVertical size={14} />
                    <button 
                      type="button" 
                      onClick={ async () => handleMove(index, 'down')} 
                      className="hover:text-orange-600 disabled:opacity-30" 
                      disabled={index === items.length - 1}
                    >
                      <ArrowDown size={12}/>
                    </button>
                  </div>
                  <Input 
                    value={getItemValue(item, 'label')} 
                    onChange={(e) =>{  updateLocalItem(item._id, 'label', e.target.value); }}
                    className="flex-1 h-9" 
                    placeholder="Label"
                  />
                  <Input 
                    value={getItemValue(item, 'url')} 
                    onChange={(e) =>{  updateLocalItem(item._id, 'url', e.target.value); }}
                    className="flex-1 h-9 font-mono text-xs" 
                    placeholder="URL" 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="text-red-500 hover:text-red-600 h-9 w-9" 
                    onClick={ async () => handleDeleteItem(item._id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  Chưa có mục nào trong menu này. Nhấn &quot;Thêm mục&quot; để bắt đầu.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() =>{  router.push('/admin/menus'); }}>Hủy bỏ</Button>
          <Button type="submit" className="bg-orange-600 hover:bg-orange-500" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </div>
  );
}
