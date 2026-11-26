#!/usr/bin/env python3
"""Build the TapTap H5 package: only the files the game loads, in one zip.

    python3 scripts/build-taptap.py                  # dist/taptap/homelove-h5-V1.0.0.zip
    python3 scripts/build-taptap.py --version 1.0.1

TapTap wants one ASCII-named folder at the zip root with index.html directly inside
it. The package holds index.html, the scripts and language packs it loads, style.css,
the fonts style.css points at and their OFL licence files. README images, docs, the
test page (dev.html), tests and scripts stay out. The build fails if any file points
at the network, so the package runs with no connection at all.
"""
import argparse, json, re, shutil, sys, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FOLDER = 'homelove'
LIMIT = 20 * 1024 * 1024


def local_refs(html):
    """Scripts and stylesheets index.html loads, without their ?v= cache keys."""
    refs = re.findall(r'<(?:script[^>]*\bsrc|link[^>]*\bhref)="([^"]+)"', html)
    return [r.split('?')[0] for r in refs]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--version', default='1.0.0')
    args = ap.parse_args()
    if not re.fullmatch(r'\d+\.\d+\.\d+', args.version):
        sys.exit('version must look like 1.0.0')

    out_dir = ROOT / 'dist/taptap'
    stage = out_dir / FOLDER
    shutil.rmtree(stage, ignore_errors=True)
    stage.mkdir(parents=True)

    html = (ROOT / 'index.html').read_text('utf8')
    refs = local_refs(html)
    remote = [r for r in refs if re.match(r'[a-z]+:|//', r)]
    if remote:
        sys.exit('index.html loads from the network: ' + ', '.join(remote))
    files = ['index.html', *refs]
    for css in [f for f in refs if f.endswith('.css')]:
        for url in re.findall(r'url\(\s*["\']?([^"\')]+)', (ROOT / css).read_text('utf8')):
            if re.match(r'[a-z]+:|//', url):
                sys.exit(f'{css} loads from the network: {url}')
            files.append((Path(css).parent / url.split('?')[0]).as_posix())
    files += sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / 'fonts').glob('*-OFL.txt'))
    files = list(dict.fromkeys(files))
    missing = [f for f in files if not (ROOT / f).is_file()]
    if missing:
        sys.exit('index.html loads missing files: ' + ', '.join(missing))
    for name in files:
        target = stage / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / name, target)
    (stage / 'version.json').write_text(json.dumps({'version': args.version}) + '\n', 'utf8')

    # Nothing in the package may reach the network: no font server, no CDN, no fetch.
    online = []
    for name in files:
        if not name.endswith(('.html', '.js', '.css')):
            continue
        body = (stage / name).read_text('utf8')
        for pattern in (r'https?://[^\s"\')]+', r'\bfetch\(', r'XMLHttpRequest', r'sendBeacon', r'\bimport\(', r'new WebSocket'):
            online += [f'{name}: {m}' for m in re.findall(pattern, body)]
    if online:
        sys.exit('network references in the package:\n' + '\n'.join(sorted(set(online))))

    zip_path = out_dir / f'{FOLDER}-h5-V{args.version}.zip'
    zip_path.unlink(missing_ok=True)
    packed = sorted(p for p in stage.rglob('*') if p.is_file())
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p in packed:
            z.write(p, p.relative_to(out_dir).as_posix())

    with zipfile.ZipFile(zip_path) as z:
        tops = {n.split('/')[0] for n in z.namelist()}
        assert tops == {FOLDER} and f'{FOLDER}/index.html' in z.namelist(), tops

    unpacked = sum(p.stat().st_size for p in packed)
    kb = lambda n: f'{n / 1024:.0f}KB'
    print(f'TapTap H5 V{args.version}  ->  {zip_path.relative_to(ROOT)}')
    for p in packed:
        print(f'  {p.relative_to(stage).as_posix():<32}{kb(p.stat().st_size):>8}')
    print(f'  {len(packed)} files, unpacked {kb(unpacked)}, zip {kb(zip_path.stat().st_size)}')
    if zip_path.stat().st_size > LIMIT:
        sys.exit('package is over 20MB')


if __name__ == '__main__':
    main()
