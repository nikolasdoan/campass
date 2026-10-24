#!/usr/bin/env python3
"""Place deals in 商圈: data/deal-districts.json, from deal addresses, offline.

    python3 -I scripts/place_deals.py TAIPEI_CSV NEWTAIPEI_CSV [--out data/deal-districts.json]

Each deal's private `address` is matched against the cities' own open house-number files
and the resulting point is tested against every outline in data/districts.json. Nothing is
sent anywhere: the address files are downloaded once, by hand, and read locally.

  臺北市門牌位置數值資料  https://data.gov.tw/dataset/155472 (臺北市政府, 政府資料開放授權條款)
    https://data.taipei/api/dataset/b7c8e724-1e98-45ee-a0bd-f3840623ed97/resource/ce76ca0c-7f94-4935-ab47-1d2a41ca2abb/download
  新北市門牌坐標資料      data.ntpc.gov.tw (新北市政府, 政府資料開放授權條款)
    https://data.ntpc.gov.tw/api/datasets/d7b568ab-3819-40c8-a6e7-a6b199443101/csv/file

Both are ~120 MB CSVs in TWD97 TM2 (EPSG:3826) and are NOT committed. Keep them outside
the repo (e.g. a scratch directory) and pass their paths.

PRIVACY: a deal's coordinates exist only in memory here. The output holds deal id -> 商圈
ids and aggregate counts, never a point; the repo is public, and a deal's public location
must stay no finer than its `area` plus the 商圈 name.

Matching, per address (after full-width -> ASCII, 台 -> 臺, 一段 -> 1段):
  exact     (區, road+段, 巷, 弄) and the house number are in the file
  near      same 區/road/巷/弄, nearest listed number (the number itself is missing)
  lane      巷/弄 not in the file: nearest number on the road to the 巷's own number,
            i.e. the lane's entrance (off by at most the lane's length)
Anything else (no 號, a landmark, a campus building, another city) stays unplaced.
"""
from __future__ import annotations

import argparse
import bisect
import collections
import csv
import datetime
import importlib.util
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

sys.dont_write_bytecode = True  # no scripts/__pycache__ from the import below
_spec = importlib.util.spec_from_file_location('build_districts', ROOT / 'scripts' / 'build_districts.py')
build_districts = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(build_districts)

# 內政部 鄉鎮市區代碼, as used by both cities' house-number files.
CODES = {
    '63000010': '松山區', '63000020': '信義區', '63000030': '大安區', '63000040': '中山區',
    '63000050': '中正區', '63000060': '大同區', '63000070': '萬華區', '63000080': '文山區',
    '63000090': '南港區', '63000100': '內湖區', '63000110': '士林區', '63000120': '北投區',
    '65000010': '板橋區', '65000020': '三重區', '65000030': '中和區', '65000040': '永和區',
    '65000050': '新莊區', '65000060': '新店區', '65000070': '樹林區', '65000080': '鶯歌區',
    '65000090': '三峽區', '65000100': '淡水區', '65000110': '汐止區', '65000120': '瑞芳區',
    '65000130': '土城區', '65000140': '蘆洲區', '65000150': '五股區', '65000160': '泰山區',
    '65000170': '林口區', '65000180': '深坑區', '65000190': '石碇區', '65000200': '坪林區',
    '65000210': '三芝區', '65000220': '石門區', '65000230': '八里區', '65000240': '平溪區',
    '65000250': '雙溪區', '65000260': '貢寮區', '65000270': '金山區', '65000280': '萬里區',
    '65000290': '烏來區',
}
CITY_BY_PREFIX = {'63000': '臺北市', '65000': '新北市'}
DISTRICTS = {city: {name for code, name in CODES.items() if code.startswith(prefix)}
             for prefix, city in CITY_BY_PREFIX.items()}

FULLWIDTH = str.maketrans({**{chr(0xFF10 + i): str(i) for i in range(10)},
                           '－': '-', '（': '(', '）': ')', '　': ' ', '台': '臺'})
NUMERALS = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}


