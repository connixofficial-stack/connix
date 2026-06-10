'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ChevronLeft, ChevronRight, Copy, Crown, Edit, Loader2, Plus, Search, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
import { BulkActionBar, ColumnToggle, SelectCheckbox, SortableHeader, useSortableData } from '../components/TableUtilities';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { useAdminAuth } from '../auth/context';

const MODULE_KEY = 'roles';

export default function RolesListPage() {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <RolesContent />
    </ModuleGuard>
  );
}

function RolesContent() {
  const { hasPermission, isLoading, token } = useAdminAuth();
  const canView = hasPermission(MODULE_KEY, 'view');
  const canCreate = hasPermission(MODULE_KEY, 'create');
  const canEdit = hasPermission(MODULE_KEY, 'edit');
  const canDelete = hasPermission(MODULE_KEY, 'delete');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!canView) {
    return (
      <Card className="p-8 text-center">
        <ShieldOff size={40} className="mx-auto text-slate-400 mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Không có quyền truy cập</h2>
        <p className="text-slate-500 mt-2">Bạn không có quyền xem module Vai trò.</p>
        <div className="mt-6">
          <Link href="/admin/dashboard"><Button>Quay lại Dashboard</Button></Link>
        </div>
      </Card>
    );
  }

  return (
    <RolesTable
      canCreate={canCreate}
      canDelete={canDelete}
      canEdit={canEdit}
      token={token}
    />
  );
}

