# Contributing

Please open an issue describing the problem before a substantial feature change. Include Chrome version, OS, steps to reproduce, expected behavior, and actual behavior. Use the included sample or another non-sensitive fixture; do not attach private screenshots.

Keep the extension local-only and dependency-free at runtime. New permissions need a documented necessity and a privacy-policy update. Avoid persistent website access, tracking, remote code, and external fonts.

Run `npm test`, `npm run check`, the browser pixel suite, and the installed-extension smoke test before a pull request. Document what was tested and any remaining limitations. Regenerate the icons using `python3 scripts/icons.py` when changing their source.

For private security concerns, use GitHub's private vulnerability reporting if enabled; otherwise report a minimal, non-sensitive issue requesting a private contact route.