def zh_number(s: str) -> int | None:
    """一 .. 九十九 -> int (enough for 段, 巷 and 弄)."""
    if s.isdigit():
        return int(s)
    if not s or any(ch not in NUMERALS for ch in s):
        return None
    if '十' not in s:
        return NUMERALS[s] if len(s) == 1 else None
    tens, _, ones = s.partition('十')
    return (NUMERALS[tens] if tens else 1) * 10 + (NUMERALS[ones] if ones else 0)


# Misspellings seen in deal addresses, folded to the house-number file's spelling.
TYPOS = {'褔': '福', '汀洲路': '汀州路'}


def norm(s: str) -> str:
    s = s.translate(FULLWIDTH).replace(' ', '')
    for wrong, right in TYPOS.items():
        s = s.replace(wrong, right)
    return re.sub(r'([一二三四五六七八九十]+)(段|號)', lambda m: f'{zh_number(m.group(1))}{m.group(2)}', s)


def num_of(s: str, unit: str) -> str:
    """'４６弄' -> '46'; a named lane ('正隆巷') stays as its name."""
    s = norm(s).removesuffix(unit)
    n = zh_number(s)
    return str(n) if n is not None else s


def load_index(paths: list[pathlib.Path]) -> dict:
    """(city, 區, road, 巷, 弄) -> sorted [(number, x, y)]."""
    index: dict[tuple, list] = collections.defaultdict(list)
    for path in paths:
        with open(path, encoding='utf-8-sig', newline='') as f:
            rows = csv.reader(f)
            next(rows)
            for row in rows:
                if len(row) < 11:
                    continue
                district = CODES.get(row[1])
                m = re.match(r'(\d+)', norm(row[8]))
                if not district or not m or not row[9] or not row[10]:
                    continue
                key = (CITY_BY_PREFIX[row[0][:5]], district, norm(row[4]),
                       num_of(row[6], '巷') if row[6] else '', num_of(row[7], '弄') if row[7] else '')
                index[key].append((int(m.group(1)), float(row[9]), float(row[10])))
    for key, points in index.items():
        index[key] = sorted(set(points))
    return index


ADDRESS = re.compile(
    r'^(?P<city>臺北市|新北市)?(?P<district>[^市縣\d]{1,3}區)?'
    r'(?:[^\d路街]{1,4}里)?(?:\d+鄰)?'
    r'(?P<road>[^\d巷弄號(:]+?(?:路|街|大道)(?:\d+段)?)'
    r'(?:(?P<lane>\d+)巷)?(?:(?P<alley>\d+)弄)?(?P<num>\d+)(?:[-之]\d+)?(?:、\d+)*號')
CITY = re.compile(r'臺北市|新北市|桃園[市縣]|臺中[市縣]|臺南[市縣]|高雄[市縣]|基隆市|新竹[市縣]|苗栗縣|'
                  r'彰化縣|南投縣|雲林縣|嘉義[市縣]|屏東縣|宜蘭縣|花蓮縣|臺東縣|澎湖縣|金門縣|連江縣')


def parse(address: str, area: str) -> list[tuple]:
    """Every 臺北市/新北市 address in the field, as (city, 區 or None, road, 巷, 弄, number).

    A chain lists its branches in one field (「永康店 …麗水街7巷1號；台大店 …」), so the field
    is split and each branch read on its own. A branch label before the address is dropped.
    """
    area = norm(area or '')
    parts = re.split(r'[；;|]', norm(address))
    out = []
    for part in parts:
        part = re.sub(r'(臺北市|新北市)\1', r'\1', part)
        found = CITY.search(part)
        if found:
            part = part[found.start():]
        else:
            part = re.sub(r'^[^:]*:', '', part)
            part = re.sub(r'^\d{3,6}', '', part)
        m = ADDRESS.match(part)
        if not m:
            continue
        if found and not m['city']:
            continue  # another city's address
        city = m['city'] or (area[:3] if area[:3] in ('臺北市', '新北市') else None)
        if not city:
            continue
        district = m['district']
        if not district and len(parts) == 1 and area[3:].endswith('區'):
            district = area[3:]  # the deal's `area` describes this, its only address
        # 「台北市新莊區…」: the 區 is unambiguous where the city is a slip.
        if district and district not in DISTRICTS[city]:
            other = next((c for c, ds in DISTRICTS.items() if district in ds), None)
            if not other:
                continue
            city = other
        out.append((city, district, m['road'], m['lane'] or '', m['alley'] or '', int(m['num'])))
    return out


