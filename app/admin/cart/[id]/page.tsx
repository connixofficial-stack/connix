'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, Loader2, Package, ShoppingCart, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui';

type CartStatus = 'Active' | 'Converted' | 'Abandoned';

const STATUS_COLORS: Record<CartStatus, 'default' | 'success' | 'destructive'> = {
  Abandoned: 'destructive',
  Active: 'default',
  Converted: 'success',
};

const STATUS_LABELS: Record<CartStatus, string> = {
  Abandoned: 'Bỏ dở',
  Active: 'Hoạt động',
  Converted: 'Đã đặt hàng',
};

const itemTypeLabel = (itemType?: 'product' | 'service' | 'course' | 'resource') => {
  if (itemType === 'service') return 'Dịch vụ';
  if (itemType === 'course') return 'Khóa học';
  if (itemType === 'resource') return 'Tài nguyên';
  return 'Sản phẩm';
};

export default function CartDetailPage() {
  const router = useRouter();
  const params = useParams();
  const cartId = params.id as Id<"carts">;

  const cartData = useQuery(api.cart.getById, { id: cartId });
  const cartItemsData = useQuery(api.cart.listCartItems, { cartId });
  const customerData = useQuery(api.customers.getById, cartData?.customerId ? { id: cartData.customerId } : "skip");
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: 'cart' });

  const updateStatus = useMutation(api.cart.updateStatus);
  const updateNote = useMutation(api.cart.updateNote);
  const removeItem = useMutation(api.cart.removeItem);
  const clearCart = useMutation(api.cart.clearCart);
  const deleteCart = useMutation(api.cart.remove);

  const [status, setStatus] = useState<CartStatus | ''>('');
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const isLoading = cartData === undefined || cartItemsData === undefined;

  // Get enabled features
  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(f => { features[f.featureKey] = f.enabled; });
    return features;
  }, [featuresData]);

  // Sync state when data loads
  React.useEffect(() => {
    if (cartData) {
      setStatus(cartData.status as CartStatus);
      setNote(cartData.note ?? '');
    }
  }, [cartData]);

  const handleUpdateStatus = async (newStatus: CartStatus) => {
    setIsUpdating(true);
    try {
      await updateStatus({ id: cartId, status: newStatus });
      setStatus(newStatus);
      toast.success('Đã cập nhật trạng thái');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateNote = async () => {
    setIsUpdating(true);
    try {
      await updateNote({ id: cartId, note: note || undefined });
      toast.success('Đã cập nhật ghi chú');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId: Id<"cartItems">) => {
    if (confirm('Xóa mục này khỏi giỏ hàng?')) {
      try {
        await removeItem({ itemId });
        toast.success('Đã xóa mục');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
      }
    }
  };

  const handleClearCart = async () => {
    if (confirm('Xóa tất cả mục trong giỏ hàng?')) {
      try {
        await clearCart({ cartId });
        toast.success('Đã xóa tất cả sản phẩm');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
      }
    }
  };

  const handleDeleteCart = async () => {
    if (confirm('Xóa giỏ hàng này? Hành động này không thể hoàn tác.')) {
      try {
        await deleteCart({ id: cartId });
        toast.success('Đã xóa giỏ hàng');
        router.push('/admin/cart');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
      }
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString('vi-VN');

  // Check if note changed
  const noteChanged = useMemo(() => note !== (cartData?.note ?? ''), [note, cartData?.note]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!cartData) {
    return (
      <div className="text-center py-12">
        <ShoppingCart size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Không tìm thấy giỏ hàng</p>
        <Link href="/admin/cart"><Button className="mt-4">Quay lại</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/cart">
          <Button variant="ghost" size="icon"><ArrowLeft size={20}/></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Chi tiết giỏ hàng</h1>
            <Badge variant={STATUS_COLORS[cartData.status as CartStatus]}>
              {STATUS_LABELS[cartData.status as CartStatus]}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">Tạo lúc: {formatDate(cartData._creationTime)}</p>
        </div>
        <Button variant="outline" className="text-red-500 hover:text-red-600 gap-2" onClick={handleDeleteCart}>
          <Trash2 size={16} /> Xóa giỏ hàng
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><User size={18}/> Khách hàng</CardTitle>
            </CardHeader>
            <CardContent>
              {customerData ? (
                <div className="space-y-1">
                  <p className="font-medium">{customerData.name}</p>
                  <p className="text-sm text-slate-500">{customerData.phone}</p>
                  <p className="text-sm text-slate-500">{customerData.email}</p>
                </div>
              ) : (cartData.sessionId ? (
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Khách vãng lai (Guest)</p>
                  <p className="text-xs text-slate-400 font-mono">Session: {cartData.sessionId}</p>
                </div>
              ) : (
                <p className="text-slate-500">Không có thông tin khách hàng</p>
              ))}
            </CardContent>
          </Card>

          {/* Cart Items */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2"><ShoppingCart size={18}/> Mục trong giỏ ({cartItemsData?.length || 0})</CardTitle>
              {cartItemsData && cartItemsData.length > 0 && (
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 gap-1" onClick={handleClearCart}>
                  <Trash2 size={14} /> Xóa tất cả
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {cartItemsData && cartItemsData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mục</TableHead>
                      <TableHead className="text-center">SL</TableHead>
                      <TableHead className="text-right">Đơn giá</TableHead>
                      <TableHead className="text-right">Thành tiền</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cartItemsData.map(item => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.productImage ? (
                              <Image src={item.productImage} alt={item.productName} width={40} height={40} className="w-10 h-10 object-cover rounded" />
                            ) : (
                              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center">
                                <Package size={16} className="text-slate-400" />
                              </div>
                            )}
                            <div>
                              <span className="font-medium">{item.productName}</span>
                              <p className="text-xs text-slate-500">{itemTypeLabel(item.itemType)}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatPrice(item.price)}</TableCell>
                        <TableCell className="text-right font-medium">{formatPrice(item.subtotal)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={ async () => handleRemoveItem(item._id)}>
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Giỏ hàng trống</p>
                </div>
              )}
              
              {/* Total */}
              {cartItemsData && cartItemsData.length > 0 && (
                <div className="border-t mt-4 pt-4 flex justify-between items-center">
                  <span className="font-medium">Tổng cộng ({cartData.itemsCount} mục):</span>
                  <span className="text-xl font-bold text-emerald-600">{formatPrice(cartData.totalAmount)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note - only show if feature enabled */}
          {enabledFeatures.enableNote && (
            <Card>
              <CardHeader className="pb-3"><CardTitle>Ghi chú</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                  value={note}
                  onChange={(e) =>{  setNote(e.target.value); }}
                  placeholder="Thêm ghi chú cho giỏ hàng..."
                />
                {noteChanged && (
                  <Button onClick={handleUpdateNote} disabled={isUpdating} className="bg-emerald-600 hover:bg-emerald-500">
                    {isUpdating && <Loader2 size={14} className="animate-spin mr-2" />}
                    Lưu ghi chú
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3"><CardTitle>Trạng thái</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant={status === 'Active' ? 'default' : 'outline'}
                  className={`justify-start gap-2 ${status === 'Active' ? 'bg-emerald-600 hover:bg-emerald-500' : ''}`}
                  onClick={ async () => handleUpdateStatus('Active')}
                  disabled={isUpdating || status === 'Active'}
                >
                  <ShoppingCart size={16} /> Hoạt động
                </Button>
                <Button
                  variant={status === 'Abandoned' ? 'default' : 'outline'}
                  className={`justify-start gap-2 ${status === 'Abandoned' ? 'bg-amber-600 hover:bg-amber-500' : ''}`}
                  onClick={ async () => handleUpdateStatus('Abandoned')}
                  disabled={isUpdating || status === 'Abandoned'}
                >
                  <AlertTriangle size={16} /> Bỏ dở
                </Button>
                <Button
                  variant={status === 'Converted' ? 'default' : 'outline'}
                  className={`justify-start gap-2 ${status === 'Converted' ? 'bg-blue-600 hover:bg-blue-500' : ''}`}
                  onClick={ async () => handleUpdateStatus('Converted')}
                  disabled={isUpdating || status === 'Converted'}
                >
                  <CheckCircle size={16} /> Đã đặt hàng
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Expiry Info - show expiry only if feature enabled */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2"><Clock size={18} /> Thời gian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tạo lúc:</span>
                <span>{formatDate(cartData._creationTime)}</span>
              </div>
              {enabledFeatures.enableExpiry && cartData.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Hết hạn:</span>
                  <span className={cartData.expiresAt < Date.now() ? 'text-red-500' : ''}>
                    {formatDate(cartData.expiresAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader className="pb-3"><CardTitle>Tổng quan</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Số mục:</span>
                <Badge variant="secondary">{cartData.itemsCount}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng tiền:</span>
                <span className="font-bold text-emerald-600">{formatPrice(cartData.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Link href="/admin/cart">
              <Button variant="outline" className="w-full">Quay lại danh sách</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
