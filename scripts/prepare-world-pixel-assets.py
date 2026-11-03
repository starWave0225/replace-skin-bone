"""Restore the exact public pixel-art subset from the archived PNGs; no network required."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify-only', action='store_true')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'docs/world-pixel-assets.json').read_text())
    total = 0
    for asset in manifest['assets']:
        source = ROOT / asset['source']
        runtime = ROOT / asset['runtime']
        data = source.read_bytes()
        assert hashlib.sha256(data).hexdigest() == asset['sha256'], source
        assert data[:8] == b'\x89PNG\r\n\x1a\n', source
        assert struct.unpack('>II', data[16:24]) == (asset['width'], asset['height']), source
        if not args.verify_only:
            runtime.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, runtime)
        assert runtime.read_bytes() == data, runtime
        total += len(data)
    print(f"Verified {len(manifest['assets'])} CC0 pixel sheets, {total} bytes")


if __name__ == '__main__':
    main()