function RolesTable({
  canCreate,
  canDelete,
  canEdit,
  token,
}: {
  canCreate: boolean;
  canDelete: boolean;
  canEdit: boolean;
  token: string | null;
}) {
  const rolesData = useQuery(api.roles.listAll);
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const userCountByRole = useQuery(api.roles.getUserCountByRole);
  
  const deleteRole = useMutation(api.roles.remove);
  const bulkDeleteRoles = useMutation(api.roles.bulkRemove);
  const cloneRole = useMutation(api.roles.clone);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' }>({ direction: 'asc', key: null });
  const [visibleColumns, setVisibleColumns] = useState(['select', 'name', 'description', 'usersCount', 'type', 'actions']);
  const [selectedIds, setSelectedIds] = useState<Id<"roles">[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<Id<"roles"> | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [cloningRoleId, setCloningRoleId] = useState<Id<"roles"> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const selectionEnabled = canDelete;

  const isLoading = rolesData === undefined || settingsData === undefined;

  // Get settings
  const rolesPerPage = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'rolesPerPage');
    return (setting?.value as number) || 10;
  }, [settingsData]);

  // Get enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  const showDescription = enabledFeatures.enableDescription ?? true;
  const showColor = enabledFeatures.enableColor ?? true;
  const showActions = canEdit || canDelete || canCreate;

  // Map roleId to userCount
  const userCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    userCountByRole?.forEach(r => { map[r.roleId] = r.userCount; });
    return map;
  }, [userCountByRole]);

  const deleteInfo = useQuery(
    api.roles.getDeleteInfo,
    deleteTargetId ? { id: deleteTargetId } : 'skip'
  );

  // Transform data
  const roles = useMemo(() => rolesData?.map(role => ({
      ...role,
      id: role._id,
      usersCount: userCountMap[role._id] ?? 0,
    })) ?? [], [rolesData, userCountMap]);

  // Build columns based on features
  const columns = useMemo(() => {
    const cols = [] as { key: string; label: string; required?: boolean }[];
    if (selectionEnabled) {
      cols.push({ key: 'select', label: 'Chọn' });
    }
    cols.push({ key: 'name', label: 'Tên vai trò', required: true });
    if (showDescription) {
      cols.push({ key: 'description', label: 'Mô tả' });
    }
    cols.push({ key: 'usersCount', label: 'Số người dùng' });
    cols.push({ key: 'type', label: 'Loại' });
    if (showActions) {
      cols.push({ key: 'actions', label: 'Hành động', required: true });
    }
    return cols;
  }, [selectionEnabled, showActions, showDescription]);

  const resolvedVisibleColumns = useMemo(() => (
    visibleColumns.filter((key) => {
      if (key === 'select') {return selectionEnabled;}
      if (key === 'actions') {return showActions;}
      return true;
    })
  ), [visibleColumns, selectionEnabled, showActions]);

  // Filter data
  const filteredData = useMemo(() => {
    let data = [...roles];
    if (searchTerm) {
      data = data.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType === 'system') {
      data = data.filter(r => r.isSystem);
    } else if (filterType === 'custom') {
      data = data.filter(r => !r.isSystem);
    }
    return data;
  }, [roles, searchTerm, filterType]);

  const sortedData = useSortableData(filteredData, sortConfig);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / rolesPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rolesPerPage;
    return sortedData.slice(start, start + rolesPerPage);
  }, [sortedData, currentPage, rolesPerPage]);

  // Only non-system roles are selectable
  const selectableRoles = paginatedData.filter(r => !r.isSystem);
  const resolvedSelectedIds = selectionEnabled ? selectedIds : [];

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc', key }));
    setCurrentPage(1);
  };

  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleSelectAll = () => {
    if (!selectionEnabled) {return;}
    setSelectedIds(selectedIds.length === selectableRoles.length ? [] : selectableRoles.map(r => r._id));
  };

  const toggleSelectItem = (id: Id<"roles">) => {
    if (!selectionEnabled) {return;}
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (id: Id<"roles">) => {
    if (!canDelete) {return;}
    const role = roles.find(r => r._id === id);
    if (role?.isSystem) {
      toast.error('Không thể xóa vai trò hệ thống');
      return;
    }
    setDeleteTargetId(id);
    setIsDeleteOpen(true);
  };

  const handleCloneRole = async (id: Id<"roles">) => {
    if (!canCreate) {return;}
    if (!token) {
      toast.error('Thiếu token xác thực');
      return;
    }
    setCloningRoleId(id);
    try {
      await cloneRole({ id, token });
      toast.success('Đã nhân bản vai trò');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi nhân bản vai trò');
    } finally {
      setCloningRoleId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) {return;}
    if (!token) {
      toast.error('Thiếu token xác thực');
      return;
    }
    setIsDeleteLoading(true);
    try {
      await deleteRole({ cascade: true, id: deleteTargetId, token });
      toast.success('Đã xóa vai trò');
      setIsDeleteOpen(false);
      setDeleteTargetId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi xóa vai trò');
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (resolvedSelectedIds.length === 0) {return;}
    if (!selectionEnabled) {return;}
    setIsBulkDeleteOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (resolvedSelectedIds.length === 0) {return;}
    if (!token) {
      toast.error('Thiếu token xác thực');
      return;
    }
    setIsBulkDeleting(true);
    try {
      const count = resolvedSelectedIds.length;
      await bulkDeleteRoles({ cascade: true, ids: resolvedSelectedIds, token });
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      toast.success(`Đã xóa ${count} vai trò`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi xóa vai trò');
    } finally {
      setIsBulkDeleting(false);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Phân quyền vai trò</h1>
          <p className="text-sm text-slate-500">Định nghĩa quyền truy cập cho từng nhóm người dùng</p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Link href="/admin/roles/create">
              <Button className="gap-2"><Plus size={16}/> Thêm vai trò</Button>
            </Link>
          )}
        </div>
      </div>

      {selectionEnabled && (
        <BulkActionBar
          selectedCount={resolvedSelectedIds.length}
          entityLabel="vai trò"
          onDelete={handleBulkDelete}
          onClearSelection={() =>{  setSelectedIds([]); }}
          isLoading={isBulkDeleting}
        />
      )}

      <Card>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Tìm vai trò..." 
                className="pl-9 w-48" 
                value={searchTerm} 
                onChange={(e) =>{  handleSearchChange(e.target.value); }} 
              />
            </div>
            <select 
              className="h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" 
              value={filterType} 
              onChange={(e) =>{  handleFilterChange(e.target.value); }}
            >
              <option value="">Tất cả loại</option>
              <option value="system">Hệ thống</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
          </div>
          <ColumnToggle columns={columns} visibleColumns={resolvedVisibleColumns} onToggle={toggleColumn} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {resolvedVisibleColumns.includes('select') && (
                <TableHead className="w-[40px]">
                  <SelectCheckbox 
                    checked={resolvedSelectedIds.length === selectableRoles.length && selectableRoles.length > 0} 
                    onChange={toggleSelectAll} 
                    indeterminate={resolvedSelectedIds.length > 0 && resolvedSelectedIds.length < selectableRoles.length} 
                  />
                </TableHead>
              )}
              {resolvedVisibleColumns.includes('name') && (
                <SortableHeader label="Tên vai trò" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />
              )}
              {resolvedVisibleColumns.includes('description') && showDescription && (
                <TableHead>Mô tả</TableHead>
              )}
              {resolvedVisibleColumns.includes('usersCount') && (
                <SortableHeader label="Số người dùng" sortKey="usersCount" sortConfig={sortConfig} onSort={handleSort} className="text-center" />
              )}
              {resolvedVisibleColumns.includes('type') && (
                <TableHead className="text-center">Loại</TableHead>
              )}
              {resolvedVisibleColumns.includes('actions') && (
                <TableHead className="text-right">Hành động</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map(role => (
              <TableRow key={role._id} className={resolvedSelectedIds.includes(role._id) ? 'bg-blue-500/5' : ''}>
                {resolvedVisibleColumns.includes('select') && (
                  <TableCell>
                    {role.isSystem ? (
                      <span className="w-4 h-4 block" title="Không thể chọn vai trò hệ thống" />
                    ) : (
                      <SelectCheckbox checked={resolvedSelectedIds.includes(role._id)} onChange={() =>{  toggleSelectItem(role._id); }} />
                    )}
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('name') && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: showColor && role.color ? `${role.color}20` : 'rgb(59 130 246 / 0.1)' }}
                      >
                        <Shield size={16} style={{ color: showColor && role.color ? role.color : '#3b82f6' }} />
                      </div>
                      <span className="font-medium">{role.name}</span>
                      {role.isSuperAdmin && (
                        <span title="Super Admin"><Crown size={14} className="text-amber-500" /></span>
                      )}
                    </div>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('description') && showDescription && (
                  <TableCell className="text-slate-500 max-w-[300px] truncate">{role.description}</TableCell>
                )}
                {resolvedVisibleColumns.includes('usersCount') && (
                  <TableCell className="text-center">
                    <Badge variant="secondary">{role.usersCount}</Badge>
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('type') && (
                  <TableCell className="text-center">
                    {role.isSystem ? (
                      <Badge variant="info">Hệ thống</Badge>
                    ) : (
                      <Badge variant="secondary">Tùy chỉnh</Badge>
                    )}
                  </TableCell>
                )}
                {resolvedVisibleColumns.includes('actions') && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {canCreate && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { void handleCloneRole(role._id); }}
                          disabled={cloningRoleId === role._id}
                          title="Nhân bản"
                        >
                          {cloningRoleId === role._id ? <Loader2 size={16} className="animate-spin" /> : <Copy size={16} />}
                        </Button>
                      )}
                      {canEdit && (
                        <Link href={`/admin/roles/${role._id}/edit`}>
                          <Button variant="ghost" size="icon"><Edit size={16}/></Button>
                        </Link>
                      )}
                      {canDelete && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className={role.isSystem ? "text-slate-300 cursor-not-allowed" : "text-red-500 hover:text-red-600"} 
                          onClick={ async () => handleDelete(role._id)}
                          disabled={role.isSystem}
                          title={role.isSystem ? "Không thể xóa vai trò hệ thống" : "Xóa"}
                        >
                          <Trash2 size={16}/>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={resolvedVisibleColumns.length} className="text-center py-8 text-slate-500">
                  {searchTerm || filterType ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có vai trò nào'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {sortedData.length > 0 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Hiển thị {(currentPage - 1) * rolesPerPage + 1} - {Math.min(currentPage * rolesPerPage, sortedData.length)} / {sortedData.length} vai trò
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() =>{  setCurrentPage(p => p - 1); }}
                >
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() =>{  setCurrentPage(p => p + 1); }}
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          setIsDeleteOpen(open);
          if (!open) {setDeleteTargetId(null);}
        }}
        title="Xóa vai trò"
        itemName={roles.find((role) => role._id === deleteTargetId)?.name ?? 'vai trò'}
        dependencies={deleteInfo?.dependencies ?? []}
        onConfirm={async () => handleConfirmDelete()}
        isLoading={isDeleteLoading}
      />
      <DeleteConfirmDialog
        open={isBulkDeleteOpen}
        onOpenChange={(open) => {
          setIsBulkDeleteOpen(open);
        }}
        title="Xóa vai trò"
        itemName={`${resolvedSelectedIds.length} vai trò`}
        dependencies={[]}
        onConfirm={async () => handleConfirmBulkDelete()}
        isLoading={isBulkDeleting}
      />
    </div>
  );
}
