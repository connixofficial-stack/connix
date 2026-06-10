'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  CheckCircle2,
  CircleDashed,
  Eye,
  GripVertical,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
  UserCircle,
} from 'lucide-react';
import { Badge, Button, Card, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label, cn } from '../components/ui';
import { ModuleGuard } from '../components/ModuleGuard';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';
import { useAdminAuth } from '../auth/context';

type KanbanColumn = Doc<'kanbanColumns'>;
type KanbanTask = Doc<'kanbanTasks'>;
type KanbanPriority = KanbanTask['priority'];
type SaveStatusState = 'idle' | 'saving' | 'saved';

const MODULE_KEY = 'kanban';

const PRIORITY_LABELS: Record<KanbanPriority, { label: string; variant: 'secondary' | 'warning' | 'destructive' }> = {
  LOW: { label: 'Thấp', variant: 'secondary' },
  MEDIUM: { label: 'Trung bình', variant: 'warning' },
  HIGH: { label: 'Cao', variant: 'destructive' },
};

const COLUMN_COLOR_STYLES: Record<string, { dot: string; text: string; border: string }> = {
  slate: { dot: 'bg-slate-400', text: 'text-slate-600', border: 'border-slate-200' },
  blue: { dot: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200' },
  amber: { dot: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-200' },
  emerald: { dot: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-200' },
  indigo: { dot: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-200' },
  rose: { dot: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-200' },
};

const COLUMN_ICON_MAP = {
  CircleDashed,
  Loader2,
  Eye,
  CheckCircle2,
};

export default function KanbanPage() {
  return (
    <ModuleGuard moduleKey={MODULE_KEY}>
      <KanbanBoardPage />
    </ModuleGuard>
  );
}

function KanbanBoardPage() {
  const { user } = useAdminAuth();
  const boards = useQuery(api.kanban.listBoards);
  const featuresData = useQuery(api.admin.modules.listModuleFeatures, { moduleKey: MODULE_KEY });
  const settingsData = useQuery(api.admin.modules.listModuleSettings, { moduleKey: MODULE_KEY });
  const users = useQuery(api.users.listAll, {});

  const [activeBoardId, setActiveBoardId] = useState<Id<'kanbanBoards'> | null>(null);
  const boardData = useQuery(
    api.kanban.getBoard,
    activeBoardId ? { boardId: activeBoardId, taskLimit: 1000 } : 'skip'
  );

  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [tasksByColumn, setTasksByColumn] = useState<Record<string, KanbanTask[]>>({});
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [dragSaveStatus, setDragSaveStatus] = useState<SaveStatusState>('idle');
  const [editSaveStatus, setEditSaveStatus] = useState<SaveStatusState>('idle');
  const [editTask, setEditTask] = useState<KanbanTask | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const dragSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragSaveActionRef = useRef<(() => Promise<unknown>) | null>(null);
  const dragSaveQueueRef = useRef<Promise<unknown>>(Promise.resolve());
  const dragSaveSequenceRef = useRef(0);
  const dragOriginalColumnRef = useRef<Id<'kanbanColumns'> | null>(null);
  const editSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editSaveSequenceRef = useRef(0);

  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [includeReview, setIncludeReview] = useState(true);

  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(false);
  const [columnTitle, setColumnTitle] = useState('');
  const [columnIcon, setColumnIcon] = useState('CircleDashed');
  const [columnColor, setColumnColor] = useState('slate');
  const [columnWipLimit, setColumnWipLimit] = useState<number | ''>('');

  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<KanbanPriority>('MEDIUM');
  const [taskAssigneeId, setTaskAssigneeId] = useState<Id<'users'> | ''>('');
  const [taskColumnId, setTaskColumnId] = useState<Id<'kanbanColumns'> | ''>('');
  const [taskDueDate, setTaskDueDate] = useState('');

  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<Id<'kanbanTasks'> | null>(null);
  const [deleteTaskName, setDeleteTaskName] = useState('');

  const [deleteColumnOpen, setDeleteColumnOpen] = useState(false);
  const [deleteColumnId, setDeleteColumnId] = useState<Id<'kanbanColumns'> | null>(null);
  const [deleteTargetColumnId, setDeleteTargetColumnId] = useState<Id<'kanbanColumns'> | ''>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createBoard = useMutation(api.kanban.createBoard);
  const deleteBoard = useMutation(api.kanban.deleteBoard);
  const createColumn = useMutation(api.kanban.createColumn);
  const deleteColumn = useMutation(api.kanban.deleteColumn);
  const reorderColumns = useMutation(api.kanban.reorderColumns);
  const createTask = useMutation(api.kanban.createTask);
  const updateTask = useMutation(api.kanban.updateTask);
  const deleteTask = useMutation(api.kanban.deleteTask);
  const reorderTasks = useMutation(api.kanban.reorderTasks);
  const moveTask = useMutation(api.kanban.moveTask);

  const enabledFeatures = useMemo(() => {
    const features: Record<string, boolean> = {};
    featuresData?.forEach(feature => {
      features[feature.featureKey] = feature.enabled;
    });
    return features;
  }, [featuresData]);

  const enableWipLimit = enabledFeatures.enableWipLimit ?? true;
  const enableAssignee = enabledFeatures.enableAssignee ?? true;

  const defaultPriority = useMemo(() => {
    const setting = settingsData?.find(item => item.settingKey === 'defaultPriority');
    return (setting?.value as KanbanPriority) || 'MEDIUM';
  }, [settingsData]);

  useEffect(() => {
    if (!boards) {
      return;
    }
    if (!boards.length) {
      setActiveBoardId(null);
      return;
    }
    if (!activeBoardId || !boards.some(board => board._id === activeBoardId)) {
      setActiveBoardId(boards[0]._id);
    }
  }, [boards, activeBoardId]);

  useEffect(() => {
    if (!boardData) {
      setColumns([]);
      setTasksByColumn({});
      return;
    }

    const sortedColumns = [...boardData.columns].sort((a, b) => a.order - b.order);
    const grouped: Record<string, KanbanTask[]> = {};
    sortedColumns.forEach(column => {
      grouped[column._id] = [];
    });
    boardData.tasks.forEach(task => {
      if (!grouped[task.columnId]) {
        grouped[task.columnId] = [];
      }
      grouped[task.columnId].push(task);
    });
    Object.values(grouped).forEach(tasks => tasks.sort((a, b) => a.order - b.order));
    setColumns(sortedColumns);
    setTasksByColumn(grouped);
  }, [boardData]);

  useEffect(() => {
    if (isCreateTaskOpen) {
      setTaskPriority(defaultPriority);
      if (!taskColumnId && columns.length > 0) {
        setTaskColumnId(columns[0]._id);
      }
    }
  }, [columns, defaultPriority, isCreateTaskOpen, taskColumnId]);

  useEffect(() => {
    if (!deleteColumnOpen) {
      return;
    }
    const targetColumn = columns.find(column => column._id !== deleteColumnId);
    setDeleteTargetColumnId(targetColumn?._id ?? '');
  }, [columns, deleteColumnId, deleteColumnOpen]);

  useEffect(() => {
    if (dragSaveStatus !== 'saved') {
      return;
    }
    const timer = setTimeout(() => setDragSaveStatus('idle'), 1500);
    return () => clearTimeout(timer);
  }, [dragSaveStatus]);

  useEffect(() => {
    if (editSaveStatus !== 'saved') {
      return;
    }
    const timer = setTimeout(() => setEditSaveStatus('idle'), 1500);
    return () => clearTimeout(timer);
  }, [editSaveStatus]);

  useEffect(() => {
    if (!editTask) {
      return;
    }

    const nextTitle = editTitle.trim();
    const nextDescription = editDescription.trim();
    const currentTitle = editTask.title.trim();
    const currentDescription = editTask.description?.trim() ?? '';
    const hasChanges = nextTitle !== currentTitle || nextDescription !== currentDescription;

    if (!hasChanges) {
      if (editSaveStatus === 'saving') {
        setEditSaveStatus('idle');
      }
      return;
    }

    if (!nextTitle) {
      editSaveSequenceRef.current += 1;
      setEditSaveStatus('idle');
      return;
    }

    editSaveSequenceRef.current += 1;
    const sequence = editSaveSequenceRef.current;
    setEditSaveStatus('saving');

    if (editSaveTimerRef.current) {
      clearTimeout(editSaveTimerRef.current);
    }

    editSaveTimerRef.current = setTimeout(() => {
      editSaveTimerRef.current = null;
      void updateTask({
        id: editTask._id,
        title: nextTitle,
        description: nextDescription || undefined,
      })
        .then(() => {
          if (editSaveSequenceRef.current === sequence) {
            setEditTask(prev => (prev ? { ...prev, title: nextTitle, description: nextDescription || undefined } : prev));
            setEditSaveStatus('saved');
            toast.success('Đã lưu task');
          }
        })
        .catch((error) => {
          console.error(error);
          if (editSaveSequenceRef.current === sequence) {
            setEditSaveStatus('idle');
            toast.error('Tự lưu thất bại');
          }
        });
    }, 800);

    return () => {
      if (editSaveTimerRef.current) {
        clearTimeout(editSaveTimerRef.current);
      }
    };
  }, [editDescription, editSaveStatus, editTask, editTitle, updateTask]);

  useEffect(() => () => {
    if (dragSaveTimerRef.current) {
      clearTimeout(dragSaveTimerRef.current);
    }
    if (editSaveTimerRef.current) {
      clearTimeout(editSaveTimerRef.current);
    }
  }, []);

  const filteredTasksByColumn = useMemo(() => {
    if (!searchTerm.trim()) {
      return tasksByColumn;
    }
    const term = searchTerm.trim().toLowerCase();
    return Object.fromEntries(
      Object.entries(tasksByColumn).map(([columnId, tasks]) => [
        columnId,
        tasks.filter(task =>
          task.title.toLowerCase().includes(term)
          || task.description?.toLowerCase().includes(term)
        ),
      ])
    );
  }, [searchTerm, tasksByColumn]);

  const usersMap = useMemo(() => {
    const map = new Map<string, Doc<'users'>>();
    users?.forEach(u => map.set(u._id, u));
    return map;
  }, [users]);

  const columnsMap = useMemo(() => {
    const map = new Map<string, KanbanColumn>();
    columns.forEach(column => map.set(column._id, column));
    return map;
  }, [columns]);

  const tasksMap = useMemo(() => {
    const map = new Map<string, KanbanTask>();
    Object.values(tasksByColumn).forEach(tasks => {
      tasks.forEach(task => map.set(task._id, task));
    });
    return map;
  }, [tasksByColumn]);

  const findColumnIdByTask = (taskId: Id<'kanbanTasks'>) => Object.entries(tasksByColumn).find(([, tasks]) =>
    tasks.some(task => task._id === taskId)
  )?.[0] as Id<'kanbanColumns'> | undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isLoading = boards === undefined || featuresData === undefined || settingsData === undefined || users === undefined;

  const isWipLimitReached = (columnId: Id<'kanbanColumns'>, additional = 0) => {
    if (!enableWipLimit) {
      return false;
    }
    const column = columns.find(item => item._id === columnId);
    if (!column?.wipLimit) {
      return false;
    }
    const currentCount = tasksByColumn[columnId]?.length ?? 0;
    return currentCount + additional > column.wipLimit;
  };

  const scheduleDragSave = (action: () => Promise<unknown>, successMessage = 'Đã lưu thay đổi') => {
    dragSaveSequenceRef.current += 1;
    const sequence = dragSaveSequenceRef.current;
    dragSaveActionRef.current = action;

    if (dragSaveTimerRef.current) {
      clearTimeout(dragSaveTimerRef.current);
    }

    setDragSaveStatus('saving');
    dragSaveTimerRef.current = setTimeout(() => {
      const pendingAction = dragSaveActionRef.current;
      dragSaveActionRef.current = null;
      dragSaveTimerRef.current = null;
      if (!pendingAction) {
        return;
      }

      dragSaveQueueRef.current = dragSaveQueueRef.current
        .then(() => pendingAction())
        .then(() => {
          if (dragSaveSequenceRef.current === sequence) {
            setDragSaveStatus('saved');
            toast.success(successMessage);
          }
        })
        .catch((error) => {
          console.error(error);
          if (dragSaveSequenceRef.current === sequence) {
            setDragSaveStatus('idle');
            toast.error('Tự lưu thất bại');
          }
        });
    }, 500);
  };

  const openEditTaskDialog = (task: KanbanTask) => {
    setEditTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditSaveStatus('idle');
  };

  const closeEditTaskDialog = () => {
    editSaveSequenceRef.current += 1;
    if (editSaveTimerRef.current) {
      clearTimeout(editSaveTimerRef.current);
      editSaveTimerRef.current = null;
    }
    setEditTask(null);
    setEditTitle('');
    setEditDescription('');
    setEditSaveStatus('idle');
  };

  const handleCreateBoard = async () => {
    if (!user?.id) {
      toast.error('Không xác định được tài khoản admin');
      return;
    }
    if (!boardName.trim()) {
      toast.error('Vui lòng nhập tên board');
      return;
    }

    setIsSubmitting(true);
    try {
      const boardId = await createBoard({
        createdBy: user.id as Id<'users'>,
        description: boardDescription.trim() || undefined,
        includeReview,
        name: boardName.trim(),
      });
      setActiveBoardId(boardId);
      setBoardName('');
      setBoardDescription('');
      setIncludeReview(true);
      setIsCreateBoardOpen(false);
      toast.success('Đã tạo board mới');
    } catch (error) {
      console.error(error);
      toast.error('Tạo board thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!activeBoardId) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteBoard({ id: activeBoardId });
      setDeleteBoardOpen(false);
      toast.success('Đã xóa board');
    } catch (error) {
      console.error(error);
      toast.error('Xóa board thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateColumn = async () => {
    if (!activeBoardId) {
      return;
    }
    if (!columnTitle.trim()) {
      toast.error('Vui lòng nhập tên cột');
      return;
    }

    setIsSubmitting(true);
    try {
      await createColumn({
        boardId: activeBoardId,
        color: columnColor,
        icon: columnIcon,
        title: columnTitle.trim(),
        wipLimit: enableWipLimit && columnWipLimit !== '' ? Number(columnWipLimit) : undefined,
      });
      setColumnTitle('');
      setColumnColor('slate');
      setColumnIcon('CircleDashed');
      setColumnWipLimit('');
      setIsCreateColumnOpen(false);
      toast.success('Đã thêm cột');
    } catch (error) {
      console.error(error);
      toast.error('Thêm cột thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (!deleteColumnId) {
      return;
    }
    const hasTasks = (tasksByColumn[deleteColumnId]?.length ?? 0) > 0;
    if (hasTasks && !deleteTargetColumnId) {
      toast.error('Cần chọn cột đích để chuyển task');
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteColumn({
        id: deleteColumnId,
        targetColumnId: hasTasks ? (deleteTargetColumnId as Id<'kanbanColumns'>) : undefined,
      });
      setDeleteColumnOpen(false);
      setDeleteColumnId(null);
      toast.success('Đã xóa cột');
    } catch (error) {
      console.error(error);
      toast.error('Xóa cột thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async () => {
    if (!user?.id) {
      toast.error('Không xác định được tài khoản admin');
      return;
    }
    if (!activeBoardId || !taskColumnId) {
      toast.error('Vui lòng chọn cột');
      return;
    }
    if (!taskTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề task');
      return;
    }
    if (isWipLimitReached(taskColumnId as Id<'kanbanColumns'>, 1)) {
      toast.error('Cột đã đạt WIP limit');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask({
        assigneeId: enableAssignee && taskAssigneeId ? (taskAssigneeId as Id<'users'>) : undefined,
        boardId: activeBoardId,
        columnId: taskColumnId as Id<'kanbanColumns'>,
        createdBy: user.id as Id<'users'>,
        description: taskDescription.trim() || undefined,
        dueDate: taskDueDate ? new Date(taskDueDate).getTime() : undefined,
        priority: taskPriority,
        title: taskTitle.trim(),
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskAssigneeId('');
      setTaskDueDate('');
      setTaskPriority(defaultPriority);
      setIsCreateTaskOpen(false);
      toast.success('Đã thêm task');
    } catch (error) {
      console.error(error);
      toast.error('Thêm task thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteTask({ id: deleteTaskId });
      setDeleteTaskId(null);
      toast.success('Đã xóa task');
    } catch (error) {
      console.error(error);
      toast.error('Xóa task thất bại');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const activeType = event.active.data.current?.type as 'column' | 'task' | undefined;
    if (activeType === 'column') {
      setActiveColumn(columnsMap.get(event.active.id as string) ?? null);
      setActiveTask(null);
      return;
    }
    if (activeType === 'task') {
      const task = tasksMap.get(event.active.id as string) ?? null;
      setActiveTask(task);
      setActiveColumn(null);
      dragOriginalColumnRef.current = task?.columnId ?? null;
      return;
    }
    setActiveTask(null);
    setActiveColumn(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const activeType = active.data.current?.type as 'column' | 'task' | undefined;
    const overType = over.data.current?.type as 'column' | 'task' | undefined;
    if (activeType !== 'task' || !overType) {
      return;
    }

    const activeTaskId = active.id as Id<'kanbanTasks'>;
    const sourceColumnId = findColumnIdByTask(activeTaskId);
    const destinationColumnId = overType === 'column'
      ? (over.id as Id<'kanbanColumns'>)
      : findColumnIdByTask(over.id as Id<'kanbanTasks'>);

    if (!sourceColumnId || !destinationColumnId) {
      return;
    }

    if (sourceColumnId === destinationColumnId) {
      const columnTasks = tasksByColumn[sourceColumnId] ?? [];
      const activeIndex = columnTasks.findIndex(task => task._id === activeTaskId);
      const overIndex = overType === 'task'
        ? columnTasks.findIndex(task => task._id === over.id)
        : columnTasks.length - 1;

      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
        return;
      }

      const reordered = arrayMove(columnTasks, activeIndex, overIndex);
      setTasksByColumn(prev => ({ ...prev, [sourceColumnId]: reordered }));
      return;
    }

    if (isWipLimitReached(destinationColumnId, 1)) {
      return;
    }

    const sourceTasks = [...(tasksByColumn[sourceColumnId] ?? [])];
    const destinationTasks = [...(tasksByColumn[destinationColumnId] ?? [])];

    const activeIndex = sourceTasks.findIndex(task => task._id === activeTaskId);
    if (activeIndex === -1) {
      return;
    }

    const [movedTask] = sourceTasks.splice(activeIndex, 1);
    const overIndex = overType === 'task'
      ? destinationTasks.findIndex(task => task._id === over.id)
      : destinationTasks.length;
    const insertIndex = overIndex >= 0 ? overIndex : destinationTasks.length;

    destinationTasks.splice(insertIndex, 0, { ...movedTask, columnId: destinationColumnId });

    setTasksByColumn(prev => ({
      ...prev,
      [sourceColumnId]: sourceTasks,
      [destinationColumnId]: destinationTasks,
    }));
  };

  const handleDragCancel = () => {
    setActiveTask(null);
    setActiveColumn(null);
    dragOriginalColumnRef.current = null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    try {
      const { active, over } = event;
      if (!over || !boardData) {
        return;
      }

      const activeType = active.data.current?.type as 'column' | 'task' | undefined;
      const overType = over.data.current?.type as 'column' | 'task' | undefined;

      if (activeType === 'column' && overType === 'column' && active.id !== over.id) {
        const oldIndex = columns.findIndex(column => column._id === active.id);
        const newIndex = columns.findIndex(column => column._id === over.id);
        if (oldIndex === -1 || newIndex === -1) {
          return;
        }
        const newColumns = arrayMove(columns, oldIndex, newIndex);
        setColumns(newColumns);
        scheduleDragSave(() => reorderColumns({
          boardId: boardData.board._id,
          orderedIds: newColumns.map(column => column._id),
        }));
        return;
      }

      if (activeType !== 'task') {
        return;
      }

      const activeTaskId = active.id as Id<'kanbanTasks'>;
      const sourceColumnId = dragOriginalColumnRef.current ?? findColumnIdByTask(activeTaskId);
      const destinationColumnId = overType === 'column'
        ? (over.id as Id<'kanbanColumns'>)
        : findColumnIdByTask(over.id as Id<'kanbanTasks'>);

      if (!sourceColumnId || !destinationColumnId) {
        return;
      }

      const sourceTasks = [...(tasksByColumn[sourceColumnId] ?? [])];
      const destinationTasks = sourceColumnId === destinationColumnId
        ? sourceTasks
        : [...(tasksByColumn[destinationColumnId] ?? [])];

      if (sourceColumnId === destinationColumnId) {
        const activeIndex = sourceTasks.findIndex(task => task._id === activeTaskId);
        const overIndex = overType === 'task'
          ? destinationTasks.findIndex(task => task._id === over.id)
          : destinationTasks.length - 1;
        if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
          return;
        }
        const reordered = arrayMove(destinationTasks, activeIndex, Math.max(overIndex, 0));
        setTasksByColumn(prev => ({ ...prev, [sourceColumnId]: reordered }));
        scheduleDragSave(() => reorderTasks({
          columnId: sourceColumnId,
          orderedIds: reordered.map(task => task._id),
        }));
        return;
      }

      if (isWipLimitReached(destinationColumnId, 1)) {
        toast.error('Cột đích đã đạt WIP limit');
        return;
      }

      const currentSourceTasks = tasksByColumn[sourceColumnId] ?? [];
      const currentDestinationTasks = tasksByColumn[destinationColumnId] ?? [];

      scheduleDragSave(() => moveTask({
        destinationOrderIds: currentDestinationTasks.map(task => task._id),
        fromColumnId: sourceColumnId,
        sourceOrderIds: currentSourceTasks.map(task => task._id),
        taskId: activeTaskId,
        toColumnId: destinationColumnId,
      }), 'Đã chuyển cột và lưu');
    } finally {
      setActiveTask(null);
      setActiveColumn(null);
      dragOriginalColumnRef.current = null;
    }
  };

  const activeBoard = boardData?.board;
  const noBoards = !boards || boards.length === 0;
  const isDragDisabled = Boolean(searchTerm.trim());

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Kanban Board</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-slate-500">Theo dõi tiến độ công việc nội bộ.</p>
            <SaveStatus status={dragSaveStatus} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="min-w-[220px]">
            <select
              value={activeBoardId ?? ''}
              onChange={(event) => setActiveBoardId(event.target.value as Id<'kanbanBoards'>)}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              disabled={noBoards || isLoading}
            >
              {noBoards && <option value="">Chưa có board</option>}
              {boards?.map(board => (
                <option key={board._id} value={board._id}>{board.name}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" onClick={() => setIsCreateBoardOpen(true)} className="gap-2">
            <Plus size={16} />
            Tạo board
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsCreateColumnOpen(true)}
            disabled={!activeBoardId || isLoading}
            className="gap-2"
          >
            <Plus size={16} />
            Thêm cột
          </Button>
          <Button
            onClick={() => setIsCreateTaskOpen(true)}
            disabled={!activeBoardId || columns.length === 0 || isLoading}
            className="gap-2"
          >
            <Plus size={16} />
            Thêm task
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm task theo tiêu đề hoặc mô tả"
            className="pl-9"
          />
        </div>
        {activeBoard && (
          <Button variant="destructive" size="sm" onClick={() => setDeleteBoardOpen(true)} className="gap-2">
            <Trash2 size={16} />
            Xóa board
          </Button>
        )}
      </div>

      {noBoards && !isLoading && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Chưa có board nào</h3>
          <p className="mt-2 text-sm text-slate-500">Tạo board đầu tiên để bắt đầu quản lý công việc.</p>
          <Button className="mt-4 gap-2" onClick={() => setIsCreateBoardOpen(true)}>
            <Plus size={16} />
            Tạo board
          </Button>
        </Card>
      )}

      {activeBoard && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SortableContext items={columns.map(column => column._id)} strategy={rectSortingStrategy}>
              {columns.map(column => (
                <KanbanColumnCard
                  key={column._id}
                  column={column}
                  tasks={filteredTasksByColumn[column._id] ?? []}
                  taskCount={tasksByColumn[column._id]?.length ?? 0}
                  enableWipLimit={enableWipLimit}
                  isDragDisabled={isDragDisabled}
                  onDelete={() => {
                    setDeleteColumnId(column._id);
                    setDeleteColumnOpen(true);
                  }}
                  onDeleteTask={(task) => {
                    setDeleteTaskId(task._id);
                    setDeleteTaskName(task.title);
                  }}
                  onEditTask={openEditTaskDialog}
                  usersMap={usersMap}
                />
              ))}
            </SortableContext>
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
            {activeTask ? (
              <div className="pointer-events-none w-72 -rotate-2 scale-105">
                <KanbanTaskOverlay task={activeTask} usersMap={usersMap} />
              </div>
            ) : activeColumn ? (
              <div className="pointer-events-none w-72 -rotate-2 scale-105">
                <KanbanColumnOverlay column={activeColumn} taskCount={tasksByColumn[activeColumn._id]?.length ?? 0} enableWipLimit={enableWipLimit} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Dialog open={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tạo board mới</DialogTitle>
            <DialogDescription>Tạo board để quản lý các cột và task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="board-name">Tên board</Label>
              <Input id="board-name" value={boardName} onChange={(event) => setBoardName(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="board-description">Mô tả</Label>
              <textarea
                id="board-description"
                value={boardDescription}
                onChange={(event) => setBoardDescription(event.target.value)}
                className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={includeReview}
                onChange={(event) => setIncludeReview(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Tạo sẵn cột Review
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBoardOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button onClick={handleCreateBoard} disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Tạo board'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateColumnOpen} onOpenChange={setIsCreateColumnOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm cột mới</DialogTitle>
            <DialogDescription>Cấu hình tên, icon và WIP limit cho cột.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="column-title">Tên cột</Label>
              <Input id="column-title" value={columnTitle} onChange={(event) => setColumnTitle(event.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="column-icon">Icon</Label>
                <select
                  id="column-icon"
                  value={columnIcon}
                  onChange={(event) => setColumnIcon(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {Object.keys(COLUMN_ICON_MAP).map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="column-color">Màu</Label>
                <select
                  id="column-color"
                  value={columnColor}
                  onChange={(event) => setColumnColor(event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {Object.keys(COLUMN_COLOR_STYLES).map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            </div>
            {enableWipLimit && (
              <div className="space-y-2">
                <Label htmlFor="column-wip">WIP limit</Label>
                <Input
                  id="column-wip"
                  type="number"
                  min={1}
                  value={columnWipLimit}
                  onChange={(event) => setColumnWipLimit(event.target.value ? Number(event.target.value) : '')}
                  placeholder="Không giới hạn"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateColumnOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button onClick={handleCreateColumn} disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Thêm cột'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm task mới</DialogTitle>
            <DialogDescription>Gán task vào cột và thiết lập ưu tiên.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Tiêu đề</Label>
              <Input id="task-title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-description">Mô tả</Label>
              <textarea
                id="task-description"
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                className="min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="task-column">Cột</Label>
                <select
                  id="task-column"
                  value={taskColumnId}
                  onChange={(event) => setTaskColumnId(event.target.value as Id<'kanbanColumns'>)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {columns.map(column => (
                    <option key={column._id} value={column._id}>{column.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-priority">Ưu tiên</Label>
                <select
                  id="task-priority"
                  value={taskPriority}
                  onChange={(event) => setTaskPriority(event.target.value as KanbanPriority)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {enableAssignee && (
                <div className="space-y-2">
                  <Label htmlFor="task-assignee">Phụ trách</Label>
                  <select
                    id="task-assignee"
                    value={taskAssigneeId}
                    onChange={(event) => setTaskAssigneeId(event.target.value as Id<'users'>)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="">Chưa gán</option>
                    {users?.map(admin => (
                      <option key={admin._id} value={admin._id}>{admin.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="task-due">Hạn xử lý</Label>
                <Input id="task-due" type="date" value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button onClick={handleCreateTask} disabled={isSubmitting}>{isSubmitting ? 'Đang tạo...' : 'Thêm task'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editTask)}
        onOpenChange={(open) => {
          if (!open) {
            closeEditTaskDialog();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3"
            onClick={closeEditTaskDialog}
          >
            <X size={16} />
          </Button>
          <DialogHeader className="text-left">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle>Chỉnh sửa task</DialogTitle>
                <DialogDescription>Tự lưu sau khi bạn dừng gõ.</DialogDescription>
              </div>
              <SaveStatus status={editSaveStatus} />
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-task-title">Tiêu đề</Label>
              <Input
                id="edit-task-title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-task-description">Mô tả</Label>
              <textarea
                id="edit-task-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                className="min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteColumnOpen} onOpenChange={setDeleteColumnOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa cột</DialogTitle>
            <DialogDescription>Task trong cột sẽ được chuyển sang cột khác nếu có.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {deleteColumnId && (tasksByColumn[deleteColumnId]?.length ?? 0) > 0 && (
              <div className="space-y-2">
                <Label htmlFor="delete-target">Chuyển task sang</Label>
                <select
                  id="delete-target"
                  value={deleteTargetColumnId}
                  onChange={(event) => setDeleteTargetColumnId(event.target.value as Id<'kanbanColumns'>)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {columns.filter(column => column._id !== deleteColumnId).map(column => (
                    <option key={column._id} value={column._id}>{column.title}</option>
                  ))}
                </select>
              </div>
            )}
            {deleteColumnId && (tasksByColumn[deleteColumnId]?.length ?? 0) > 0 && columns.length <= 1 && (
              <p className="text-sm text-slate-500">Cần có ít nhất một cột khác để chuyển task.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteColumnOpen(false)} disabled={isSubmitting}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteColumn}
              disabled={isSubmitting || (columns.length <= 1 && (tasksByColumn[deleteColumnId ?? '']?.length ?? 0) > 0)}
            >
              {isSubmitting ? 'Đang xóa...' : 'Xóa cột'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteBoardOpen}
        onOpenChange={setDeleteBoardOpen}
        title="Xóa board"
        itemName={activeBoard?.name ?? 'board'}
        onConfirm={handleDeleteBoard}
        isLoading={isSubmitting}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteTaskId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTaskId(null);
            setDeleteTaskName('');
          }
        }}
        title="Xóa task"
        itemName={deleteTaskName || 'task'}
        onConfirm={handleDeleteTask}
        isLoading={isSubmitting}
      />
    </div>
  );
}

function KanbanColumnCard({
  column,
  tasks,
  taskCount,
  enableWipLimit,
  isDragDisabled,
  onDelete,
  onDeleteTask,
  onEditTask,
  usersMap,
}: {
  column: KanbanColumn;
  tasks: KanbanTask[];
  taskCount: number;
  enableWipLimit: boolean;
  isDragDisabled: boolean;
  onDelete: () => void;
  onDeleteTask: (task: KanbanTask) => void;
  onEditTask: (task: KanbanTask) => void;
  usersMap: Map<string, Doc<'users'>>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column._id,
    data: { type: 'column' },
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const colorStyle = COLUMN_COLOR_STYLES[column.color ?? 'slate'] ?? COLUMN_COLOR_STYLES.slate;
  const ColumnIcon = COLUMN_ICON_MAP[column.icon as keyof typeof COLUMN_ICON_MAP] ?? CircleDashed;

  return (
    <div ref={setNodeRef} style={style} className={cn('transition', isDragging && 'opacity-30')}>
      <Card className={cn('p-4', isDragging && 'border-dashed border-slate-300 bg-slate-50')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={cn('h-2 w-2 rounded-full', colorStyle.dot)} />
            <ColumnIcon size={16} className={cn(colorStyle.text)} />
            <div>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{column.title}</div>
              {enableWipLimit && column.wipLimit ? (
                <Badge variant={taskCount > column.wipLimit ? 'destructive' : 'secondary'}>
                  {taskCount}/{column.wipLimit}
                </Badge>
              ) : (
                <span className="text-xs text-slate-500">{taskCount} task</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 size={16} />
            </Button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
              {...attributes}
              {...listeners}
              disabled={isDragDisabled}
            >
              <GripVertical size={16} />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <SortableContext items={tasks.map(task => task._id)} strategy={verticalListSortingStrategy}>
            {tasks.map(task => (
              <KanbanTaskCard
                key={task._id}
                task={task}
                isDragDisabled={isDragDisabled}
                onDelete={() => onDeleteTask(task)}
                onEdit={() => onEditTask(task)}
                usersMap={usersMap}
              />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-400">
              Chưa có task
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function KanbanTaskCard({
  task,
  isDragDisabled,
  onDelete,
  onEdit,
  usersMap,
}: {
  task: KanbanTask;
  isDragDisabled: boolean;
  onDelete: () => void;
  onEdit: () => void;
  usersMap: Map<string, Doc<'users'>>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task._id,
    data: { type: 'task', columnId: task.columnId },
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityMeta = PRIORITY_LABELS[task.priority];
  const assignee = task.assigneeId ? usersMap.get(task.assigneeId) : null;
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : null;

  return (
    <div ref={setNodeRef} style={style} className={cn('transition', isDragging && 'opacity-30')}>
      <Card
        className={cn('cursor-pointer p-3 space-y-2', isDragging && 'border-dashed border-slate-300 bg-slate-50')}
        onClick={onEdit}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{task.title}</div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 size={14} />
            </Button>
            {!isDragDisabled && (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                onClick={(event) => event.stopPropagation()}
                {...attributes}
                {...listeners}
              >
                <GripVertical size={14} />
              </button>
            )}
          </div>
        </div>
        {task.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge variant={priorityMeta.variant}>{priorityMeta.label}</Badge>
          {assignee && (
            <span className="inline-flex items-center gap-1">
              <UserCircle size={14} />
              {assignee.name}
            </span>
          )}
          {dueDate && (
            <span className="inline-flex items-center gap-1">
              <Calendar size={14} />
              {dueDate}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}

function KanbanColumnOverlay({
  column,
  taskCount,
  enableWipLimit,
}: {
  column: KanbanColumn;
  taskCount: number;
  enableWipLimit: boolean;
}) {
  const colorStyle = COLUMN_COLOR_STYLES[column.color ?? 'slate'] ?? COLUMN_COLOR_STYLES.slate;
  const ColumnIcon = COLUMN_ICON_MAP[column.icon as keyof typeof COLUMN_ICON_MAP] ?? CircleDashed;

  return (
    <Card className="p-4 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', colorStyle.dot)} />
          <ColumnIcon size={16} className={cn(colorStyle.text)} />
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{column.title}</div>
            {enableWipLimit && column.wipLimit ? (
              <Badge variant={taskCount > column.wipLimit ? 'destructive' : 'secondary'}>
                {taskCount}/{column.wipLimit}
              </Badge>
            ) : (
              <span className="text-xs text-slate-500">{taskCount} task</span>
            )}
          </div>
        </div>
        <span className="text-xs text-slate-400">Kéo để đổi vị trí</span>
      </div>
    </Card>
  );
}

function KanbanTaskOverlay({
  task,
  usersMap,
}: {
  task: KanbanTask;
  usersMap: Map<string, Doc<'users'>>;
}) {
  const priorityMeta = PRIORITY_LABELS[task.priority];
  const assignee = task.assigneeId ? usersMap.get(task.assigneeId) : null;
  const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('vi-VN') : null;

  return (
    <Card className="p-3 space-y-2 shadow-lg">
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{task.title}</div>
      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Badge variant={priorityMeta.variant}>{priorityMeta.label}</Badge>
        {assignee && (
          <span className="inline-flex items-center gap-1">
            <UserCircle size={14} />
            {assignee.name}
          </span>
        )}
        {dueDate && (
          <span className="inline-flex items-center gap-1">
            <Calendar size={14} />
            {dueDate}
          </span>
        )}
      </div>
    </Card>
  );
}

function SaveStatus({ status, className }: { status: SaveStatusState; className?: string }) {
  if (status === 'idle') {
    return null;
  }

  const isSaving = status === 'saving';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-xs',
        isSaving ? 'text-slate-500' : 'text-emerald-600',
        className
      )}
    >
      {isSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
      <span>{isSaving ? 'Đang lưu...' : 'Đã lưu'}</span>
    </div>
  );
}
