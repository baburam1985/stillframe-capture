import { renderEdits } from '../extension/render.js';
const make = (width, height) => Object.assign(document.createElement('canvas'), { width, height });
const assert = (value, message) => { if (!value) throw new Error(message); };
const pixel = (c, x, y) => Array.from(c.getContext('2d').getImageData(x, y, 1, 1).data).join(',');
document.getElementById('run').addEventListener('click', async () => {
  const log = [], out = document.getElementById('results');
  try {
    const source = make(200, 100), ctx = source.getContext('2d');
    ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 200, 100);
    ctx.fillStyle = '#00ff00'; ctx.fillRect(100, 0, 100, 100);
    const redacted = renderEdits(source, [{ type: 'redact', x: 10, y: 10, width: 40, height: 30 }], make);
    for (let y = 10; y < 40; y++) for (let x = 10; x < 50; x++) assert(pixel(redacted, x, y) === '23,45,50,255', 'Redaction must replace every selected pixel opaquely');
    assert(pixel(redacted, 9, 10) === '255,0,0,255', 'Redaction must not change the neighboring pixel');
    log.push('PASS: 1,200 redacted pixels are opaque; adjacent pixels are unchanged.');
    const cropped = renderEdits(source, [{ type: 'crop', x: 100, y: 0, width: 100, height: 100 }], make);
    assert(cropped.width === 100 && pixel(cropped, 0, 0) === '0,255,0,255', 'Crop must use the correct source coordinates');
    log.push('PASS: Crop dimensions and source coordinates.');
    const sequence = renderEdits(source, [{ type: 'redact', x: 10, y: 10, width: 40, height: 30 }, { type: 'crop', x: 10, y: 10, width: 50, height: 40 }], make);
    assert(pixel(sequence, 0, 0) === '23,45,50,255', 'Crop must preserve redaction');
    assert(pixel(source, 10, 10) === '255,0,0,255', 'Original must remain unchanged for undo');
    log.push('PASS: Crop after redaction and original preservation.');
    const annotated = renderEdits(source, [{ type: 'arrow', from: { x: 5, y: 5 }, to: { x: 80, y: 80 } }, { type: 'box', x: 110, y: 10, width: 50, height: 50 }], make);
    assert(pixel(annotated, 40, 40) !== '255,0,0,255', 'Arrow must render');
    assert(pixel(annotated, 110, 30) !== '0,255,0,255', 'Outline must render');
    log.push('PASS: Arrow and outline produce visible pixels.');
    const blob = await new Promise(resolve => redacted.toBlob(resolve, 'image/png'));
    const image = await createImageBitmap(blob), decoded = make(image.width, image.height);
    decoded.getContext('2d').drawImage(image, 0, 0);
    assert(blob.type === 'image/png' && pixel(decoded, 20, 20) === '23,45,50,255', 'Downloaded PNG must contain flattened redaction');
    log.push('PASS: PNG round trip preserves redaction and dimensions.'); image.close();
    const jpg = await new Promise(resolve => redacted.toBlob(resolve, 'image/jpeg', .94));
    const jpeg = await createImageBitmap(jpg);
    assert(jpg.type === 'image/jpeg' && jpeg.width === 200 && jpeg.height === 100, 'JPEG must decode at original size'); jpeg.close();
    log.push('PASS: JPEG export decodes at the expected size.');
    log.push('\n6/6 browser pixel tests passed.');
  } catch (error) { log.push('FAIL: ' + error.message); }
  out.textContent = log.join('\n');
});
