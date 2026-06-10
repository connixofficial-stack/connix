'use client';

import React from 'react';
import { AdminImage as Image } from '@/app/admin/components/AdminImage';
import {
  Award, Briefcase, Building, Camera, ChevronDown, ChevronUp,
  Crown, GripVertical, ImageIcon, Layers, Lightbulb, Loader2,
  Mail, Palette, Phone, Plus, Sparkles, Star, Trash2, Upload, Users, Youtube, Zap,
} from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';
import { Button, Input, cn } from '../../../components/ui';
import { IconPopoverPicker } from '../../_shared/components/IconPopoverPicker';
import type { IconOption } from '../../_shared/components/IconPopoverPicker';
import type { TeamEditorMember, TeamAvatarType } from '../_types';
import { AiDemoTeamImport } from '../../product-list/_components/AiDemoProductsImport';
import { useFileDraftUploads } from '@/app/admin/components/useFileDraftUploads';
import { ImageEditorDialog } from '@/app/admin/components/ImageEditorDialog';
import { ImageSourceActions } from '@/app/admin/components/ImageSourceActions';
import { CollapsibleSubSection as SubSection } from '../../_shared/components/CollapsibleSubSection';
import { TikTokIcon, ZaloIcon } from '@/components/site/SocialIcons';
import { useFormSectionsState } from '../../_shared/hooks/useFormSectionsState';
import { FormSectionsToggleAllButton } from '../../_shared/components/FormSectionsToggleAllButton';

// Demo avatars — AI-generated, phụ nữ châu Á chuyên nghiệp
const DEMO_AVATARS = [
  '/demo/team-avatars/demo-f1.png',
  '/demo/team-avatars/demo-f2.png',
  '/demo/team-avatars/demo-f3.png',
  '/demo/team-avatars/demo-f4.png',
  '/demo/team-avatars/demo-f5.png',
  '/demo/team-avatars/demo-f6.png',
];

const AVAILABLE_ICONS = [
  'Star', 'Award', 'Crown', 'Briefcase', 'Building', 'Layers',
  'Lightbulb', 'Palette', 'Camera', 'Zap', 'Sparkles',
] as const;

const ICON_COMPONENTS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Star, Award, Crown, Briefcase, Building, Layers, Lightbulb, Palette, Camera, Zap, Sparkles,
};

const getIconCmp = (name: string) => ICON_COMPONENTS[name] ?? Star;

const TEAM_ICON_PICKER_OPTIONS: IconOption[] = AVAILABLE_ICONS.map((name) => ({
  value: name,
  label: name,
  Icon: ICON_COMPONENTS[name] ?? Star,
}));

interface TeamFormProps {
  members: TeamEditorMember[];
  onChange: (next: TeamEditorMember[]) => void;
  secondary: string;
  defaultExpanded?: boolean;
}

const createEmptyMember = (seed: number): TeamEditorMember => ({
  id: seed,
  name: '',
  role: '',
  avatar: '',
  avatarType: 'upload',
  avatarIcon: 'Star',
  bio: '',
  facebook: '',
  linkedin: '',
  twitter: '',
  phone: '',
  zalo: '',
  tiktok: '',
  youtube: '',
  email: '',
});

function useDragReorder<T extends { id: number }>(items: T[], setItems: (items: T[]) => void) {
  const [draggedId, setDraggedId] = React.useState<number | null>(null);
  const [dragOverId, setDragOverId] = React.useState<number | null>(null);

  const dragProps = (id: number) => ({
    draggable: true,
    onDragEnd: () => { setDraggedId(null); setDragOverId(null); },
    onDragOver: (event: React.DragEvent) => { event.preventDefault(); if (draggedId !== id) { setDragOverId(id); } },
    onDragStart: () => { setDraggedId(id); },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      if (!draggedId || draggedId === id) { return; }
      const nextItems = [...items];
      const from = items.findIndex((item) => item.id === draggedId);
      const to = items.findIndex((item) => item.id === id);
      if (from < 0 || to < 0) { return; }
      const [moved] = nextItems.splice(from, 1);
      nextItems.splice(to, 0, moved);
      setItems(nextItems);
      setDraggedId(null);
      setDragOverId(null);
    },
  });

  return { draggedId, dragOverId, dragProps };
}

