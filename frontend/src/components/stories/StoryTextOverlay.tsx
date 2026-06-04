import { useRef, useState, useEffect, useCallback } from 'react';
import type { StoryTextLayer } from '../../types/story';
import { STORY_FONT_CLASSES } from '../../config/storyFonts';

const DRAG_THRESHOLD = 6;
const PLACEHOLDER = 'Nhập chữ…';

interface Props {
  layer: StoryTextLayer;
  selected: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<StoryTextLayer>) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export default function StoryTextOverlay({
  layer,
  selected,
  onSelect,
  onChange,
  containerRef,
}: Props) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number; moved: boolean } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState(false);

  const fontClass = STORY_FONT_CLASSES[layer.fontId];
  const displayText = layer.text.trim() || PLACEHOLDER;
  const isPlaceholder = !layer.text.trim();

  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    if (editing) {
      autoResize();
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    }
  }, [editing, autoResize]);

  useEffect(() => {
    if (selected && !editing) {
      /* giữ selection ring */
    }
  }, [selected, editing]);

  const startEdit = () => {
    onSelect();
    setEditing(true);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return;
    e.stopPropagation();
    onSelect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: layer.x,
      origY: layer.y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current || editing) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    if (!dragRef.current.moved) {
      dragRef.current.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    const rect = containerRef.current.getBoundingClientRect();
    const pctX = (dx / rect.width) * 100;
    const pctY = (dy / rect.height) * 100;
    onChange({
      x: Math.min(92, Math.max(4, dragRef.current.origX + pctX)),
      y: Math.min(88, Math.max(8, dragRef.current.origY + pctY)),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const wasDrag = dragRef.current?.moved;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!wasDrag) startEdit();
  };

  return (
    <div
      className={`story-text-layer absolute z-20 max-w-[90%] select-none ${editing ? 'cursor-text' : 'cursor-move'} ${selected ? 'story-text-layer--selected' : ''}`}
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        transform: 'translate(-50%, -50%)',
        textAlign: layer.align,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={e => {
        e.stopPropagation();
        startEdit();
      }}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          value={layer.text}
          onChange={e => {
            onChange({ text: e.target.value });
            autoResize();
          }}
          onBlur={() => setEditing(false)}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setEditing(false);
            }
          }}
          placeholder={PLACEHOLDER}
          className={`${fontClass} story-text-input resize-none outline-none`}
          style={{
            color: layer.color,
            background: layer.bgColor ?? 'rgba(0,0,0,0.35)',
            fontSize: layer.fontSize,
            textAlign: layer.align,
            width: `${Math.max(140, Math.min(320, layer.text.length * layer.fontSize * 0.55 + 40))}px`,
          }}
          rows={1}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <p
          className={`${fontClass} story-text-display px-2.5 py-1.5 rounded-lg break-words whitespace-pre-wrap ${isPlaceholder ? 'story-text-display--placeholder' : ''}`}
          style={{
            color: isPlaceholder ? 'rgba(255,255,255,0.65)' : layer.color,
            background: layer.bgColor ?? undefined,
            fontSize: layer.fontSize,
          }}
          onClick={e => {
            e.stopPropagation();
            if (selected) startEdit();
            else onSelect();
          }}
        >
          {displayText}
        </p>
      )}
    </div>
  );
}
