'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { useCustomerAuth } from '@/app/(site)/auth/context';

type CartItem = {
  _id: Id<'cartItems'>;
  cartId: Id<'carts'>;
  itemType?: 'product' | 'service' | 'course' | 'resource';
  price: number;
  productId?: Id<'products'>;
  serviceId?: Id<'services'>;
  courseId?: Id<'courses'>;
  resourceId?: Id<'resources'>;
  productImage?: string;
  productName: string;
  quantity: number;
  subtotal: number;
  variantId?: Id<'productVariants'>;
};

type Cart = {
  _id: Id<'carts'>;
  customerId?: Id<'customers'>;
  expiresAt?: number;
  itemsCount: number;
  note?: string;
  status: 'Active' | 'Converted' | 'Abandoned';
  totalAmount: number;
};

type CartContextValue = {
  cart: Cart | null;
  items: CartItem[];
  itemsCount: number;
  totalAmount: number;
  isLoading: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (
    item: Id<'products'> | {
      itemType: 'product';
      productId: Id<'products'>;
      quantity?: number;
      variantId?: Id<'productVariants'>;
    } | {
      itemType: 'service';
      serviceId: Id<'services'>;
      quantity?: number;
    } | {
      itemType: 'course';
      courseId: Id<'courses'>;
      quantity?: number;
    } | {
      itemType: 'resource';
      resourceId: Id<'resources'>;
      quantity?: number;
    },
    quantity?: number,
    variantId?: Id<'productVariants'>,
    options?: { silent?: boolean }
  ) => Promise<boolean>;
  removeItem: (itemId: Id<'cartItems'>) => Promise<void>;
  updateQuantity: (itemId: Id<'cartItems'>, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<void>;
  updateNote: (note?: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Khởi tạo/lấy Session ID vãng lai cho khách ẩn danh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('guest_session_id');
      if (!id) {
        id = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
        localStorage.setItem('guest_session_id', id);
      }
      setSessionId(id);
    }
  }, []);

  // Query giỏ hàng theo Customer ID (nếu đã đăng nhập) hoặc Session ID (nếu chưa đăng nhập)
  const customerCart = useQuery(
    api.cart.getByCustomer,
    isAuthenticated && customer ? { customerId: customer.id as Id<'customers'> } : 'skip'
  );

  const sessionCart = useQuery(
    api.cart.getBySession,
    !isAuthenticated && sessionId ? { sessionId } : 'skip'
  );

  const cart = isAuthenticated ? customerCart : sessionCart;

  const items = useQuery(
    api.cart.listCartItems,
    cart?._id ? { cartId: cart._id } : 'skip'
  );
  const normalizedItems = useMemo(() => (items ?? []).map((item) => {
    if ((item.itemType ?? 'product') !== 'course' && item.itemType !== 'resource') {
      return item;
    }
    return {
      ...item,
      quantity: 1,
      subtotal: item.price,
    };
  }), [items]);
  const normalizedItemsCount = useMemo(
    () => normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
    [normalizedItems]
  );
  const normalizedTotalAmount = useMemo(
    () => normalizedItems.reduce((sum, item) => sum + item.subtotal, 0),
    [normalizedItems]
  );
  const normalizedCart = useMemo<Cart | null>(() => {
    if (!cart) {
      return null;
    }
    if (items === undefined) {
      return cart;
    }
    return {
      ...cart,
      itemsCount: normalizedItemsCount,
      totalAmount: normalizedTotalAmount,
    };
  }, [cart, items, normalizedItemsCount, normalizedTotalAmount]);

  const createCart = useMutation(api.cart.create);
  const addItemMutation = useMutation(api.cart.addItem);
  const removeItemMutation = useMutation(api.cart.removeItem);
  const updateQuantityMutation = useMutation(api.cart.updateItemQuantity);
  const clearCartMutation = useMutation(api.cart.clearCart);
  const updateNoteMutation = useMutation(api.cart.updateNote);
  const mergeCartMutation = useMutation(api.cart.mergeCart);

  // Tự động gộp giỏ hàng vãng lai khi đăng nhập thành công
  useEffect(() => {
    if (isAuthenticated && customer && sessionId) {
      mergeCartMutation({ customerId: customer.id as Id<'customers'>, sessionId })
        .then((res) => {
          if (res.ok && res.merged) {
            toast.success('Đã gộp giỏ hàng vãng lai vào tài khoản của bạn.');
          }
        })
        .catch((err) => {
          console.error('Lỗi khi gộp giỏ hàng:', err);
        });
    }
  }, [isAuthenticated, customer, sessionId, mergeCartMutation]);

  const isLoading = Boolean(
    (isAuthenticated && (customerCart === undefined || (customerCart && items === undefined))) ||
    (!isAuthenticated && sessionId && (sessionCart === undefined || (sessionCart && items === undefined)))
  );

  const runSafely = useCallback(async (
    action: () => Promise<{ ok: boolean; error?: string }>,
    fallbackMessage: string,
    silent?: boolean
  ) => {
    try {
      const result = await action();
      if (!result.ok) {
        if (!silent) {
          toast.error(result.error ?? fallbackMessage);
        }
        return false;
      }
      return true;
    } catch (error) {
      if (!silent) {
        toast.error(error instanceof Error ? error.message : fallbackMessage);
      }
      return false;
    }
  }, []);

  const addItem = useCallback(async (
    itemInput: Id<'products'> | {
      itemType: 'product';
      productId: Id<'products'>;
      quantity?: number;
      variantId?: Id<'productVariants'>;
    } | {
      itemType: 'service';
      serviceId: Id<'services'>;
      quantity?: number;
    } | {
      itemType: 'course';
      courseId: Id<'courses'>;
      quantity?: number;
    } | {
      itemType: 'resource';
      resourceId: Id<'resources'>;
      quantity?: number;
    },
    quantity = 1,
    variantId?: Id<'productVariants'>,
    options?: { silent?: boolean }
  ) => {
    if (cart === undefined) {
      return false;
    }

    return runSafely(async () => {
      const activeCartId = cart?._id ?? await createCart({
        customerId: isAuthenticated && customer ? (customer.id as Id<'customers'>) : undefined,
        sessionId: !isAuthenticated && sessionId ? sessionId : undefined
      });
      const payload = typeof itemInput === 'string'
        ? { cartId: activeCartId, itemType: 'product' as const, productId: itemInput, quantity, variantId }
        : {
            cartId: activeCartId,
            ...itemInput,
            quantity: itemInput.itemType === 'course' || itemInput.itemType === 'resource' ? 1 : (itemInput.quantity ?? quantity),
            variantId: itemInput.itemType === 'product' ? (itemInput.variantId ?? variantId) : undefined,
          };
      return addItemMutation(payload);
    }, 'Không thể thêm sản phẩm vào giỏ hàng.', options?.silent);
  }, [addItemMutation, cart, createCart, customer, isAuthenticated, sessionId, runSafely]);

  const removeItem = useCallback(async (itemId: Id<'cartItems'>) => {
    await removeItemMutation({ itemId });
  }, [removeItemMutation]);

  const updateQuantity = useCallback(async (itemId: Id<'cartItems'>, quantity: number) => {
    return runSafely(async () => {
      return updateQuantityMutation({ itemId, quantity });
    }, 'Không thể cập nhật số lượng.');
  }, [runSafely, updateQuantityMutation]);

  const clearCart = useCallback(async () => {
    if (!cart?._id) {
      return;
    }
    await clearCartMutation({ cartId: cart._id });
  }, [cart, clearCartMutation]);

  const updateNote = useCallback(async (note?: string) => {
    if (!cart?._id) {
      return;
    }
    await updateNoteMutation({ id: cart._id, note });
  }, [cart, updateNoteMutation]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(() => ({
    cart: normalizedCart,
    items: normalizedItems,
    itemsCount: normalizedCart?.itemsCount ?? 0,
    totalAmount: normalizedCart?.totalAmount ?? 0,
    isLoading,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    updateNote,
  }), [addItem, clearCart, closeDrawer, isDrawerOpen, isLoading, normalizedCart, normalizedItems, openDrawer, removeItem, updateNote, updateQuantity]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
