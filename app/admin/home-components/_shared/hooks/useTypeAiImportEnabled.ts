'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { HOME_COMPONENT_BASE_TYPES, HOME_COMPONENT_TYPE_VALUES } from '@/lib/home-components/componentTypes';

const TYPE_SET = new Set(HOME_COMPONENT_TYPE_VALUES);
const ROUTE_TO_TYPE = new Map(HOME_COMPONENT_BASE_TYPES.map((item) => [item.route, item.value]));

const resolveTypeFromPathname = (pathname: string | null) => {
  const segments = pathname?.split('/').filter(Boolean) ?? [];
  for (const segment of segments) {
    if (TYPE_SET.has(segment)) {
      return segment;
    }
    const type = ROUTE_TO_TYPE.get(segment);
    if (type) {
      return type;
    }
  }
  return null;
};

export function useTypeAiImportEnabled(type?: string) {
  const pathname = usePathname();
  const config = useQuery(api.homeComponentSystemConfig.getConfig);
  const resolvedType = useMemo(() => {
    if (type && TYPE_SET.has(type)) {
      return type;
    }
    return resolveTypeFromPathname(pathname);
  }, [pathname, type]);

  if (!resolvedType) {
    return true;
  }

  if (config === undefined) {
    return false;
  }

  return config?.typeAiImportOverrides?.[resolvedType]?.enabled ?? true;
}
