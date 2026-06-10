'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode } from '@lexical/rich-text';
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND, $isLinkNode } from '@lexical/link';
import type {
  LexicalNode,
  RangeSelection,
} from 'lexical';
import { 
  $createParagraphNode, 
  $getRoot, 
  $getSelection, 
  $isDecoratorNode, 
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $setSelection,
  UNDO_COMMAND,
} from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $getSelectionStyleValueForProperty, $patchStyleText, $setBlocksType } from '@lexical/selection';
import { 
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, ChevronDown, Heading1, 
  Heading2, Image as ImageIcon, Italic, List as ListIcon, ListOrdered, Loader2, Palette, 
  Quote, Type, Underline, Undo2, Redo2, Link2, Youtube
} from 'lucide-react';
import { cn } from './ui';
import { toast } from 'sonner';
import ImagesPlugin, { INSERT_IMAGE_COMMAND, ImageNode } from './nodes/ImageNode';
import YouTubePlugin, { INSERT_YOUTUBE_COMMAND, YouTubeNode } from './nodes/YouTubeNode';
import { prepareImageForUpload, validateImageFile } from '@/lib/image/uploadPipeline';
import { resolveNamingContext } from '@/lib/image/uploadNaming';
import { mergeRegister } from '@lexical/utils';



const theme = {
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
  },
  list: {
    listitem: 'editor-listitem',
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
  },
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    strikethrough: 'editor-text-strikethrough',
    underline: 'editor-text-underline',
  },
};

const FONT_FAMILY_OPTIONS = [
  ['Inter', 'Inter'],
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const FONT_SIZE_OPTIONS = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['18px', '18px'],
  ['20px', '20px'],
  ['24px', '24px'],
  ['30px', '30px'],
];

const normalizeUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {return null;}
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {return trimmed;}
  return `https://${trimmed}`;
};

const getSelectedNode = (selection: ReturnType<typeof $getSelection>) => {
  if (!$isRangeSelection(selection)) {
    return selection?.getNodes()[0] ?? null;
  }
  const anchor = selection.anchor.getNode();
  const focus = selection.focus.getNode();
  if (anchor === focus) {
    return anchor;
  }
  return selection.isBackward() ? focus : anchor;
};

interface ToolbarPluginProps {
  onImageUpload?: (file: File) => Promise<string | null>;
  onRequestLinkEdit?: () => void;
}

