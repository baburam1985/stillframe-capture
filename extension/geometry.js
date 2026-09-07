export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeRect(a, b, width, height) {
  const x = clamp(Math.floor(Math.min(a.x, b.x)), 0, width);
  const y = clamp(Math.floor(Math.min(a.y, b.y)), 0, height);
  const right = clamp(Math.ceil(Math.max(a.x, b.x)), 0, width);
  const bottom = clamp(Math.ceil(Math.max(a.y, b.y)), 0, height);
  return { x, y, width: right - x, height: bottom - y };
}

export function pointerToPixel(clientX, clientY, bounds, width, height) {
  return {
    x: clamp((clientX - bounds.left) * width / bounds.width, 0, width),
    y: clamp((clientY - bounds.top) * height / bounds.height, 0, height)
  };
}

export function validRect(rect, width, height) {
  return ['x', 'y', 'width', 'height'].every(key => Number.isInteger(rect[key])) &&
    rect.x >= 0 && rect.y >= 0 && rect.width >= 1 && rect.height >= 1 &&
    rect.x + rect.width <= width && rect.y + rect.height <= height;
}

export function safeFilename(value, extension) {
  const stem = value.replace(/\.(png|jpe?g)$/i, '').replace(/[^a-zA-Z0-9_\- .]/g, '-')
    .replace(/^[. ]+|[. ]+$/g, '').slice(0, 100);
  return (stem || 'stillframe') + '.' + extension;
}
