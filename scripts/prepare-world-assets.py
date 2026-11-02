"""Prepare local CC0 map textures. Keep originals and verify the provider's MD5."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import json
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets-source' / 'world-materials'
RUNTIME = ROOT / 'public' / 'assets' / 'world'
MATERIALS = {
    'grey_roof_tiles': ('roof', '青灰旧瓦'),
    'mossy_cobblestone': ('stone', '苔缝石板路与桥面'),
    'forest_ground_04': ('earth', '草地、庭院和后井的腐叶湿土'),
    'worn_mossy_plasterwall': ('plaster', '斑驳灰墙'),
    'mossy_stone_wall': ('brick', '院墙、河岸与井沿'),
    'old_wood_floor': ('floor', '客舍、茶楼与王宅旧木地板'),
    'dark_wood': ('wood', '木柱、门扇与桌案'),
}

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={
        'User-Agent': 'PaintedSkinBorrowedFace-Demo/0.1 (local asset preparation)'
    }), timeout=45).read()

def prepare(asset):
    folder = SOURCE / asset
    folder.mkdir(parents=True, exist_ok=True)
    data = {}
    for kind in ['info', 'files']:
        path = folder / (kind + '.json')
        if not path.exists():
            path.write_bytes(fetch('https://api.polyhaven.com/' + kind + '/' + asset))
        data[kind] = json.loads(path.read_text(encoding='utf-8'))
    entry = data['files']['Diffuse']['1k']['jpg']
    source = folder / 'diffuse-1k.jpg'
    if not source.exists():
        source.write_bytes(fetch(entry['url']))
    assert hashlib.md5(source.read_bytes()).hexdigest() == entry['md5'], asset
    name, use = MATERIALS[asset]
    target = RUNTIME / (name + '.webp')
    # Format/size conversion only. Artistic grading is done by the Canvas renderer.
    with Image.open(source) as im:
        im.resize((512, 512), Image.Resampling.LANCZOS).save(target, 'WEBP', quality=92, method=6)
    print(asset, target.stat().st_size, flush=True)
    return {'id': asset, 'author': data['info'].get('authors'), 'source': 'https://polyhaven.com/a/' + asset,
            'license': 'CC0-1.0', 'download': entry['url'], 'md5': entry['md5'], 'use': use,
            'runtime': str(target.relative_to(ROOT)).replace('\\', '/'),
            'sha256': hashlib.sha256(target.read_bytes()).hexdigest()}

if __name__ == '__main__':
    RUNTIME.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=3) as pool:
        assets = list(pool.map(prepare, MATERIALS))
    (ROOT / 'docs' / 'world-public-assets.json').write_text(json.dumps({
        'downloaded': '2026-10-31', 'provider': 'Poly Haven', 'license': 'https://polyhaven.com/license',
        'processing': '1K diffuse to 512px WebP; runtime Canvas color grading; no preview renders used',
        'assets': assets
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    (RUNTIME / 'CREDITS.txt').write_text('Poly Haven — CC0 1.0\nhttps://polyhaven.com/license\nSee docs/world-public-assets.json and ASSET_CREDITS.md for individual authors and sources.\n', encoding='utf-8')
