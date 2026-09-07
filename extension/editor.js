import { normalizeRect, pointerToPixel, validRect, safeFilename } from './geometry.js';
import { consumeCapture } from './capture.js';
import { renderEdits } from './render.js';

const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const rectInputs = ['x', 'y', 'width', 'height'].map(key => $('rect-' + key));
const makeCanvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });
const hints = {
  crop: 'Drag across the image to select a crop, or enter exact coordinates.',
  redact: 'Select private details, then apply an opaque cover. Export flattens it into the image.',
  arrow: 'Drag from the arrow tail to its tip. With coordinates, the arrow points diagonally down and right.',
  box: 'Select an area to outline in terracotta. Apply to keep the annotation.'
};
let source = null, rendered = null, operations = [], redoStack = [];
let tool = 'crop', selection = null, drag = null, isSample = false;

function status(message, error = false) {
  $('status').textContent = message;
  $('status').classList.toggle('error', error);
}

function fields(rect) {
  rectInputs.forEach(input => { input.value = rect[input.id.replace('rect-', '')]; });
}

function currentRect() {
  return Object.fromEntries(rectInputs.map(input => [input.id.replace('rect-', ''), input.value === '' ? NaN : Number(input.value)]));
}

function draw() {
  if (!rendered) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(rendered, 0, 0);
  if (!selection) return;
  const rect = selection.rect;
  ctx.save();
  ctx.strokeStyle = '#1783a5';
  ctx.lineWidth = Math.max(2, canvas.width / 700);
  ctx.setLineDash([8, 5]);
  ctx.fillStyle = '#1783a51a';
  if (tool === 'arrow') {
    ctx.beginPath(); ctx.moveTo(selection.from.x, selection.from.y); ctx.lineTo(selection.to.x, selection.to.y); ctx.stroke();
  } else {
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
  }
  ctx.restore();
}

function rebuild() {
  if (rendered) { rendered.width = 1; rendered.height = 1; }
  rendered = renderEdits(source, operations, makeCanvas);
  canvas.width = rendered.width; canvas.height = rendered.height;
  selection = null; drag = null;
  fields({ x: 0, y: 0, width: canvas.width, height: canvas.height });
  $('dimensions').textContent = `${canvas.width} × ${canvas.height} px`;
  $('undo').disabled = operations.length === 0;
  $('redo').disabled = redoStack.length === 0;
  $('edit-count').textContent = operations.length ? `${operations.length} edit${operations.length === 1 ? '' : 's'} applied` : 'Original image';
  draw();
}

function setTool(value) {
  tool = value; selection = null; drag = null;
  document.querySelectorAll('[data-tool]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tool === tool)));
  $('tool-hint').textContent = hints[tool];
  $('apply').textContent = `Apply ${tool === 'box' ? 'outline' : tool === 'redact' ? 'redaction' : tool}`;
  draw();
}

async function loadImage(url, sample = false) {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 32_000_000 || image.naturalWidth > 16384 || image.naturalHeight > 16384) {
    throw new Error('This image is too large. Use an image below 32 megapixels and 16,384 pixels per side.');
  }
  // Draw immediately; the source image contains only raster pixels after this point.
  const next = makeCanvas(image.naturalWidth, image.naturalHeight);
  next.getContext('2d').drawImage(image, 0, 0);
  if (source) { source.width = 1; source.height = 1; }
  source = next; operations = []; redoStack = []; isSample = sample;
  $('welcome').hidden = true; $('workspace').hidden = false;
  $('capture-label').textContent = sample ? 'SAMPLE CAPTURE · FICTIONAL DATA' : 'YOUR CAPTURE';
  $('filename').value = 'stillframe-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  setTool('crop'); rebuild();
  status(sample ? 'Sample loaded. Try cropping, annotating, or covering a detail.' : 'Ready. Select an area to edit, or download your image as it is.');
}

$('sample').addEventListener('click', async () => {
  try { await loadImage('sample.svg', true); } catch { status('The sample could not be loaded.', true); }
});
$('image-file').addEventListener('change', async event => {
  const file = event.target.files[0];
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 24 * 1024 * 1024) {
    status('Choose a PNG, JPEG, or WebP image smaller than 24 MB.', true); event.target.value = ''; return;
  }
  const url = URL.createObjectURL(file);
  try { await loadImage(url); } catch (error) { status(error.message || 'This image could not be opened.', true); }
  finally { URL.revokeObjectURL(url); event.target.value = ''; }
});
document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => setTool(button.dataset.tool)));