const ToolbarPlugin: React.FC<ToolbarPluginProps> = ({ onImageUpload, onRequestLinkEdit }) => {
  const [editor] = useLexicalComposerContext();
  const [isUploading, setIsUploading] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeState, setActiveState] = useState({
    align: 'left',
    blockType: 'paragraph',
    bold: false,
    fontColor: '#000000',
    fontFamily: 'Inter',
    fontSize: '15px',
    italic: false,
    link: false,
    underline: false,
  });

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const selectedNode = getSelectedNode(selection);
      const parentNode = selectedNode?.getParent();
      const isLink = Boolean($isLinkNode(parentNode) || $isLinkNode(selectedNode));

      setActiveState({
        align: String(element.getFormat()) || 'left',
        blockType: element.getType(),
        bold: selection.hasFormat('bold'),
        fontColor: $getSelectionStyleValueForProperty(selection, 'color', '#000000'),
        fontFamily: $getSelectionStyleValueForProperty(selection, 'font-family', 'Inter'),
        fontSize: $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
        italic: selection.hasFormat('italic'),
        link: isLink,
        underline: selection.hasFormat('underline'),
      });
    }
  }, []);

  useEffect(() => editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    ), [editor, updateToolbar]);

  useEffect(() => editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    }), [editor, updateToolbar]);

  useEffect(() => mergeRegister(
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    ), [editor]);

  const applyStyleText = (styles: Record<string, string>) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, styles);
      }
    });
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyStyleText({ 'font-family': e.target.value });
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    applyStyleText({ 'font-size': e.target.value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyStyleText({ 'color': e.target.value });
  };

  const parseYouTubeId = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {return null;}
    const match = trimmed.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
    );
    return match?.[1] ?? null;
  };

  const formatBlock = (type: string) => {
    if (type === 'h1') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {$setBlocksType(selection, () => $createHeadingNode('h1'));}
      });
    } else if (type === 'h2') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {$setBlocksType(selection, () => $createHeadingNode('h2'));}
      });
    } else if (type === 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {$setBlocksType(selection, () => $createQuoteNode());}
      });
    } else if (type === 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {$setBlocksType(selection, () => $createParagraphNode());}
      });
    } else if (type === 'ul') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else if (type === 'ol') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  const handleToggleLink = () => {
    let canOpen = false;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      if (activeState.link || !selection.isCollapsed()) {
        canOpen = true;
      }
    });
    if (!canOpen) {
      toast.error('Vui lòng chọn đoạn văn bản để gắn link');
      return;
    }
    onRequestLinkEdit?.();
  };

  const handleInsertYouTube = () => {
    if (!editor.hasNodes([YouTubeNode])) {
      toast.error('YouTube chưa được cấu hình, vui lòng tải lại trang.');
      return;
    }
    const url = window.prompt('Dán URL YouTube');
    if (!url) {return;}
    const videoId = parseYouTubeId(url);
    if (!videoId) {
      toast.error('URL YouTube không hợp lệ');
      return;
    }
    editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, { videoId });
  };

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file && onImageUpload) {
        setIsUploading(true);
        try {
          const url = await onImageUpload(file);
          if (url) {
            // Use command pattern for image insertion
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, { altText: '', src: url });
            toast.success('Đã chèn ảnh vào nội dung');
          }
        } catch (error) {
          console.error('Image upload error:', error);
          toast.error('Không thể tải ảnh lên');
        } finally {
          setIsUploading(false);
        }
      } else if (!onImageUpload) {
        toast.error('Chức năng upload ảnh chưa được cấu hình');
      }
    };
    input.click();
  };

  const ToolbarBtn = ({ active, onClick, children, title, disabled }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string; disabled?: boolean }) => (
    <button
      type="button"
      onClick={() => {
        if (!disabled) {onClick();}
      }}
      title={title}
      disabled={disabled}
      className={cn(
        "p-1.5 rounded-md transition-colors text-slate-600 dark:text-slate-400 flex items-center justify-center min-w-[28px]",
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-sm",
        active ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-inner" : ""
      )}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-t-lg sticky top-0 z-10">
      <div className="flex items-center gap-0.5">
        <ToolbarBtn onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} active={false} title="Hoàn tác" disabled={!canUndo}>
          <Undo2 size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} active={false} title="Làm lại" disabled={!canRedo}>
          <Redo2 size={16} />
        </ToolbarBtn>
      </div>

      <Divider />
      
      <div className="flex items-center gap-1 mr-1">
        <div className="relative">
          <select 
            onChange={handleFontFamilyChange} 
            value={activeState.fontFamily}
            className="h-8 w-[110px] appearance-none pl-2 pr-6 text-xs bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-600 focus:border-slate-300 focus:outline-none cursor-pointer text-slate-700 dark:text-slate-300 truncate"
          >
            {FONT_FAMILY_OPTIONS.map(([option, text]) => (
              <option key={option} value={option}>{text}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select 
            onChange={handleFontSizeChange} 
            value={activeState.fontSize}
            className="h-8 w-[65px] appearance-none pl-2 pr-5 text-xs bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-600 focus:border-slate-300 focus:outline-none cursor-pointer text-slate-700 dark:text-slate-300"
          >
            {FONT_SIZE_OPTIONS.map(([option, text]) => (
              <option key={option} value={option}>{text}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative flex items-center justify-center w-8 h-8 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer group" title="Màu chữ">
          <Palette size={16} className="text-slate-600 dark:text-slate-400" />
          <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-slate-200" style={{ backgroundColor: activeState.fontColor }}></div>
          <input 
            type="color" 
            value={activeState.fontColor} 
            onChange={handleColorChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>

      <Divider />

      <div className="flex items-center gap-0.5">
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')} active={activeState.bold} title="In đậm (Ctrl+B)">
          <Bold size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')} active={activeState.italic} title="In nghiêng (Ctrl+I)">
          <Italic size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')} active={activeState.underline} title="Gạch chân (Ctrl+U)">
          <Underline size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleToggleLink} active={activeState.link} title="Chèn/Bỏ link">
          <Link2 size={16} />
        </ToolbarBtn>
      </div>

      <Divider />

      <div className="flex items-center gap-0.5">
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')} active={activeState.align === 'left'} title="Căn trái">
          <AlignLeft size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')} active={activeState.align === 'center'} title="Căn giữa">
          <AlignCenter size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')} active={activeState.align === 'right'} title="Căn phải">
          <AlignRight size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')} active={activeState.align === 'justify'} title="Căn đều">
          <AlignJustify size={16} />
        </ToolbarBtn>
      </div>

      <Divider />

      <div className="flex items-center gap-0.5">
        <ToolbarBtn onClick={() =>{  formatBlock('paragraph'); }} active={activeState.blockType === 'paragraph'} title="Văn bản thường">
          <Type size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() =>{  formatBlock('h1'); }} active={activeState.blockType === 'h1'} title="Tiêu đề 1">
          <Heading1 size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() =>{  formatBlock('h2'); }} active={activeState.blockType === 'h2'} title="Tiêu đề 2">
          <Heading2 size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() =>{  formatBlock('quote'); }} active={activeState.blockType === 'quote'} title="Trích dẫn">
          <Quote size={16} />
        </ToolbarBtn>
      </div>

      <Divider />

      <div className="flex items-center gap-0.5">
        <ToolbarBtn onClick={() =>{  formatBlock('ul'); }} active={activeState.blockType === 'ul'} title="Danh sách chấm">
          <ListIcon size={16} />
        </ToolbarBtn>
        <ToolbarBtn onClick={() =>{  formatBlock('ol'); }} active={activeState.blockType === 'ol'} title="Danh sách số">
          <ListOrdered size={16} />
        </ToolbarBtn>
      </div>

      <Divider />

      <div className="flex items-center gap-0.5">
        <ToolbarBtn onClick={handleImageUpload} title="Tải ảnh lên">
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
        </ToolbarBtn>
        <ToolbarBtn onClick={handleInsertYouTube} title="Chèn YouTube">
          <Youtube size={16} />
        </ToolbarBtn>
      </div>
    </div>
  );
};

interface FloatingLinkEditorProps {
  anchorElem: HTMLElement | null;
  openSignal: number;
}

const FloatingLinkEditor: React.FC<FloatingLinkEditorProps> = ({ anchorElem, openSignal }) => {
  const [editor] = useLexicalComposerContext();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastSelectionRef = useRef<RangeSelection | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [editedUrl, setEditedUrl] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const getSelectionRect = useCallback(() => {
    if (!anchorElem) {
      return null;
    }
    const domSelection = window.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      return null;
    }
    const domRange = domSelection.getRangeAt(0);
    if (!anchorElem.contains(domRange.startContainer)) {
      return null;
    }
    return domRange.getBoundingClientRect();
  }, [anchorElem]);

  const positionEditor = useCallback((rect: DOMRect) => {
    if (!anchorElem) {
      return;
    }
    const anchorRect = anchorElem.getBoundingClientRect();
    const top = rect.bottom - anchorRect.top + anchorElem.scrollTop + 8;
    const left = rect.left - anchorRect.left + anchorElem.scrollLeft + rect.width / 2;
    const safeLeft = Math.max(8, Math.min(left, anchorRect.width - 8));
    setPosition({ top, left: safeLeft });
  }, [anchorElem]);

  const updateEditor = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        setIsVisible(false);
        return;
      }

      const selectedNode = getSelectedNode(selection);
      const parentNode = selectedNode?.getParent();
      const linkNode = $isLinkNode(parentNode) ? parentNode : $isLinkNode(selectedNode) ? selectedNode : null;
      const nextUrl = linkNode?.getURL() ?? '';
      const shouldShow = Boolean(linkNode) || (isEditing && !selection.isCollapsed());

      if (!shouldShow) {
        setIsVisible(false);
        return;
      }

      lastSelectionRef.current = selection;
      setIsVisible(true);

      if (!isEditing) {
        setLinkUrl(nextUrl);
        setEditedUrl(nextUrl);
      } else if (linkNode && nextUrl !== linkUrl) {
        setLinkUrl(nextUrl);
      }

      const selectionRect = getSelectionRect();
      if (selectionRect) {
        positionEditor(selectionRect);
      }
    });
  }, [editor, getSelectionRect, isEditing, linkUrl, positionEditor]);

  useEffect(() => mergeRegister(
      editor.registerUpdateListener(() => {
        updateEditor();
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateEditor();
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    ), [editor, updateEditor]);

  useEffect(() => {
    if (!openSignal) {
      return;
    }
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return;
      }
      const selectedNode = getSelectedNode(selection);
      const parentNode = selectedNode?.getParent();
      const linkNode = $isLinkNode(parentNode) ? parentNode : $isLinkNode(selectedNode) ? selectedNode : null;
      if (!linkNode && selection.isCollapsed()) {
        return;
      }
      const nextUrl = linkNode?.getURL() ?? '';
      setIsEditing(true);
      setLinkUrl(nextUrl);
      setEditedUrl(nextUrl);
      setIsVisible(true);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    });
  }, [editor, openSignal]);

  const applyLink = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) && lastSelectionRef.current) {
        $setSelection(lastSelectionRef.current);
      }
      const normalized = normalizeUrl(editedUrl);
      if (!normalized) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
        return;
      }
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, normalized);
    });
    setIsEditing(false);
    setIsVisible(false);
  }, [editor, editedUrl]);

  const removeLink = useCallback(() => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setIsEditing(false);
    setIsVisible(false);
  }, [editor]);

  if (!anchorElem || !isVisible) {
    return null;
  }

  return (
    <div
      className="absolute z-20"
      style={{ top: position.top, left: position.left, transform: 'translate(-50%, 0)' }}
    >
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 shadow-lg text-xs">
        <input
          ref={inputRef}
          value={editedUrl}
          onChange={(event) => setEditedUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              applyLink();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setIsEditing(false);
              setIsVisible(false);
            }
          }}
          placeholder="Dán URL..."
          className="w-56 bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="button"
          className="rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-100"
          onClick={applyLink}
        >
          Áp dụng
        </button>
        {linkUrl && (
          <button
            type="button"
            className="rounded px-1.5 py-0.5 text-rose-600 hover:bg-rose-50"
            onClick={removeLink}
          >
            Gỡ
          </button>
        )}
      </div>
    </div>
  );
};

