"""Rebuild local OFL font subsets after adding Chinese text.

Optional authoring dependencies: python -m pip install fonttools brotli
The game itself does not require Python or a network connection.
"""
from pathlib import Path
from io import BytesIO
from urllib.request import urlopen
from fontTools import subset

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
text = "".join(p.read_text(encoding="utf-8") for p in (ROOT / "src").rglob("*") if p.is_file())
characters = "".join(sorted(set(text)))
for family, filename, destination in [
    ("mashanzheng", "MaShanZheng-Regular.ttf", "brush.woff2"),
    ("notoserifsc", "NotoSerifSC%5Bwght%5D.ttf", "serif.woff2"),
]:
    url = f"https://raw.githubusercontent.com/google/fonts/main/ofl/{family}/{filename}"
    options = subset.Options()
    options.flavor = "woff2"
    options.desubroutinize = True
    font = subset.load_font(BytesIO(urlopen(url, timeout=60).read()), options)
    selection = subset.Subsetter(options=options)
    selection.populate(text=characters)
    selection.subset(font)
    subset.save_font(font, str(ASSETS / destination), options)
    print(destination, (ASSETS / destination).stat().st_size, "bytes")
