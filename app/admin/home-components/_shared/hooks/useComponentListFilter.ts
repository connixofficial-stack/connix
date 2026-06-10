'use client';

import { useMemo, useState } from 'react';

export interface ComponentListItem {
  _id: string;
  title: string;
  type: string;
  active: boolean;
}

export type StatusFilter = 'all' | 'active' | 'inactive';

export interface UseComponentListFilterReturn {
  /** Danh sách đã lọc — dùng thay thế cho `components` gốc */
  filtered: ComponentListItem[];
  search: string;
  setSearch: (v: string) => void;
  typeFilter: string;               // '' = tất cả types
  setTypeFilter: (v: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  /** Reset tất cả filter về mặc định */
  resetFilters: () => void;
  /** true khi có ít nhất 1 filter đang active — dùng để hiện clear button */
  hasActiveFilter: boolean;
  /** Danh sách type duy nhất từ data hiện có — dùng cho dropdown */
  availableTypes: string[];
}

/**
 * Hook source of truth cho filter/search trên danh sách home components.
 *
 * Logic lọc 100% client-side (đã có limit 100 ở Convex query).
 * Không fetch thêm gì từ server.
 *
 * Usage:
 *   const { filtered, search, setSearch, typeFilter, setTypeFilter,
 *           statusFilter, setStatusFilter, resetFilters, hasActiveFilter, availableTypes } =
 *     useComponentListFilter(components);
 *
 *   // Dùng `filtered` thay vì `components` gốc trong render
 *   {filtered.map(comp => <SortableRow key={comp._id} comp={comp} />)}
 */
export function useComponentListFilter(
  components: ComponentListItem[] | undefined
): UseComponentListFilterReturn {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Derived: danh sách type duy nhất, sort alphabetically
  const availableTypes = useMemo(() => {
    if (!components) { return []; }
    return Array.from(new Set(components.map(c => c.type))).sort();
  }, [components]);

  // Derived: filter logic
  const filtered = useMemo(() => {
    if (!components) { return []; }

    const searchLower = search.trim().toLowerCase();

    return components.filter(c => {
      // Filter 1: search theo title và type
      if (searchLower) {
        const matchTitle = c.title.toLowerCase().includes(searchLower);
        const matchType = c.type.toLowerCase().includes(searchLower);
        if (!matchTitle && !matchType) { return false; }
      }

      // Filter 2: type
      if (typeFilter && c.type !== typeFilter) { return false; }

      // Filter 3: status
      if (statusFilter === 'active' && !c.active) { return false; }
      if (statusFilter === 'inactive' && c.active) { return false; }

      return true;
    });
  }, [components, search, typeFilter, statusFilter]);

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('all');
  };

  const hasActiveFilter = search.trim() !== '' || typeFilter !== '' || statusFilter !== 'all';

  return {
    availableTypes,
    filtered,
    hasActiveFilter,
    resetFilters,
    search,
    setSearch,
    setStatusFilter,
    setTypeFilter,
    statusFilter,
    typeFilter,
  };
}
