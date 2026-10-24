#!/usr/bin/env python3
"""Regenerate data/districts.json (商圈 outlines) from a tecxmate/bizmap checkout.

    python3 -I scripts/build_districts.py /path/to/bizmap [--out data/districts.json]

Reads only bizmap's built pages under dist/ (nothing is fetched):

  * every city page (citywide.html = 臺北市, newtaipei.html = 新北市, ...) inlines its 商圈
    outlines as `"areas":[{"n": name, "poly": [[x, y], ...], ...}]`;
  * each published 商圈 page (dist/<name>.html) carries `meta.local` (its centre) and
    `meta.radius` in metres.

Coordinates there are TWD97 TM2 metres (EPSG:3826) stored as offsets from bizmap's fixed
national origin, (247334, 2652321) — 臺灣地理中心碑 in Puli. We add the origin back and apply
the inverse TM2 projection (GRS80, central meridian 121°E, k0 0.9999, false easting 250000).

Only the name, city, centre, radius and outline are written. bizmap's per-商圈 business
counts are left out, and so is everything about how it built the outlines. The national
inventory's 理事長姓名 column never reaches bizmap's pages and is never read here.

Owner-approved reuse: tecxmate/bizmap is proprietary, and its founder cleared this data for
CampusPass. The underlying 商圈 list is 經濟部商業發展署's 全國商圈盤點清冊
(data.gov.tw/dataset/103804, 政府資料開放授權條款).
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import json
import math
import pathlib
import re
import sys

NATIONAL_ORIGIN = (247_334, 2_652_321)  # bizmap pipeline/geo.py

# TWD97 TM2 zone 121: GRS80 ellipsoid.
A = 6378137.0
F = 1 / 298.257222101
K0 = 0.9999
LON0 = math.radians(121)
FALSE_EAST = 250_000.0
E2 = F * (2 - F)
EP2 = E2 / (1 - E2)

CITY_SLUG = {'臺北市': 'tpe', '新北市': 'ntpc', '桃園市': 'tyn', '臺中市': 'txg', '臺南市': 'tnn',
             '高雄市': 'khh', '基隆市': 'kel', '新竹市': 'hsz', '新竹縣': 'hsq', '苗栗縣': 'mia',
             '彰化縣': 'cha', '雲林縣': 'yun', '嘉義縣': 'cyq', '屏東縣': 'pif', '花蓮縣': 'hua',
             '臺東縣': 'ttt', '澎湖縣': 'phe', '金門縣': 'kmn'}


def to_twd97(lat: float, lon: float) -> tuple[float, float]:
    """WGS84 -> TM2. Used only to prove the inverse below round-trips."""
    p, l = math.radians(lat), math.radians(lon)
    n = A / math.sqrt(1 - E2 * math.sin(p) ** 2)
    t, c, a_ = math.tan(p) ** 2, EP2 * math.cos(p) ** 2, (l - LON0) * math.cos(p)
    x = FALSE_EAST + K0 * n * (a_ + (1 - t + c) * a_ ** 3 / 6
                               + (5 - 18 * t + t * t + 72 * c - 58 * EP2) * a_ ** 5 / 120)
    y = K0 * (meridian_arc(p) + n * math.tan(p) * (
        a_ * a_ / 2 + (5 - t + 9 * c + 4 * c * c) * a_ ** 4 / 24
        + (61 - 58 * t + t * t + 600 * c - 330 * EP2) * a_ ** 6 / 720))
    return x, y


def meridian_arc(p: float) -> float:
    return A * ((1 - E2 / 4 - 3 * E2 ** 2 / 64 - 5 * E2 ** 3 / 256) * p
                - (3 * E2 / 8 + 3 * E2 ** 2 / 32 + 45 * E2 ** 3 / 1024) * math.sin(2 * p)
                + (15 * E2 ** 2 / 256 + 45 * E2 ** 3 / 1024) * math.sin(4 * p)
                - (35 * E2 ** 3 / 3072) * math.sin(6 * p))


def to_wgs84(x: float, y: float) -> tuple[float, float]:
    """TM2 metres -> (lat, lng) degrees. Snyder's inverse transverse Mercator (USGS PP 1395)."""
    m = y / K0
    mu = m / (A * (1 - E2 / 4 - 3 * E2 ** 2 / 64 - 5 * E2 ** 3 / 256))
    e1 = (1 - math.sqrt(1 - E2)) / (1 + math.sqrt(1 - E2))
    p1 = (mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * math.sin(2 * mu)
          + (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * math.sin(4 * mu)
          + (151 * e1 ** 3 / 96) * math.sin(6 * mu)
          + (1097 * e1 ** 4 / 512) * math.sin(8 * mu))
    c1 = EP2 * math.cos(p1) ** 2
    t1 = math.tan(p1) ** 2
    n1 = A / math.sqrt(1 - E2 * math.sin(p1) ** 2)
    r1 = A * (1 - E2) / (1 - E2 * math.sin(p1) ** 2) ** 1.5
    d = (x - FALSE_EAST) / (n1 * K0)
    lat = p1 - (n1 * math.tan(p1) / r1) * (
        d * d / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 * c1 - 9 * EP2) * d ** 4 / 24
        + (61 + 90 * t1 + 298 * c1 + 45 * t1 * t1 - 252 * EP2 - 3 * c1 * c1) * d ** 6 / 720)
    lon = LON0 + (d - (1 + 2 * t1 + c1) * d ** 3 / 6
                  + (5 - 2 * c1 + 28 * t1 - 3 * c1 * c1 + 8 * EP2 + 24 * t1 * t1) * d ** 5 / 120
                  ) / math.cos(p1)
    return math.degrees(lat), math.degrees(lon)


