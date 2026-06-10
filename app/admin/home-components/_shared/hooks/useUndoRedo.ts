'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UseUndoRedoReturn<T> {
  /** State hiện tại */
  state: T;
  /**
   * Set state mới — tự động push state cũ vào history.
   * Dùng thay thế cho setState thông thường.
   */
  set: (next: T | ((prev: T) => T)) => void;
  /** Undo về state trước */
  undo: () => void;
  /** Redo state đã undo */
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /**
   * Reset toàn bộ history (dùng khi load data mới từ DB / sau khi save).
   * Present = next, past/future đều rỗng.
   */
  reset: (next: T) => void;
}

/**
 * Generic hook quản lý undo/redo cho bất kỳ kiểu state nào.
 *
 * Pattern dùng:
 *   // Thay vì:
 *   const [slides, setSlides] = useState<HeroSlide[]>(initial);
 *
 *   // Dùng:
 *   const { state: slides, set: setSlides, undo, redo, canUndo, canRedo, reset } =
 *     useUndoRedo<HeroSlide[]>(initial, { maxHistory: 15 });
 *
 * Keyboard shortcut Ctrl+Z / Ctrl+Y được bind TẠI COMPONENT dùng UndoRedoToolbar.
 *
 * @param initialState - Giá trị khởi tạo (hỗ trợ lazy init dạng () => T)
 * @param options.maxHistory - Số bước tối đa lưu trong past (default: 10)
 */
export function useUndoRedo<T>(
  initialState: T | (() => T),
  options?: { maxHistory?: number }
): UseUndoRedoReturn<T> {
  const maxHistory = options?.maxHistory ?? 10;

  const [historyState, setHistoryState] = useState<UndoRedoState<T>>(() => ({
    future: [],
    past: [],
    present: typeof initialState === 'function'
      ? (initialState as () => T)()
      : initialState,
  }));

  // Dùng ref để tránh closure stale trong keyboard handler
  const canUndoRef = useRef(false);
  const canRedoRef = useRef(false);
  canUndoRef.current = historyState.past.length > 0;
  canRedoRef.current = historyState.future.length > 0;

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setHistoryState(prev => {
      const nextValue = typeof next === 'function'
        ? (next as (p: T) => T)(prev.present)
        : next;

      // Không push vào history nếu state không đổi (shallow ref check)
      if (Object.is(nextValue, prev.present)) { return prev; }

      const newPast = [...prev.past, prev.present];
      // Giới hạn maxHistory: bỏ item cũ nhất nếu tràn
      if (newPast.length > maxHistory) { newPast.shift(); }

      return {
        future: [],      // reset future mỗi khi set mới
        past: newPast,
        present: nextValue,
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.past.length === 0) { return prev; }
      const previous = prev.past[prev.past.length - 1];
      const newPast = prev.past.slice(0, -1);
      return {
        future: [prev.present, ...prev.future],
        past: newPast,
        present: previous,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryState(prev => {
      if (prev.future.length === 0) { return prev; }
      const next = prev.future[0];
      const newFuture = prev.future.slice(1);
      return {
        future: newFuture,
        past: [...prev.past, prev.present],
        present: next,
      };
    });
  }, []);

  const reset = useCallback((next: T) => {
    setHistoryState({ future: [], past: [], present: next });
  }, []);

  // Keyboard shortcut: Ctrl+Z (undo), Ctrl+Y / Ctrl+Shift+Z (redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (!ctrl) { return; }

      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndoRef.current) { undo(); }
        return;
      }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        if (canRedoRef.current) { redo(); }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    canRedo: historyState.future.length > 0,
    canUndo: historyState.past.length > 0,
    redo,
    reset,
    set,
    state: historyState.present,
    undo,
  };
}