def nearest(points: list, number: int) -> tuple[tuple, bool]:
    i = bisect.bisect_left(points, (number, float('-inf'), float('-inf')))
    if i < len(points) and points[i][0] == number:
        return points[i], True
    near = [p for p in points[max(0, i - 1):i + 1]]
    return min(near, key=lambda p: abs(p[0] - number)), False


def locate(index: dict, parsed: tuple) -> tuple[tuple | None, str]:
    city, district, road, lane, alley, number = parsed
    if district is None:
        # 「臺北市羅斯福路四段85號」 names no 區. Accept it only when exactly one 區 of the
        # city lists that exact house number on that road/巷/弄.
        hits = []
        for d in {k[1] for k in index if k[0] == city}:
            points = index.get((city, d, road, lane, alley))
            if points and nearest(points, number)[1]:
                hits.append(d)
        if len(hits) != 1:
            return None, 'no_district'
        district = hits[0]
    points = index.get((city, district, road, lane, alley))
    if points:
        p, exact = nearest(points, number)
        return p, 'exact' if exact else 'near'
    if lane.isdigit():
        points = index.get((city, district, road, '', ''))
        if points:
            return nearest(points, int(lane))[0], 'lane'
    return None, 'not_in_index'


TIERS = ['exact', 'near', 'lane', 'no_district', 'not_in_index']


def inside(lat: float, lng: float, poly: list) -> bool:
    hit = False
    j = len(poly) - 1
    for i in range(len(poly)):
        (yi, xi), (yj, xj) = poly[i], poly[j]
        if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            hit = not hit
        j = i
    return hit


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('addresses', nargs='+', type=pathlib.Path, help='house-number CSVs')
    ap.add_argument('--deals', type=pathlib.Path, default=ROOT / 'data' / 'deals.json')
    ap.add_argument('--districts', type=pathlib.Path, default=ROOT / 'data' / 'districts.json')
    ap.add_argument('--out', type=pathlib.Path, default=ROOT / 'data' / 'deal-districts.json')
    args = ap.parse_args()

    deals = json.loads(args.deals.read_text(encoding='utf-8'))
    districts = json.loads(args.districts.read_text(encoding='utf-8'))['districts']
    index = load_index(args.addresses)
    print(f'{len(index):,} address keys', file=sys.stderr)

    outcome = collections.Counter()
    per_district = collections.Counter()
    placed: dict[str, list[str]] = {}
    for deal in deals:
        address = (deal.get('address') or '').strip()
        if not address:
            outcome['no_address'] += 1
            continue
        if not re.search(r'[臺台]北市?|新北市', address + (deal.get('area') or '')):
            outcome['other_city'] += 1
            continue
        branches = parse(address, deal.get('area') or '')
        if not branches:
            outcome['unparsed'] += 1
            continue
        # A deal is counted once, by its best-placed branch; its 商圈 are the union over
        # branches. Points never leave this loop.
        hows, hits = [], []
        for parsed in branches:
            point, how = locate(index, parsed)
            hows.append(how)
            if not point:
                continue
            lat, lng = build_districts.to_wgs84(point[1], point[2])
            hits += [d for d in districts if d['city'] == parsed[0] and inside(lat, lng, d['polygon'])
                     and d not in hits]
        how = min(hows, key=TIERS.index)
        outcome[how] += 1
        if how not in ('exact', 'near', 'lane'):
            continue
        if hits:
            outcome[f'in_district_{how}'] += 1
            placed[deal['id']] = [d['id'] for d in hits]
            per_district.update(d['name'] for d in hits)
        else:
            outcome[f'outside_{how}'] += 1

    out = {
        'generated': datetime.date.today().isoformat(),
        'method': 'Offline: deal address -> 臺北市/新北市 open house-number files (TWD97) -> '
                  'point-in-polygon against data/districts.json. No coordinates are stored.',
        'counts': {
            'deals': len(deals),
            'outcomes': dict(sorted(outcome.items())),
            'deals_in_a_district': len(placed),
            'by_district': dict(per_district.most_common()),
        },
        'deals': dict(sorted(placed.items())),
    }
    args.out.write_text(json.dumps(out, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    print(json.dumps(out['counts'], ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
