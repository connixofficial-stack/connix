'use client';

import React, { useState } from 'react';
import { 
  Area, 
  AreaChart, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from 'recharts';
import { AlertCircle, Database, Edit3, ExternalLink, Eye, EyeOff, HardDrive, Save, Settings, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useI18n } from './i18n/context';

type TimeRange = 'today' | '7d' | '1m' | '3m' | '1y';

export default function OverviewPage() {
  const { t } = useI18n();
  const config = useQuery(api.convexDashboard.get);
  const upsert = useMutation(api.convexDashboard.upsert);
  const remove = useMutation(api.convexDashboard.remove);

  const [selectedRange, setSelectedRange] = useState<TimeRange>('today');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    dashboardUrl: '',
    email: '',
    notes: '',
    password: '',
  });

  // Fetch bandwidth data from usageStats
  const bandwidthData = useQuery(api.usageStats.getBandwidthData, { range: selectedRange });
  const chartData = bandwidthData?.data ?? [];
  const totalDbBandwidth = bandwidthData?.totalDbBandwidth ?? 0;
  const totalFileBandwidth = bandwidthData?.totalFileBandwidth ?? 0;
  const hasData = bandwidthData?.hasData ?? false;
  const timeRanges: TimeRange[] = ['today', '7d', '1m', '3m', '1y'];

  const handleEdit = () => {
    if (config) {
      setForm({
        dashboardUrl: config.dashboardUrl,
        email: config.email ?? '',
        notes: config.notes ?? '',
        password: config.password ?? '',
      });
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!form.dashboardUrl.trim()) {return;}
    await upsert({
      dashboardUrl: form.dashboardUrl,
      email: form.email || undefined,
      notes: form.notes || undefined,
      password: form.password || undefined,
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(t.common.confirm + '?')) {
      await remove();
      setForm({ dashboardUrl: '', email: '', notes: '', password: '' });
    }
  };

  const openDashboard = () => {
    if (config?.dashboardUrl) {
      window.open(config.dashboardUrl, '_blank');
    }
  };

  if (config === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">{t.common.loading}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.overview.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.overview.subtitle}</p>
        </div>
      </div>

      {/* Convex Dashboard Config Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">
          {t.overview.dashboardConfig}
        </h3>
        
        {!config && !isEditing ? (
          <div className="text-center py-6">
            <Settings className="mx-auto h-10 w-10 text-slate-400 mb-3" />
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {t.overview.noConfig}
            </p>
            <button
              onClick={() =>{  setIsEditing(true); }}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              {t.overview.addConfig}
            </button>
          </div>
        ) : (isEditing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dashboard URL *
                </label>
                <input
                  type="url"
                  value={form.dashboardUrl}
                  onChange={(e) =>{  setForm({ ...form, dashboardUrl: e.target.value }); }}
                  placeholder="https://dashboard.convex.dev/t/your-team/settings/usage"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>{  setForm({ ...form, email: e.target.value }); }}
                  placeholder="your@email.com"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) =>{  setForm({ ...form, password: e.target.value }); }}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-10 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() =>{  setShowPassword(!showPassword); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t.overview.notes}
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>{  setForm({ ...form, notes: e.target.value }); }}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!form.dashboardUrl.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save size={16} />
                {t.common.save}
              </button>
              <button
                onClick={() =>{  setIsEditing(false); }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        ) : config && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Dashboard URL</p>
                <p className="text-slate-900 dark:text-slate-100 break-all font-mono text-sm bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded">
                  {config.dashboardUrl}
                </p>
              </div>

              {config.email && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email</p>
                  <p className="text-slate-900 dark:text-slate-100">{config.email}</p>
                </div>
              )}

              {config.password && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Password</p>
                  <div className="flex items-center gap-2">
                    <p className="text-slate-900 dark:text-slate-100 font-mono">
                      {showPassword ? config.password : '••••••••'}
                    </p>
                    <button
                      onClick={() =>{  setShowPassword(!showPassword); }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {config.notes && (
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t.overview.notes}</p>
                  <p className="text-slate-900 dark:text-slate-100 text-sm">{config.notes}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={openDashboard}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
              >
                <ExternalLink size={16} />
                {t.overview.openDashboard}
              </button>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Edit3 size={16} />
                {t.common.edit}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={16} />
                {t.common.delete}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bandwidth Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-slate-700 dark:text-slate-200 font-semibold flex items-center gap-2">
              {t.overview.bandwidthTrend}
            </h3>
            <p className="text-xs text-slate-500 mt-1">{t.overview.bandwidthUsage} ({t.overview.timeRanges[selectedRange]})</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {timeRanges.map((range) => (
              <button 
                key={range} 
                onClick={() =>{  setSelectedRange(range); }}
                className={`text-xs px-2.5 py-1.5 rounded border transition-all ${
                  selectedRange === range 
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400' 
                    : 'border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700'
                }`}
              >
                {t.overview.timeRanges[range]}
              </button>
            ))}
          </div>
        </div>

        {/* No Data Warning */}
        {bandwidthData && !hasData && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {t.overview.noDataTitle || 'Chưa có dữ liệu bandwidth'}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {t.overview.noDataDesc || 'Dữ liệu sẽ được tracking tự động khi có hoạt động trên hệ thống. Bạn có thể gọi api.usageStats.track() để bắt đầu tracking.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database size={16} className="text-amber-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.overview.dbBandwidth}</p>
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalDbBandwidth.toLocaleString()} <span className="text-sm font-normal">MB</span></p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive size={16} className="text-rose-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.overview.fileBandwidth}</p>
            </div>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totalFileBandwidth.toLocaleString()} <span className="text-sm font-normal">MB</span></p>
          </div>
        </div>
        
        {/* Loading State */}
        {bandwidthData === undefined ? (
          <div className="h-72 w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDbBandwidth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFileBandwidth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} MB`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '6px', color: '#f8fafc' }}
                  formatter={(value, name) => {
                    const formattedValue = typeof value === 'number'
                      ? value.toLocaleString()
                      : (Array.isArray(value)
                        ? value.join(', ')
                        : String(value));
                    return [
                      `${formattedValue} MB`,
                      name === 'dbBandwidth' ? t.overview.dbBandwidth : t.overview.fileBandwidth
                    ];
                  }}
                />
                <Area type="monotone" dataKey="fileBandwidth" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorFileBandwidth)" />
                <Area type="monotone" dataKey="dbBandwidth" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorDbBandwidth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t.overview.dbBandwidth}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t.overview.fileBandwidth}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
