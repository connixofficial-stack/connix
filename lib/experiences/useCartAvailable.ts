import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

type CartAvailability = {
  isAvailable: boolean;
  isLoading: boolean;
  cartEnabled: boolean;
  ordersEnabled: boolean;
  hasCartProvider: boolean;
};

export function useCartAvailable(): CartAvailability {
  const capabilities = useQuery(api.cart.getCommerceCapabilities, {});

  const isLoading = capabilities === undefined;
  const cartEnabled = capabilities?.cartEnabled ?? false;
  const ordersEnabled = capabilities?.ordersEnabled ?? false;
  const hasCartProvider = capabilities?.hasCartProvider ?? false;
  const isAvailable = capabilities?.cartAvailable ?? false;

  return { cartEnabled, hasCartProvider, isAvailable, isLoading, ordersEnabled };
}
