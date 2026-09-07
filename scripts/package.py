"""Build a deterministic Chrome Web Store ZIP. No source tooling or private files."""
import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXTENSION = ROOT / 'extension'
version = json.loads((EXTENSION / 'manifest.json').read_text())['version']
out = ROOT / 'dist'
out.mkdir(exist_ok=True)
target = out / f'stillframe-capture-{version}.zip'
allowed = {'.json', '.js', '.html', '.css', '.png', '.svg'}
with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for file in sorted(EXTENSION.rglob('*')):
        if not file.is_file() or file.suffix not in allowed or any(p.startswith('.') for p in file.relative_to(EXTENSION).parts):
            continue
        info = zipfile.ZipInfo(str(file.relative_to(EXTENSION)), date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        archive.writestr(info, file.read_bytes())
digest = hashlib.sha256(target.read_bytes()).hexdigest()
(out / 'SHA256SUMS').write_text(f'{digest}  {target.name}\n')
print(f'{target}\nSHA256 {digest}')
