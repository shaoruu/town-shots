import { useRef, useState } from 'react';
import { MediaItem } from './types';
import { formatCaptureTimeShort, resolveMediaSrc } from './utils';
import './MediaTile.css';

interface MediaTileProps {
  item: MediaItem;
  eager: boolean;
  onClick: () => void;
}

export default function MediaTile({ item, eager, onClick }: MediaTileProps) {
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const src = resolveMediaSrc(item.src);
  const hasRatio = Boolean(item.width && item.height);
  const alt = item.annotation || 'Town capture';

  const playPreview = () => {
    videoRef.current?.play().catch(() => {});
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  return (
    <figure
      className={`media-tile${hasRatio ? ' has-ratio' : ''}${loaded ? ' is-loaded' : ''}`}
      style={hasRatio ? { aspectRatio: `${item.width} / ${item.height}` } : undefined}
      role="button"
      tabIndex={0}
      aria-label={alt}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={item.type === 'video' ? playPreview : undefined}
      onMouseLeave={item.type === 'video' ? stopPreview : undefined}
    >
      {item.type === 'video' ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setLoaded(true)}
        />
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      )}

      <figcaption className="media-tile-label">
        <span className="media-tile-time">{formatCaptureTimeShort(item.capturedAt)}</span>
        {item.annotation && (
          <span className="media-tile-note">
            <span>{item.annotation}</span>
          </span>
        )}
      </figcaption>
    </figure>
  );
}