const point = event => pointerToPixel(event.clientX, event.clientY, canvas.getBoundingClientRect(), canvas.width, canvas.height);
canvas.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !source) return;
  drag = { start: point(event), pointerId: event.pointerId };
  selection = null;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const end = point(event);
  const rect = normalizeRect(drag.start, end, canvas.width, canvas.height);
  selection = { rect, from: drag.start, to: end };
  fields(rect); draw();
});
canvas.addEventListener('pointerup', event => {
  if (!drag || drag.pointerId !== event.pointerId) return;
  const end = point(event), rect = normalizeRect(drag.start, end, canvas.width, canvas.height);
  selection = { rect, from: drag.start, to: end };
  fields(rect); drag = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  draw();
});
canvas.addEventListener('pointercancel', () => { drag = null; selection = null; draw(); });
rectInputs.forEach(input => input.addEventListener('input', () => {
  const rect = currentRect();
  selection = validRect(rect, canvas.width, canvas.height) ? {
    rect, from: { x: rect.x, y: rect.y }, to: { x: rect.x + rect.width, y: rect.y + rect.height }
  } : null;
  draw();
}));
$('apply').addEventListener('click', () => {
  if (!source) return;
  const rect = currentRect();
  const arrow = tool === 'arrow' && selection;
  if (arrow ? Math.hypot(selection.to.x - selection.from.x, selection.to.y - selection.from.y) < 2 : !validRect(rect, canvas.width, canvas.height)) {
    status('Select an area inside the image with positive dimensions. Arrows must be at least 2 pixels long.', true); return;
  }
  if (operations.length >= 100) { status('This image has reached 100 edits. Download it, then reopen it to continue.', true); return; }
  const op = tool === 'arrow' ? {
    type: tool, from: selection?.from || { x: rect.x, y: rect.y }, to: selection?.to || { x: rect.x + rect.width, y: rect.y + rect.height }
  } : { type: tool, ...rect };
  operations.push(op); redoStack = []; rebuild();
  status(`${tool === 'redact' ? 'Solid redaction' : tool === 'box' ? 'Outline' : tool[0].toUpperCase() + tool.slice(1)} applied. Undo is available until you close this tab.`);
});
$('undo').addEventListener('click', () => { if (operations.length) { redoStack.push(operations.pop()); rebuild(); status('Edit undone.'); } });
$('redo').addEventListener('click', () => { if (redoStack.length) { operations.push(redoStack.pop()); rebuild(); status('Edit restored.'); } });
$('discard').addEventListener('click', () => {
  source.width = source.height = 1; rendered.width = rendered.height = 1;
  source = rendered = null; operations = []; redoStack = []; selection = drag = null;
  canvas.width = canvas.height = 1; $('workspace').hidden = true; $('welcome').hidden = false;
  status('Image discarded from the editor.'); $('sample').focus();
});
$('download').addEventListener('click', async () => {
  if (!rendered) return;
  if (selection) { status('Apply your selection or press Esc to cancel it before downloading.', true); return; }
  const button = $('download'); button.disabled = true;
  try {
    const format = $('format').value;
    // Export only committed pixels, never the selection overlay or edit history.
    const output = makeCanvas(rendered.width, rendered.height);
    const ctx = output.getContext('2d');
    if (format === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, output.width, output.height); }
    ctx.drawImage(rendered, 0, 0);
    const blob = await new Promise(resolve => output.toBlob(resolve, 'image/' + format, .94));
    output.width = output.height = 1;
    if (!blob) throw new Error('Export failed. Try cropping to a smaller image.');
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = safeFilename($('filename').value, format === 'jpeg' ? 'jpg' : 'png');
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    status('Download requested. Your browser will save the flattened image.');
  } catch (error) { status(error.message || 'Download failed. Please try again.', true); }
  finally { button.disabled = false; }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { selection = null; drag = null; draw(); status('Selection cancelled.'); }
  const editable = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
  if (!editable && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && source) {
    event.preventDefault(); $(event.shiftKey ? 'redo' : 'undo').click();
  }
});
window.addEventListener('beforeunload', event => {
  if (source && !isSample) { event.preventDefault(); event.returnValue = ''; }
});

async function init() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (params.has('error')) {
    status(params.get('error') === 'tab-changed' ? 'The active tab changed during capture. Stay on the page and click Stillframe again.' : 'Chrome could not capture this page. Try a regular website, allow file access for local files, or use a smaller browser window if the image is too large.', true);
  }
  const id = params.get('capture');
  if (!id) return;
  history.replaceState(null, '', location.pathname);
  try {
    if (!globalThis.chrome?.storage?.session) throw new Error('Open this editor through the installed Stillframe extension.');
    const dataUrl = await consumeCapture(chrome.storage.session, id);
    if (!dataUrl) throw new Error('This capture has expired or was already opened. Click the extension icon to take a new screenshot.');
    await loadImage(dataUrl);
  } catch (error) { status(error.message || 'Could not open this screenshot. Please capture again.', true); }
}
init();
