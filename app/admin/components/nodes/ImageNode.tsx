'use client';

import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode} from 'lexical';
import {
  $applyNodeReplacement,
  $createNodeSelection,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isNodeSelection,
  $isParagraphNode,
  $isRangeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  createCommand,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface InsertImagePayload {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
}

export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand('INSERT_IMAGE_COMMAND');

type SerializedImageNode = {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  type: 'image';
  version: 1;
} & SerializedLexicalNode;

function convertImageElement(domNode: HTMLElement): DOMConversionOutput | null {
  if (domNode instanceof HTMLImageElement) {
    const { src, alt } = domNode;
    // Get width/height from attributes or style
    let width = domNode.getAttribute('width');
    let height = domNode.getAttribute('height');
    
    // Also check style
    if (!width && domNode.style.width) {
      width = domNode.style.width.replace('px', '');
    }
    if (!height && domNode.style.height) {
      height = domNode.style.height.replace('px', '');
    }
    
    const node = $createImageNode({ 
      altText: alt || '', 
      height: height ? Number.parseInt(height, 10) : undefined,
      src,
      width: width ? Number.parseInt(width, 10) : undefined,
    });
    return { node };
  }
  return null;
}

export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __altText: string;
  __width?: number;
  __height?: number;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__key,
    );
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { src, altText, width, height } = serializedNode;
    return $createImageNode({ altText, height, src, width });
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.__altText,
      height: this.__height,
      src: this.__src,
      type: 'image',
      version: 1,
      width: this.__width,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: () => ({
        conversion: convertImageElement,
        priority: 0,
      }),
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    if (this.__width) {
      element.setAttribute('width', String(this.__width));
      element.style.width = `${this.__width}px`;
    }
    if (this.__height) {
      element.setAttribute('height', String(this.__height));
      element.style.height = `${this.__height}px`;
    }
    element.style.maxWidth = '100%';
    element.style.borderRadius = '4px';
    element.style.display = 'block';
    element.style.margin = '8px 0';
    return { element };
  }

  constructor(
    src: string,
    altText: string,
    width?: number,
    height?: number,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
  }

  setWidthAndHeight(width: number, height: number): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.style.display = 'inline-block';
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): React.ReactElement {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        nodeKey={this.getKey()}
      />
    );
  }
}

export function $createImageNode({
  src,
  altText = '',
  width,
  height,
}: InsertImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, width, height));
}

export function $isImageNode(node?: LexicalNode | null): node is ImageNode {
  return node instanceof ImageNode;
}

// ImageComponent with resize functionality
function ImageComponent({
  src,
  altText,
  width,
  height,
  nodeKey,
}: {
  src: string;
  altText: string;
  width?: number;
  height?: number;
  nodeKey: NodeKey;
}): React.ReactElement {
  const imageRef = useRef<HTMLImageElement>(null);
  const [editor] = useLexicalComposerContext();
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState(false);

  const onDelete = useCallback(
    (event: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        const node = $getNodeByKey(nodeKey);
        if ($isImageNode(node)) {
          node.remove();
        }
      }
      return false;
    },
    [isSelected, nodeKey],
  );

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (isResizing) {return true;}
      if (event.target === imageRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }
      return false;
    },
    [isResizing, isSelected, setSelected, clearSelection],
  );

  useEffect(() => mergeRegister(
      editor.registerCommand(CLICK_COMMAND, onClick, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
    ), [editor, onClick, onDelete]);

  const onResizeEnd = (nextWidth: number, nextHeight: number) => {
    setTimeout(() =>{  setIsResizing(false); }, 200);
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight);
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const isFocused = isSelected || isResizing;

  return (
    <div 
      className={`image-wrapper ${isFocused ? 'focused' : ''}`}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      <img
        ref={imageRef}
        src={src}
        alt={altText}
        width={width ?? 600}
        height={height ?? 400}
        style={{
          borderRadius: '4px',
          cursor: 'default',
          display: 'block',
          height: height ? `${height}px` : 'auto',
          maxWidth: '100%',
          outline: isFocused ? '2px solid #3b82f6' : 'none',
          width: width ? `${width}px` : 'auto',
        }}
        draggable={false}
      />
      {isFocused && (
        <ImageResizer
          imageRef={imageRef}
          onResizeStart={onResizeStart}
          onResizeEnd={onResizeEnd}
          editor={editor}
        />
      )}
    </div>
  );
}

