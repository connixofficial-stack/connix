'use client';

import React from 'react';
import { Progress } from '@/app/admin/components/ui';

type WizardProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const value = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Step {currentStep} / {totalSteps}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
