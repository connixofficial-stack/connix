'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { ArrowLeft, Copy, CreditCard, ExternalLink, Loader2, MapPin, Package, ShoppingBag, Truck, User } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '../../../components/ui';
import { useOrderStatuses } from '@/lib/experiences';
import { DigitalCredentialsForm } from '@/components/orders/DigitalCredentialsForm';
import { buildAbsoluteWebUrl, buildAdminOrderDetailPath, buildPublicOrderLookupPath } from '@/lib/orders/links';

const MODULE_KEY = 'orders';

type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';
type PaymentMethod = 'COD' | 'BankTransfer' | 'VietQR' | 'CreditCard' | 'EWallet';

const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { label: 'Chờ thanh toán', value: 'Pending' },
  { label: 'Đã thanh toán', value: 'Paid' },
  { label: 'Thất bại', value: 'Failed' },
  { label: 'Hoàn tiền', value: 'Refunded' },
];

const PAYMENT_METHODS: Record<PaymentMethod, string> = {
  BankTransfer: 'Chuyển khoản ngân hàng',
  COD: 'Thanh toán khi nhận hàng',
  VietQR: 'VietQR',
  CreditCard: 'Thẻ tín dụng',
  EWallet: 'Ví điện tử',
};

export default function EditOrderPage() {
  const params = useParams();
  const orderId = params.id as Id<"orders">;

  const orderData = useQuery(api.orders.getById, { id: orderId });
  const customerData = useQuery(api.customers.getById, orderData?.customerId ? { id: orderData.customerId } : "skip");
  const fieldsData = useQuery(api.admin.modules.listEnabledModuleFields, { moduleKey: MODULE_KEY });
  const updateOrder = useMutation(api.orders.update);
  const deliverDigitalItem = useMutation(api.orders.deliverDigitalItem);
  const { statuses: orderStatuses } = useOrderStatuses();

  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pending');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [digitalCredentials, setDigitalCredentials] = useState<Record<number, {
    username?: string;
    password?: string;
    licenseKey?: string;
    downloadUrl?: string;
    customContent?: string;
    expiresAt?: number;
  }>>({});

  const isLoading = orderData === undefined || fieldsData === undefined;

  const enabledFields = useMemo(() => {
    const fields = new Set<string>();
    fieldsData?.forEach(f => fields.add(f.fieldKey));
    return fields;
  }, [fieldsData]);
  const statusMap = useMemo(() => new Map(orderStatuses.map((status) => [status.key, status])), [orderStatuses]);
  const getStatusVariant = (statusKey: string) => {
    const key = statusKey.toLowerCase();
    if (key.includes('cancel')) return 'destructive';
    if (key.includes('refund')) return 'secondary';
    if (key.includes('deliver') || key.includes('complete')) return 'success';
    if (key.includes('ship') || key.includes('process')) return 'warning';
    return 'secondary';
  };

  // Sync state from server
  useEffect(() => {
    if (orderData) {
      setStatus(orderData.status);
      setPaymentStatus((orderData.paymentStatus!) || 'Pending');
      setTrackingNumber(orderData.trackingNumber ?? '');
      setShippingAddress(orderData.shippingAddress ?? '');
      setNote(orderData.note ?? '');
      const nextCredentials: Record<number, {
        username?: string;
        password?: string;
        licenseKey?: string;
        downloadUrl?: string;
        customContent?: string;
        expiresAt?: number;
      }> = {};
      orderData.items.forEach((item, index) => {
        if (item.digitalCredentials) {
          nextCredentials[index] = {
            username: item.digitalCredentials.username,
            password: item.digitalCredentials.password,
            licenseKey: item.digitalCredentials.licenseKey,
            downloadUrl: item.digitalCredentials.downloadUrl,
            customContent: item.digitalCredentials.customContent,
            expiresAt: item.digitalCredentials.expiresAt,
          };
        }
      });
      setDigitalCredentials(nextCredentials);
    }
  }, [orderData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateOrder({
        id: orderId,
        note: enabledFields.has('note') ? note : undefined,
        paymentStatus: enabledFields.has('paymentStatus') ? paymentStatus : undefined,
        shippingAddress: enabledFields.has('shippingAddress') ? shippingAddress : undefined,
        status,
        trackingNumber: enabledFields.has('trackingNumber') ? trackingNumber : undefined,
      });
      toast.success('Đã cập nhật đơn hàng');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN', { currency: 'VND', style: 'currency' }).format(price);
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleString('vi-VN');
  const formatDateOnly = (timestamp?: number) => (timestamp ? new Date(timestamp).toLocaleDateString('vi-VN') : '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Không tìm thấy đơn hàng</p>
        <Link href="/admin/orders"><Button className="mt-4">Quay lại</Button></Link>
      </div>
    );
  }

  const publicOrderLookupPath = buildPublicOrderLookupPath(orderData.orderNumber);
  const adminOrderDetailPath = buildAdminOrderDetailPath(orderData._id);
  const publicOrderLookupUrl = typeof window === 'undefined'
    ? publicOrderLookupPath
    : buildAbsoluteWebUrl(window.location.origin, publicOrderLookupPath);
  const adminOrderDetailUrl = typeof window === 'undefined'
    ? adminOrderDetailPath
    : buildAbsoluteWebUrl(window.location.origin, adminOrderDetailPath);

  const handleCopyUrl = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(`Đã copy ${label}.`);
    } catch {
      toast.error(`Không thể copy ${label}.`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost" size="icon"><ArrowLeft size={20}/></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{orderData.orderNumber}</h1>
            <Badge variant={getStatusVariant(orderData.status)}>
              {statusMap.get(orderData.status)?.label ?? orderData.status}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">Tạo lúc: {formatDate(orderData._creationTime)}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
                ) : (
                  <p className="text-slate-500">Không tìm thấy thông tin khách hàng</p>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2"><ShoppingBag size={18}/> Sản phẩm ({orderData.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {orderData.items.map((item, index) => (
                    <div key={index} className="py-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center overflow-hidden shrink-0">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                            ) : (
                              <Package size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-slate-500">{formatPrice(item.price)} x {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                      </div>

                      {item.isDigital && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-600">Giao hàng Digital</div>
                            {item.digitalCredentials?.deliveredAt ? (
                              <Badge variant="success">Đã giao {formatDateOnly(item.digitalCredentials.deliveredAt)}</Badge>
                            ) : (
                              <Badge variant="secondary">Chưa giao</Badge>
                            )}
                          </div>
                          {item.digitalDeliveryType && (
                            <DigitalCredentialsForm
                              type={item.digitalDeliveryType as 'account' | 'license' | 'download' | 'custom'}
                              value={digitalCredentials[index] ?? {}}
                              onChange={(value) => setDigitalCredentials((prev) => ({ ...prev, [index]: value }))}
                            />
                          )}
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="accent"
                              disabled={isSubmitting || Boolean(item.digitalCredentials?.deliveredAt)}
                              onClick={async () => {
                                try {
                                  await deliverDigitalItem({
                                    orderId,
                                    itemIndex: index,
                                    credentials: digitalCredentials[index] ?? {},
                                  });
                                  toast.success('Đã giao credentials');
                                } catch (error) {
                                  toast.error(error instanceof Error ? error.message : 'Không thể giao credentials');
                                }
                              }}
                            >
                              Giao credentials
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(orderData.subtotal)}</span>
                  </div>
                  {enabledFields.has('shippingFee') && (
                    <div className="flex justify-between text-sm">
                      <span>Phí vận chuyển:</span>
                      <span>{formatPrice(orderData.shippingFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Tổng tiền:</span>
                    <span className="text-emerald-600">{formatPrice(orderData.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Info */}
            {enabledFields.has('shippingAddress') && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><MapPin size={18}/> Địa chỉ giao hàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                    value={shippingAddress}
                    onChange={(e) =>{  setShippingAddress(e.target.value); }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Note */}
            {enabledFields.has('note') && (
              <Card>
                <CardHeader className="pb-3"><CardTitle>Ghi chú</CardTitle></CardHeader>
                <CardContent>
                  <textarea
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm min-h-[80px]"
                    value={note}
                    onChange={(e) =>{  setNote(e.target.value); }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader className="pb-3"><CardTitle>Trạng thái đơn</CardTitle></CardHeader>
              <CardContent>
                <select
                  className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) =>{  setStatus(e.target.value); }}
                >
                  {orderStatuses.map((statusOption) => (
                    <option key={statusOption.key} value={statusOption.key}>{statusOption.label}</option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Payment Info */}
            {enabledFields.has('paymentMethod') && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><CreditCard size={18}/> Thanh toán</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-slate-500">Phương thức</Label>
                    <p className="font-medium">{orderData.paymentMethod ? PAYMENT_METHODS[orderData.paymentMethod as PaymentMethod] : 'Chưa chọn'}</p>
                  </div>
                  {enabledFields.has('paymentStatus') && (
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">Trạng thái TT</Label>
                      <select
                        className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                        value={paymentStatus}
                        onChange={(e) =>{  setPaymentStatus(e.target.value as PaymentStatus); }}
                      >
                        {PAYMENT_STATUSES.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tracking */}
            {enabledFields.has('trackingNumber') && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2"><Truck size={18}/> Vận chuyển</CardTitle>
                </CardHeader>
                <CardContent>
                  <Label className="text-xs text-slate-500 mb-1 block">Mã vận đơn</Label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) =>{  setTrackingNumber(e.target.value); }}
                    placeholder="VD: VN123456789"
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Liên kết nhanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Link khách tra cứu</Label>
                  <div className="flex gap-2">
                    <Input value={publicOrderLookupUrl} readOnly className="font-mono text-xs" />
                    <Button type="button" variant="outline" size="icon" title="Copy link khách" onClick={async () => handleCopyUrl(publicOrderLookupUrl, 'link khách')}>
                      <Copy size={16} />
                    </Button>
                    <Button type="button" variant="outline" size="icon" title="Mở link khách" onClick={() => window.open(publicOrderLookupUrl, '_blank', 'noopener,noreferrer')}>
                      <ExternalLink size={16} />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Link admin đơn này</Label>
                  <div className="flex gap-2">
                    <Input value={adminOrderDetailUrl} readOnly className="font-mono text-xs" />
                    <Button type="button" variant="outline" size="icon" title="Copy link admin" onClick={async () => handleCopyUrl(adminOrderDetailUrl, 'link admin')}>
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  Dùng các link này để dán cho khách hoặc lưu nội bộ khi email hệ thống chưa sẵn sàng.
                </p>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={16} className="animate-spin mr-2" />}
                Cập nhật đơn hàng
              </Button>
              <Link href="/admin/orders">
                <Button type="button" variant="outline" className="w-full">Quay lại</Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
