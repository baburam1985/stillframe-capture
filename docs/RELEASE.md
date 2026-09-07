# Chrome Web Store release

The public source repository and the Chrome Web Store listing are separate deliverables. The store listing is not live until Google approves it.

1. Complete the installed-extension test in TESTING.md.
2. Run `npm test`, `npm run check`, and `npm run package`.
3. Register a Chrome Web Store developer account if necessary. Google requires a registration fee and acceptance of developer terms; the publisher must handle these account steps.
4. Upload `dist/stillframe-capture-1.0.0.zip` in the developer dashboard.
5. Use the listing text below, upload actual product screenshots (1280 × 800 or 640 × 400), and supply the 128-pixel icon.
6. Add a publicly accessible privacy-policy URL. The repository's `extension/privacy.html` is the policy source; a rendered public policy page is preferable. A GitHub-rendered policy copy is also provided in PRIVACY.md.
7. Complete the privacy declarations consistently with the code and policy. No user data is collected or transmitted off the device. Screenshots are handled locally for the sole purpose of capture/edit/export.
8. Select free distribution. Submit for review only after the release gate passes.

## Listing text

**Name:** Stillframe Capture

**Summary:** Capture your visible tab, crop, annotate, redact, and save. Free, open source, and entirely on your device.

**Category:** Tools / workflow and productivity (choose the matching category offered by the dashboard).

**Description:**

Worth a screenshot. Stillframe is a simple, free screenshot tool for Chrome.

Click the extension icon to capture the visible part of your current tab. Refine it in a focused editor: crop to an exact area, point out a detail with an arrow or outline, cover sensitive information with solid redaction, then download PNG or JPEG.

- Visible-tab capture with one click
- Precise crop with drag or pixel coordinates
- Arrows, outlines, and opaque redaction
- Undo and redo
- PNG and JPEG downloads without watermarks
- Local image editing
- No account, uploads, advertising, or analytics
- MIT-licensed source code

Your screenshots stay on your device. Stillframe requests temporary access only when you use it. It does not capture full scrolling pages. Save your image before closing the editor.

**Single purpose:** Capture, edit, and download screenshots locally.

**activeTab justification:** Required to capture the visible current tab after the user invokes the toolbar action or shortcut; no persistent host access is requested.

**storage justification:** Uses chrome.storage.session to pass the captured PNG from the service worker to the editor across worker suspension. The editor deletes the handoff after reading. No local/sync screenshot storage is used.

**Remote code:** None.

**Reviewer instructions:** No login required. Open a regular webpage and click the extension icon. Verify the captured image in the new tab. Crop or redact, then download. Use the included sample or open a local image from the editor to exercise editing without a capture.

## References

- https://developer.chrome.com/docs/webstore/publish
- https://developer.chrome.com/docs/webstore/register
- https://developer.chrome.com/docs/webstore/images
