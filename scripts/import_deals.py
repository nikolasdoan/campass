#!/usr/bin/env python3
"""Build data/deals.json and seed/deals.sql from all deal sources.

Usage: python3 scripts/import_deals.py [data/ntu-partners.xlsx]

Sources:
  - The NTU Finance Office partner spreadsheet (data/ntu-partners.xlsx)
  - Every data/sources/*.json file (records in the same shape as deals.json,
    produced by research; each must carry source_org and source_url)

Each sheet is one category. Rows with the same merchant appearing in several
lodging regions are merged into one deal with multiple regions. Eligibility
(student / staff / alumni / family) is inferred from the text and can be
corrected in OVERRIDES below.
"""
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parent.parent
FINANCE_URL = "https://homepage.ntu.edu.tw/~ntufinance/benefit.html"
RETRIEVED_ON = "2026-10-15"
CATEGORIES = {"food", "lodging", "transport", "shopping", "services", "entertainment", "health", "education"}

SHEETS = {
    "住旅(北)": ("lodging", "north"),
    "住旅(中)": ("lodging", "central"),
    "住旅(南)": ("lodging", "south"),
    "住旅(東)": ("lodging", "east"),
    "住旅(交通)": ("transport", None),
    "美食": ("food", None),
    "購物": ("shopping", None),
    "便利生活": ("services", None),
}

# Same merchant listed under slightly different names across sheets.
ALIASES = {
    "福容大飯店全台連鎖": "福容大飯店全台分館",
    "台北旅店集團(喜瑞飯店、丹迪旅店、新驛旅店)": "台北旅店集團-喜瑞飯店、丹迪旅店、新驛旅店)",
}

# Manual corrections, keyed by merchant name (first line, prefix match).
# Eligibility keys: student, staff, alumni, family -> True / False.
# Display keys: name, subtitle, highlight.
OVERRIDES = {
    "台灣高鐵": {"student": True, "alumni": False, "highlight": "企業會員"},
    "旅居文旅集團": {"highlight": "專屬優惠價"},
    "頭城農場-頭城休閒旅館": {"student": False, "alumni": False, "highlight": "6折"},
    "富邦人壽保險股份有限公司": {"student": False, "alumni": False, "family": False, "highlight": "保費折扣"},
    "台灣大哥大": {"student": False, "alumni": False, "highlight": "專案優惠"},
    "新北市私立": {"name": "永和耕莘托嬰中心", "subtitle": "新北市私立", "student": True, "alumni": False, "family": False},
    "高雄萬豪酒店": {"student": False, "alumni": False, "family": False},
    "兄弟大飯店": {"student": True, "alumni": False, "family": False},
    "于記杏仁": {"student": False, "alumni": False},
    "樂田麵包屋": {"student": False, "alumni": False},
    "東森得易購股份有限公司": {"student": False, "alumni": False},
    "FedEx聯邦快遞": {"student": False, "alumni": False, "family": False},
    "東元電機股份有限公司": {"student": False, "alumni": False},
    "foodpanda": {"student": False, "alumni": False},
    "長榮航空": {"student": True, "alumni": True},
    "山富旅遊": {"student": True, "alumni": False},
    "臺大徐州路文教會館": {"student": True, "alumni": True, "highlight": "專屬房價"},
    "臺大癌醫美食街": {"student": True, "alumni": False},
}

# Deals that only appear as free text on the short-term sheet.
EXTRA_DEALS = [
    {
        "name": "美國聯合航空",
        "subtitle": "United Airlines",
        "category": "transport",
        "regions": [],
        "offer": "由臺灣出發至美洲（美國、加拿大、中/南美洲 (古巴除外)、墨西哥）之聯合航空/全日空航線，享有票價5%折扣。\n請透過指定服務旅行社訂票 https://reurl.cc/6dn5OV\n\n開票日116/04/30前（出發日116/10/31前），本校教職員工、學生敬請多加利用！（管理單位：臺大國際處）",
        "info": "",
        "expires_on": "2027-04-30",
        "auto_renew": False,
        "notes": "短期優惠",
        "highlight": "95折",
        "eligibility": {"student": True, "staff": True, "alumni": False, "family": False},
    }
]

URL_RE = re.compile(r"https?://[^\s，、）)」>]+")
DISCOUNT_RE = re.compile(r"(\d{1,2}(?:\.\d)?)\s*折(起)?")


