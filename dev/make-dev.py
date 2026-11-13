#!/usr/bin/env python3
"""Generate the HomeLove test entry from index.html."""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
page = (root / "index.html").read_text(encoding="utf-8")
for original, replacement in (
    ("<title>", "<title>[DEV] "),
    ("<body>", '<body data-mode="test">'),
    ("</body>", '<script src="dev/panel.js"></script>\n</body>'),
):
    if page.count(original) != 1:
        raise ValueError(f"Expected one {original} in index.html")
    page = page.replace(original, replacement, 1)

(root / "dev.html").write_text(page, encoding="utf-8")
print("wrote", root / "dev.html")
