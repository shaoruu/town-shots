import { useEffect, useRef, useState } from 'react';
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
  const [playing, setPlaying] = useState(false);
  const figureRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = item.type === 'video';
  const src = resolveMediaSrc(item.src);
  const still = resolveMediaSrc(isVideo ? item.poster ?? item.src : item.thumb ?? item.src);
  const hasRatio = Boolean(item.width && item.height);
  const alt = item.annotation || 'Town capture';

  const playPreview = () => {
    const video = videoRef.current;
    if (!video || !video.paused) return;
    video.play().catch(() => {});
  };

  const stopPreview = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
    setPlaying(false);
  };

  // A page load with the cursor already parked over the tile fires no mouseenter,
  // but :hover is still resolved after layout.
  useEffect(() => {
    if (isVideo && loaded && figureRef.current?.matches(':hover')) playPreview();
  }, [isVideo, loaded]);

  return (
    <figure
      ref={figureRef}
      className={`media-tile${hasRatio ? ' has-ratio' : ''}${loaded ? ' is-loaded' : ''}${playing ? ' is-playing' : ''}`}
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
      onMouseEnter={isVideo ? playPreview : undefined}
      onMouseMove={isVideo ? playPreview : undefined}
      onMouseLeave={isVideo ? stopPreview : undefined}
    >
      {isVideo ? (
        <>
          {item.poster && (
            <img
              className="media-tile-poster"
              src={still}
              alt={alt}
              loading={eager ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={() => setLoaded(true)}
            />
          )}
          <video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={() => !item.poster && setLoaded(true)}
            onPlaying={() => setPlaying(true)}
          />
        </>
      ) : (
        <img
          src={still}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      )}

      <figcaption className="media-tile-label">
        <span className="media-tile-time">{formatCaptureTimeShort(item.capturedAt)}</span>
        {item.annotation && <span className="media-tile-note">{item.annotation}</span>}
      </figcaption>
    </figure>
  );
}
