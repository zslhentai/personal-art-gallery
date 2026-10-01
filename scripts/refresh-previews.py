#!/usr/bin/env python3
"""Refresh small WebP previews from verified Met records; never retain originals.
Requires Python 3 and ImageMagick 7 (`magick`). Run from the repository root.
"""
import json
import pathlib
import subprocess
import tempfile
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
artworks = json.loads((ROOT / 'src/data/artworks.json').read_text())
with tempfile.TemporaryDirectory(prefix='gallery-images-') as scratch:
    for artwork in artworks:
        museum_id = artwork['id'].removeprefix('met-')
        endpoint = f'https://collectionapi.metmuseum.org/public/collection/v1/objects/{museum_id}'
        with urllib.request.urlopen(endpoint, timeout=45) as response:
            record = json.load(response)
        if record.get('isPublicDomain') is not True:
            raise ValueError(f"{artwork['id']}: official record no longer confirms open access")
        if record.get('primaryImage') != artwork['imageUrl']:
            raise ValueError(f"{artwork['id']}: source changed; review JSON before refreshing")
        original = pathlib.Path(scratch) / 'original.jpg'
        with urllib.request.urlopen(artwork['imageUrl'], timeout=60) as response:
            original.write_bytes(response.read())
        width, height = map(int, subprocess.check_output(['magick', 'identify', '-format', '%w %h', str(original)]).decode().split())
        if (width, height) != (artwork['width'], artwork['height']):
            raise ValueError(f"{artwork['id']}: image dimensions changed; review JSON")
        for size in [400, 800, 1200]:
            output = ROOT / f"public/images/{artwork['slug']}-{size}.webp"
            subprocess.run(['magick', str(original), '-auto-orient', '-resize', f'{size}x', '-strip', '-quality', '80', str(output)], check=True)
        print(f"Updated {artwork['slug']}")
