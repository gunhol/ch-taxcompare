"""Join swisstopo-derived 2026 geometries to the official BFS commune directory.

Run from the repository root with the internal Python runtime. The generated
TopoJSON is a static browser asset; no runtime service is required.
"""
from __future__ import annotations

import json
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / ".impeccable/mocks/decision/assets"
OUT = ROOT / "app/public/data"
OUT.mkdir(parents=True, exist_ok=True)

CANTONS = {
    1: ("ZH", "Zürich"), 2: ("BE", "Bern"), 3: ("LU", "Luzern"),
    4: ("UR", "Uri"), 5: ("SZ", "Schwyz"), 6: ("OW", "Obwalden"),
    7: ("NW", "Nidwalden"), 8: ("GL", "Glarus"), 9: ("ZG", "Zug"),
    10: ("FR", "Fribourg"), 11: ("SO", "Solothurn"),
    12: ("BS", "Basel-Stadt"), 13: ("BL", "Basel-Landschaft"),
    14: ("SH", "Schaffhausen"), 15: ("AR", "Appenzell Ausserrhoden"),
    16: ("AI", "Appenzell Innerrhoden"), 17: ("SG", "St. Gallen"),
    18: ("GR", "Graubünden"), 19: ("AG", "Aargau"), 20: ("TG", "Thurgau"),
    21: ("TI", "Ticino"), 22: ("VD", "Vaud"), 23: ("VS", "Valais"),
    24: ("NE", "Neuchâtel"), 25: ("GE", "Genève"), 26: ("JU", "Jura"),
}


def read_bfs(path: Path) -> dict[int, dict[str, str | int | bool]]:
    soup = BeautifulSoup(path.read_text(), "html.parser")
    records: dict[int, dict[str, str | int | bool]] = {}
    for row in soup.select("tbody tr"):
        cells = [cell.get_text(" ", strip=True) for cell in row.select("td")]
        if len(cells) < 8 or cells[7]:
            continue
        bfs_id = int(cells[4])
        records[bfs_id] = {
            "name": cells[5], "canton": cells[1], "district": cells[3],
            "special": bfs_id in {2391, 5391, 5394},
        }
    return records


records = read_bfs(ROOT / ".impeccable/map-tools/bfs-results.html")
for bfs_id, record in read_bfs(ROOT / ".impeccable/map-tools/bfs-results-all.html").items():
    records.setdefault(bfs_id, record)

dbf = {row["id"]: row for row in json.loads((ROOT / ".impeccable/map-tools/municipality-names.json").read_text())}
topo = json.loads((ASSETS / "ch-2026.json").read_text())
canton_by_abbr = {abbr: number for number, (abbr, _) in CANTONS.items()}

for feature in topo["objects"]["municipalities"]["geometries"]:
    bfs_id = int(feature["id"])
    if bfs_id not in records:
        raise RuntimeError(f"Missing official BFS record for {bfs_id}")
    record = records[bfs_id]
    canton_number = dbf[bfs_id]["KTNR"]
    expected_abbr = CANTONS[canton_number][0]
    if record["canton"] != expected_abbr:
        raise RuntimeError(f"Canton mismatch for {bfs_id}: {record['canton']} != {expected_abbr}")
    feature["properties"] = {
        **record,
        "bfsId": bfs_id,
        "cantonNumber": canton_number,
        "cantonName": CANTONS[canton_number][1],
    }

for feature in topo["objects"]["cantons"]["geometries"]:
    number = int(feature["id"])
    abbr, name = CANTONS[number]
    feature["properties"] = {"number": number, "abbr": abbr, "name": name}

(OUT / "ch-2026.json").write_text(json.dumps(topo, ensure_ascii=False, separators=(",", ":")))
(OUT / "metadata.json").write_text(json.dumps({
    "geographyYear": 2026,
    "areas": len(topo["objects"]["municipalities"]["geometries"]),
    "politicalMunicipalities": 2110,
    "specialAreas": 3,
    "cantons": 26,
    "geometrySource": "https://unpkg.com/swiss-maps@4.7.0/2026/ch-combined.json",
    "namesSource": "https://www.agvchapp.bfs.admin.ch/de/communes/query",
    "valueMode": "synthetic",
}, indent=2) + "\n")

print(f"Wrote {len(records)} named areas across {len(CANTONS)} cantons to {OUT}")
