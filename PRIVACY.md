# Stillframe Capture privacy policy

Effective September 7, 2026 · Version 1.0.0

Stillframe captures the visible area of a tab only after you click its icon or invoke its keyboard shortcut. You may also choose a local image to edit. All image processing takes place on your device. Stillframe does not upload images, collect analytics, use advertising, or contact a server.

A new capture is temporarily held in Chrome's session memory while the editor opens. The editor removes it from session storage as soon as it retrieves it. Unopened captures expire after five minutes and are removed on the next capture, or when Chrome clears the extension session. Nothing is synced. The editor retains the image and undo history in tab memory until you close, reload, or discard it. Downloaded files remain wherever your browser saves them.

## Permissions

- **activeTab:** Capture the current tab following your explicit action. No persistent access to all websites.
- **storage:** Transfer the capture to the editor using `chrome.storage.session`. No local or sync storage.

## Redaction

Redaction covers the selected area with opaque pixels. Downloaded files are flattened and contain no original image or undo history. Undo can restore the original in the open editor. Review exports before sharing; only selected areas are covered. Imported metadata is not deliberately copied into exports.

## External links

The Source code link opens GitHub only when clicked. GitHub has its own privacy policy. No screenshot is attached to that link.

## Limited use

Stillframe's use of information received from Google APIs adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.

## Contact

Use the [project issue tracker](https://github.com/baburam1985/stillframe-capture/issues). Do not include private screenshots in public issues.
