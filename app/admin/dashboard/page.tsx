'use client';

import React, { useMemo, useState } from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle } from '../components/ui';
import { ModuleGuard } from '../components/ModuleGuard';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Eye, Globe, HardDrive, Loader2, Mail, Package, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Badge } from '../components/ui';
import { toast } from 'sonner';

type TimeRange = '7d' | '30d' | '90d' | '1y';
type ChartGroupBy = 'day' | 'month' | 'year';
type MediaStats = {
  totalCount: number;
  totalSize: number;
};
const STORAGE_QUOTA_BYTES = 6 * 1024 * 1024 * 1024;

function formatNumber(num: number): string {
  if (num >= 1_000_000) {return (num / 1_000_000).toFixed(1) + 'M';}
  if (num >= 1000) {return (num / 1000).toFixed(1) + 'K';}
  return num.toString();
}

const TIME_TABS: { key: TimeRange; label: string }[] = [
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '90d', label: '90 ngày' },
  { key: '1y', label: '1 năm' },
];

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {return `${(value / 1_000_000_000).toFixed(1)}B`;}
  if (value >= 1_000_000) {return `${(value / 1_000_000).toFixed(1)}M`;}
  if (value >= 1000) {return `${(value / 1000).toFixed(1)}K`;}
  return value.toLocaleString('vi-VN');
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) {return '0 B';}
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, unitIndex);
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function StorageUsageCard({
  isResyncing,
  mediaStats,
  onResync,
}: {
  isResyncing: boolean;
  mediaStats: MediaStats | undefined;
  onResync: () => void;
}) {
  const usedBytes = mediaStats?.totalSize ?? 0;
  const usagePercent = Math.min(100, (usedBytes / STORAGE_QUOTA_BYTES) * 100);

  return (
    <Card className="p-4 border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <HardDrive size={20} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 truncate">Dung lượng media</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {mediaStats ? `${formatBytes(usedBytes)} / 6 GB` : '...'}
          </p>
          <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {mediaStats ? `${mediaStats.totalCount.toLocaleString('vi-VN')} file · ${usagePercent.toFixed(1)}%` : 'Đang tải thống kê'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 h-7 gap-1.5 px-2 text-xs"
            onClick={onResync}
            disabled={isResyncing}
          >
            <RefreshCw size={12} className={isResyncing ? 'animate-spin' : ''} />
            {isResyncing ? 'Đang tính lại' : 'Tính lại'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <ModuleGuard moduleKey="analytics">
      <DashboardContent />
    </ModuleGuard>
  );
}

function DashboardContent() {
  // Fetch features and settings from server
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: 'analytics' });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'analytics' });
  const contactInboxModule = useQuery(api.admin.modules.getModuleByKey, { key: 'contactInbox' });
  const contactInboxFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'contactInbox', featureKey: 'enableContactDashboardWidget' });
  
  // Get default period from settings, fallback to '30d'
  const defaultPeriod = useMemo(() => {
    const setting = settingsData?.find(s => s.settingKey === 'defaultPeriod');
    return (setting?.value as TimeRange) || '30d';
  }, [settingsData]);

  const [timeRange, setTimeRange] = useState<TimeRange>(() => (
    TIME_TABS.some(t => t.key === defaultPeriod) ? defaultPeriod : '30d'
  ));
  const [trafficChartGroupBy, setTrafficChartGroupBy] = useState<ChartGroupBy>('day');
  
  // Real data queries from Convex
  const summaryStats = useQuery(api.analytics.getSummaryStats, { period: timeRange });
  const chartData = useQuery(api.analytics.getRevenueChartData, { period: timeRange });
  const topProducts = useQuery(api.analytics.getTopProducts, { limit: 5 });
  const lowStockProducts = useQuery(api.analytics.getLowStockProducts, { limit: 5, threshold: 10 });
  const mediaStats = useQuery(api.media.getStats);
  const resyncMediaCounters = useMutation(api.seed.syncMediaCounters);
  const [isResyncingMedia, setIsResyncingMedia] = useState(false);
  
  // Traffic data queries
  const trafficStats = useQuery(api.pageViews.getTrafficStats, { period: timeRange });
  const trafficChartData = useQuery(api.pageViews.getTrafficChartData, { groupBy: trafficChartGroupBy, period: timeRange });
  const topPages = useQuery(api.pageViews.getTopPages, { limit: 5, period: timeRange });
  const trafficSources = useQuery(api.pageViews.getTrafficSources, { limit: 5, period: timeRange });
  const deviceStats = useQuery(api.pageViews.getDeviceStats, { period: timeRange });
  
  const isLoading = featuresData === undefined
    || settingsData === undefined
    || contactInboxModule === undefined
    || contactInboxFeature === undefined;
  
  const isFeatureEnabled = (featureKey: string): boolean => {
    const feature = featuresData?.find(f => f.featureKey === featureKey);
    return feature?.enabled ?? false;
  };

  const showContactInboxWidget = (contactInboxModule?.enabled ?? false) && (contactInboxFeature?.enabled ?? false);
  const inboxStats = useQuery(api.contactInbox.getInboxStats, showContactInboxWidget ? {} : 'skip');
  const recentInbox = useQuery(api.contactInbox.listRecentInbox, showContactInboxWidget ? { limit: 5 } : 'skip');
  const hasInboxData = showContactInboxWidget && (inboxStats?.total ?? 0) > 0 && (recentInbox?.length ?? 0) > 0;

  const handleResyncMediaCounters = async () => {
    if (!confirm('Hệ thống sẽ quét lại toàn bộ media để tính đúng số file và dung lượng đã dùng. Tiếp tục?')) {return;}

    setIsResyncingMedia(true);
    try {
      const result = await resyncMediaCounters();
      const total = result.stats.total;
      toast.success(`Đã tính lại: ${total.count} file · ${formatBytes(total.totalSize)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Có lỗi khi tính lại dung lượng media');
    } finally {
      setIsResyncingMedia(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const showSales = isFeatureEnabled('enableSales');
  const showCustomers = isFeatureEnabled('enableCustomers');
  const showProducts = isFeatureEnabled('enableProducts');
  const showTraffic = isFeatureEnabled('enableTraffic');
  const hasAnyFeature = showSales || showCustomers || showProducts || showTraffic;

  if (!hasAnyFeature) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tổng quan</h1>
          <p className="text-slate-500 dark:text-slate-400">Chào mừng trở lại, Admin User!</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StorageUsageCard isResyncing={isResyncingMedia} mediaStats={mediaStats} onResync={() => void handleResyncMediaCounters()} />
        </div>
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              Chưa có báo cáo nào được bật. Vui lòng liên hệ quản trị viên hệ thống để kích hoạt.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Tổng quan</h1>
          <p className="text-slate-500 dark:text-slate-400">Chào mừng trở lại, Admin User!</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {TIME_TABS.map((tab) => (
            <button 
              key={tab.key}
              onClick={() =>{  setTimeRange(tab.key); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                timeRange === tab.key 
                  ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {!showTraffic && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StorageUsageCard isResyncing={isResyncingMedia} mediaStats={mediaStats} onResync={() => void handleResyncMediaCounters()} />
        </div>
      )}

      {/* Summary Stats Cards */}
      {(showSales || showCustomers || showProducts) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {showSales && (
            <>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <TrendingUp size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 truncate">Doanh thu</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {summaryStats ? formatCurrency(summaryStats.revenue.value) : '...'}
                    </p>
                    {summaryStats && summaryStats.revenue.change !== 0 && (
                      <Badge variant={summaryStats.revenue.change > 0 ? "success" : "destructive"} className="text-xs">
                        {summaryStats.revenue.change > 0 ? '+' : ''}{summaryStats.revenue.change}%
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Package size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 truncate">Đơn hàng</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {summaryStats?.orders.value.toLocaleString('vi-VN') ?? '...'}
                    </p>
                    {summaryStats && summaryStats.orders.change !== 0 && (
                      <Badge variant={summaryStats.orders.change > 0 ? "success" : "destructive"} className="text-xs">
                        {summaryStats.orders.change > 0 ? '+' : ''}{summaryStats.orders.change}%
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            </>
          )}
          {showCustomers && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-lg">
                  <Users size={20} className="text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 truncate">Khách mới</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {summaryStats?.customers.value.toLocaleString('vi-VN') ?? '...'}
                  </p>
                  {summaryStats && summaryStats.customers.change !== 0 && (
                    <Badge variant={summaryStats.customers.change > 0 ? "success" : "destructive"} className="text-xs">
                      {summaryStats.customers.change > 0 ? '+' : ''}{summaryStats.customers.change}%
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          )}
          {showProducts && (
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Package size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 truncate">Sản phẩm</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {summaryStats?.products.value.toLocaleString('vi-VN') ?? '...'}
                  </p>
                  {summaryStats?.products.lowStock ? (
                    <span className="text-xs text-amber-600 flex items-center gap-0.5">
                      <AlertTriangle size={10} /> {summaryStats.products.lowStock} sắp hết
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Revenue Chart */}
      {showSales && chartData && chartData.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-slate-900 dark:text-slate-100">Biểu đồ doanh thu</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis 
                    tick={{ fontSize: 12 }} 
                    stroke="#94a3b8"
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number) + ' VND', 'Doanh thu']}
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Chart */}
      {showSales && chartData && chartData.length > 0 && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-slate-900 dark:text-slate-100">Số đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip 
                    formatter={(value) => [value + ' đơn', 'Đơn hàng']}
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Products & Low Stock */}
      {showProducts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          {topProducts && topProducts.length > 0 && (
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-slate-900 dark:text-slate-100">Sản phẩm bán chạy</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {topProducts.map((product, i) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-blue-600 w-6">#{i + 1}</span>
                        {product.image && <Image src={product.image} alt={product.name} width={40} height={40} className="w-10 h-10 rounded object-cover" />}
                        <span className="text-sm text-slate-700 dark:text-slate-300">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="default">{product.sales} đã bán</Badge>
                        <p className="text-xs text-slate-500 mt-1">{formatCurrency(product.revenue)} VND</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Low Stock Warning */}
          {lowStockProducts && lowStockProducts.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800 shadow-sm">
              <CardHeader className="border-b border-amber-100 dark:border-amber-800 pb-4">
                <CardTitle className="text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertTriangle size={20} /> Sản phẩm sắp hết hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-2">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{product.name}</span>
                        <p className="text-xs text-slate-500">SKU: {product.sku}</p>
                      </div>
                      <Badge variant="warning" className="text-xs">
                        Còn {product.stock}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {hasInboxData && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Mail size={18} /> Tin nhắn liên hệ mới
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="warning">Mới: {inboxStats?.new ?? 0}</Badge>
              <Badge variant="secondary">Tổng: {inboxStats?.total ?? 0}</Badge>
              <Link href="/admin/contact-inbox" className="text-sm text-cyan-600 hover:underline">Xem tất cả</Link>
            </div>
            <div className="space-y-3">
              {(recentInbox ?? []).map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{item.name}</div>
                    <div className="text-xs text-slate-500 truncate">{item.subject}</div>
                  </div>
                  <div className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traffic Report */}
      {showTraffic && (
        <>
          {/* Traffic Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StorageUsageCard isResyncing={isResyncingMedia} mediaStats={mediaStats} onResync={() => void handleResyncMediaCounters()} />
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Eye size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 truncate">Lượt xem trang</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {trafficStats ? formatNumber(trafficStats.totalPageviews) : '...'}
                  </p>
                  {trafficStats && trafficStats.pageviewsChange !== 0 && (
                    <Badge variant={trafficStats.pageviewsChange > 0 ? "success" : "destructive"} className="text-xs">
                      {trafficStats.pageviewsChange > 0 ? '+' : ''}{trafficStats.pageviewsChange}%
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 truncate">Người truy cập</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {trafficStats ? formatNumber(trafficStats.uniqueVisitors) : '...'}
                  </p>
                  {trafficStats && trafficStats.visitorsChange !== 0 && (
                    <Badge variant={trafficStats.visitorsChange > 0 ? "success" : "destructive"} className="text-xs">
                      {trafficStats.visitorsChange > 0 ? '+' : ''}{trafficStats.visitorsChange}%
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Traffic Chart */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-slate-900 dark:text-slate-100">Biểu đồ lượt truy cập</CardTitle>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  {([
                    { key: 'day', label: 'Ngày' },
                    { key: 'month', label: 'Tháng' },
                    { key: 'year', label: 'Năm' },
                  ] as { key: ChartGroupBy; label: string }[]).map((tab) => (
                    <button 
                      key={tab.key}
                      onClick={() =>{  setTrafficChartGroupBy(tab.key); }}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        trafficChartGroupBy === tab.key 
                          ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {trafficChartData && trafficChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficChartData}>
                      <defs>
                        <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                      <Tooltip 
                        formatter={(value, name) => [
                          formatNumber(value as number), 
                          name === 'pageviews' ? 'Lượt xem' : 'Người truy cập'
                        ]}
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="pageviews" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#colorPageviews)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  Chưa có dữ liệu lượt truy cập
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Pages & Traffic Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Pages */}
            {topPages && topPages.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-slate-900 dark:text-slate-100">Trang được xem nhiều</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {topPages.map((page, i) => (
                      <div key={page.path} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-blue-600 w-5">#{i + 1}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{page.path}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{formatNumber(page.views)}</span>
                          <Badge variant="outline" className="text-xs">{page.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Traffic Sources */}
            {trafficSources && trafficSources.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Globe size={18} /> Nguồn truy cập
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {trafficSources.map((source, i) => (
                      <div key={source.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs font-medium text-emerald-600 w-5">#{i + 1}</span>
                          <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{source.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{formatNumber(source.views)}</span>
                          <Badge variant="outline" className="text-xs">{source.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Device & Browser Stats */}
          {deviceStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Devices */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-slate-900 dark:text-slate-100 text-sm">Thiết bị</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {deviceStats.devices.map((item) => (
                      <div key={item.device} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 capitalize">{item.device}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* OS */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-slate-900 dark:text-slate-100 text-sm">Hệ điều hành</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {deviceStats.os.map((item) => (
                      <div key={item.os} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{item.os}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Browsers */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <CardTitle className="text-slate-900 dark:text-slate-100 text-sm">Trình duyệt</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {deviceStats.browsers.map((item) => (
                      <div key={item.browser} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{item.browser}</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

