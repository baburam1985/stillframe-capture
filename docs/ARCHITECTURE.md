# Architecture decisions

## Explicit capture with activeTab

The toolbar action performs one screenshot, with no content scripts or permanent host access. Full-page stitching is deferred because it needs scrolling and script injection, introduces fixed-element and layout edge cases, and expands the permission model.

## Session-memory handoff

The MV3 worker writes a capture to `chrome.storage.session` before opening the editor. This survives worker suspension without writing screenshot history to local/sync storage. The editor consumes and deletes the entry. Unopened captures expire after five minutes and are cleaned at the next capture. Session quota errors surface as a capture failure. No screenshot data is placed in a URL or log.

## Operation-based editing

An immutable source raster and a list of operations implement undo and redo. The canvas renderer replays crop, redaction, arrow, and outline operations in order. Crops create a new coordinate space for later operations. Undo memory grows by operation count, not by full screenshot snapshots. Replay time grows with edit count; the editor caps history at 100 edits and image input at 32 megapixels.

## Pixel accuracy and redaction

Drag coordinates map through the canvas's displayed bounds into intrinsic raster dimensions. Rectangles round outward to integer boundaries. Redaction uses opaque fills, not blur, and export contains only flattened raster pixels. Selection overlays are rendered on a separate presentation canvas and cannot enter the exported image.

## No build chain at runtime

Native JavaScript modules and Manifest V3 eliminate bundled dependencies and remote code. The content security policy disallows connections and external script sources. The normal web preview reuses the actual editor and renderer; the capture API itself must be tested with the installed extension.
