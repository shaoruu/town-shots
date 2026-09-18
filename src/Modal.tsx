import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { MediaItem } from './types';
import { formatCaptureTime, resolveMediaSrc } from './utils';
import './Modal.css';

interface ModalProps {
  item: MediaItem;
  index: number;
  total: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const CLICK_SLOP = 4;

const IDENTITY: Transform = { x: 0, y: 0, scale: 1 };

const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));

export default function Modal({ item, index, total, onClose, onNavigate }: ModalProps) {
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
    pinchDistance: number;
    pinchScale: number;
  } | null>(null);

  const hasPrev = index > 0;
  const hasNext = index < total - 1;
  const isVideo = item.type === 'video';
  const src = resolveMediaSrc(item.src);

  useEffect(() => {
    setTransform(IDENTITY);
  }, [item.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') onNavigate('prev');
      else if (e.key === 'ArrowRight') onNavigate('next');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, onNavigate]);

  // Wheel zoom anchored to the cursor so the point under it stays put.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || isVideo) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;
      const factor = Math.exp(-e.deltaY * 0.0018);

      setTransform((prev) => {
        const scale = clampScale(prev.scale * factor);
        if (scale === MIN_SCALE) return IDENTITY;
        const ratio = scale / prev.scale;
        return {
          scale,
          x: px - (px - prev.x) * ratio,
          y: py - (py - prev.y) * ratio,
        };
      });
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [isVideo, item.id]);

  const pointerDistance = () => {
    const [a, b] = Array.from(pointers.current.values());
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isVideo) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      gesture.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: transform.x,
        originY: transform.y,
        moved: false,
        pinchDistance: 0,
        pinchScale: transform.scale,
      };
      setDragging(true);
    } else if (pointers.current.size === 2 && gesture.current) {
      gesture.current.pinchDistance = pointerDistance();
      gesture.current.pinchScale = transform.scale;
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;

    if (pointers.current.size >= 2 && g.pinchDistance > 0) {
      const scale = clampScale((g.pinchScale * pointerDistance()) / g.pinchDistance);
      g.moved = true;
      setTransform((prev) => (scale === MIN_SCALE ? IDENTITY : { ...prev, scale }));
      return;
    }

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (!g.moved && Math.hypot(dx, dy) > CLICK_SLOP) g.moved = true;
    if (g.moved && transform.scale > MIN_SCALE) {
      setTransform((prev) => ({ ...prev, x: g.originX + dx, y: g.originY + dy }));
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const wasPrimaryGesture = pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;

    const g = gesture.current;
    gesture.current = null;
    setDragging(false);

    // A clean tap outside the media closes; on the media it does nothing.
    if (wasPrimaryGesture && g && !g.moved && e.type !== 'pointercancel') {
      const media = mediaRef.current?.getBoundingClientRect();
      const inside =
        media &&
        e.clientX >= media.left &&
        e.clientX <= media.right &&
        e.clientY >= media.top &&
        e.clientY <= media.bottom;
      if (!inside) onClose();
    }
  };

  const onDoubleClick = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (isVideo) return;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;

      setTransform((prev) => {
        if (prev.scale > MIN_SCALE) return IDENTITY;
        const scale = 2.5;
        return { scale, x: px - px * scale, y: py - py * scale };
      });
    },
    [isVideo],
  );

  const mediaStyle = {
    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={item.annotation || 'Town capture'}>
      <div
        ref={stageRef}
        className={`modal-stage${dragging && transform.scale > MIN_SCALE ? ' is-dragging' : ''}${
          transform.scale > MIN_SCALE ? ' is-zoomed' : ''
        }${isVideo ? ' is-video' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
        onClick={isVideo ? (e) => e.target === e.currentTarget && onClose() : undefined}
      >
        {isVideo ? (
          <video
            ref={(el) => {
              mediaRef.current = el;
            }}
            className="modal-media"
            src={src}
            controls
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <img
            ref={(el) => {
              mediaRef.current = el;
            }}
            className="modal-media"
            src={src}
            alt={item.annotation || 'Town capture'}
            style={mediaStyle}
            draggable={false}
          />
        )}
      </div>

      <button className="modal-close" onClick={onClose} aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      </button>

      {hasPrev && (
        <button className="modal-nav modal-nav-prev" onClick={() => onNavigate('prev')} aria-label="Previous">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 4l-8 8 8 8" />
          </svg>
        </button>
      )}

      {hasNext && (
        <button className="modal-nav modal-nav-next" onClick={() => onNavigate('next')} aria-label="Next">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 4l8 8-8 8" />
          </svg>
        </button>
      )}

      <div className="modal-caption">
        <span className="modal-caption-time">{formatCaptureTime(item.capturedAt)}</span>
        {item.annotation && <span className="modal-caption-note">{item.annotation}</span>}
      </div>

      <div className="modal-counter">
        {index + 1} / {total}
      </div>
    </div>
  );
}