interface LexicalEditorProps {
  onChange?: (html: string) => void;
  initialContent?: string;
  folder?: string;
  resetKey?: number | string;
}

// Plugin to handle paste events and auto-upload base64 images
interface PasteImagePluginProps {
  onImageUpload: (file: File) => Promise<string | null>;
}

const PasteImagePlugin: React.FC<PasteImagePluginProps> = ({ onImageUpload }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) {return;}

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            try {
              const url = await onImageUpload(file);
              if (url) {
                // Use command pattern for image insertion
                editor.dispatchCommand(INSERT_IMAGE_COMMAND, { altText: '', src: url });
                toast.success('Đã paste và upload ảnh');
              }
            } catch (error) {
              console.error('Paste image error:', error);
              toast.error('Không thể upload ảnh');
            }
          }
          break;
        }
      }
    };

    const rootElement = editor.getRootElement();
    if (rootElement) {
      rootElement.addEventListener('paste', handlePaste as unknown as EventListener);
      return () => {
        rootElement.removeEventListener('paste', handlePaste as unknown as EventListener);
      };
    }
  }, [editor, onImageUpload]);

  return null;
};

const InitialContentPlugin: React.FC<{ initialContent?: string; resetKey?: number | string }> = ({ initialContent, resetKey }) => {
  const [editor] = useLexicalComposerContext();
  const isInitializedRef = useRef(false);
  const lastResetKeyRef = useRef<number | string | undefined>(undefined);

  useEffect(() => {
    if (!initialContent) {return;}
    const shouldReset = resetKey !== undefined
      ? lastResetKeyRef.current !== resetKey
      : !isInitializedRef.current;
    if (!shouldReset) {return;}
    editor.update(() => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialContent, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const root = $getRoot();
      root.clear();
      
      // Filter: only ElementNode or DecoratorNode can be appended to root
      // TextNodes need to be wrapped in ParagraphNode
      const validNodes: LexicalNode[] = [];
      for (const node of nodes) {
        if ($isElementNode(node) || $isDecoratorNode(node)) {
          validNodes.push(node);
        } else if ($isTextNode(node)) {
          // Wrap text nodes in paragraph
          const text = node.getTextContent().trim();
          if (text) {
            const paragraph = $createParagraphNode();
            paragraph.append(node);
            validNodes.push(paragraph);
          }
        }
      }
      
      if (validNodes.length > 0) {
        root.append(...validNodes);
      }
    });
    isInitializedRef.current = true;
    lastResetKeyRef.current = resetKey;
  }, [editor, initialContent, resetKey]);

  return null;
};

