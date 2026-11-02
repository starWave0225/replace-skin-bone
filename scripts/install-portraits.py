"""Copy selected imagegen outputs and encode runtime WebP without changing alpha."""
from pathlib import Path
from PIL import Image
import json
import shutil
import sys

ROOT = Path(__file__).resolve().parents[1]
manifest_path = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "docs/portraits/prompts.json")
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
for asset in manifest["assets"]:
    generated = Path(asset["generated_file"])
    original = ROOT / asset["source"]
    runtime = ROOT / asset["runtime"]
    original.parent.mkdir(parents=True, exist_ok=True)
    runtime.parent.mkdir(parents=True, exist_ok=True)
    if not original.exists():
        shutil.copy2(generated, original)
    image = Image.open(original)
    assert image.mode == "RGBA", f"{asset['id']} has no alpha"
    assert image.getchannel("A").getextrema()[0] == 0, f"{asset['id']} is not transparent"
    image.save(runtime, format="WEBP", quality=91, method=6, exact=True)
    encoded = Image.open(runtime)
    assert encoded.size == image.size
    assert encoded.getchannel("A").tobytes() == image.getchannel("A").tobytes(), "alpha must remain exact"
    print(asset["id"], image.size, "alpha", image.getchannel("A").getextrema(), runtime.stat().st_size)