def latlng(offset: list[float]) -> list[float]:
    lat, lng = to_wgs84(offset[0] + NATIONAL_ORIGIN[0], offset[1] + NATIONAL_ORIGIN[1])
    return [round(lat, 6), round(lng, 6)]


def inline_arrays(html: str, key: str) -> list:
    """Every JSON value that follows `"key":` in an HTML page's inline payload."""
    dec = json.JSONDecoder()
    out = []
    for m in re.finditer(r'"%s":(?=[\[{])' % re.escape(key), html):
        value, _ = dec.raw_decode(html, m.end())
        out.append(value)
    return out


def page_meta(html: str) -> dict | None:
    for meta in inline_arrays(html, 'meta'):
        if isinstance(meta, dict) and meta.get('mode') == 'district':
            return meta
    return None


def slug(city: str, name: str) -> str:
    return f"{CITY_SLUG.get(city, 'tw')}-{hashlib.sha1(name.encode('utf-8')).hexdigest()[:8]}"


def centroid(poly: list[list[float]]) -> tuple[float, float]:
    """Area centroid of a simple polygon (falls back to the vertex mean when degenerate)."""
    a = cx = cy = 0.0
    for (x0, y0), (x1, y1) in zip(poly, poly[1:] + poly[:1]):
        cross = x0 * y1 - x1 * y0
        a += cross
        cx += (x0 + x1) * cross
        cy += (y0 + y1) * cross
    if abs(a) < 1e-9:
        return (sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly))
    return cx / (3 * a), cy / (3 * a)


def convex_hull(points: list) -> list:
    """Andrew's monotone chain, counter-clockwise."""
    pts = sorted({(float(x), float(y)) for x, y in points})
    if len(pts) < 3:
        return pts

    def half(seq: list) -> list:
        out: list = []
        for p in seq:
            while len(out) >= 2 and ((out[-1][0] - out[-2][0]) * (p[1] - out[-2][1])
                                     - (out[-1][1] - out[-2][1]) * (p[0] - out[-2][0])) <= 0:
                out.pop()
            out.append(p)
        return out

    return half(pts)[:-1] + half(pts[::-1])[:-1]


def outline_from_shape(shape: list, pad: float = 60) -> list:
    """A city-map style outline from a 商圈 page's exact shape (a polygon, or corridor paths):
    the convex hull, pushed `pad` metres out from its vertex mean so street frontages fall
    inside. Same reading bizmap's city map uses, so the two kinds of outline agree."""
    points = shape if shape and isinstance(shape[0][0], (int, float)) else [
        p for path in shape for p in path]
    hull = convex_hull(points)
    if len(hull) < 3:
        return [[round(x), round(y)] for x, y in hull]
    mx = sum(p[0] for p in hull) / len(hull)
    my = sum(p[1] for p in hull) / len(hull)
    grown = []
    for x, y in hull:
        d = math.hypot(x - mx, y - my) or 1
        grown.append([round(x + (x - mx) / d * pad), round(y + (y - my) / d * pad)])
    return grown


def page_shape(html: str) -> list | None:
    """The exact shape a 商圈 page draws: its top-level `"poly"` (the first one inline)."""
    for poly in inline_arrays(html, 'poly'):
        if poly:
            return poly
    return None


