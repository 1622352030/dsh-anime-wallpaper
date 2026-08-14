#!/usr/bin/env python3
"""Generate src/client/backgrounds.generated.ts from the source images.

Resizes every source to 1920x1080 webp (quality 82) and emits one exported
`data:image/webp;base64,...` constant per background, plus a key->uri map.
Run from the skin root:  python scripts/generate-backgrounds.py
"""
import base64
import io
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGES = os.path.join(ROOT, 'images')
OUT = os.path.join(ROOT, 'src', 'client', 'backgrounds.generated.ts')

# stable key -> source filename (keys are the localStorage switch handles)
BACKGROUNDS = [
    ('rabbit-umbrella', '兔子打伞-4k-16x9.png'),
    ('sakuya-snow', '咲夜看雪-4k-16x9.png'),
    ('sanae-fishing', '早苗摸鱼-4k-16x9.png'),
    ('orange-isle', '橘子洲头.png'),
    ('reimu-flower', '灵梦吃花-4k-16x9-无水印.png'),
    ('reimu-flower-wm', '灵梦吃花-4k-16x9.png'),
    ('reimu-water', '灵梦泡水-4k-16x9.png'),
    ('nahida', '纳西达.jpg'),
    ('rem', '蕾姆流星锤-expanded-16x9.png'),
]

TARGET = (1920, 1080)
QUALITY = 82


def const_name(key: str) -> str:
    return 'BG_' + key.replace('-', '_').upper()


def to_data_uri(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, 'WEBP', quality=QUALITY, method=6)
    payload = base64.b64encode(buf.getvalue()).decode('ascii')
    return 'data:image/webp;base64,' + payload


def main() -> None:
    lines = [
        '/**',
        ' * Generated background data URIs. Regenerate with:',
        ' *   python scripts/generate-backgrounds.py',
        ' *',
        ' * Each key is also the localStorage switch handle: set',
        ' * `localStorage["dsh-skin-anime-wallpaper.background"] = "<key>"`.',
        ' */',
    ]
    entries = []
    for key, filename in BACKGROUNDS:
        path = os.path.join(IMAGES, filename)
        if not os.path.exists(path):
            raise SystemExit(f'missing source: {path}')
        img = Image.open(path).convert('RGB')
        img = img.resize(TARGET, Image.LANCZOS)
        uri = to_data_uri(img)
        lines.append(f'export const {const_name(key)} = {uri!r}')
        entries.append((key, const_name(key), filename))
        print(f'{key:18s} <- {filename}  ({len(uri) // 1024} KiB data URI)')

    lines.append('')
    lines.append('export const BACKGROUNDS: Record<string, string> = {')
    for key, cn, _ in entries:
        lines.append(f"  '{key}': {cn},")
    lines.append('}')
    lines.append('')
    lines.append('export const BACKGROUND_KEYS = [' + ', '.join(f"'{k}'" for k, _, _ in entries) + ']')
    lines.append('')
    lines.append('export const DEFAULT_BACKGROUND = \'reimu-flower\'')
    lines.append('')

    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))
    print(f'\nwrote {OUT} ({os.path.getsize(OUT) // 1024} KiB)')


if __name__ == '__main__':
    main()