def clean(s):
    return (s or "").replace("\r", "").strip() if isinstance(s, str) else ("" if s is None else str(s))


def split_name(raw):
    lines = [l.strip() for l in clean(raw).split("\n") if l.strip()]
    name = lines[0]
    subtitle = " ".join(lines[1:]).lstrip("-").strip()
    if subtitle.endswith(")") and "(" not in subtitle:
        subtitle = subtitle[:-1]
    return name, subtitle


def field(info, *labels):
    for label in labels:
        m = re.search(rf"{label}\s*[：:]\s*(.+)", info)
        if m:
            v = m.group(1).strip()
            if v and "詳見官網" not in v:
                return v
    return ""


def offer_from_info(info):
    m = re.search(r"優惠內容\s*[：:]\s*(.*?)(?=\n\s*(?:網站|營業時間|營業項目)\s*[：:]|\Z)", info, re.S)
    return m.group(1).strip() if m else ""


def is_only_urls(s):
    return bool(s) and not URL_RE.sub("", s).strip()


def highlight(text, category):
    m = DISCOUNT_RE.search(text)
    if m:
        return f"{m.group(1)}折{'起' if m.group(2) else ''}"
    m = re.search(r"折價新台幣\s*(\d+)\s*元", text)
    if m:
        return f"折 ${m.group(1)}"
    m = re.search(r"(\d+)%\s*折扣", text)
    if m:
        return f"{100 - int(m.group(1))}折"
    if "優惠價" in text or "合約" in text:
        return "專屬優惠價"
    if "企業會員" in text:
        return "企業會員"
    return "特約優惠"


def eligibility(text, note):
    t = text + "\n" + note
    # A plain "臺大識別證/證件" requirement also covers student ID cards.
    student = bool(re.search(r"教職員工生|學生|臺(灣)?大(學)?識別|臺大證件|NTU 身分", t))
    alumni = "校友" in t and not re.search(r"校友[^。\n]*不適用|不含[^。\n]*校友", t)
    family = bool(re.search(r"眷屬證適用|眷屬適用|含眷屬|及眷屬|校友及眷屬", t)) and "眷屬不適用" not in t
    if re.search(r"學生[^。\n]*不適用", t):
        student = False
    return {"student": student, "staff": True, "alumni": alumni, "family": family}


def expiry(v):
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d"), False
    s = clean(v)
    if "自動續約" in s:
        return None, True
    return None, False


def links_from(*texts):
    out, seen = [], set()
    for t in texts:
        for url in URL_RE.findall(t or ""):
            url = url.rstrip(".。")
            if url in seen:
                continue
            seen.add(url)
            if "drive.google.com" in url:
                label = "優惠說明文件"
            elif "forms.gle" in url:
                label = "申請表單"
            else:
                label = re.sub(r"^https?://(www\.)?", "", url).split("/")[0]
            out.append({"label": label, "url": url})
    return out


def deal_id(key):
    return hashlib.sha1(key.encode()).hexdigest()[:10]


