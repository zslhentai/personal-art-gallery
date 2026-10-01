#!/usr/bin/env python3
"""Refresh small WebP previews from verified Met / Commons records; never retain originals.
Requires Python 3 and ImageMagick 7 (`magick`). Run from the repository root.
"""
import json
import pathlib
import subprocess
import tempfile
import urllib.request
import urllib.parse

USER_AGENT = "PersonalArtGallery/1.0 (https://github.com/zslhentai/personal-art-gallery; open-access collection maintenance)"

def open_source(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": USER_AGENT}), timeout=60)

ROOT = pathlib.Path(__file__).resolve().parents[1]
artworks = json.loads((ROOT / 'src/data/artworks.json').read_text())
with tempfile.TemporaryDirectory(prefix='gallery-images-') as scratch:
    for artwork in artworks:
        if artwork['id'].startswith('met-'):
            museum_id = artwork['id'].removeprefix('met-')
            endpoint = f'https://collectionapi.metmuseum.org/public/collection/v1/objects/{museum_id}'
            with open_source(endpoint) as response:
                record = json.load(response)
            if record.get('isPublicDomain') is not True or record.get('primaryImage') != artwork['imageUrl']:
                raise ValueError(f"{artwork['id']}: Met source or permission changed; review JSON")
        elif artwork['id'].startswith('commons-'):
            query = urllib.parse.urlencode({
                'action': 'query', 'format': 'json', 'pageids': artwork['id'].removeprefix('commons-'),
                'prop': 'imageinfo', 'iiprop': 'url|extmetadata', 'iiurlwidth': 1600,
            })
            with open_source('https://commons.wikimedia.org/w/api.php?' + query) as response:
                record = next(iter(json.load(response)['query']['pages'].values()))['imageinfo'][0]
            license_name = record['extmetadata']['LicenseShortName']['value']
            if license_name not in ['Public domain', 'CC0']:
                raise ValueError(f"{artwork['id']}: Commons permission changed; review JSON")
            allowed = [record['url'], record.get('thumburl', ''), *record.get('responsiveUrls', {}).values()]
            if artwork['imageUrl'] not in [url.split('?')[0] for url in allowed]:
                raise ValueError(f"{artwork['id']}: Commons rendition changed; review JSON")
        else:
            raise ValueError(f"{artwork['id']}: unsupported source; verify manually")
        original = pathlib.Path(scratch) / 'original.jpg'
        with open_source(artwork['imageUrl']) as response:
            original.write_bytes(response.read())
        width, height = map(int, subprocess.check_output(['magick', 'identify', '-format', '%w %h', str(original)]).decode().split())
        if (width, height) != (artwork['width'], artwork['height']):
            raise ValueError(f"{artwork['id']}: image dimensions changed; review JSON")
        for size in [400, 800, 1200]:
            output = ROOT / f"public/images/{artwork['slug']}-{size}.webp"
            subprocess.run(['magick', str(original), '-auto-orient', '-resize', f'{size}x', '-strip', '-quality', '76', str(output)], check=True)
        print(f"Updated {artwork['slug']}")
