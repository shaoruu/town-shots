import { MediaItem } from './types';
import { formatCaptureTime } from './utils';
import './MediaTile.css';

interface MediaTileProps {
  item: MediaItem;
  onClick: () => void;
}

export default function MediaTile({ item, onClick }: MediaTileProps) {
  const mediaSrc = item.src.startsWith('/') ? item.src : `/town-shots/${item.src}`;

  return (
    <div className="media-tile" onClick={onClick}>
      {item.type === 'video' ? (
        <>
          <video src={mediaSrc} muted playsInline preload="metadata" />
          <div className="media-tile-video-indicator">VIDEO</div>
        </>
      ) : (
        <img src={mediaSrc} alt={item.annotation || 'Town screenshot'} loading="lazy" />
      )}

      <div className="media-tile-overlay">
        <div className="media-tile-time">{formatCaptureTime(item.capturedAt)}</div>
        {item.annotation && <div className="media-tile-annotation">{item.annotation}</div>}
        {item.tags && item.tags.length > 0 && (
          <div className="media-tile-tags">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="media-tile-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