function AvatarUpload({ value, onChange, index, onUrlMode }: { value: string; onChange: (url: string, storageId?: string | null) => void; index: number; onUrlMode: () => void }) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const { trackDraftUpload } = useFileDraftUploads('team-avatars');

  const handleFile = React.useCallback(async (file: File) => {
    const err = validateImageFile(file, 10);
    if (err) { toast.error(err); return; }
    setIsUploading(true);
    try {
      const naming = resolveNamingContext(undefined, { entityName: 'team', field: 'avatar', index });
      const prepared = await prepareImageForUpload(file, { quality: 0.85, naming });
      const uploadUrl = await generateUploadUrl();
      const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': prepared.mimeType }, body: prepared.file });
      if (!res.ok) { throw new Error('Upload failed'); }
      const { storageId } = await res.json();
      const result = await saveImage({ storageId: storageId as Id<'_storage'>, filename: prepared.filename, folder: 'team-avatars', mimeType: prepared.mimeType, size: prepared.size, width: prepared.width, height: prepared.height });
      await trackDraftUpload(storageId as Id<'_storage'>, 'team-avatars');
      onChange(result.url ?? '', storageId);
      toast.success('Tải ảnh thành công');
    } catch { toast.error('Lỗi tải ảnh'); } finally { setIsUploading(false); }
  }, [generateUploadUrl, index, onChange, saveImage, trackDraftUpload]);

  const handleClipboardPaste = React.useCallback(async () => {
    if (isUploading) { return; }
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File([blob], `team-avatar-clipboard-${Date.now()}.${ext}`, { type: imageType });
          void handleFile(file);
          return;
        }
      }
      toast.error('Clipboard không có ảnh. Hãy copy ảnh trước.');
    } catch {
      toast.error('Không đọc được clipboard. Hãy copy ảnh trước.');
    }
  }, [handleFile, isUploading]);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { void handleFile(f); } }} />
      <div className="relative">
        <div
          className={cn('h-10 w-10 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-all',
            'border-slate-200 hover:border-slate-300 dark:border-slate-600',
            isUploading && 'pointer-events-none')}
          onClick={() => { if (!isUploading) { inputRef.current?.click(); } }}
        >
          {isUploading ? (
            <div className="h-full w-full flex items-center justify-center bg-slate-100"><Loader2 size={14} className="animate-spin text-blue-500" /></div>
          ) : value ? (
            <Image src={value} alt="" width={40} height={40} className="h-full w-full object-cover" unoptimized />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-800"><Upload size={12} className="text-slate-400" /></div>
          )}
        </div>
        {value && (
          <button type="button" className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); onChange('', null); }}>×</button>
        )}
      </div>
      <ImageSourceActions
        mode="upload"
        onUpload={() => inputRef.current?.click()}
        onUrl={onUrlMode}
        onPaste={handleClipboardPaste}
        onCrop={() => setIsEditorOpen(true)}
        cropLabel="1:1"
        cropDisabled={!value || isUploading}
        disabled={isUploading}
        iconSize={11}
        className="gap-1"
      />
      {isEditorOpen && value && (
        <ImageEditorDialog
          imageUrl={value}
          preferredCropAspectRatio="square"
          onClose={() => setIsEditorOpen(false)}
          onApply={(editedFile) => {
            setIsEditorOpen(false);
            void handleFile(editedFile);
          }}
        />
      )}
    </div>
  );
}

type TeamSocialField = 'facebook' | 'linkedin' | 'twitter' | 'phone' | 'zalo' | 'tiktok' | 'youtube' | 'email';

const SOCIAL_FIELDS: Array<{
  type: TeamSocialField;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
}> = [
  {
    type: 'facebook',
    label: 'Facebook',
    placeholder: 'facebook.com/ten-thanh-vien',
    icon: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>,
  },
  {
    type: 'linkedin',
    label: 'LinkedIn',
    placeholder: 'linkedin.com/in/ten-thanh-vien',
    icon: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" /></svg>,
  },
  {
    type: 'zalo',
    label: 'Zalo',
    placeholder: 'zalo.me/so-dien-thoai hoặc số Zalo',
    icon: <ZaloIcon size={15} />,
  },
  {
    type: 'phone',
    label: 'Điện thoại',
    placeholder: '0901234567 hoặc tel:0901234567',
    icon: <Phone size={14} />,
  },
  {
    type: 'tiktok',
    label: 'TikTok',
    placeholder: 'tiktok.com/@username',
    icon: <TikTokIcon size={14} />,
  },
  {
    type: 'youtube',
    label: 'YouTube',
    placeholder: 'youtube.com/@channel',
    icon: <Youtube size={14} />,
  },
  {
    type: 'twitter',
    label: 'X',
    placeholder: 'x.com/username',
    icon: <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>,
  },
  {
    type: 'email',
    label: 'Email',
    placeholder: 'email@domain.com',
    icon: <Mail size={14} />,
  },
];

