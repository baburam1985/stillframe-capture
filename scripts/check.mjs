import { readFile, readdir, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const ext = path.join(root, 'extension');
const manifest = JSON.parse(await readFile(path.join(ext, 'manifest.json')));
assert.equal(manifest.manifest_version, 3);
assert.deepEqual(manifest.permissions, ['activeTab', 'storage']);
assert.equal(manifest.host_permissions, undefined);
assert.equal(manifest.content_scripts, undefined);
assert.equal(manifest.externally_connectable, undefined);
assert(manifest.description.length <= 132);
for (const file of [manifest.background.service_worker, ...Object.values(manifest.icons)]) await access(path.join(ext, file));
for (const file of await readdir(ext)) {
  const content = await readFile(path.join(ext, file)).catch(() => null);
  if (!content) continue;
  if (file.endsWith('.js')) {
    execFileSync(process.execPath, ['--check', path.join(ext, file)]);
    assert(!/\b(fetch|XMLHttpRequest|WebSocket|eval)\s*\(/.test(content.toString()), `${file}: unexpected network or eval API`);
  }
  if (file.endsWith('.html')) assert(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(content.toString()), `${file}: inline script`);
}
for (const [size, name] of Object.entries(manifest.icons)) {
  const buffer = await readFile(path.join(ext, name));
  assert.equal(buffer.readUInt32BE(16), Number(size));
  assert.equal(buffer.readUInt32BE(20), Number(size));
}
console.log('Manifest, permissions, icons, JavaScript syntax, and network-free source checks passed.');
