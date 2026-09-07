# Testing evidence

Verified September 7, 2026, on macOS with Google Chrome.

## Passed

- 15 Node tests: capture ordering, active-tab changes, closed editor/window failures, session quota failure, single-use handoff, expiry cleanup, missing tab, reverse drag geometry, bounds, CSS/Retina scaling, invalid rectangles, and safe filenames.
- Source checks: Manifest V3, only activeTab/storage permissions, no host permissions or content scripts, expected icons/dimensions, JavaScript parsing, no network/eval calls or inline scripts.
- Six real Chrome Canvas tests: 1,200 opaque redaction pixels and unchanged neighbors; crop dimensions/source pixels; crop after redaction and original preservation; visible arrow/outline pixels; PNG decode with flattened redaction; JPEG decode with expected dimensions.
- Chrome editor interaction: sample opens, precise redaction, crop to 1150 × 325, undo/redo, and PNG download request.

## Pending release gate

The installed-extension capture smoke test is pending. Browser automation cannot open the Chrome extension manager, so installation requires a manual Load unpacked step. Unit tests mock the Chrome capture API and do not substitute for this test.

## Repeatable installed-extension smoke test

1. Load `extension/` unpacked in Chrome, then open the local sample page or a regular public webpage.
2. Click Stillframe in the toolbar: verify a new editor tab displays that page's visible pixels.
3. Crop, redact a sample detail, and download PNG and JPEG. Open exports and verify dimensions and redaction.
4. Undo and redo; verify the results. Change tools, cancel a selection, and discard the image.
5. Exercise an unavailable capture context and verify a useful error rather than a blank editor.
6. Test the keyboard shortcut if available, multiple windows, and a high-DPI display.

The reproducible browser pixel suite is `tests/browser.html`. Run `npm run dev`, open it in Chrome, and click Run pixel tests.
