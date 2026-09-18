import { useEffect, useRef, useState } from 'react';
import { MediaItem } from './types';
import { formatCaptureTime } from './utils';
import './Modal.css';

interface ModalProps {
  item: MediaItem;
  items: MediaItem[];
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function Modal({ item, items, onClose, onNavigate }: ModalProps) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = items.findIndex((i) => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate('prev');
      if (e.key === 'ArrowRight' && hasNext) onNavigate('next');
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      setTransform((prev) => ({
        ...prev,
        scale: Math.max(0.5, Math.min(5, prev.scale + delta)),
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    containerRef.current?.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      containerRef.current?.removeEventListener('wheel', handleWheel);
    };
  }, [onClose, onNavigate, hasPrev, hasNext]);

  useEffect(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, [item.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const mediaSrc = item.src.startsWith('/') ? item.src : `/town-shots/${item.src}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>

        {hasPrev && (
          <button className="modal-nav modal-nav-prev" onClick={() => onNavigate('prev')}>
            ‹
          </button>
        )}

        {hasNext && (
          <button className="modal-nav modal-nav-next" onClick={() => onNavigate('next')}>
            ›
          </button>
        )}

        <div
          ref={containerRef}
          className={`modal-media-container ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {item.type === 'video' ? (
            <video
              className="modal-media"
              src={mediaSrc}
              controls
              autoPlay
              loop
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              }}
            />
          ) : (
            <img
              className="modal-media"
              src={mediaSrc}
              alt={item.annotation || 'Town screenshot'}
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              }}
            />
          )}
        </div>

        <div className="modal-info">
          <div className="modal-info-time">{formatCaptureTime(item.capturedAt)}</div>
          {item.annotation && <div className="modal-info-annotation">{item.annotation}</div>}
          {item.tags && item.tags.length > 0 && (
            <div className="modal-info-tags">
              {item.tags.map((tag) => (
                <span key={tag} className="modal-info-tag">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