export const LexicalEditor: React.FC<LexicalEditorProps> = ({ onChange, initialContent, folder = 'posts-content', resetKey }) => {
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const saveImage = useMutation(api.storage.saveImage);
  const uploadCounterRef = useRef(1);
  const composerKey = 'lexical-editor-v2';
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [linkEditorSignal, setLinkEditorSignal] = useState(0);
  
  const initialConfig = {
    namespace: 'MyEditor',
    nodes: [
      HeadingNode, 
      QuoteNode, 
      ListNode, 
      ListItemNode, 
      AutoLinkNode, 
      LinkNode,
      ImageNode,
      YouTubeNode
    ],
    onError: (error: Error) =>{  console.error(error); },
    theme,
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string | null> => {
    const validationError = validateImageFile(file, 5);
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    try {
      const resolvedNaming = resolveNamingContext(undefined, {
        entityName: folder,
        field: 'content',
        index: uploadCounterRef.current++,
      });
      const prepared = await prepareImageForUpload(file, { naming: resolvedNaming });
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uploadUrl, {
        body: prepared.file,
        headers: { 'Content-Type': prepared.mimeType },
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { storageId } = await response.json();

      const result = await saveImage({
        filename: prepared.filename,
        folder,
        height: prepared.height,
        mimeType: prepared.mimeType,
        size: prepared.size,
        storageId: storageId as Id<"_storage">,
        width: prepared.width,
      });

      return result.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }, [generateUploadUrl, saveImage, folder]);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-sm w-full editor-shell">
      <LexicalComposer key={composerKey} initialConfig={initialConfig}>
        <ToolbarPlugin onImageUpload={handleImageUpload} onRequestLinkEdit={() => setLinkEditorSignal((value) => value + 1)} />
        <div ref={editorContainerRef} className="relative min-h-[400px] editor-container">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input outline-none h-full min-h-[400px] p-4" />}
            placeholder={<div className="editor-placeholder absolute top-4 left-4 text-slate-400 pointer-events-none">Bắt đầu viết nội dung tuyệt vời của bạn...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin validateUrl={(url) => Boolean(normalizeUrl(url))} />
          <ImagesPlugin />
          <YouTubePlugin />
          <PasteImagePlugin onImageUpload={handleImageUpload} />
          <InitialContentPlugin initialContent={initialContent} resetKey={resetKey} />
          <FloatingLinkEditor anchorElem={editorContainerRef.current} openSignal={linkEditorSignal} />
          <OnChangePlugin onChange={(editorState, editor) => {
             editorState.read(() => {
                const html = $generateHtmlFromNodes(editor, null);
                if (onChange) {onChange(html);}
             });
          }}/>
        </div>
      </LexicalComposer>
      <style jsx global>{`
        .editor-paragraph { margin: 0 0 8px 0; }
        .editor-heading-h1 { font-size: 24px; font-weight: bold; margin: 0 0 12px 0; }
        .editor-heading-h2 { font-size: 18px; font-weight: bold; margin: 0 0 10px 0; }
        .editor-quote { border-left: 4px solid #cbd5e1; margin: 8px 0; padding-left: 16px; color: #64748b; font-style: italic; }
        .editor-list-ul { list-style-type: disc; padding-left: 24px; margin: 8px 0; }
        .editor-list-ol { list-style-type: decimal; padding-left: 24px; margin: 8px 0; }
        .editor-listitem { margin: 4px 0; }
        .editor-text-bold { font-weight: bold; }
        .editor-text-italic { font-style: italic; }
        .editor-text-underline { text-decoration: underline; }
        .editor-input a { color: #2563eb; }
        .editor-input img { max-width: 100%; height: auto; display: block; margin: 8px 0; border-radius: 4px; }
        .editor-youtube { position: relative; padding-bottom: 56.25%; height: 0; margin: 12px 0; }
        .editor-youtube iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 6px; }
      `}</style>
    </div>
  );
};
