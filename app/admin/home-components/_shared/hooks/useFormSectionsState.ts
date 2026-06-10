'use client';

import React from 'react';

type ToggleAllController = {
  hasClosedSection: boolean;
  setAll: (open: boolean) => void;
};

const formSectionControllers = new Map<string, ToggleAllController>();
const formSectionListeners = new Set<() => void>();
const emptyFormSectionSnapshot: ToggleAllController[] = [];
let formSectionSnapshot: ToggleAllController[] = [];

function emitFormSectionChange() {
  formSectionSnapshot = Array.from(formSectionControllers.values());
  formSectionListeners.forEach((listener) => listener());
}

function subscribeFormSectionToggle(listener: () => void) {
  formSectionListeners.add(listener);
  return () => {
    formSectionListeners.delete(listener);
  };
}

function getFormSectionSnapshot() {
  return formSectionSnapshot;
}

function getServerFormSectionSnapshot() {
  return emptyFormSectionSnapshot;
}

export function useGlobalFormSectionsToggle() {
  const controllers = React.useSyncExternalStore(
    subscribeFormSectionToggle,
    getFormSectionSnapshot,
    getServerFormSectionSnapshot,
  );
  const hasClosedSection = controllers.some((controller) => controller.hasClosedSection);

  const handleToggleAll = React.useCallback(() => {
    const nextOpenState = hasClosedSection;
    controllers.forEach((controller) => controller.setAll(nextOpenState));
  }, [controllers, hasClosedSection]);

  return {
    hasClosedSection,
    handleToggleAll,
    hasControllers: controllers.length > 0,
  };
}

/**
 * Hook quản lý trạng thái đóng/mở của các section trong Home Component Form.
 * Hỗ trợ tự động thu gọn/mở rộng tất cả các section đang hiển thị.
 * 
 * @param activeKeys Danh sách key của các section đang hoạt động trên màn hình
 * @param defaultExpanded Trạng thái mở rộng mặc định (true = mở rộng hết, false = thu gọn hết)
 */
export function useFormSectionsState<K extends string>(
  activeKeys: K[],
  defaultExpanded: boolean = true
) {
  const [openSections, setOpenSections] = React.useState<Record<K, boolean>>(() => {
    const initialState = {} as Record<K, boolean>;
    activeKeys.forEach((key) => {
      initialState[key] = defaultExpanded;
    });
    return initialState;
  });

  const activeKeysJson = JSON.stringify(activeKeys);

  // Đồng bộ khi defaultExpanded thay đổi
  React.useEffect(() => {
    setOpenSections((prev) => {
      const updated = { ...prev };
      activeKeys.forEach((key) => {
        updated[key] = defaultExpanded;
      });
      return updated;
    });
  }, [defaultExpanded, activeKeysJson]);

  const hasClosedSection = React.useMemo(() => {
    return activeKeys.some((key) => !openSections[key]);
  }, [activeKeys, openSections]);

  const toggleSection = React.useCallback((key: K, open?: boolean) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: open !== undefined ? open : !prev[key],
    }));
  }, []);

  const handleToggleAll = React.useCallback(() => {
    const nextState = hasClosedSection;
    setOpenSections((prev) => {
      const updated = { ...prev };
      activeKeys.forEach((key) => {
        updated[key] = nextState;
      });
      return updated;
    });
  }, [activeKeys, hasClosedSection]);

  const controllerId = React.useId();
  React.useEffect(() => {
    formSectionControllers.set(controllerId, {
      hasClosedSection,
      setAll: (open) => {
        setOpenSections((prev) => {
          const updated = { ...prev };
          activeKeys.forEach((key) => {
            updated[key] = open;
          });
          return updated;
        });
      },
    });
    emitFormSectionChange();

    return () => {
      formSectionControllers.delete(controllerId);
      emitFormSectionChange();
    };
  }, [activeKeysJson, controllerId, hasClosedSection]);

  return {
    openSections,
    setOpenSections,
    hasClosedSection,
    toggleSection,
    handleToggleAll,
  };
}
