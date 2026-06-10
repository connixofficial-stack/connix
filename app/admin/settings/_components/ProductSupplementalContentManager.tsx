'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { useAdminAuth } from '@/app/admin/auth/context';
import { getAdminMutationErrorMessage } from '@/app/admin/lib/mutation-error';
import { LexicalEditor } from '@/app/admin/components/LexicalEditor';
import { normalizeRichText } from '@/app/admin/lib/normalize-rich-text';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/admin/components/ui';
import { HomeComponentStickyFooter } from '@/app/admin/home-components/_shared/components/HomeComponentStickyFooter';

export function ProductSupplementalContentManager() {
  const { hasPermission, user } = useAdminAuth();
  const canView = hasPermission('products', 'view');
  const canEdit = hasPermission('products', 'edit');

  const globalTemplate = useQuery(api.productSupplementalContents.getGlobalTemplate);
  const upsertTemplate = useMutation(api.productSupplementalContents.upsertGlobalTemplate);

  const [preContent, setPreContent] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  // Sync content when template loaded
  useEffect(() => {
    if (globalTemplate) {
      setPreContent(globalTemplate.preContent ?? '');
      setPostContent(globalTemplate.postContent ?? '');
    } else {
      setPreContent('');
      setPostContent('');
    }
  }, [globalTemplate]);

  if (!canView) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-slate-500">
          Bạn không có quyền xem cấu hình này.
        </CardContent>
      </Card>
    );
  }

  if (globalTemplate === undefined) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!canEdit) {
      return;
    }

    setIsSaving(true);
    try {
      await upsertTemplate({
        preContent: normalizeRichText(preContent),
        postContent: normalizeRichText(postContent),
        updatedBy: user?.id ? (user.id as Id<'users'>) : null,
      });
      toast.success('Đã lưu nội dung mô tả dùng chung thành công');
    } catch (error) {
      toast.error(getAdminMutationErrorMessage(error, 'Không thể lưu nội dung mô tả dùng chung'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (globalTemplate) {
      setPreContent(globalTemplate.preContent ?? '');
      setPostContent(globalTemplate.postContent ?? '');
    } else {
      setPreContent('');
      setPostContent('');
    }
    setResetCounter((prev) => prev + 1);
    toast.message('Đã hoàn tác thay đổi');
  };

  const hasChanges =
    preContent !== (globalTemplate?.preContent ?? '') ||
    postContent !== (globalTemplate?.postContent ?? '');

  return (
    <>
      <div className="space-y-6 pb-28">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nội dung đầu mô tả sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <LexicalEditor
              onChange={(html) => setPreContent(normalizeRichText(html))}
              initialContent={preContent}
              resetKey={`pre-${globalTemplate?._id || 'new'}-${resetCounter}`}
              folder="products-supplemental-pre"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nội dung cuối mô tả sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <LexicalEditor
              onChange={(html) => setPostContent(normalizeRichText(html))}
              initialContent={postContent}
              resetKey={`post-${globalTemplate?._id || 'new'}-${resetCounter}`}
              folder="products-supplemental-post"
            />
          </CardContent>
        </Card>
      </div>

      <HomeComponentStickyFooter
        isSubmitting={isSaving}
        submitLabel="Lưu thay đổi"
        onCancel={handleCancel}
        submitType="button"
        onClickSave={handleSave}
        disableSave={!canEdit || isSaving || !hasChanges}
      >
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving || !hasChanges}
          >
            Hủy
          </Button>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-xs text-slate-500">
              Nội dung mô tả sẽ tự động áp dụng toàn cục cho các sản phẩm Active.
            </div>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!canEdit || isSaving || !hasChanges}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Lưu cấu hình
            </Button>
          </div>
        </>
      </HomeComponentStickyFooter>
    </>
  );
}
