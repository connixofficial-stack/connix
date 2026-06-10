export function buildPublicOrderLookupPath(orderNumber: string) {
  return `/tra-cuu-don-hang?orderNumber=${encodeURIComponent(orderNumber)}`;
}

export function buildAdminOrderDetailPath(orderId: string) {
  return `/admin/orders/${encodeURIComponent(orderId)}/edit`;
}

export function buildAbsoluteWebUrl(origin: string, path: string) {
  const normalizedOrigin = origin.trim().replace(/\/+$/, '') || 'http://localhost:3000';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedOrigin}${normalizedPath}`;
}
