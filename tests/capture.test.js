import test from 'node:test';
import assert from 'node:assert/strict';
import { captureTab, consumeCapture, cleanExpired, CAPTURE_TTL } from '../extension/capture.js';

function mock() {
  const entries = {}, events = [];
  const session = {
    async get(key) { return key === null ? { ...entries } : { [key]: entries[key] }; },
    async set(values) { events.push('store'); Object.assign(entries, values); },
    async remove(keys) { for (const key of [].concat(keys)) delete entries[key]; }
  };
  const api = {
    storage: { session }, runtime: { getURL: file => 'chrome-extension://test/' + file },
    tabs: {
      async query() { return [{ id: 7 }]; },
      async captureVisibleTab(windowId, options) { assert.equal(windowId, 2); assert.equal(options.format, 'png'); events.push('capture'); return 'data:image/png;base64,TEST'; },
      async create(options) { events.push('open'); assert.equal(options.windowId, 2); }
    }
  };
  return { api, entries, events, session };
}
test('capture is taken and stored before opening the editor', async () => {
  const { api, entries, events } = mock();
  await captureTab(api, { id: 7, windowId: 2 }, { now: 100, id: 'abc' });
  assert.deepEqual(events, ['capture', 'store', 'open']);
  assert.equal(entries['capture:abc'].dataUrl, 'data:image/png;base64,TEST');
});
test('tab switch before capture prevents capture', async () => {
  const { api, events } = mock(); api.tabs.query = async () => [{ id: 8 }];
  await assert.rejects(captureTab(api, { id: 7, windowId: 2 }), /TAB_CHANGED/);
  assert.deepEqual(events, []);
});
test('tab switch during capture discards the result', async () => {
  const { api, entries } = mock(); let calls = 0;
  api.tabs.query = async () => [{ id: ++calls === 1 ? 7 : 8 }];
  await assert.rejects(captureTab(api, { id: 7, windowId: 2 }), /TAB_CHANGED/);
  assert.deepEqual(entries, {});
});
test('failed editor creation cleans up screenshot data', async () => {
  const { api, entries } = mock(); api.tabs.create = async () => { throw new Error('window closed'); };
  await assert.rejects(captureTab(api, { id: 7, windowId: 2 }), /window closed/);
  assert.deepEqual(entries, {});
});
test('storage quota failure does not open an empty editor', async () => {
  const { api, events } = mock(); api.storage.session.set = async () => { throw new Error('quota'); };
  await assert.rejects(captureTab(api, { id: 7, windowId: 2 }), /quota/);
  assert.deepEqual(events, ['capture']);
});
test('capture is consumed once and removed from session storage', async () => {
  const { session, entries } = mock(); entries['capture:abc'] = { createdAt: 100, dataUrl: 'data:image/png;base64,TEST' };
  assert.equal(await consumeCapture(session, 'abc', 200), 'data:image/png;base64,TEST');
  assert.equal(await consumeCapture(session, 'abc', 200), null);
  assert.deepEqual(entries, {});
});
test('expired and malformed captures cannot be opened', async () => {
  const { session, entries } = mock(); entries['capture:abc'] = { createdAt: 100, dataUrl: 'data:image/png;base64,TEST' };
  assert.equal(await consumeCapture(session, 'abc', CAPTURE_TTL + 101), null);
  assert.equal(await consumeCapture(session, '../bad', 101), null);
  entries['capture:bad'] = { createdAt: 100, dataUrl: 'https://example.com/private' };
  assert.equal(await consumeCapture(session, 'bad', 101), null);
});
test('cleanup removes only expired captures', async () => {
  const { session, entries } = mock(); Object.assign(entries, { other: 1, 'capture:old': { createdAt: 1 }, 'capture:new': { createdAt: CAPTURE_TTL } });
  await cleanExpired(session, CAPTURE_TTL + 2);
  assert.deepEqual(Object.keys(entries), ['other', 'capture:new']);
});
test('missing tab is rejected', async () => {
  const { api } = mock(); await assert.rejects(captureTab(api, undefined), /NO_TAB/);
});
