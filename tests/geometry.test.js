import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRect, pointerToPixel, validRect, safeFilename } from '../extension/geometry.js';

test('reverse-direction selection preserves all covered pixels', () => {
  assert.deepEqual(normalizeRect({ x: 40.3, y: 70.8 }, { x: 10.2, y: 5.1 }, 100, 100), { x: 10, y: 5, width: 31, height: 66 });
});
test('selection clamps to image boundaries', () => {
  assert.deepEqual(normalizeRect({ x: -3, y: -6 }, { x: 150, y: 180 }, 100, 80), { x: 0, y: 0, width: 100, height: 80 });
});
test('CSS-scaled and Retina canvas coordinates map to actual pixels', () => {
  assert.deepEqual(pointerToPixel(210, 120, { left: 10, top: 20, width: 400, height: 200 }, 1600, 800), { x: 800, y: 400 });
});
test('pointer leaving canvas remains bounded', () => {
  assert.deepEqual(pointerToPixel(-9, 999, { left: 0, top: 0, width: 400, height: 200 }, 1600, 800), { x: 0, y: 800 });
});
test('invalid and fractional crop coordinates are rejected', () => {
  for (const rect of [
    { x: 0, y: 0, width: 0, height: 1 }, { x: -1, y: 0, width: 1, height: 1 },
    { x: 0, y: 0, width: NaN, height: 1 }, { x: .2, y: 0, width: 1, height: 1 },
    { x: 99, y: 0, width: 2, height: 1 }
  ]) assert.equal(validRect(rect, 100, 100), false);
  assert.equal(validRect({ x: 0, y: 0, width: 100, height: 100 }, 100, 100), true);
});
test('filenames cannot contain path traversal or duplicate image extensions', () => {
  assert.equal(safeFilename('../../secret.png', 'jpg'), '-..-secret.jpg');
  assert.equal(safeFilename('report.png', 'png'), 'report.png');
  assert.equal(safeFilename('...', 'png'), 'stillframe.png');
});