def main(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    deals = {}
    order = 0
    for sheet, (category, region) in SHEETS.items():
        ws = wb[sheet]
        started = False
        for row in ws.iter_rows(values_only=True):
            if not row or not row[0]:
                continue
            if clean(row[0]) == "商家名稱":
                started = True
                continue
            if not started:
                continue
            cells = list(row) + [None] * 6
            raw_name, info_raw, link_raw, exp_raw, note_raw = cells[:5]
            name, subtitle = split_name(raw_name)
            key = re.sub(r"\s+", "", clean(raw_name))
            key = ALIASES.get(key, key)
            if key in deals:
                if region and region not in deals[key]["regions"]:
                    deals[key]["regions"].append(region)
                continue

            info = clean(info_raw)
            link_text = clean(link_raw)
            note = clean(note_raw)
            if note in ("N/A",):
                note = ""
            info_offer = offer_from_info(info)
            if is_only_urls(link_text) or not link_text:
                offer = info_offer or info
            else:
                offer = f"{info_offer}\n\n{link_text}".strip() if info_offer else link_text

            exp, auto = expiry(exp_raw)
            elig = eligibility(offer + "\n" + info, note)
            fixes = next((v for k, v in OVERRIDES.items() if name.startswith(k)), {})
            elig.update({k: v for k, v in fixes.items() if k in elig})

            order += 1
            deals[key] = {
                "id": deal_id(key),
                "name": name,
                "subtitle": subtitle,
                "category": category,
                "regions": [region] if region else [],
                "highlight": highlight(offer, category),
                "offer": offer,
                "info": info,
                "phone": field(info, "電話", "訂房專線", "聯絡電話", "客服電話", "客服專線"),
                "address": field(info, "地址", "門市地址"),
                "links": links_from(link_text, info, offer, note),
                "expires_on": exp,
                "auto_renew": auto,
                "notes": note if not note.startswith("申請書連結") else "",
                "eligibility": elig,
                "schools": ["NTU"],
                "source_level": "school",
                "source_org": "臺大財務管理處",
                "source_url": FINANCE_URL,
                "retrieved_on": RETRIEVED_ON,
                "sort_order": order,
            }
            for k in ("name", "subtitle", "highlight"):
                if k in fixes:
                    deals[key][k] = fixes[k]

    for extra in EXTRA_DEALS:
        order += 1
        d = {
            "id": deal_id(extra["name"]),
            "phone": "",
            "address": "",
            "links": links_from(extra["offer"]),
            "schools": ["NTU"],
            "source_level": "school",
            "source_org": "臺大財務管理處（短期優惠）",
            "source_url": FINANCE_URL,
            "retrieved_on": RETRIEVED_ON,
            "sort_order": order,
            **extra,
        }
        deals[extra["name"]] = d

    for src in sorted((ROOT / "data/sources").glob("*.json")):
        for rec in json.loads(src.read_text()):
            if not rec.get("source_url") or rec.get("category") not in CATEGORIES:
                print(f"skip {src.name}: {rec.get('name')} (missing source_url or bad category)")
                continue
            key = f"{rec.get('source_org', '')}|{rec['name']}|{rec.get('subtitle', '')}"
            if key in deals:
                continue
            order += 1
            elig = {"student": True, "staff": False, "alumni": False, "family": False}
            elig.update(rec.get("eligibility") or {})
            deals[key] = {
                "id": deal_id(key),
                "name": rec["name"].strip(),
                "subtitle": (rec.get("subtitle") or "").strip(),
                "category": rec["category"],
                "regions": rec.get("regions") or [],
                "highlight": rec.get("highlight") or highlight(rec.get("offer", ""), rec["category"]),
                "offer": rec.get("offer", ""),
                "info": rec.get("info", ""),
                "phone": rec.get("phone", ""),
                "address": rec.get("address", ""),
                "links": rec.get("links") or [],
                "expires_on": rec.get("expires_on"),
                "auto_renew": bool(rec.get("auto_renew")),
                "notes": rec.get("notes", ""),
                "eligibility": elig,
                "schools": rec.get("schools") or ["NTU"],
                "source_level": rec.get("source_level") or "student_org",
                "source_org": rec.get("source_org", ""),
                "source_url": rec["source_url"],
                "retrieved_on": rec.get("retrieved_on") or RETRIEVED_ON,
                "sort_order": order,
            }

    result = sorted(deals.values(), key=lambda d: d["sort_order"])
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data/deals.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    write_sql(result)
    print(f"Imported {len(result)} deals")


def sql(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "1" if v else "0"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def write_sql(deals):
    cols = ["id", "name", "subtitle", "category", "regions", "highlight", "offer", "info", "phone",
            "address", "links", "expires_on", "auto_renew", "notes", "eligibility", "schools", "source_level",
            "source_org", "source_url", "retrieved_on", "sort_order"]
    lines = ["-- Generated by scripts/import_deals.py. Do not edit by hand.", "DELETE FROM deals;"]
    for d in deals:
        row = dict(d)
        row["regions"] = ",".join(d["regions"])
        row["schools"] = ",".join(d["schools"])
        row["links"] = json.dumps(d["links"], ensure_ascii=False)
        row["eligibility"] = json.dumps(d["eligibility"])
        vals = ", ".join(sql(row[c]) for c in cols)
        lines.append(f"INSERT INTO deals ({', '.join(cols)}) VALUES ({vals});")
    (ROOT / "seed").mkdir(exist_ok=True)
    (ROOT / "seed/deals.sql").write_text("\n".join(lines) + "\n")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ROOT / "data/ntu-partners.xlsx")
