import type { Dispatch, SetStateAction } from 'react';

interface UseDemoItemListOptions<T extends { id: string }> {
  /** Trả về 1 item mới (chưa có id) */
  createEmpty: () => Omit<T, 'id'>;
  /** Danh sách mẫu mặc định (chưa có id) */
  defaults: Omit<T, 'id'>[];
  /** Số lượng tối thiểu — không cho xóa nếu còn đúng minItems. Mặc định: 1 */
  minItems?: number;
}

export interface DemoItemListActions<T extends { id: string }> {
  /** Thêm 1 item mới (id tự tạo) */
  add: () => void;
  /** Patch partial fields cho item theo id */
  update: (id: string, patch: Partial<T>) => void;
  /** Xóa item theo id (bảo vệ minItems) */
  remove: (id: string) => void;
  /** Nạp danh sách mẫu mặc định (tạo id mới để tránh conflict) */
  loadDefault: () => void;
}

/**
 * Generic hook quản lý CRUD danh sách demo items.
 * Dùng chung cho mọi home-component có selectionMode = 'demo'.
 *
 * @example
 * const { add, update, remove, loadDefault } = useDemoItemList(demoPosts, setDemoPosts, {
 *   createEmpty: () => ({ title: '', thumbnail: '', link: '' }),
 *   defaults: DEFAULT_DEMO_BLOG_POSTS,
 * });
 */
export function useDemoItemList<T extends { id: string }>(
  items: T[],
  setItems: Dispatch<SetStateAction<T[]>>,
  opts: UseDemoItemListOptions<T>,
): DemoItemListActions<T> {
  const { createEmpty, defaults, minItems = 1 } = opts;

  const add = () => {
    setItems((prev) => [
      ...prev,
      { ...createEmpty(), id: `demo-${Date.now()}` } as T,
    ]);
  };

  const update = (id: string, patch: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const remove = (id: string) => {
    if (items.length <= minItems) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const loadDefault = () => {
    setItems(
      defaults.map((d, i) => ({ ...d, id: `demo-${Date.now() + i}` }) as T),
    );
  };

  return { add, update, remove, loadDefault };
}
