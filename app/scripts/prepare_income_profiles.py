#!/usr/bin/env python3
"""Generate compact, validated ESTV 2026 gross-income tax profiles."""

from __future__ import annotations

import argparse
import json
import math
import os
import tempfile
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any

APP_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = APP_ROOT / "public" / "data"
OUTPUT_DIR = DATA_DIR / "income-profiles"
GEOGRAPHY_PATH = DATA_DIR / "ch-2026.json"
METADATA_PATH = DATA_DIR / "metadata.json"
API_URL = (
    "https://swisstaxcalculator.estv.admin.ch/delegate/ost-integration/"
    "v1/maps/income-tax-values/EN"
)
YEAR = 2026
MODELS = {
    "single": 1,
    "singleWithChildren": 3,
    "marriedSingleNoChildren": 5,
    "marriedSingleWithChildren": 7,
    "marriedDualNoChildren": 13,
    "marriedDualWithChildren": 15,
}
CHURCHES = {
    "protestant": 1,
    "romanCatholic": 2,
    "christianCatholic": 3,
    "none": 4,
}
INCOMES = [
    15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000,
    60000, 70000, 80000, 90000, 100000, 125000, 150000, 175000,
    200000, 250000, 300000, 400000, 500000, 750000, 1000000,
    5000000, 10000000, 50000000, 100000000,
]
COMPONENTS = ("cantonalTax", "municipalityTax", "churchTax")


def political_bfs_ids() -> set[int]:
    topology = json.loads(GEOGRAPHY_PATH.read_text(encoding="utf-8"))
    return {
        int(item["properties"]["bfsId"])
        for item in topology["objects"]["municipalities"]["geometries"]
        if not item["properties"].get("special", False)
    }


def parse_payload(
    payload: dict[str, Any],
    household: str,
    church: str,
    expected_ids: set[int],
) -> dict[str, Any]:
    rows = payload.get("data")
    if not isinstance(rows, list):
        raise ValueError("ESTV response has no data list")

    income_indexes = {income: index for index, income in enumerate(INCOMES)}
    rates: dict[str, list[list[float] | None]] = {
        str(bfs_id): [None] * len(INCOMES) for bfs_id in expected_ids
    }
    seen: set[tuple[int, int]] = set()

    for row in rows:
        try:
            bfs_id = int(row["bfsId"])
            income = int(row["income"])
        except (KeyError, TypeError, ValueError) as error:
            raise ValueError("ESTV row has an invalid BFS identifier or income") from error
        if bfs_id not in expected_ids:
            raise ValueError(f"Unexpected BFS identifier: {bfs_id}")
        if income not in income_indexes:
            raise ValueError(f"Unexpected income for BFS {bfs_id}: {income}")
        key = (bfs_id, income)
        if key in seen:
            raise ValueError(f"Duplicate ESTV row for BFS {bfs_id} at CHF {income}")
        seen.add(key)

        values: list[float] = []
        for component in COMPONENTS:
            series = row.get(component)
            if not isinstance(series, list) or len(series) != 1:
                raise ValueError(
                    f"Invalid {component} series for BFS {bfs_id} at CHF {income}"
                )
            value = series[0]
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise ValueError(f"Non-numeric {component} for BFS {bfs_id}")
            if not math.isfinite(value) or value < 0:
                raise ValueError(f"Invalid {component} value for BFS {bfs_id}: {value}")
            values.append(value)
        rates[str(bfs_id)][income_indexes[income]] = values

    missing = [
        (bfs_id, INCOMES[index])
        for bfs_id, series in rates.items()
        for index, values in enumerate(series)
        if values is None
    ]
    if missing:
        bfs_id, income = missing[0]
        raise ValueError(
            f"Missing {len(missing)} ESTV values; first is BFS {bfs_id} at CHF {income}"
        )

    dataset = {
        "year": YEAR,
        "household": household,
        "church": church,
        "incomes": INCOMES,
        "rates": rates,
    }
    validate_dataset(dataset, household, church, expected_ids)
    return dataset


def validate_dataset(
    dataset: Any,
    household: str,
    church: str,
    expected_ids: set[int],
) -> None:
    if not isinstance(dataset, dict):
        raise ValueError("Profile is not an object")
    if dataset.get("year") != YEAR:
        raise ValueError("Profile has the wrong tax year")
    if dataset.get("household") != household or dataset.get("church") != church:
        raise ValueError("Profile household or church does not match its filename")
    if dataset.get("incomes") != INCOMES:
        raise ValueError("Profile income brackets are incomplete or out of order")
    rates = dataset.get("rates")
    if not isinstance(rates, dict) or set(rates) != {str(value) for value in expected_ids}:
        raise ValueError("Profile BFS coverage is incomplete")
    for bfs_id, series in rates.items():
        if not isinstance(series, list) or len(series) != len(INCOMES):
            raise ValueError(f"Profile BFS {bfs_id} has invalid income coverage")
        for values in series:
            if not isinstance(values, list) or len(values) != 3:
                raise ValueError(f"Profile BFS {bfs_id} has invalid components")
            if any(
                isinstance(value, bool)
                or not isinstance(value, (int, float))
                or not math.isfinite(value)
                or value < 0
                for value in values
            ):
                raise ValueError(f"Profile BFS {bfs_id} has an invalid component value")


