'use client';

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalCommand,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';
import {
  $applyNodeReplacement,
  $createNodeSelection,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isParagraphNode,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  DecoratorNode,
  createCommand,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { useEffect } from 'react';

export interface InsertYouTubePayload {
  videoId: string;
}

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<InsertYouTubePayload> =
  createCommand('INSERT_YOUTUBE_COMMAND');

type SerializedYouTubeNode = {
  type: 'youtube';
  version: 1;
  videoId: string;
} & SerializedLexicalNode;

const parseYouTubeIdFromSrc = (src: string) => {
  const match = src.match(/(?:youtube\.com\/(?:embed|watch)\S*?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/i);
  if (match?.[1]) {
    return match[1];
  }
  const embedMatch = src.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i);
  return embedMatch?.[1] ?? null;
};

const createEmbedUrl = (videoId: string) => `https://www.youtube.com/embed/${videoId}`;

function convertDivElement(domNode: HTMLElement): DOMConversionOutput | null {
  if (domNode instanceof HTMLDivElement && domNode.classList.contains('editor-youtube')) {
    const iframe = domNode.querySelector('iframe');
    const src = iframe?.getAttribute('src') ?? '';
    const videoId = parseYouTubeIdFromSrc(src);
    if (videoId) {
      const node = $createYouTubeNode(videoId);
      return { node };
    }
  }
  return null;
}

function convertIframeElement(domNode: HTMLElement): DOMConversionOutput | null {
  if (domNode instanceof HTMLIFrameElement) {
    const src = domNode.getAttribute('src') ?? '';
    const videoId = parseYouTubeIdFromSrc(src);
    if (videoId) {
      const node = $createYouTubeNode(videoId);
      return { node };
    }
  }
  return null;
}

export class YouTubeNode extends DecoratorNode<React.ReactElement> {
  __videoId: string;

  static getType(): string {
    return 'youtube';
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__videoId, node.__key);
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode(serializedNode.videoId);
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      type: 'youtube',
      version: 1,
      videoId: this.__videoId,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: () => ({
        conversion: convertDivElement,
        priority: 1,
      }),
      iframe: () => ({
        conversion: convertIframeElement,
        priority: 2,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const wrapper = document.createElement('div');
    wrapper.className = 'editor-youtube';
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', createEmbedUrl(this.__videoId));
    iframe.setAttribute('title', 'YouTube video');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', 'true');
    wrapper.appendChild(iframe);
    return { element: wrapper };
  }

  constructor(videoId: string, key?: NodeKey) {
    super(key);
    this.__videoId = videoId;
  }

  createDOM(): HTMLElement {
    const container = document.createElement('div');
    return container;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.ReactElement {
    return (
      <div className="editor-youtube">
        <iframe
          src={createEmbedUrl(this.__videoId)}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }
}

export function $createYouTubeNode(videoId: string): YouTubeNode {
  return $applyNodeReplacement(new YouTubeNode(videoId));
}

export function $isYouTubeNode(node?: LexicalNode | null): node is YouTubeNode {
  return node instanceof YouTubeNode;
}

const YouTubePlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => mergeRegister(
      editor.registerCommand<InsertYouTubePayload>(
        INSERT_YOUTUBE_COMMAND,
        (payload) => {
          const node = $createYouTubeNode(payload.videoId);

          const insertAtSelection = (selection: ReturnType<typeof $getSelection>) => {
            if ($isRangeSelection(selection) || $isNodeSelection(selection)) {
              selection.insertNodes([node]);
              return true;
            }
            return false;
          };

          const selection = $getSelection();
          let inserted = insertAtSelection(selection);

          if (!inserted) {
            const root = $getRoot();
            root.selectEnd();
            const selectionAfterFocus = $getSelection();
            inserted = insertAtSelection(selectionAfterFocus);
            if (!inserted) {
              root.append(node);
              const nodeSelection = $createNodeSelection();
              nodeSelection.add(node.getKey());
              $setSelection(nodeSelection);
            }
          }

          const parent = node.getParent();
          if ($isParagraphNode(parent)) {
            parent.insertAfter(node);
            parent.remove();
          }

          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
    ), [editor]);

  return null;
};

export default YouTubePlugin;