def build(bizmap: pathlib.Path) -> dict:
    dist = bizmap / 'dist'
    if not dist.is_dir():
        sys.exit(f'{dist} not found: pass the root of a built bizmap checkout')

    outlines: dict[tuple[str, str], list] = {}
    metas: dict[tuple[str, str], dict] = {}
    for page in sorted(dist.glob('*.html')):
        html = page.read_text(encoding='utf-8')
        meta = page_meta(html)
        if meta:
            metas[(meta['city'], meta['name'])] = {**meta, 'shape': page_shape(html)}
            continue
        areas = [a for a in inline_arrays(html, 'areas') if a]
        if not areas:
            continue
        city = re.search(r'"city":"([^"]+)"', html)
        if not city:
            sys.exit(f'{page.name}: 商圈 outlines but no city')
        for arr in areas:
            for area in arr:
                outlines[(city.group(1), area['n'])] = area['poly']

    districts = []
    for (city, name), poly in sorted(outlines.items()):
        meta = metas.get((city, name))
        if meta and meta.get('local'):
            cx, cy = meta['local']
            if meta.get('centre') and list(meta['centre']) != list(NATIONAL_ORIGIN):
                sys.exit(f'{name}: unexpected meta.centre {meta["centre"]}; origin changed?')
            radius = meta['radius']
            # The city page's outline and the 商圈's own page should describe one place. When
            # they don't (seen for five 新北市 商圈 whose city-map outline sits 10-30 km away,
            # in another district), the 商圈's own page is the one that matches the 商圈's
            # real location, so its exact shape is used to redraw the outline.
            mx, my = centroid(poly)
            if math.hypot(mx - cx, my - cy) > max(300, radius) and meta.get('shape'):
                print(f'  {city} {name}: city outline is {math.hypot(mx - cx, my - cy) / 1000:.1f}'
                      f' km from its page centre; redrawn from the page shape', file=sys.stderr)
                poly = outline_from_shape(meta['shape'])
                mx, my = centroid(poly)
                if math.hypot(mx - cx, my - cy) > max(300, radius):
                    sys.exit(f'{name}: page shape disagrees with page centre too')
        else:
            # A 商圈 too thin for its own page: centre and reach from the outline instead.
            cx, cy = centroid(poly)
            radius = max(math.hypot(x - cx, y - cy) for x, y in poly)
        districts.append({
            'id': slug(city, name),
            'name': name,
            'city': city,
            'centre': latlng([cx, cy]),
            'radius_m': round(radius),
            'polygon': [latlng(p) for p in poly],
        })
    ids = [d['id'] for d in districts]
    if len(set(ids)) != len(ids):
        sys.exit('duplicate district ids')
    return {
        'source': '全國商圈盤點清冊, 經濟部商業發展署 (https://data.gov.tw/dataset/103804); '
                  'outlines resolved from its 商圈範圍 text by tecxmate/bizmap. '
                  'Outlines are approximate (the source says 約為).',
        'licence': '政府資料開放授權條款 (商圈名冊) + geometry from tecxmate/bizmap (owner-approved)',
        'generated': datetime.date.today().isoformat(),
        'districts': districts,
    }


def self_check(out: dict) -> None:
    # Round trip: inverse(forward(p)) must return p to well under a metre.
    for lat, lng in [(25.0143, 121.5340), (22.6273, 120.3014), (23.9756, 120.9738)]:
        back = to_wgs84(*to_twd97(lat, lng))
        assert abs(back[0] - lat) < 1e-7 and abs(back[1] - lng) < 1e-7, (lat, lng, back)
    for d in out['districts']:
        lat, lng = d['centre']
        assert 21.8 < lat < 26.5 and 118 < lng < 122.1, d['name']
    gongguan = next(d for d in out['districts'] if d['name'] == '臺大公館商圈')
    lat, lng = gongguan['centre']
    assert abs(lat - 25.014) < 0.006 and abs(lng - 121.534) < 0.006, gongguan['centre']


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('bizmap', type=pathlib.Path, help='root of the tecxmate/bizmap checkout')
    ap.add_argument('--out', type=pathlib.Path,
                    default=pathlib.Path(__file__).resolve().parent.parent / 'data' / 'districts.json')
    args = ap.parse_args()
    out = build(args.bizmap)
    self_check(out)
    # One district per line: small diffs on regeneration without a line per coordinate.
    head = {k: v for k, v in out.items() if k != 'districts'}
    body = ',\n'.join('  ' + json.dumps(d, ensure_ascii=False, separators=(',', ':'))
                      for d in out['districts'])
    text = json.dumps(head, ensure_ascii=False, indent=1)[:-2]
    args.out.write_text(f'{text},\n "districts": [\n{body}\n ]\n}}\n', encoding='utf-8')
    by_city: dict[str, int] = {}
    for d in out['districts']:
        by_city[d['city']] = by_city.get(d['city'], 0) + 1
    print(f"{len(out['districts'])} 商圈 -> {args.out} ({', '.join(f'{c} {n}' for c, n in by_city.items())})")


if __name__ == '__main__':
    main()
