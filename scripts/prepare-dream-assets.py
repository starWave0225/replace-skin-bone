"""Download selected CC0 Poly Haven assets once; runtime uses local files only."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import urllib.request
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets-source' / 'polyhaven'
RUNTIME = ROOT / 'public' / 'assets' / 'dream' / 'realism'
HEADERS = {'User-Agent': 'PaintedSkinBorrowedFace-Demo/0.1 (local asset preparation)'}
MODELS = ['chinese_chandelier', 'chinese_console_table', 'chinese_armchair', 'chinese_screen_panels', 'chinese_tea_table', 'chinese_cabinet']
MATERIALS = ['old_wood_floor', 'dark_wood', 'worn_plaster_wall', 'rough_linen']

def fetch(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=60) as response:
        return response.read()

def metadata(asset, kind):
    path = SOURCE / asset / (kind + '.json')
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_bytes(fetch('https://api.polyhaven.com/' + kind + '/' + asset))
    return json.loads(path.read_text(encoding='utf-8'))

def download(entry, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        path.write_bytes(fetch(entry['url']))
    assert hashlib.md5(path.read_bytes()).hexdigest() == entry['md5'], str(path)

def encode(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    Image.open(source).save(target, format='WEBP', quality=92, method=6)

def model(asset):
    info = metadata(asset, 'info')
    entry = metadata(asset, 'files')['gltf']['1k']['gltf']
    src = SOURCE / asset
    dest = RUNTIME / asset
    original = src / (asset + '.gltf')
    download(entry, original)
    for relative, included in entry['include'].items():
        source = src / relative
        download(included, source)
        if source.suffix == '.jpg':
            encode(source, (dest / relative).with_suffix('.webp'))
        else:
            target = dest / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.read_bytes())
    gltf = json.loads(original.read_text(encoding='utf-8'))
    for image in gltf.get('images', []):
        uri = image.get('uri', '')
        if uri.endswith('.jpg'):
            image['uri'] = uri[:-4] + '.webp'
            image['mimeType'] = 'image/webp'
    dest.mkdir(parents=True, exist_ok=True)
    (dest / 'model.gltf').write_text(json.dumps(gltf), encoding='utf-8')
    print('model', asset, flush=True)
    return {'id': asset, 'kind': 'model', 'author': info.get('authors'), 'source': 'https://polyhaven.com/a/' + asset, 'license': 'CC0-1.0', 'resolution': '1k', 'runtime': str((dest / 'model.gltf').relative_to(ROOT)).replace('\\', '/')}

def material(asset):
    info = metadata(asset, 'info')
    files = metadata(asset, 'files')
    for kind, filename in [('Diffuse', 'color'), ('nor_gl', 'normal'), ('arm', 'arm')]:
        entry = files[kind]['2k']['jpg']
        source = SOURCE / asset / (filename + '.jpg')
        download(entry, source)
        encode(source, RUNTIME / asset / (filename + '.webp'))
    print('material', asset, flush=True)
    return {'id': asset, 'kind': 'material', 'author': info.get('authors'), 'source': 'https://polyhaven.com/a/' + asset, 'license': 'CC0-1.0', 'resolution': '2k', 'runtime': str((RUNTIME / asset).relative_to(ROOT)).replace('\\', '/')}

def environment(asset):
    info = metadata(asset, 'info')
    entry = metadata(asset, 'files')['hdri']['1k']['hdr']
    source = SOURCE / asset / 'night.hdr'
    download(entry, source)
    RUNTIME.mkdir(parents=True, exist_ok=True)
    (RUNTIME / 'night.hdr').write_bytes(source.read_bytes())
    print('environment', asset, flush=True)
    return {'id': asset, 'kind': 'environment', 'author': info.get('authors'), 'source': 'https://polyhaven.com/a/' + asset, 'license': 'CC0-1.0', 'resolution': '1k', 'runtime': 'public/assets/dream/realism/night.hdr'}

if __name__ == '__main__':
    jobs = [(model, asset) for asset in MODELS] + [(material, asset) for asset in MATERIALS] + [(environment, 'moonless_golf')]
    with ThreadPoolExecutor(max_workers=4) as pool:
        manifest = list(pool.map(lambda job: job[0](job[1]), jobs))
    (ROOT / 'docs' / 'dream-public-assets.json').write_text(json.dumps({'provider': 'Poly Haven', 'license': 'https://polyhaven.com/license', 'downloaded': '2026-10-31', 'assets': manifest}, indent=2), encoding='utf-8')
    print('runtime bytes', sum(p.stat().st_size for p in RUNTIME.rglob('*') if p.is_file()))
