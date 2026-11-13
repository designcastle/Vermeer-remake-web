#!/usr/bin/env python3
"""Fetch the few catalog paintings still missing a real Public Domain image (single batched Wikipedia query)."""
import json, os, ssl, urllib.parse, urllib.request

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "paintings")
CTX = ssl.create_default_context()
HEADERS = {"User-Agent": "VermeerRemakeWeb/3.0 (educational FOSS game; mailto:wilwoj@gmail.com)"}

MISSING = {
    22: "Le Chapeau de Paille",
    23: "A View of Het Steen in the Early Morning",
    29: "The Four Holy Men",
    32: "Cupid complaining to Venus",
    33: "Judith with the Head of Holofernes (Cranach the Elder)",
    36: "The Judgement of Paris (Cranach, Basel)",
}

def main():
    titles = "|".join(MISSING.values())
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "titles": titles, "redirects": "1", "prop": "pageimages",
        "piprop": "thumbnail", "pithumbsize": "330", "format": "json"})
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=20, context=CTX) as r:
        q = json.loads(r.read().decode()).get("query", {})
    norm = {n["from"]: n["to"] for n in q.get("normalized", [])}
    redir = {n["from"]: n["to"] for n in q.get("redirects", [])}
    thumbs = {p.get("title"): p.get("thumbnail", {}).get("source") for p in q.get("pages", {}).values()}
    got = 0
    for idx, title in MISSING.items():
        t = redir.get(norm.get(title, title), norm.get(title, title))
        src = thumbs.get(t)
        if not src:
            print(f"no image for {idx}: {title}")
            continue
        with urllib.request.urlopen(urllib.request.Request(src, headers=HEADERS), timeout=20, context=CTX) as ir:
            with open(os.path.join(OUT, f"art_{idx:02d}.jpg"), "wb") as f:
                f.write(ir.read())
        png = os.path.join(OUT, f"art_{idx:02d}.png")
        if os.path.exists(png):
            os.remove(png)
        got += 1
    print(f"fetched {got}/{len(MISSING)}")

if __name__ == "__main__":
    main()

