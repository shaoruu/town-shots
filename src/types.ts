export interface MediaItem {
  id: string;
  src: string;
  type: 'image' | 'video';
  capturedAt: string; // ISO 8601
  annotation?: string;
  tags?: string[];
  width?: number;
  height?: number;
  sourcePath?: string;
}

export interface Manifest {
  items: MediaItem[];
}
