import { HOME_COMPONENT_BASE_TYPES } from '@/lib/home-components/componentTypes';

const TYPE_ROUTE_MAP = new Map(HOME_COMPONENT_BASE_TYPES.map((type) => [type.value, type.route]));

export const getTypeRoute = (type: string) => TYPE_ROUTE_MAP.get(type) ?? null;

export const getCreateRoute = (type: string) => {
  const route = getTypeRoute(type);
  return route ? `/admin/home-components/create/${route}` : null;
};

export const getEditRoute = (type: string, id: string) => {
  const route = getTypeRoute(type);
  return route ? `/admin/home-components/${route}/${id}/edit` : null;
};
