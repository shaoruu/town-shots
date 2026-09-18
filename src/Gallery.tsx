import { useState } from 'react';
import { MediaItem } from './types';
import MediaTile from './MediaTile';
import Modal from './Modal';
import './Gallery.css';

interface GalleryProps {
  items: MediaItem[];
}

export default function Gallery({ items }: GalleryProps) {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!selectedItem) return;
    const currentIndex = items.findIndex((i) => i.id === selectedItem.id);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < items.length) {
      setSelectedItem(items[newIndex]);
    }
  };

  if (items.length === 0) {
    return (
      <div className="gallery-empty">
        <div className="gallery-empty-title">No media yet</div>
        <div className="gallery-empty-description">
          This gallery is waiting for Town screenshots and videos. The media folder and manifest will be synced here soon.
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-grid">
        {items.map((item) => (
          <MediaTile key={item.id} item={item} onClick={() => setSelectedItem(item)} />
        ))}
      </div>

      {selectedItem && (
        <Modal
          item={selectedItem}
          items={items}
          onClose={() => setSelectedItem(null)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
