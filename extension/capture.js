export const CAPTURE_PREFIX = 'capture:';
export const CAPTURE_TTL = 5 * 60 * 1000;

export async function cleanExpired(storage, now = Date.now()) {
  const entries = await storage.get(null);
  const expired = Object.entries(entries)
    .filter(([key, value]) => key.startsWith(CAPTURE_PREFIX) &&
      (!value?.createdAt || now - value.createdAt > CAPTURE_TTL))
    .map(([key]) => key);
  if (expired.length) await storage.remove(expired);
}

export async function captureTab(api, tab, { now = Date.now(), id = crypto.randomUUID() } = {}) {
  if (!Number.isInteger(tab?.id) || !Number.isInteger(tab?.windowId)) {
    throw new Error('NO_TAB');
  }
  await cleanExpired(api.storage.session, now);
  const assertActive = async () => {
    const [active] = await api.tabs.query({ active: true, windowId: tab.windowId });
    if (active?.id !== tab.id) throw new Error('TAB_CHANGED');
  };
  await assertActive();
  const dataUrl = await api.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  await assertActive();
  const key = CAPTURE_PREFIX + id;
  try {
    await api.storage.session.set({ [key]: { dataUrl, createdAt: now } });
    await api.tabs.create({
      url: api.runtime.getURL('editor.html') + '#capture=' + encodeURIComponent(id),
      windowId: tab.windowId,
      active: true
    });
  } catch (error) {
    await api.storage.session.remove(key);
    throw error;
  }
  return key;
}

export async function consumeCapture(storage, id, now = Date.now()) {
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) return null;
  const key = CAPTURE_PREFIX + id;
  const entry = (await storage.get(key))[key];
  await storage.remove(key);
  if (!entry || now - entry.createdAt > CAPTURE_TTL ||
      !entry.dataUrl?.startsWith('data:image/png;base64,')) return null;
  return entry.dataUrl;
}
