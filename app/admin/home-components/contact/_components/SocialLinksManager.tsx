'use client';

import React, { useMemo, useState } from 'react';
import { Download, GripVertical, Plus, Share2, Trash2 } from 'lucide-react';
import type { ContactSocialLink } from '../_types';
import { Button, Input, cn } from '../../../components/ui';
import { buildDefaultContactSocialsFromSettings, getContactSocialPlatforms } from '../_lib/constants';

interface SocialLinksManagerProps {
  links: ContactSocialLink[];
  onChange: (links: ContactSocialLink[]) => void;
  contactSettings?: Array<{ key: string; value: string | number | boolean }>;
  socialSettings?: Array<{ key: string; value: string | number | boolean }>;
  isLoadingSettings?: boolean;
  validationErrors?: Record<number, { url?: string }>;
}

const getNextId = (items: Array<{ id?: number | string }>) => {
  const max = items.reduce((acc, item) => {
    const asNumber = typeof item.id === 'number' ? item.id : Number(item.id);
    return Number.isFinite(asNumber) ? Math.max(acc, asNumber) : acc;
  }, 0);
  return max + 1;
};

const getSocialPlaceholder = (platform: string) => {
  if (platform.trim().toLowerCase() === 'zalo') {
    return 'https://zalo.me/0948066514 hoặc 0948066514';
  }

  return 'https://facebook.com/yourpage';
};

export function SocialLinksManager({
  links,
  onChange,
  contactSettings,
  socialSettings,
  isLoadingSettings,
  validationErrors,
}: SocialLinksManagerProps) {
  const platforms = getContactSocialPlatforms();
  const linksWithId = useMemo<ContactSocialLink[]>(() => links.map((link, index) => ({
    ...link,
    id: link.id ?? index + 1,
    icon: link.icon ?? link.platform,
  })), [links]);

  const [draggedId, setDraggedId] = useState<number | string | null>(null);
  const [dragOverId, setDragOverId] = useState<number | string | null>(null);

  const addSocialLink = () => {
    const usedPlatforms = new Set(linksWithId.map((link) => link.platform));
    const available = platforms.find((platform) => !usedPlatforms.has(platform.platform));
    if (!available) {return;}
    const newId = getNextId(linksWithId);
    onChange([...linksWithId, { id: newId, platform: available.platform, icon: available.platform, url: '' }]);
  };

  const updateSocialLink = (id: number | string, field: 'platform' | 'url', valueInput: string) => {
    onChange(linksWithId.map((link) => {
      if (link.id !== id) {return link;}
      if (field === 'platform') {
        return { ...link, platform: valueInput, icon: valueInput };
      }
      return { ...link, url: valueInput };
    }));
  };

  const removeSocialLink = (id: number | string) => {
    onChange(linksWithId.filter((link) => link.id !== id));
  };

  const loadFromSettings = () => {
    onChange(buildDefaultContactSocialsFromSettings(contactSettings, socialSettings));
  };

  const handleDragStart = (id: number | string) => { setDraggedId(id); };
  const handleDragEnd = () => { setDraggedId(null); setDragOverId(null); };
  const handleDragOver = (event: React.DragEvent, id: number | string) => {
    event.preventDefault();
    if (draggedId !== id) {setDragOverId(id);}
  };
  const handleDrop = (event: React.DragEvent, targetId: number | string) => {
    event.preventDefault();
    if (!draggedId || draggedId === targetId) {return;}
    const items = [...linksWithId];
    const draggedIndex = items.findIndex((item) => item.id === draggedId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    const [moved] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, moved);
    onChange(items);
    setDraggedId(null);
    setDragOverId(null);
  };

  const canAdd = linksWithId.length < platforms.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Social Links</p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={loadFromSettings} disabled={isLoadingSettings}>
            <Download size={14} className="mr-1" /> Load từ Settings
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addSocialLink} disabled={!canAdd}>
            <Plus size={14} className="mr-1" /> Thêm MXH
          </Button>
        </div>
      </div>

      {linksWithId.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700 px-4 py-8 text-center">
          <Share2 size={28} className="text-slate-400 mb-2" />
          <p className="text-sm text-slate-500">Chưa có mạng xã hội nào.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={loadFromSettings} disabled={isLoadingSettings}>
              <Download size={14} className="mr-1" /> Load từ Settings
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={addSocialLink} disabled={!canAdd}>
              <Plus size={14} className="mr-1" /> Thêm MXH
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {linksWithId.map((link) => {
            const hasError = validationErrors?.[link.id]?.url;

            return (
              <div
                key={link.id}
                draggable
                onDragStart={() => { handleDragStart(link.id); }}
                onDragEnd={handleDragEnd}
                onDragOver={(event) => { handleDragOver(event, link.id); }}
                onDrop={(event) => { handleDrop(event, link.id); }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-all',
                  draggedId === link.id && 'opacity-50',
                  dragOverId === link.id && 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20',
                  'border-slate-200 dark:border-slate-700'
                )}
              >
                <GripVertical size={16} className="text-slate-400 cursor-grab flex-shrink-0" />
                <select
                  value={link.platform}
                  onChange={(e) => { updateSocialLink(link.id, 'platform', e.target.value); }}
                  className="h-9 w-40 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                >
                  {platforms.map((platform) => (
                    <option
                      key={platform.platform}
                      value={platform.platform}
                      disabled={linksWithId.some((item) => item.platform === platform.platform && item.id !== link.id)}
                    >
                      {platform.label}
                    </option>
                  ))}
                </select>
                <div className="flex-1">
                  <Input
                    value={link.url}
                    onChange={(e) => { updateSocialLink(link.id, 'url', e.target.value); }}
                    placeholder={getSocialPlaceholder(link.platform)}
                    className={hasError ? 'border-red-500 dark:border-red-500' : ''}
                  />
                  {hasError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{validationErrors?.[link.id]?.url}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { removeSocialLink(link.id); }}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
