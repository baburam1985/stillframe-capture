"""Generate original, supersampled corner-frame icons using only Python's stdlib."""
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def png(path, size):
    scale = 4
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            colors = []
            for sy in range(scale):
                for sx in range(scale):
                    px = (x + (sx + .5) / scale) * 128 / size
                    py = (y + (sy + .5) / scale) * 128 / size
                    # Rounded tile, with a frame and a warm center dot.
                    dx = max(16 - px, 0, px - 112)
                    dy = max(16 - py, 0, py - 112)
                    inside = dx * dx + dy * dy <= 16 * 16
                    color = (23, 45, 50, 255) if inside else (0, 0, 0, 0)
                    frame = ((30 <= px <= 37 or 91 <= px <= 98) and (30 <= py <= 51 or 77 <= py <= 98)) or ((30 <= py <= 37 or 91 <= py <= 98) and (30 <= px <= 51 or 77 <= px <= 98))
                    if frame:
                        color = (248, 246, 230, 255)
                    if (px - 64) ** 2 + (py - 64) ** 2 <= 13 ** 2:
                        color = (231, 128, 88, 255)
                    colors.append(color)
            raw.extend(round(sum(c[channel] for c in colors) / len(colors)) for channel in range(4))
    def chunk(kind, data):
        return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff)
    path.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!IIBBBBB', size, size, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))

if __name__ == '__main__':
    for size in (16, 32, 48, 128):
        png(ROOT / 'extension' / 'icons' / f'icon{size}.png', size)
    print('Generated icons at 16, 32, 48, and 128 pixels.')
