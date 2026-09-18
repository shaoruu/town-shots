import { useCallback, useEffect, useMemo, useState } from 'react';
import { MediaItem } from './types';
import MediaTile from './MediaTile';
import Modal from './Modal';
import './Gallery.css';

interface GalleryProps {
  items: MediaItem[];
}

const DEFAULT_RATIO = 4 / 3;

function columnsForWidth(width: number): number {
  if (width < 560) return 1;
  if (width < 900) return 2;
  if (width < 1440) return 3;
  return 4;
}

function useColumnCount(): number {
  const [count, setCount] = useState(() =>
    typeof window === 'undefined' ? 3 : columnsForWidth(window.innerWidth),
  );

  useEffect(() => {
    const onResize = () => setCount(columnsForWidth(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return count;
}

// Shortest-column placement keeps seams even and reading order roughly
// left-to-right, unlike CSS columns which fill top-to-bottom.
function distribute(items: MediaItem[], columnCount: number): MediaItem[][] {
  const columns: MediaItem[][] = Array.from({ length: columnCount }, () => []);
  const heights = new Array<number>(columnCount).fill(0);

  for (const item of items) {
    const ratio = item.width && item.height ? item.width / item.height : DEFAULT_RATIO;
    let target = 0;
    for (let i = 1; i < columnCount; i++) {
      if (heights[i] < heights[target]) target = i;
    }
    columns[target].push(item);
    heights[target] += 1 / ratio;
  }

  return columns;
}

export default function Gallery({ items }: GalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const columnCount = useColumnCount();
  const columns = useMemo(() => distribute(items, columnCount), [items, columnCount]);

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      setSelectedIndex((current) => {
        if (current === null) return current;
        const next = direction === 'prev' ? current - 1 : current + 1;
        return next >= 0 && next < items.length ? next : current;
      });
    },
    [items.length],
  );

  const handleClose = useCallback(() => setSelectedIndex(null), []);

  return (
    <>
      <header className="site-strip">
        <span className="wordmark">Town Shots</span>
      </header>

      {items.length === 0 ? (
        <div className="gallery-empty">Nothing on the wall yet.</div>
      ) : (
        <main className="gallery-grid" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
          {columns.map((column, columnIndex) => (
            <div className="gallery-column" key={columnIndex}>
              {column.map((item) => {
                const index = items.indexOf(item);
                return (
                  <MediaTile
                    key={item.id}
                    item={item}
                    eager={index < columnCount * 2}
                    onClick={() => setSelectedIndex(index)}
                  />
                );
              })}
            </div>
          ))}
        </main>
      )}

      {selectedIndex !== null && (
        <Modal
          item={items[selectedIndex]}
          index={selectedIndex}
          total={items.length}
          onClose={handleClose}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
}
