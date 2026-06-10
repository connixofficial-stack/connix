'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { Loader2, ShieldOff } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../components/ui';
import { CopyableInput } from '../../components/CopyTextButton';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';
import { useAdminAuth } from '../../auth/context';
import {
  ACTION_LABELS,
  PERMISSION_ACTIONS,
  getModuleActions,
  isPermissionModule,
  type PermissionAction,
} from '../permission-config';

const MODULE_KEY = 'roles';


export default function RoleCreatePage() {
  const { hasPermission, isLoading: isAuthLoading, token } = useAdminAuth();
  const canCreate = hasPermission(MODULE_KEY, 'create');

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!canCreate) {
    return (
      <Card className="max-w-4xl mx-auto p-8 text-center">
        <ShieldOff size={40} className="mx-auto text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Không có quyền truy cập</h2>
        <p className="text-slate-500 mt-2">Bạn không có quyền tạo vai trò mới.</p>
        <div className="mt-6">
          <Link href="/admin/roles"><Button>Quay lại danh sách</Button></Link>
        </div>
      </Card>
    );
  }

  return <RoleCreateForm token={token} />;
}

function RoleCreateForm({ token }: { token: string | null }) {
  const router = useRouter();
  
  const modulesData = useQuery(api.admin.modules.listModules);
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const createRole = useMutation(api.roles.create);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = modulesData === undefined;

  // Get enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const showDescription = enabledFeatures.enableDescription ?? true;
  const showColor = enabledFeatures.enableColor ?? true;

  // Get permission modules (enabled modules that are not system-only)
  const permissionModules = useMemo(() => {
    if (!modulesData) {return [];}
    return modulesData
      .filter(m => m.enabled && isPermissionModule(m.key))
      .map(m => ({ key: m.key, label: m.name }));
  }, [modulesData]);

  const togglePermission = (module: string, action: PermissionAction) => {
    setPermissions(prev => {
      const moduleActions = getModuleActions(module);
      if (!moduleActions.includes(action)) {
        return prev;
      }
      const current = prev[module] || [];
      if (current.includes(action)) {
        return { ...prev, [module]: current.filter(a => a !== action) };
      }
        return { ...prev, [module]: [...current, action] };
      
    });
  };

  const toggleAllForModule = (module: string) => {
    setPermissions(prev => {
      const moduleActions = getModuleActions(module);
      const current = new Set(prev[module] || []);
      const hasAll = moduleActions.every((action) => current.has(action));
      if (hasAll) {
        moduleActions.forEach((action) => current.delete(action));
      } else {
        moduleActions.forEach((action) => current.add(action));
      }
      return { ...prev, [module]: Array.from(current) };
      
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập tên vai trò';
    } else if (name.length > 50) {
      newErrors.name = 'Tên vai trò tối đa 50 ký tự';
    }
    if (description.length > 200) {
      newErrors.description = 'Mô tả tối đa 200 ký tự';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {return;}
    if (!token) {
      toast.error('Thiếu token xác thực');
      return;
    }

    setIsSubmitting(true);
    try {
      await createRole({ 
        color: showColor ? color : undefined, 
        description: description.trim(),
        isSystem: false,
        name: name.trim(),
        permissions,
        token,
      });
      toast.success('Đã tạo vai trò mới');
      router.push('/admin/roles');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo vai trò');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Thêm vai trò mới</h1>
        <Link href="/admin/roles" className="text-sm text-blue-600 hover:underline">Quay lại danh sách</Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Tên vai trò <span className="text-red-500">*</span></Label>
              <CopyableInput
                value={name}
                onChange={(e) =>{  setName(e.target.value); }}
                copyLabel="tên vai trò"
                placeholder="Ví dụ: Biên tập viên..." 
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            {showDescription && (
              <div className="space-y-2">
                <Label>Mô tả</Label>
                <textarea 
                  className={`w-full min-h-[80px] rounded-md border ${errors.description ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  value={description}
                  onChange={(e) =>{  setDescription(e.target.value); }}
                  placeholder="Mô tả quyền hạn của vai trò này..."
                />
                {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
              </div>
            )}

            {showColor && (
              <div className="space-y-2">
                <Label>Màu sắc</Label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={color}
                    onChange={(e) =>{  setColor(e.target.value); }}
                    className="w-10 h-10 rounded cursor-pointer border border-slate-200 dark:border-slate-700"
                  />
                  <Input 
                    value={color}
                    onChange={(e) =>{  setColor(e.target.value); }}
                    placeholder="#3b82f6"
                    className="w-32"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân quyền chi tiết</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-6 gap-4 pb-2 border-b border-slate-200 dark:border-slate-700">
                <div className="font-medium text-sm text-slate-500">Module</div>
                <div className="text-center text-sm font-medium text-slate-500">Tất cả</div>
                {PERMISSION_ACTIONS.map(action => (
                  <div key={action} className="text-center text-sm font-medium text-slate-500">
                    {ACTION_LABELS[action]}
                  </div>
                ))}
              </div>
              {permissionModules.map(module => {
                const modulePerms = permissions[module.key] || [];
                const moduleActions = getModuleActions(module.key);
                const allChecked = moduleActions.every((action) => modulePerms.includes(action));
                return (
                  <div key={module.key} className="grid grid-cols-6 gap-4 items-center py-2">
                    <div className="font-medium text-slate-700 dark:text-slate-300">{module.label}</div>
                    <div className="flex justify-center">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() =>{  toggleAllForModule(module.key); }}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    {PERMISSION_ACTIONS.map(action => (
                      <div key={action} className="flex justify-center">
                        {moduleActions.includes(action) ? (
                          <input
                            type="checkbox"
                            checked={modulePerms.includes(action)}
                            onChange={() =>{  togglePermission(module.key, action); }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
              {permissionModules.length === 0 && (
                <p className="text-center text-slate-500 py-4">Không có module nào để phân quyền</p>
              )}
            </div>
          </CardContent>
        </Card>

        <HomeComponentStickyFooter
          isSubmitting={isSubmitting}
          onCancel={() =>{  router.push('/admin/roles'); }}
          submitLabel="Tạo vai trò"
          submittingLabel="Đang tạo..."
          disableSave={isSubmitting}
        />
      </form>
    </div>
  );
}