const getMemberSocialValue = (member: TeamEditorMember, type: TeamSocialField) => member[type] ?? '';

const SocialIconBtn = ({ field, value, onChange }: { field: typeof SOCIAL_FIELDS[number]; value: string; onChange: (next: string) => void; }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div className="relative">
      <button type="button" title={field.label}
        className={cn('flex h-8 w-8 items-center justify-center rounded-md transition-all',
          value ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50' : 'bg-slate-100 text-slate-400 dark:bg-slate-700 hover:bg-slate-200')}
        onClick={() => setIsOpen((p) => !p)}>
        {field.icon}
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-[9999] mt-1 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{field.label}</div>
          <Input value={value} className="h-8 text-xs" autoFocus placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => { setTimeout(() => setIsOpen(false), 150); }} />
        </div>
      )}
    </div>
  );
};

export const TeamForm = ({ members, onChange, secondary, defaultExpanded = true }: TeamFormProps) => {
  const [expandedBioId, setExpandedBioId] = React.useState<number | null>(null);

  const { openSections, toggleSection, hasClosedSection, handleToggleAll } = useFormSectionsState(['members'], defaultExpanded);

  const { draggedId, dragOverId, dragProps } = useDragReorder(members, onChange);

  const updateMember = (id: number, patch: Partial<TeamEditorMember>) => {
    onChange(members.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const addMember = () => {
    const maxId = members.reduce((max, m) => Math.max(max, m.id), 0);
    onChange([...members, createEmptyMember(maxId + 1)]);
  };

  const removeMember = (id: number) => {
    onChange(members.filter((m) => m.id !== id));
    if (expandedBioId === id) { setExpandedBioId(null); }
  };

  const avatarTypeOptions: Array<{ value: TeamAvatarType; label: string; icon: React.ReactNode }> = [
    { value: 'upload', label: 'Upload', icon: <Upload size={11} /> },
    { value: 'url', label: 'URL', icon: <ImageIcon size={11} /> },
    { value: 'icon', label: 'Icon', icon: <Sparkles size={11} /> },
  ];

  return (
    <div className="mb-6">
      <FormSectionsToggleAllButton hasClosedSection={hasClosedSection} onToggleAll={handleToggleAll} />
      <SubSection
        icon={Users}
        title={`Thành viên (${members.length})`}
        open={openSections.members}
        onOpenChange={(open) => toggleSection('members', open)}
        actions={(
          <>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addMember}>
              <Plus size={12} /> Thêm
            </Button>
            <AiDemoTeamImport onApply={(items) => onChange(items as TeamEditorMember[])} />
          </>
        )}
      >
        <div className="space-y-2">
          {/* Demo avatars */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
            <span className="text-[11px] text-slate-500 shrink-0">Demo:</span>
            <div className="flex gap-1.5 flex-wrap">
              {DEMO_AVATARS.map((url, i) => (
                <button key={url} type="button" title={`Dùng avatar demo ${i + 1}`}
                  className="h-7 w-7 overflow-hidden rounded-full border-2 border-transparent hover:border-blue-400 transition-all"
                  onClick={() => {
                    if (members[i]) {
                      updateMember(members[i].id, { avatar: url, avatarType: 'url', avatarStorageId: null });
                    } else {
                      const maxId = members.reduce((max, m) => Math.max(max, m.id), 0);
                      onChange([...members, { ...createEmptyMember(maxId + 1), avatar: url, avatarType: 'url', avatarStorageId: null, name: `Thành viên ${i + 1}` }]);
                    }
                  }}>
                  <Image src={url} alt="" width={28} height={28} className="h-full w-full object-cover" unoptimized />
                </button>
              ))}
            </div>
          </div>

          {members.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-700">
              <Users size={24} className="mb-2 text-slate-300" style={{ color: secondary }} />
              <p className="text-sm text-slate-500 mb-3">Chưa có thành viên</p>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addMember}>
                <Plus size={12} /> Thêm thành viên
              </Button>
            </div>
          )}

          {members.map((member) => {
            const avatarType = member.avatarType ?? 'upload';
            const IconCmp = getIconCmp(member.avatarIcon || 'Star');

            return (
              <div key={member.id} {...dragProps(member.id)}
                className={cn('cursor-grab overflow-visible rounded-xl border bg-white transition-all active:cursor-grabbing dark:bg-slate-900',
                  draggedId === member.id && 'opacity-50 scale-[0.98]',
                  dragOverId === member.id && 'ring-2 ring-blue-500 ring-offset-1',
                  'border-slate-200 dark:border-slate-700')}>

                <div className="grid gap-3 p-3 md:grid-cols-[auto_1fr_auto]">
                  <div className="flex items-start gap-2">
                    <GripVertical size={14} className="mt-2 shrink-0 cursor-grab text-slate-300" />
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700">
                      {avatarType === 'icon' ? (
                        <div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: `${secondary}20` }}>
                          <IconCmp size={24} style={{ color: secondary }} />
                        </div>
                      ) : member.avatar ? (
                        <Image src={member.avatar} alt="" width={64} height={64} className="h-full w-full object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-700">
                          <Users size={20} className="text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input placeholder="Họ và tên" className="h-9 text-sm" value={member.name}
                        onChange={(e) => updateMember(member.id, { name: e.target.value })} />
                      <Input placeholder="Chức vụ" className="h-9 text-sm" value={member.role}
                        onChange={(e) => updateMember(member.id, { role: e.target.value })} />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {avatarTypeOptions.map((opt) => (
                        <button key={opt.value} type="button"
                          className={cn('flex h-8 items-center gap-1 rounded-md border px-2 text-[11px] font-medium transition-colors',
                            avatarType === opt.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900')}
                          onClick={() => updateMember(member.id, { avatarType: opt.value })}>
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                      <button type="button" className="ml-auto flex h-8 items-center gap-1 rounded-md px-2 text-[11px] text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                        onClick={() => setExpandedBioId((p) => (p === member.id ? null : member.id))}>
                        Bio {expandedBioId === member.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>

                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800/40">
                      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">Liên hệ & mạng xã hội</div>
                      <div className="flex flex-wrap gap-1.5">
                        {SOCIAL_FIELDS.map((field) => (
                          <SocialIconBtn
                            key={field.type}
                            field={field}
                            value={getMemberSocialValue(member, field.type)}
                            onChange={(value) => updateMember(member.id, { [field.type]: value } as Partial<TeamEditorMember>)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-500"
                    onClick={() => removeMember(member.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>

                {/* Avatar input (URL hoặc Upload) */}
                {avatarType === 'upload' && (
                  <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 px-2.5 py-1.5">
                    <AvatarUpload value={member.avatar} onChange={(url, storageId) => updateMember(member.id, { avatar: url, avatarStorageId: storageId })}
                      onUrlMode={() => updateMember(member.id, { avatarType: 'url' })}
                      index={members.findIndex((m) => m.id === member.id) + 1} />
                    {member.avatar && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{member.avatar}</span>
                    )}
                  </div>
                )}

                {avatarType === 'url' && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-2.5 py-1.5">
                    <Input placeholder="https://example.com/avatar.jpg" className="h-7 text-xs"
                      value={member.avatar}
                      onChange={(e) => updateMember(member.id, { avatar: e.target.value, avatarStorageId: null })} />
                  </div>
                )}

                {avatarType === 'icon' && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-2.5 py-1.5">
                    <IconPopoverPicker
                      value={member.avatarIcon || 'Star'}
                      onChange={(nextIcon) => updateMember(member.id, { avatarIcon: nextIcon })}
                      options={TEAM_ICON_PICKER_OPTIONS}
                      brandColor={secondary}
                    />
                  </div>
                )}

                {/* Bio */}
                {expandedBioId === member.id && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-2.5 pb-2.5">
                    <textarea placeholder="Giới thiệu ngắn..." value={member.bio}
                      onChange={(e) => updateMember(member.id, { bio: e.target.value })}
                      className="mt-1.5 min-h-[52px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SubSection>
    </div>
  );
};
