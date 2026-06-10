'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export type ContactFormValues = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const DEFAULT_VALUES: ContactFormValues = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
};

export const useContactInquiryForm = ({
  sourcePath,
  subjectFallback,
}: {
  sourcePath?: string;
  subjectFallback?: string;
}) => {
  const submitContactInquiry = useMutation(api.contactInbox.submitContactInquiry);
  const inboxFeature = useQuery(api.admin.modules.getModuleFeature, { moduleKey: 'contactInbox', featureKey: 'enableContactFormSubmission' });
  const inboxSettings = useQuery(api.admin.modules.listModuleSettings, { moduleKey: 'contactInbox' });

  const [values, setValues] = useState<ContactFormValues>(DEFAULT_VALUES);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const isModuleLoading = inboxFeature === undefined || inboxSettings === undefined;
  const isFormEnabled = (inboxFeature?.enabled ?? false) && !isModuleLoading;
  const requireEmail = Boolean(inboxSettings?.find(setting => setting.settingKey === 'requireEmail')?.value);
  const requirePhone = Boolean(inboxSettings?.find(setting => setting.settingKey === 'requirePhone')?.value);

  const resolvedSubjectFallback = useMemo(() => subjectFallback?.trim() || 'Liên hệ từ website', [subjectFallback]);

  const updateValue = (field: keyof ContactFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setValues(DEFAULT_VALUES);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormEnabled || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      const subjectValue = values.subject.trim() || resolvedSubjectFallback;
      await submitContactInquiry({
        email: values.email.trim() || undefined,
        message: values.message.trim(),
        name: values.name.trim(),
        phone: values.phone.trim() || undefined,
        subject: subjectValue,
        sourcePath,
      });
      setSubmitMessage('Cảm ơn bạn! Chúng tôi đã nhận được tin nhắn.');
      resetForm();
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : 'Gửi tin nhắn thất bại. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    updateValue,
    handleSubmit,
    isSubmitting,
    submitMessage,
    isFormEnabled,
    isModuleLoading,
    requireEmail,
    requirePhone,
    subjectFallback: resolvedSubjectFallback,
  };
};
