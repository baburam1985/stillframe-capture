import { captureTab } from './capture.js';

let capturing = false;
chrome.action.onClicked.addListener(async (tab) => {
  if (capturing) return;
  capturing = true;
  try {
    await captureTab(chrome, tab);
  } catch (error) {
    const code = error.message === 'TAB_CHANGED' ? 'tab-changed' : 'capture-failed';
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') + '#error=' + code });
    } catch { /* A closed browser window cannot show an error page. */ }
  } finally {
    capturing = false;
  }
});
