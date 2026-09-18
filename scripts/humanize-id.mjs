// Shared annotation humanizer for sync ingest.
// Strips agent-/video-/published/-slow / long numeric ids / dates so hover notes
// never read like a VIDEO badge (e.g. "Video butterfly flight published").

const DATE = /20\d{2}-\d{2}-\d{2}/g;
const DROP = new Set([
  'agent',
  'video',
  'published',
  'slow',
  'new',
  'final',
  'after',
  'before',
  'still',
  'clip',
]);

/** @param {string} itemId */
export function humanizeId(itemId) {
  let name = String(itemId || '');
  if (name.includes('__')) name = name.split('__').slice(1).join('__');
  name = name.replace(/\.(png|jpe?g|webp|mp4|webm|mov)$/i, '');
  name = name.replace(DATE, '');
  name = name.replace(/^(agent-)?(video-)?/i, '');
  name = name.replace(/-(published)(-slow)?/gi, '');
  name = name.replace(/-?\d{10,}/g, '');
  name = name.replace(/_/g, '-');
  const parts = name
    .split('-')
    .filter((p) => p && !/^\d+$/.test(p) && !DROP.has(p.toLowerCase()));
  if (!parts.length) return undefined;
  const words = parts.map((p) =>
    /^fl\d*$/i.test(p) ? p.toUpperCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(),
  );
  const text = words.join(' ').replace(/\s{2,}/g, ' ').trim(' -');
  return text || undefined;
}

/** Keep only clearly authored phrases (e.g. "Painted lady on poppy"). */
export function isHandmadeAnnotation(a) {
  if (!a) return false;
  if (/^video\s/i.test(a)) return false;
  return /\bon\b/i.test(a);
}