def profile_path(household: str, church: str) -> Path:
    return OUTPUT_DIR / f"{household}-{church}.json"


def valid_existing(household: str, church: str, expected_ids: set[int]) -> bool:
    path = profile_path(household, church)
    if not path.exists():
        return False
    try:
        dataset = json.loads(path.read_text(encoding="utf-8"))
        validate_dataset(dataset, household, church, expected_ids)
        return True
    except (OSError, ValueError, json.JSONDecodeError):
        return False


def request_payload(household: str, church: str) -> dict[str, Any]:
    return {
        "massExportModelId": MODELS[household],
        "belastungsVergleich": 2,
        "taxGroup": 99,
        "confession": CHURCHES[church],
        "incomes": INCOMES,
        "fortunes": [],
        "klasse": 1,
        "years": [YEAR],
        "output": 1,
        "considerMaximumExposureLimit": False,
        "investmentIncome": None,
    }


def download_profile(household: str, church: str) -> dict[str, Any]:
    request = urllib.request.Request(
        API_URL,
        data=json.dumps(request_payload(household, church)).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "CH-Tax-Compare/2026 data preparation",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=180) as response:
        return json.load(response)


def write_atomic(path: Path, dataset: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary_name = temporary.name
            json.dump(dataset, temporary, ensure_ascii=False, separators=(",", ":"))
            temporary.write("\n")
        os.replace(temporary_name, path)
    finally:
        if temporary_name and os.path.exists(temporary_name):
            os.unlink(temporary_name)


def generate_profile(household: str, church: str, expected_ids: set[int]) -> str:
    path = profile_path(household, church)
    if valid_existing(household, church, expected_ids):
        return f"Kept valid {path.name}"

    last_error: Exception | None = None
    for attempt in range(3):
        try:
            payload = download_profile(household, church)
            dataset = parse_payload(payload, household, church, expected_ids)
            write_atomic(path, dataset)
            return f"Generated {path.name} ({path.stat().st_size:,} bytes)"
        except Exception as error:  # Network and validation failures share retry behavior.
            last_error = error
            if attempt < 2:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Could not generate {path.name}: {last_error}")


def update_metadata() -> None:
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    metadata.update({
        "valueMode": "estv-2026-official-gross-income-profiles",
        "incomeProfileYear": YEAR,
        "incomeProfileSource": API_URL,
        "incomeProfileData": "income-profiles/{household}-{church}.json",
        "incomeProfileCount": len(MODELS) * len(CHURCHES),
        "incomeProfileCoverage": len(political_bfs_ids()),
        "incomeProfileHouseholds": list(MODELS),
        "incomeProfileChurches": list(CHURCHES),
        "incomeProfileIncomes": INCOMES,
        "incomeProfileComponents": ["cantonal", "communal", "church"],
        "incomeProfileExcludes": ["federal", "personal"],
    })
    for obsolete_key in (
        "incomeScaleYear", "incomeScaleSource", "incomeScaleData",
        "incomeScaleCantons", "incomeScaleRows", "incomeCalculationModes",
        "taxMultiplierYear", "taxMultiplierSource", "taxMultiplierData",
        "taxMultiplierCoverage", "taxMultiplierUnit",
    ):
        metadata.pop(obsolete_key, None)
    write_atomic(METADATA_PATH, metadata)


def self_test() -> None:
    payload = {
        "data": [{
            "bfsId": 1,
            "income": 100000,
            "cantonalTax": [100],
            "municipalityTax": [50],
            "churchTax": [0],
        }]
    }
    try:
        parse_payload(payload, "single", "none", {1, 2})
    except ValueError as error:
        assert "Missing" in str(error), error
        return
    raise AssertionError("A missing BFS record must be rejected")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--only", nargs=2, metavar=("HOUSEHOLD", "CHURCH"))
    args = parser.parse_args()
    if args.self_test:
        self_test()
        print("Self-test passed")
        return

    combinations = list((household, church) for household in MODELS for church in CHURCHES)
    if args.only:
        household, church = args.only
        if household not in MODELS or church not in CHURCHES:
            parser.error("--only requires a valid household and church")
        combinations = [(household, church)]

    expected_ids = political_bfs_ids()
    if len(expected_ids) != 2110:
        raise ValueError(f"Expected 2,110 political municipalities, found {len(expected_ids)}")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(generate_profile, household, church, expected_ids): (household, church)
            for household, church in combinations
        }
        for future in as_completed(futures):
            try:
                print(future.result(), flush=True)
            except Exception as error:
                failures.append(str(error))
                print(error, flush=True)
    if failures:
        raise RuntimeError(f"{len(failures)} profile(s) failed; rerun to resume")
    if not args.only:
        update_metadata()
        print(f"Validated {len(combinations)} profiles and updated metadata")


if __name__ == "__main__":
    main()
