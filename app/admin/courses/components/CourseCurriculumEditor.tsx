'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Edit2,
  GripVertical,
  Loader2,
  Plus,
  Trash2,
  Video,
  Eye,
  Settings,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { stripHtml } from '@/lib/seo';
import { LexicalEditor } from '../../components/LexicalEditor';
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  cn
} from '../../components/ui';

// ─── Types ───────────────────────────────────────────────────────────────────

type VideoType = 'none' | 'youtube' | 'drive' | 'external';

interface DraftLesson {
  /** Convex ID hoặc `temp_${uuid}` nếu chưa tạo */
  _id: string;
  chapterId: string;
  title: string;
  videoType: VideoType;
  videoUrl?: string;
  durationSeconds?: number;
  description?: string;
  exerciseLink?: string;
  isPreview: boolean;
  order: number;
  isNew: boolean;
  isDeleted: boolean;
}

interface DraftChapter {
  /** Convex ID hoặc `temp_${uuid}` nếu chưa tạo */
  _id: string;
  title: string;
  summary?: string;
  order: number;
  isNew: boolean;
  isDeleted: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTempId(): string {
  return `temp_${Math.random().toString(36).slice(2)}`;
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function parseDurationToSeconds(input: string): number {
  if (!input) return 0;
  const cleanInput = input.trim().toLowerCase();

  if (cleanInput.includes(':')) {
    const parts = cleanInput.split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  let totalSeconds = 0;
  const hourMatch = cleanInput.match(/(\d+(\.\d+)?)\s*h/);
  if (hourMatch) {
    totalSeconds += parseFloat(hourMatch[1]) * 3600;
  }
  const minuteMatch = cleanInput.match(/(\d+(\.\d+)?)\s*(m|min)/);
  if (minuteMatch) {
    totalSeconds += parseFloat(minuteMatch[1]) * 60;
  }
  const secondMatch = cleanInput.match(/(\d+)\s*(s|sec)/);
  if (secondMatch) {
    totalSeconds += parseInt(secondMatch[1], 10);
  }
  if (totalSeconds === 0 && /^\d+(\.\d+)?$/.test(cleanInput)) {
    totalSeconds += parseFloat(cleanInput) * 60;
  }
  return Math.round(totalSeconds);
}

function formatSecondsToDurationInputString(seconds?: number): string {
  if (!seconds) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || (hours > 0 && remainingSeconds > 0)) result += `${minutes}m `;
  if (remainingSeconds > 0 || (hours === 0 && minutes === 0)) result += `${remainingSeconds}s`;
  return result.trim();
}

function getDurationFeedback(input: string): string {
  const seconds = parseDurationToSeconds(input);
  if (seconds <= 0) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} giờ`);
  if (minutes > 0) parts.push(`${minutes} phút`);
  if (remainingSeconds > 0) parts.push(`${remainingSeconds} giây`);

  return `Quy đổi: ${parts.join(' ')} (${seconds} giây)`;
}

function formatDuration(seconds?: number): string {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (s === 0) return `${m} phút`;
  return `${m}m ${s}s`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CourseCurriculumEditorProps {
  courseId: Id<'courses'>;
  onDirtyChange: (isDirty: boolean) => void;
  onSaveRef: React.MutableRefObject<(() => Promise<void>) | null>;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CourseCurriculumEditor({
  courseId,
  onDirtyChange,
  onSaveRef,
}: CourseCurriculumEditorProps) {
  // ── Convex data (read-only source of truth) ──
  const serverChapters = useQuery(api.courses.listChapters, { courseId });
  const serverLessons = useQuery(api.courses.listLessonsByCourse, { courseId });

  // ── Mutations ──
  const createChapter = useMutation(api.courses.createChapter);
  const updateChapter = useMutation(api.courses.updateChapter);
  const removeChapter = useMutation(api.courses.removeChapter);
  const reorderChapters = useMutation(api.courses.reorderChapters);

  const createLesson = useMutation(api.courses.createLesson);
  const updateLesson = useMutation(api.courses.updateLesson);
  const removeLesson = useMutation(api.courses.removeLesson);
  const reorderLessons = useMutation(api.courses.reorderLessons);

  // ── Draft State (pending model) ──
  const [draftChapters, setDraftChapters] = useState<DraftChapter[]>([]);
  const [draftLessons, setDraftLessons] = useState<DraftLesson[]>([]);
  const [initialized, setInitialized] = useState(false);

  // ── UI State ──
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState('');
  const [editChapterSummary, setEditChapterSummary] = useState('');

  // Add Chapter Form
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterSummary, setNewChapterSummary] = useState('');
  const [newChapterResetKey, setNewChapterResetKey] = useState(0);

  // Add Lesson Form (Inline)
  const [addingLessonToChapterId, setAddingLessonToChapterId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonVideoType, setNewLessonVideoType] = useState<VideoType>('none');
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
  const [newLessonDurationInput, setNewLessonDurationInput] = useState('');
  const [newLessonDescription, setNewLessonDescription] = useState('');
  const [newLessonExerciseLink, setNewLessonExerciseLink] = useState('');
  const [newLessonResetKey, setNewLessonResetKey] = useState(0);
  const [newLessonPreview, setNewLessonPreview] = useState(false);

  // Edit Lesson Inline
  const [editingLesson, setEditingLesson] = useState<{
    id: string;
    title: string;
    videoType: VideoType;
    videoUrl: string;
    durationInput: string;
    isPreview: boolean;
    description: string;
    exerciseLink: string;
  } | null>(null);

  // Drag and Drop States
  const [draggingChapterId, setDraggingChapterId] = useState<string | null>(null);
  const [draggingLessonId, setDraggingLessonId] = useState<string | null>(null);
  const [dragOverChapterId, setDragOverChapterId] = useState<string | null>(null);
  const [dragOverLessonId, setDragOverLessonId] = useState<string | null>(null);

  // ── Initialize draft from server data (once) ──
  useEffect(() => {
    if (!serverChapters || !serverLessons || initialized) return;

    const chapters: DraftChapter[] = serverChapters.map((ch) => ({
      _id: ch._id,
      title: ch.title,
      summary: ch.summary,
      order: ch.order,
      isNew: false,
      isDeleted: false,
    }));

    const lessons: DraftLesson[] = serverLessons.map((l) => ({
      _id: l._id,
      chapterId: l.chapterId,
      title: l.title,
      videoType: l.videoType ?? 'none',
      videoUrl: l.videoUrl,
      durationSeconds: l.durationSeconds,
      description: l.description,
      exerciseLink: l.exerciseLink,
      isPreview: l.isPreview ?? false,
      order: l.order,
      isNew: false,
      isDeleted: false,
    }));

    setDraftChapters(chapters);
    setDraftLessons(lessons);
    setInitialized(true);

    // Open first chapter by default
    if (chapters.length > 0) {
      setOpenChapters({ [chapters[0]._id]: true });
    }
  }, [serverChapters, serverLessons, initialized]);

  // ── Compute isDirty ──
  const isDirty = useMemo(() => {
    if (!initialized || !serverChapters || !serverLessons) return false;

    const activeChapters = draftChapters.filter((c) => !c.isDeleted);
    const activeLessons = draftLessons.filter((l) => !l.isDeleted);

    // New items added?
    if (activeChapters.some((c) => c.isNew)) return true;
    if (activeLessons.some((l) => l.isNew)) return true;

    // Deleted items?
    if (draftChapters.some((c) => c.isDeleted && !c.isNew)) return true;
    if (draftLessons.some((l) => l.isDeleted && !l.isNew)) return true;

    // Chapter changes?
    for (const ch of activeChapters) {
      const srv = serverChapters.find((s) => s._id === ch._id);
      if (!srv) continue;
      if (srv.title !== ch.title) return true;
      if ((srv.summary ?? '') !== (ch.summary ?? '')) return true;
      if (srv.order !== ch.order) return true;
    }

    // Lesson changes?
    for (const l of activeLessons) {
      const srv = serverLessons.find((s) => s._id === l._id);
      if (!srv) continue;
      if (srv.title !== l.title) return true;
      if ((srv.videoType ?? 'none') !== l.videoType) return true;
      if ((srv.videoUrl ?? '') !== (l.videoUrl ?? '')) return true;
      if ((srv.durationSeconds ?? 0) !== (l.durationSeconds ?? 0)) return true;
      if ((srv.description ?? '') !== (l.description ?? '')) return true;
      if ((srv.exerciseLink ?? '') !== (l.exerciseLink ?? '')) return true;
      if ((srv.isPreview ?? false) !== l.isPreview) return true;
      if (srv.order !== l.order) return true;
      if (srv.chapterId !== l.chapterId) return true;
    }

    // Inline edit lesson form đang mở có thay đổi?
    if (editingLesson !== null) {
      const draftLesson = draftLessons.find((l) => l._id === editingLesson.id);
      if (draftLesson) {
        const parsedDuration = parseDurationToSeconds(editingLesson.durationInput);
        if (
          draftLesson.title !== editingLesson.title.trim() ||
          draftLesson.videoType !== editingLesson.videoType ||
          (draftLesson.videoUrl ?? '') !== editingLesson.videoUrl.trim() ||
          (draftLesson.durationSeconds ?? 0) !== (parsedDuration > 0 ? parsedDuration : 0) ||
          (draftLesson.description ?? '') !== editingLesson.description.trim() ||
          (draftLesson.exerciseLink ?? '') !== editingLesson.exerciseLink.trim() ||
          draftLesson.isPreview !== editingLesson.isPreview
        ) return true;
      } else {
        // Bài học mới (chưa có trong draft) — form đang mở = dirty
        return true;
      }
    }

    // Inline edit chapter form đang mở có thay đổi?
    if (editingChapterId !== null) {
      const draftChapter = draftChapters.find((c) => c._id === editingChapterId);
      if (draftChapter) {
        if (
          draftChapter.title !== editChapterTitle.trim() ||
          (draftChapter.summary ?? '') !== editChapterSummary.trim()
        ) return true;
      }
    }

    return false;
  }, [
    initialized, serverChapters, serverLessons, draftChapters, draftLessons,
    editingLesson, editingChapterId, editChapterTitle, editChapterSummary,
  ]);

  // ── Notify parent of dirty change ──
  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // ── Save function (exposed to parent via ref) ──
  const saveDraft = useCallback(async () => {
    if (!serverChapters || !serverLessons) return;

    // Auto-commit any open edit forms into local vars trước khi save
    let workingChapters = draftChapters;
    let workingLessons = draftLessons;

    if (editingChapterId !== null && editChapterTitle.trim()) {
      workingChapters = workingChapters.map((c) =>
        c._id === editingChapterId
          ? { ...c, title: editChapterTitle.trim(), summary: editChapterSummary.trim() || undefined }
          : c
      );
      setEditingChapterId(null);
    }

    if (editingLesson !== null && editingLesson.title.trim()) {
      const parsedDuration = parseDurationToSeconds(editingLesson.durationInput);
      workingLessons = workingLessons.map((l) =>
        l._id === editingLesson.id
          ? {
              ...l,
              title: editingLesson.title.trim(),
              videoType: editingLesson.videoType,
              videoUrl: editingLesson.videoUrl.trim() || undefined,
              durationSeconds: parsedDuration > 0 ? parsedDuration : undefined,
              description: editingLesson.description.trim() || undefined,
              exerciseLink: editingLesson.exerciseLink.trim() || undefined,
              isPreview: editingLesson.isPreview,
            }
          : l
      );
      setEditingLesson(null);
    }

    // 1. Delete chapters (and their lessons cascade)
    const chaptersToDelete = workingChapters.filter((c) => c.isDeleted && !c.isNew);
    for (const ch of chaptersToDelete) {
      await removeChapter({ id: ch._id as Id<'courseChapters'> });
    }

    // 2. Delete lessons (only those in non-deleted chapters)
    const lessonsToDelete = workingLessons.filter((l) => l.isDeleted && !l.isNew && !chaptersToDelete.some((c) => c._id === l.chapterId));
    for (const l of lessonsToDelete) {
      await removeLesson({ id: l._id as Id<'courseLessons'> });
    }

    // 3. Create new chapters + map tempId → realId
    const tempToRealChapterId: Record<string, Id<'courseChapters'>> = {};
    const newChapters = workingChapters.filter((c) => c.isNew && !c.isDeleted);
    for (const ch of newChapters) {
      const realId = await createChapter({
        courseId,
        title: ch.title,
        summary: ch.summary || undefined,
      });
      tempToRealChapterId[ch._id] = realId;
    }

    // 4. Update existing chapters
    const chaptersToUpdate = workingChapters.filter((c) => !c.isNew && !c.isDeleted);
    for (const ch of chaptersToUpdate) {
      const srv = serverChapters.find((s) => s._id === ch._id);
      if (!srv) continue;
      const hasChange = srv.title !== ch.title || (srv.summary ?? '') !== (ch.summary ?? '');
      if (hasChange) {
        await updateChapter({
          id: ch._id as Id<'courseChapters'>,
          title: ch.title,
          summary: ch.summary || undefined,
        });
      }
    }

    // 5. Reorder chapters
    const activeChapters = workingChapters.filter((c) => !c.isDeleted);
    const chapterOrders = activeChapters.map((ch, idx) => ({
      id: (tempToRealChapterId[ch._id] ?? ch._id) as Id<'courseChapters'>,
      order: idx,
    }));
    if (chapterOrders.length > 0) {
      await reorderChapters({ orders: chapterOrders });
    }

    // 6. Create new lessons (resolve chapter IDs)
    const tempToRealLessonId: Record<string, Id<'courseLessons'>> = {};
    const newLessons = workingLessons.filter((l) => l.isNew && !l.isDeleted);
    for (const l of newLessons) {
      const realChapterId = tempToRealChapterId[l.chapterId] ?? (l.chapterId as Id<'courseChapters'>);
      const realId = await createLesson({
        courseId,
        chapterId: realChapterId,
        title: l.title,
        videoType: l.videoType,
        videoUrl: l.videoUrl || undefined,
        durationSeconds: l.durationSeconds || undefined,
        description: l.description || undefined,
        exerciseLink: l.exerciseLink || undefined,
        isPreview: l.isPreview,
      });
      tempToRealLessonId[l._id] = realId;
    }

    // 7. Update existing lessons
    const lessonsToUpdate = workingLessons.filter((l) => !l.isNew && !l.isDeleted && !chaptersToDelete.some((c) => c._id === l.chapterId));
    for (const l of lessonsToUpdate) {
      const srv = serverLessons.find((s) => s._id === l._id);
      if (!srv) continue;
      const hasChange =
        srv.title !== l.title ||
        (srv.videoType ?? 'none') !== l.videoType ||
        (srv.videoUrl ?? '') !== (l.videoUrl ?? '') ||
        (srv.durationSeconds ?? 0) !== (l.durationSeconds ?? 0) ||
        (srv.description ?? '') !== (l.description ?? '') ||
        (srv.exerciseLink ?? '') !== (l.exerciseLink ?? '') ||
        (srv.isPreview ?? false) !== l.isPreview;
      if (hasChange) {
        await updateLesson({
          id: l._id as Id<'courseLessons'>,
          title: l.title,
          videoType: l.videoType,
          videoUrl: l.videoUrl || undefined,
          durationSeconds: l.durationSeconds || undefined,
          description: l.description || undefined,
          exerciseLink: l.exerciseLink || undefined,
          isPreview: l.isPreview,
        });
      }
    }

    // 8. Reorder lessons per chapter
    const activeChapterIds = activeChapters.map((c) => tempToRealChapterId[c._id] ?? c._id);
    const activeLessons = workingLessons.filter((l) => !l.isDeleted);

    const lessonOrders: { id: Id<'courseLessons'>; order: number; chapterId?: Id<'courseChapters'> }[] = [];
    for (const chId of activeChapterIds) {
      const originalTempId = Object.keys(tempToRealChapterId).find((k) => tempToRealChapterId[k] === chId);
      const draftChId = originalTempId ?? chId;
      const chLessons = activeLessons
        .filter((l) => l.chapterId === draftChId)
        .sort((a, b) => a.order - b.order);

      chLessons.forEach((l, idx) => {
        const realLessonId = (tempToRealLessonId[l._id] ?? l._id) as Id<'courseLessons'>;
        const realChapterId = chId as Id<'courseChapters'>;
        const srv = serverLessons.find((s) => s._id === l._id);
        const chapterChanged = srv && srv.chapterId !== l.chapterId;
        lessonOrders.push({
          id: realLessonId,
          order: idx,
          chapterId: (l.isNew || chapterChanged) ? realChapterId : undefined,
        });
      });
    }

    if (lessonOrders.length > 0) {
      await reorderLessons({ orders: lessonOrders });
    }

    toast.success('Đã lưu lộ trình học');
    // Reset draft để Convex data mới reinit lại sạch
    setInitialized(false);
  }, [
    serverChapters, serverLessons, draftChapters, draftLessons, courseId,
    editingChapterId, editChapterTitle, editChapterSummary, editingLesson,
    createChapter, updateChapter, removeChapter, reorderChapters,
    createLesson, updateLesson, removeLesson, reorderLessons,
  ]);

  // Expose saveDraft to parent
  useEffect(() => {
    onSaveRef.current = saveDraft;
  }, [saveDraft, onSaveRef]);

  // ── Derived: lessons by chapter ──
  const lessonsByChapter = useMemo(() => {
    const map: Record<string, DraftLesson[]> = {};
    draftLessons
      .filter((l) => !l.isDeleted)
      .forEach((l) => {
        map[l.chapterId] = [...(map[l.chapterId] ?? []), l];
      });
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => a.order - b.order);
    });
    return map;
  }, [draftLessons]);

  const activeChapters = useMemo(
    () => draftChapters.filter((c) => !c.isDeleted).sort((a, b) => a.order - b.order),
    [draftChapters]
  );

  // ── Chapter handlers (draft only) ──
  const toggleChapter = (id: string) => {
    setOpenChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExpandAll = () => {
    const state: Record<string, boolean> = {};
    activeChapters.forEach((ch) => { state[ch._id] = true; });
    setOpenChapters(state);
  };

  const handleCollapseAll = () => setOpenChapters({});

  const handleAddChapter = () => {
    if (!newChapterTitle.trim()) return;
    const tempId = makeTempId();
    const newOrder = activeChapters.length;
    setDraftChapters((prev) => [
      ...prev,
      { _id: tempId, title: newChapterTitle.trim(), summary: newChapterSummary.trim() || undefined, order: newOrder, isNew: true, isDeleted: false },
    ]);
    setNewChapterTitle('');
    setNewChapterSummary('');
    setNewChapterResetKey((prev) => prev + 1);
    setOpenChapters((prev) => ({ ...prev, [tempId]: true }));
  };

  const startEditChapter = (ch: DraftChapter) => {
    setEditingChapterId(ch._id);
    setEditChapterTitle(ch.title);
    setEditChapterSummary(ch.summary ?? '');
  };

  const handleSaveChapter = (chapterId: string) => {
    if (!editChapterTitle.trim()) return;
    setDraftChapters((prev) =>
      prev.map((c) =>
        c._id === chapterId
          ? { ...c, title: editChapterTitle.trim(), summary: editChapterSummary.trim() || undefined }
          : c
      )
    );
    setEditingChapterId(null);
  };

  const handleDeleteChapter = (chapterId: string) => {
    if (!confirm('Xóa chương này và toàn bộ bài học bên trong? Bạn không thể hoàn tác hành động này.')) return;
    // Mark chapter and all its lessons as deleted
    setDraftChapters((prev) =>
      prev.map((c) => (c._id === chapterId ? { ...c, isDeleted: true } : c))
    );
    setDraftLessons((prev) =>
      prev.map((l) => (l.chapterId === chapterId ? { ...l, isDeleted: true } : l))
    );
  };

  // ── Lesson handlers (draft only) ──
  const handleAddLesson = (chapterId: string) => {
    if (!newLessonTitle.trim()) return;
    const chapterLessons = lessonsByChapter[chapterId] ?? [];
    const newOrder = chapterLessons.length;
    const parsedDuration = parseDurationToSeconds(newLessonDurationInput);
    const tempId = makeTempId();
    setDraftLessons((prev) => [
      ...prev,
      {
        _id: tempId,
        chapterId,
        title: newLessonTitle.trim(),
        videoType: newLessonVideoType,
        videoUrl: newLessonVideoUrl.trim() || undefined,
        durationSeconds: parsedDuration > 0 ? parsedDuration : undefined,
        description: newLessonDescription.trim() || undefined,
        exerciseLink: newLessonExerciseLink.trim() || undefined,
        isPreview: newLessonPreview,
        order: newOrder,
        isNew: true,
        isDeleted: false,
      },
    ]);
    setNewLessonTitle('');
    setNewLessonVideoType('none');
    setNewLessonVideoUrl('');
    setNewLessonDurationInput('');
    setNewLessonDescription('');
    setNewLessonExerciseLink('');
    setNewLessonResetKey((prev) => prev + 1);
    setNewLessonPreview(false);
    setAddingLessonToChapterId(null);
  };

  const handleOpenEditLesson = (lesson: DraftLesson) => {
    setEditingLesson({
      id: lesson._id,
      title: lesson.title,
      videoType: lesson.videoType,
      videoUrl: lesson.videoUrl ?? '',
      durationInput: formatSecondsToDurationInputString(lesson.durationSeconds),
      isPreview: lesson.isPreview,
      description: lesson.description ?? '',
      exerciseLink: lesson.exerciseLink ?? '',
    });
  };



  const handleDeleteLesson = (lessonId: string) => {
    if (!confirm('Xóa bài học này?')) return;
    setDraftLessons((prev) =>
      prev.map((l) => (l._id === lessonId ? { ...l, isDeleted: true } : l))
    );
  };

  // ── Drag & Drop (Chapters) ──
  const handleChapterDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('type', 'chapter');
    e.dataTransfer.setData('id', id);
    setDraggingChapterId(id);
  };

  const handleChapterDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggingChapterId && draggingChapterId !== id) {
      setDragOverChapterId(id);
    }
  };

  const handleChapterDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const dragType = e.dataTransfer.getData('type');
    const dragId = e.dataTransfer.getData('id');

    setDraggingChapterId(null);
    setDragOverChapterId(null);

    if (dragType !== 'chapter' || dragId === targetId) return;

    setDraftChapters((prev) => {
      const active = prev.filter((c) => !c.isDeleted).sort((a, b) => a.order - b.order);
      const deleted = prev.filter((c) => c.isDeleted);
      const dragIndex = active.findIndex((c) => c._id === dragId);
      const targetIndex = active.findIndex((c) => c._id === targetId);
      if (dragIndex === -1 || targetIndex === -1) return prev;
      const [removed] = active.splice(dragIndex, 1);
      active.splice(targetIndex, 0, removed);
      return [
        ...active.map((c, idx) => ({ ...c, order: idx })),
        ...deleted,
      ];
    });
  };

  // ── Drag & Drop (Lessons) ──
  const handleLessonDragStart = (e: React.DragEvent, lessonId: string, sourceChapterId: string) => {
    e.stopPropagation();
    e.dataTransfer.setData('type', 'lesson');
    e.dataTransfer.setData('id', lessonId);
    e.dataTransfer.setData('sourceChapterId', sourceChapterId);
    setDraggingLessonId(lessonId);
  };

  const handleLessonDragOver = (e: React.DragEvent, lessonId: string, chapterId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggingLessonId && draggingLessonId !== lessonId) {
      setDragOverLessonId(lessonId);
    }
    setDragOverChapterId(chapterId);
  };

  const handleLessonDropOnChapter = (e: React.DragEvent, targetChapterId: string) => {
    e.preventDefault();
    const dragType = e.dataTransfer.getData('type');
    const dragId = e.dataTransfer.getData('id');
    const sourceChapterId = e.dataTransfer.getData('sourceChapterId');

    setDraggingLessonId(null);
    setDragOverLessonId(null);
    setDragOverChapterId(null);

    if (dragType !== 'lesson') return;

    setDraftLessons((prev) => {
      const lessons = prev.filter((l) => !l.isDeleted);
      if (sourceChapterId === targetChapterId) {
        const chLessons = lessons.filter((l) => l.chapterId === sourceChapterId).sort((a, b) => a.order - b.order);
        const dragIdx = chLessons.findIndex((l) => l._id === dragId);
        if (dragIdx === -1) return prev;
        const [removed] = chLessons.splice(dragIdx, 1);
        chLessons.push(removed);
        const updatedIds = new Set(chLessons.map((l) => l._id));
        return [
          ...prev.filter((l) => l.isDeleted || !updatedIds.has(l._id)),
          ...chLessons.map((l, idx) => ({ ...l, order: idx })),
        ];
      } else {
        // Move to a different chapter
        setOpenChapters((o) => ({ ...o, [targetChapterId]: true }));
        const targetLessons = lessons.filter((l) => l.chapterId === targetChapterId).sort((a, b) => a.order - b.order);
        return prev.map((l) => {
          if (l._id === dragId) return { ...l, chapterId: targetChapterId, order: targetLessons.length };
          return l;
        });
      }
    });
  };

  const handleLessonDropOnLesson = (e: React.DragEvent, targetLessonId: string, targetChapterId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const dragType = e.dataTransfer.getData('type');
    const dragId = e.dataTransfer.getData('id');
    const sourceChapterId = e.dataTransfer.getData('sourceChapterId');

    setDraggingLessonId(null);
    setDragOverLessonId(null);
    setDragOverChapterId(null);

    if (dragType !== 'lesson' || dragId === targetLessonId) return;

    setDraftLessons((prev) => {
      const lessons = prev.filter((l) => !l.isDeleted);
      const deleted = prev.filter((l) => l.isDeleted);

      if (sourceChapterId === targetChapterId) {
        const chLessons = lessons.filter((l) => l.chapterId === sourceChapterId).sort((a, b) => a.order - b.order);
        const dragIdx = chLessons.findIndex((l) => l._id === dragId);
        const targetIdx = chLessons.findIndex((l) => l._id === targetLessonId);
        if (dragIdx === -1 || targetIdx === -1) return prev;
        const [removed] = chLessons.splice(dragIdx, 1);
        chLessons.splice(targetIdx, 0, removed);
        const updatedIds = new Set(chLessons.map((l) => l._id));
        return [
          ...lessons.filter((l) => !updatedIds.has(l._id)),
          ...chLessons.map((l, idx) => ({ ...l, order: idx })),
          ...deleted,
        ];
      } else {
        setOpenChapters((o) => ({ ...o, [targetChapterId]: true }));
        const targetLessons = lessons.filter((l) => l.chapterId === targetChapterId).sort((a, b) => a.order - b.order);
        const targetIdx = targetLessons.findIndex((l) => l._id === targetLessonId);
        if (targetIdx === -1) return prev;

        const updatedLesson = { ...prev.find((l) => l._id === dragId)!, chapterId: targetChapterId };
        targetLessons.splice(targetIdx, 0, updatedLesson);

        return [
          ...lessons.filter((l) => l._id !== dragId && !targetLessons.some((tl) => tl._id === l._id)),
          ...targetLessons.map((l, idx) => ({ ...l, order: idx })),
          ...deleted,
        ];
      }
    });
  };

  // ── Loading state ──
  if (!initialized || serverChapters === undefined || serverLessons === undefined) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const isDragDisabled = editingChapterId !== null || addingLessonToChapterId !== null || editingLesson !== null;

  return (
    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="border-b border-slate-100 p-4 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Chi tiết Lộ trình học</h2>
          <p className="text-xs text-slate-500 mt-0.5">Sắp xếp chương/bài học bằng kéo thả. Sửa đổi trực quan.</p>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={handleExpandAll}
            title="Mở rộng tất cả"
          >
            <ChevronsDown size={18} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={handleCollapseAll}
            title="Thu gọn tất cả"
          >
            <ChevronsUp size={18} />
          </Button>
        </div>
      </div>

      <CardContent className="p-4 space-y-6">
        {/* Chapters & Lessons Area */}
        <div className="space-y-4">
          {activeChapters.map((chapter, chapterIdx) => {
            const isExpanded = !!openChapters[chapter._id];
            const chapterLessons = lessonsByChapter[chapter._id] ?? [];
            const isEditing = editingChapterId === chapter._id;

            if (isEditing) {
              return (
                <div
                  key={chapter._id}
                  className="rounded-lg border border-indigo-500/30 dark:border-indigo-400/30 bg-indigo-50/5 dark:bg-indigo-950/5 p-4 space-y-4 transition-all duration-200"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h4 className="font-semibold text-sm text-indigo-700 dark:text-indigo-400">
                      Chỉnh sửa chi tiết Chương {chapterIdx + 1}
                    </h4>
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      onClick={() => setEditingChapterId(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Tên chương <span className="text-red-500">*</span></Label>
                      <Input
                        value={editChapterTitle}
                        onChange={(e) => setEditChapterTitle(e.target.value)}
                        placeholder="Nhập tên chương học..."
                        className="h-9 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSaveChapter(chapter._id);
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Tóm tắt chương (tùy chọn)</Label>
                      <LexicalEditor
                        onChange={setEditChapterSummary}
                        initialContent={editChapterSummary}
                        folder="chapters"
                        resetKey={editingChapterId}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 dark:text-slate-500 text-right pt-1">
                    Bấm <span className="font-medium text-indigo-500">Lưu thay đổi</span> ở thanh dưới để lưu
                  </p>
                </div>
              );
            }

            return (
              <div
                key={chapter._id}
                draggable={!isDragDisabled}
                onDragStart={(e) => handleChapterDragStart(e, chapter._id)}
                onDragOver={(e) => handleChapterDragOver(e, chapter._id)}
                onDrop={(e) => {
                  if (draggingChapterId) {
                    handleChapterDrop(e, chapter._id);
                  } else if (draggingLessonId) {
                    handleLessonDropOnChapter(e, chapter._id);
                  }
                }}
                className={cn(
                  "rounded-lg border bg-white dark:bg-slate-900 transition-all duration-200",
                  draggingChapterId === chapter._id ? "opacity-40 border-dashed border-indigo-400 bg-slate-50" : "border-slate-200 dark:border-slate-800",
                  dragOverChapterId === chapter._id && draggingChapterId ? "border-indigo-500 scale-[1.01] bg-indigo-50/20" : "",
                  dragOverChapterId === chapter._id && draggingLessonId ? "bg-indigo-50/10 border-indigo-400" : "",
                  chapter.isNew ? "border-l-2 border-l-indigo-400" : ""
                )}
              >
                {/* Chapter Header */}
                <div className="flex items-center justify-between p-3 sm:p-4 gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Kéo thả để sắp xếp chương"
                    >
                      <GripVertical size={16} />
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleChapter(chapter._id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="min-w-0 cursor-pointer flex-1" onClick={() => toggleChapter(chapter._id)}>
                      <h4 className="font-semibold text-sm sm:text-base text-slate-800 dark:text-slate-200 truncate">
                        Chương {chapterIdx + 1}: {chapter.title}
                        {chapter.isNew && (
                          <span className="ml-2 text-[10px] font-normal text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-full">
                            Chưa lưu
                          </span>
                        )}
                      </h4>
                      {chapter.summary && (
                        <p className="text-xs text-slate-500 truncate mt-0.5">{stripHtml(chapter.summary)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {chapterLessons.length} bài
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-indigo-600"
                      onClick={() => startEditChapter(chapter)}
                      title="Sửa tên chương"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      onClick={() => handleDeleteChapter(chapter._id)}
                      title="Xóa chương học"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Chapter Lessons List */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-900/10 p-3 space-y-2">
                    {chapterLessons.map((lesson, lessonIdx) => {
                      const isEditingLesson = editingLesson?.id === lesson._id;

                      if (isEditingLesson) {
                        return (
                          <div
                            key={lesson._id}
                            className="rounded-lg border border-indigo-500/30 dark:border-indigo-400/30 bg-indigo-50/5 dark:bg-indigo-950/5 p-3 space-y-3"
                          >
                            <div className="flex items-center justify-between border-b border-indigo-100/50 pb-1.5 dark:border-indigo-900/20">
                              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                                Chỉnh sửa chi tiết Bài học {lessonIdx + 1}
                              </span>
                              <button
                                type="button"
                                className="text-slate-400 hover:text-slate-600"
                                onClick={() => setEditingLesson(null)}
                              >
                                <X size={14} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Tiêu đề bài học <span className="text-red-500">*</span></Label>
                                <Input
                                  value={editingLesson.title}
                                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                                  placeholder="Nhập tiêu đề..."
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Loại Video</Label>
                                <select
                                  value={editingLesson.videoType}
                                  onChange={(e) => setEditingLesson({ ...editingLesson, videoType: e.target.value as VideoType })}
                                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                  <option value="none">Không có video</option>
                                  <option value="youtube">YouTube</option>
                                  <option value="drive">Google Drive</option>
                                  <option value="external">Đường dẫn ngoài</option>
                                </select>
                              </div>

                              {editingLesson.videoType !== 'none' && (
                                <div className="space-y-1 sm:col-span-2">
                                  <Label className="text-xs">URL Video</Label>
                                  <Input
                                    value={editingLesson.videoUrl}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="h-8 text-xs"
                                  />
                                </div>
                              )}

                              {editingLesson.videoType === 'youtube' && editingLesson.videoUrl?.trim() !== '' && (
                                <div className="space-y-1 sm:col-span-2">
                                  <Label className="text-xs">Xem trước Video</Label>
                                  {(() => {
                                    const videoId = getYouTubeVideoId(editingLesson.videoUrl);
                                    if (videoId) {
                                      return (
                                        <div className="mt-1 flex gap-3 p-2 bg-white dark:bg-slate-800 border rounded-md max-w-sm shadow-sm">
                                          <img
                                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                            alt="YouTube Thumbnail"
                                            className="w-24 h-16 rounded object-cover shrink-0"
                                          />
                                          <div className="flex flex-col justify-center min-w-0">
                                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">YouTube Video</span>
                                            <span className="text-[10px] text-slate-400">ID: {videoId}</span>
                                          </div>
                                        </div>
                                      );
                                    }
                                    return <p className="text-[10px] text-red-500">Đường dẫn YouTube không hợp lệ</p>;
                                  })()}
                                </div>
                              )}

                              <div className="space-y-1">
                                <Label className="text-xs">Thời lượng bài học (VD: 1h 30m, 45m)</Label>
                                <Input
                                  type="text"
                                  value={editingLesson.durationInput}
                                  onChange={(e) => setEditingLesson({ ...editingLesson, durationInput: e.target.value })}
                                  placeholder="VD: 1h 30m hoặc 1:30:00"
                                  className="h-8 text-xs"
                                />
                                {editingLesson.durationInput && (
                                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
                                    {getDurationFeedback(editingLesson.durationInput)}
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Đường dẫn bài tập (Drive, v.v.)</Label>
                                <Input
                                  value={editingLesson.exerciseLink}
                                  onChange={(e) => setEditingLesson({ ...editingLesson, exerciseLink: e.target.value })}
                                  placeholder="https://drive.google.com/..."
                                  className="h-8 text-xs"
                                />
                              </div>

                              <div className="space-y-1 sm:col-span-2">
                                <Label className="text-xs">Mô tả bài học</Label>
                                <LexicalEditor
                                  onChange={(val) => setEditingLesson({ ...editingLesson, description: val })}
                                  initialContent={editingLesson.description}
                                  folder="lessons"
                                  resetKey={editingLesson.id}
                                />
                              </div>

                              <div className="flex items-center gap-2 pt-2">
                                <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingLesson.isPreview}
                                    onChange={(e) => setEditingLesson({ ...editingLesson, isPreview: e.target.checked })}
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                                  />
                                  Cho xem thử
                                </label>
                              </div>
                            </div>

                            <p className="text-[11px] text-slate-400 dark:text-slate-500 text-right pt-1">
                              Bấm <span className="font-medium text-indigo-500">Lưu thay đổi</span> ở thanh dưới để lưu
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={lesson._id}
                          draggable={!isDragDisabled}
                          onDragStart={(e) => handleLessonDragStart(e, lesson._id, chapter._id)}
                          onDragOver={(e) => handleLessonDragOver(e, lesson._id, chapter._id)}
                          onDrop={(e) => draggingLessonId && handleLessonDropOnLesson(e, lesson._id, chapter._id)}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-md border bg-white dark:bg-slate-800/50 transition-all duration-150",
                            draggingLessonId === lesson._id ? "opacity-30 border-dashed border-indigo-300" : "border-slate-100 dark:border-slate-800/80 shadow-sm",
                            dragOverLessonId === lesson._id && draggingLessonId ? "border-indigo-500 translate-y-1 bg-indigo-50/30" : "",
                            lesson.isNew ? "border-l-2 border-l-indigo-400" : ""
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
                              title="Kéo thả bài học"
                            >
                              <GripVertical size={13} />
                            </div>
                            <span className="text-xs font-semibold text-slate-400 shrink-0">
                              {lessonIdx + 1}.
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 block truncate">
                                {lesson.title}
                                {lesson.isNew && (
                                  <span className="ml-2 text-[10px] font-normal text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-full">
                                    Chưa lưu
                                  </span>
                                )}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {lesson.videoType !== 'none' && (
                                  <span className="text-[10px] flex items-center gap-0.5 text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    <Video size={10} /> Video: {lesson.videoType}
                                  </span>
                                )}
                                {lesson.durationSeconds && (
                                  <span className="text-[10px] text-slate-400">
                                    ⏱️ {formatDuration(lesson.durationSeconds)}
                                  </span>
                                )}
                                {lesson.isPreview && (
                                  <span className="text-[10px] flex items-center gap-0.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-1.5 py-0.5 rounded font-semibold">
                                    <Eye size={10} /> Xem thử
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-indigo-600"
                              onClick={() => handleOpenEditLesson(lesson)}
                              title="Chỉnh sửa bài học chi tiết"
                            >
                              <Settings size={13} />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-slate-400 hover:text-red-500"
                              onClick={() => handleDeleteLesson(lesson._id)}
                              title="Xóa bài học"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {chapterLessons.length === 0 && (
                      <div className="text-center py-4 text-xs text-slate-400 italic">
                        Chưa có bài học trong chương này. Kéo thả bài học vào đây hoặc thêm mới ở dưới.
                      </div>
                    )}

                    {/* Inline Add Lesson Action */}
                    {addingLessonToChapterId === chapter._id ? (
                      <div className="border border-indigo-100 bg-indigo-50/20 dark:border-indigo-900/30 dark:bg-indigo-950/10 p-3 rounded-md space-y-3 mt-2">
                        <div className="flex items-center justify-between border-b border-indigo-100/50 pb-1.5 dark:border-indigo-900/20">
                          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Thêm bài học vào Chương {chapterIdx + 1}</span>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600"
                            onClick={() => setAddingLessonToChapterId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Tên bài học <span className="text-red-500">*</span></Label>
                            <Input
                              value={newLessonTitle}
                              onChange={(e) => setNewLessonTitle(e.target.value)}
                              placeholder="Nhập tên bài học..."
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Loại Video</Label>
                            <select
                              value={newLessonVideoType}
                              onChange={(e) => setNewLessonVideoType(e.target.value as VideoType)}
                              className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="none">Không có video</option>
                              <option value="youtube">YouTube</option>
                              <option value="drive">Google Drive</option>
                              <option value="external">Đường dẫn ngoài</option>
                            </select>
                          </div>

                          {newLessonVideoType !== 'none' && (
                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-xs">URL Video</Label>
                              <Input
                                value={newLessonVideoUrl}
                                onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                                placeholder="https://..."
                                className="h-8 text-xs"
                              />
                            </div>
                          )}

                          {newLessonVideoType === 'youtube' && newLessonVideoUrl.trim() !== '' && (
                            <div className="space-y-1 sm:col-span-2">
                              <Label className="text-xs">Xem trước Video</Label>
                              {(() => {
                                const videoId = getYouTubeVideoId(newLessonVideoUrl);
                                if (videoId) {
                                  return (
                                    <div className="mt-1 flex gap-3 p-2 bg-white dark:bg-slate-800 border rounded-md max-w-sm shadow-sm">
                                      <img
                                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                        alt="YouTube Thumbnail"
                                        className="w-24 h-16 rounded object-cover shrink-0"
                                      />
                                      <div className="flex flex-col justify-center min-w-0">
                                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">YouTube Video</span>
                                        <span className="text-[10px] text-slate-400">ID: {videoId}</span>
                                      </div>
                                    </div>
                                  );
                                }
                                return <p className="text-[10px] text-red-500">Đường dẫn YouTube không hợp lệ</p>;
                              })()}
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label className="text-xs">Thời lượng bài học (VD: 1h 30m, 45m, 1:20:00)</Label>
                            <Input
                              type="text"
                              value={newLessonDurationInput}
                              onChange={(e) => setNewLessonDurationInput(e.target.value)}
                              placeholder="VD: 1h 30m, 45m hoặc 1:30:00"
                              className="h-8 text-xs"
                            />
                            {newLessonDurationInput && (
                              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium">
                                {getDurationFeedback(newLessonDurationInput)}
                              </p>
                            )}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Đường dẫn bài tập (Drive, v.v.)</Label>
                            <Input
                              type="text"
                              value={newLessonExerciseLink}
                              onChange={(e) => setNewLessonExerciseLink(e.target.value)}
                              placeholder="https://drive.google.com/..."
                              className="h-8 text-xs"
                            />
                          </div>

                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs">Mô tả bài học</Label>
                            <LexicalEditor
                              onChange={setNewLessonDescription}
                              initialContent={newLessonDescription}
                              folder="lessons"
                              resetKey={newLessonResetKey}
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newLessonPreview}
                                onChange={(e) => setNewLessonPreview(e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600"
                              />
                              Cho xem thử
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-slate-500 hover:text-slate-700"
                            onClick={() => setAddingLessonToChapterId(null)}
                          >
                            Hủy
                          </Button>
                          <Button
                            type="button"
                            variant="accent"
                            size="sm"
                            disabled={!newLessonTitle.trim()}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white"
                            onClick={() => handleAddLesson(chapter._id)}
                          >
                            <Plus size={12} className="mr-1" />
                            Thêm bài học
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs border-dashed text-slate-500 hover:text-indigo-600 hover:border-indigo-400 flex items-center justify-center gap-1 bg-slate-50/50"
                          onClick={() => {
                            setAddingLessonToChapterId(chapter._id);
                            setNewLessonTitle('');
                            setNewLessonVideoType('none');
                            setNewLessonVideoUrl('');
                            setNewLessonDurationInput('');
                            setNewLessonDescription('');
                            setNewLessonExerciseLink('');
                            setNewLessonResetKey((prev) => prev + 1);
                            setNewLessonPreview(false);
                          }}
                        >
                          <Plus size={12} /> Thêm bài học mới vào chương này
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {activeChapters.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400 italic">
              Khóa học chưa có chương học nào. Vui lòng điền form bên dưới để tạo chương học đầu tiên.
            </div>
          )}
        </div>

        {/* Add Chapter Panel */}
        <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
            <Plus size={16} className="text-indigo-600" /> Thêm chương học mới
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">Tên chương <span className="text-red-500">*</span></Label>
                <Input
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Nhập tên chương học..."
                  className="h-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChapter();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Tóm tắt chương (tùy chọn)</Label>
                <LexicalEditor
                  onChange={setNewChapterSummary}
                  initialContent={newChapterSummary}
                  folder="chapters"
                  resetKey={newChapterResetKey}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="default"
                disabled={!newChapterTitle.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-9 px-4"
                onClick={handleAddChapter}
              >
                <Plus size={13} className="mr-1" />
                Thêm chương
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
