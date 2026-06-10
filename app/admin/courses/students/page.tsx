'use client';

import React from 'react';
import { GraduationCap } from 'lucide-react';
import { CourseStudentsPanel } from '@/app/admin/courses/components/CourseStudentsPanel';
import { ModuleGuard } from '@/app/admin/components/ModuleGuard';

export default function CourseStudentsPage() {
  return (
    <ModuleGuard moduleKey="courses">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2">
              <GraduationCap className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Học viên khóa học</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Theo dõi học viên, tiến độ học và chứng nhận hoàn thành.</p>
            </div>
          </div>
        </div>

        <CourseStudentsPanel showCourseColumn />
      </div>
    </ModuleGuard>
  );
}

