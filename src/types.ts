export interface MediaItem {
  id: string;
  src: string;
  type: 'image' | 'video';
  capturedAt: string; // ISO 8601
  thumb?: string; // wall-sized derivative; `src` stays the full-res original
  poster?: string; // first frame for videos
  annotation?: string;
  tags?: string[];
  width?: number;
  height?: number;
  sourcePath?: string;
}

export interface Manifest {
  items: MediaItem[];
}
