import React from 'react';
import { Input } from '@/app/admin/components/ui';
import { QuickRouteInput } from './QuickRouteInput';

interface DemoPrimaryFieldsProps {
  /** Giá trị field tên/tiêu đề */
  name: string;
  /** Placeholder cho field tên */
  namePlaceholder?: string;
  /** Callback khi tên thay đổi */
  onNameChange: (value: string) => void;
  /** Giá trị field liên kết */
  link?: string;
  /** Placeholder cho field liên kết */
  linkPlaceholder?: string;
  /** Callback khi link thay đổi */
  onLinkChange?: (value: string) => void;
  /** Hiện field liên kết hay không (mặc định: true) */
  showLink?: boolean;
}

/**
 * Cụm field chuẩn cho demo item: Input Tên + QuickRouteInput Liên kết.
 * Đặt trong children của DemoItemRowShell.
 *
 * @example
 * <DemoPrimaryFields
 *   name={item.title}
 *   onNameChange={v => update(item.id, { title: v })}
 *   link={item.link ?? ''}
 *   onLinkChange={v => update(item.id, { link: v })}
 * />
 */
export function DemoPrimaryFields({
  name,
  namePlaceholder = 'Tên *',
  onNameChange,
  link,
  linkPlaceholder = 'Liên kết khi click',
  onLinkChange,
  showLink = true,
}: DemoPrimaryFieldsProps) {
  return (
    <>
      <Input
        placeholder={namePlaceholder}
        className="h-8 text-xs min-w-0"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
      />
      {showLink && onLinkChange !== undefined && (
        <QuickRouteInput
          placeholder={linkPlaceholder}
          value={link ?? ''}
          onChangeValue={onLinkChange}
          inputClassName="h-8 text-xs"
        />
      )}
    </>
  );
}
