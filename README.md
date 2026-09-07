# Stillframe Capture

**Worth a screenshot.** A free, open-source Chrome extension to capture your visible tab, crop, annotate, cover private details, and save the result.

No account. No uploads. No ads. No watermark. No runtime dependencies.

## Features

- Click the extension icon to capture the visible area of your current tab.
- Keyboard shortcut: **Alt+Shift+S** (Option+Shift+S on Mac), if available. Chrome may leave a shortcut unassigned if another extension uses it.
- Crop using a drag selection or exact pixel coordinates.
- Add arrows and outlines, or apply solid, opaque redaction.
- Undo and redo up to 100 edits. Keyboard undo: Ctrl/Cmd+Z; redo: Ctrl/Cmd+Shift+Z.
- Download flattened PNG or JPEG images.
- Open existing PNG, JPEG, and WebP images locally.
- Try an included fictional sample before capturing a page.

## Install from source

1. Download this repository using **Code → Download ZIP**, and extract it.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose the **extension** folder inside the extracted repository.
5. Open an ordinary webpage, then click **Stillframe Capture** in Chrome's extensions menu. Pin it if you want quick access.

The editor opens in a new tab. Capture access is granted only when you invoke the extension. The Chrome Web Store listing is not yet published; source installation is available now.

## Privacy

Only two permissions are requested:

| Permission | Purpose |
| --- | --- |
| `activeTab` | Capture the current visible tab after an explicit click or keyboard action. |
| `storage` | Transfer the capture to the editor in `chrome.storage.session` memory. |

No persistent host permissions, injected content scripts, remote code, analytics, or background network requests. Captures are deleted from session storage when the editor reads them. Unopened captures expire after five minutes and are cleaned on the next capture or when Chrome clears the extension session. The editor keeps the image and undo history in tab memory. Downloaded files are saved by Chrome.

Redaction is a solid pixel replacement in the flattened export. Undo can recover the original in the editor; it cannot recover it from the exported redacted image. Review the output before sharing. [Read the full privacy policy](PRIVACY.md).

## Development

Requires Node.js 20+ and Python 3. No `npm install` needed.

```sh
npm test
npm run check
npm run dev
```

Open `http://127.0.0.1:4178/extension/editor.html` for editor development. This normal web preview supports sample and local image editing; capture requires the installed extension.

For real Canvas pixel and export tests, open `http://127.0.0.1:4178/tests/browser.html` in Chrome and click **Run pixel tests**. The test fixtures contain only synthetic data.

```sh
npm run package
```

This creates `dist/stillframe-capture-1.0.0.zip` with `manifest.json` at the archive root, and `dist/SHA256SUMS`. Packaging is deterministic and includes only extension assets. The CI workflow runs unit/source checks and produces the package artifact.

## Architecture

```text
Explicit toolbar click / keyboard shortcut
                 │
       MV3 service worker
       captureVisibleTab
                 │
       chrome.storage.session
       (single-use handoff)
                 │
           Editor tab
    Original raster + edit operations
                 │
      Deterministic Canvas renderer
                 │
     Flattened PNG / JPEG download
```

The capture code checks the active tab before and after capture and discards the result if it changed. The editor uses original image pixel coordinates rather than CSS coordinates, including on Retina displays. Edits are represented as operations rather than full-image undo snapshots. Export renders committed pixels only, never selection guides or edit history. Pending selections must be applied or cancelled before export.

See [architecture decisions](docs/ARCHITECTURE.md), [testing evidence](docs/TESTING.md), and [release instructions](docs/RELEASE.md).

## Current limits

- Captures the **visible viewport**, not a stitched full-page screenshot or video.
- Maximum image size: 32 megapixels and 16,384 pixels per side. Imported files must be below 24 MB. Chrome's session-storage quota can also limit very large captures; reduce the browser window size if necessary.
- Restricted environments, protected media, and browser policy may prevent capture. Local file URLs require enabling file access for the extension.
- Closing or reloading the editor clears the image; download first. Non-sample images show a leave-page warning when supported by Chrome.
- Shortcuts may conflict with existing extensions; use the toolbar icon or configure a shortcut yourself.
- Redaction covers only the region selected by the user. It does not automatically detect private information.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). Small improvements, reproducible bug reports, and accessibility feedback are welcome.

## License

[MIT](LICENSE). Free to use, modify, and distribute. Original icons and the fictional sample artwork are included under the same license.
