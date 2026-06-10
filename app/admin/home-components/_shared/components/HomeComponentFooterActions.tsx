'use client';

import React, { useEffect, useId, useSyncExternalStore } from 'react';

type FooterActionEntry = {
  instanceId: string;
  node: React.ReactNode;
};

const actionStacks = new Map<string, FooterActionEntry[]>();
const listeners = new Set<() => void>();
const emptySnapshot: { key: string; node: React.ReactNode | null }[] = [];
let snapshot: { key: string; node: React.ReactNode | null }[] = [];

function emitChange() {
  snapshot = Array.from(actionStacks.entries()).map(([key, entries]) => ({
    key,
    node: entries.at(-1)?.node ?? null,
  }));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Đồng bộ hóa tức thì các action đã đăng ký trước khi subscribe bằng microtask.
  // Giúp giải quyết triệt để timing mismatch ở trang Create (SSR/Hydration).
  void Promise.resolve().then(() => {
    if (listeners.has(listener)) {
      listener();
    }
  });
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return emptySnapshot;
}

function registerFooterAction(key: string, entry: FooterActionEntry) {
  const entries = actionStacks.get(key) ?? [];
  const nextEntries = [...entries.filter((item) => item.instanceId !== entry.instanceId), entry];
  actionStacks.set(key, nextEntries);
  emitChange();

  return () => {
    const currentEntries = actionStacks.get(key) ?? [];
    const remainingEntries = currentEntries.filter((item) => item.instanceId !== entry.instanceId);
    if (remainingEntries.length > 0) {
      actionStacks.set(key, remainingEntries);
    } else {
      actionStacks.delete(key);
    }
    emitChange();
  };
}

export function HomeComponentFooterActionPortal({
  actionKey = 'ai-import',
  children,
  deps = [],
}: {
  actionKey?: string;
  children: React.ReactNode;
  deps?: React.DependencyList;
}) {
  const instanceId = useId();
  const childrenRef = React.useRef(children);
  childrenRef.current = children;

  useEffect(() => {
    const entry: FooterActionEntry = {
      instanceId,
      node: <PortalNodeWrapper childrenRef={childrenRef} />,
    };
    return registerFooterAction(actionKey, entry);
  }, [actionKey, instanceId, ...deps]);

  return null;
}

function PortalNodeWrapper({
  childrenRef,
}: {
  childrenRef: React.MutableRefObject<React.ReactNode>;
}) {
  return <>{childrenRef.current}</>;
}

export function useHomeComponentFooterActions() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).filter((entry) => entry.node !== null);
}