// ImageResizer component
function ImageResizer({
  imageRef,
  onResizeStart,
  onResizeEnd,
  editor,
}: {
  imageRef: React.RefObject<HTMLImageElement | null>;
  onResizeStart: () => void;
  onResizeEnd: (width: number, height: number) => void;
  editor: LexicalEditor;
}): React.ReactElement {
  const positioningRef = useRef({
    currentHeight: 0,
    currentWidth: 0,
    isResizing: false,
    ratio: 1,
    startHeight: 0,
    startWidth: 0,
    startX: 0,
    startY: 0,
  });

  const editorRoot = editor.getRootElement();
  const maxWidth = editorRoot ? editorRoot.getBoundingClientRect().width - 40 : 800;
  const minWidth = 50;
  const minHeight = 50;

  const handlePointerDown = (event: React.PointerEvent, corner: string) => {
    if (!editor.isEditable()) {return;}
    const image = imageRef.current;
    if (!image) {return;}

    event.preventDefault();
    const { width, height } = image.getBoundingClientRect();
    const pos = positioningRef.current;
    pos.startWidth = width;
    pos.startHeight = height;
    pos.ratio = width / height;
    pos.currentWidth = width;
    pos.currentHeight = height;
    pos.startX = event.clientX;
    pos.startY = event.clientY;
    pos.isResizing = true;

    onResizeStart();
    document.body.style.cursor = `${corner}-resize`;
    document.body.style.userSelect = 'none';

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!pos.isResizing || !image) {return;}
      
      const diffX = moveEvent.clientX - pos.startX;
      const diffY = moveEvent.clientY - pos.startY;
      
      // Calculate new dimensions based on corner
      let newWidth = pos.startWidth;
      let newHeight = pos.startHeight;

      if (corner.includes('e')) {newWidth = pos.startWidth + diffX;}
      if (corner.includes('w')) {newWidth = pos.startWidth - diffX;}
      if (corner.includes('s')) {newHeight = pos.startHeight + diffY;}
      if (corner.includes('n')) {newHeight = pos.startHeight - diffY;}

      // Maintain aspect ratio for corner resizes
      if (corner.length === 2) {
        newHeight = newWidth / pos.ratio;
      }

      // Clamp values
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, newWidth / pos.ratio);

      pos.currentWidth = newWidth;
      pos.currentHeight = newHeight;
      
      image.style.width = `${newWidth}px`;
      image.style.height = `${newHeight}px`;
    };

    const handlePointerUp = () => {
      if (pos.isResizing) {
        pos.isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        onResizeEnd(Math.round(pos.currentWidth), Math.round(pos.currentHeight));
      }
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handleStyle = {
    backgroundColor: '#3b82f6',
    border: '1px solid white',
    borderRadius: '2px',
    height: '10px',
    position: 'absolute' as const,
    width: '10px',
  };

  return (
    <>
      {/* Corner handles */}
      <div
        style={{ ...handleStyle, top: -5, left: -5, cursor: 'nw-resize' }}
        onPointerDown={(e) =>{  handlePointerDown(e, 'nw'); }}
      />
      <div
        style={{ ...handleStyle, top: -5, right: -5, cursor: 'ne-resize' }}
        onPointerDown={(e) =>{  handlePointerDown(e, 'ne'); }}
      />
      <div
        style={{ ...handleStyle, bottom: -5, left: -5, cursor: 'sw-resize' }}
        onPointerDown={(e) =>{  handlePointerDown(e, 'sw'); }}
      />
      <div
        style={{ ...handleStyle, bottom: -5, right: -5, cursor: 'se-resize' }}
        onPointerDown={(e) =>{  handlePointerDown(e, 'se'); }}
      />
      {/* Edge handles */}
      <div
        style={{ ...handleStyle, top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' }}
        onPointerDown={(e) =>{  handlePointerDown(e, 'n'); }}
      />
      <div
        style={{ ...handleStyle, bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' }}
        onPointerDown={(e) =>{  handlePointerDown(e, 's'); }}
      />
      <div
        style={{ ...handleStyle, top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'w-resize' }}
        onPointerDown={(e) =>{  handlePointerDown(e, 'w'); }}
      />
      <div
        style={{ ...handleStyle, top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'e-resize' }}
        onPointerDown={(e) =>{  handlePointerDown(e, 'e'); }}
      />
    </>
  );
}

// ImagesPlugin - handles INSERT_IMAGE_COMMAND
const ImagesPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => editor.registerCommand<InsertImagePayload>(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const imageNode = $createImageNode(payload);

        const insertAtSelection = (sel: ReturnType<typeof $getSelection>) => {
          if ($isRangeSelection(sel) || $isNodeSelection(sel)) {
            sel.insertNodes([imageNode]);
            return true;
          }
          return false;
        };

        const selection = $getSelection();
        let inserted = insertAtSelection(selection);

        if (!inserted) {
          const root = $getRoot();
          root.selectEnd();
          const selAfterFocus = $getSelection();
          inserted = insertAtSelection(selAfterFocus);
          if (!inserted) {
            root.append(imageNode);
            const nodeSelection = $createNodeSelection();
            nodeSelection.add(imageNode.getKey());
            $setSelection(nodeSelection);
          }
        }

        const parent = imageNode.getParent();
        if ($isParagraphNode(parent)) {
          parent.insertAfter(imageNode);
          parent.remove();
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ), [editor]);

  return null;
};

export default ImagesPlugin;

