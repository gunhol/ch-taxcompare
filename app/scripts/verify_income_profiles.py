#!/usr/bin/env python3
"""Validate every static income profile and compare benchmarks with fresh ESTV data."""

import json

import prepare_income_profiles as profiles


def main() -> None:
    expected_ids = profiles.political_bfs_ids()
    paths = sorted(profiles.OUTPUT_DIR.glob("*.json"))
    assert len(paths) == 24, f"Expected 24 profiles, found {len(paths)}"
    for household in profiles.MODELS:
        for church in profiles.CHURCHES:
            path = profiles.profile_path(household, church)
            dataset = json.loads(path.read_text(encoding="utf-8"))
            profiles.validate_dataset(dataset, household, church, expected_ids)
    print("Validated 24 profiles × 2,110 municipalities × 27 incomes")

    fresh_payload = profiles.download_profile("single", "none")
    fresh = profiles.parse_payload(fresh_payload, "single", "none", expected_ids)
    local = json.loads(profiles.profile_path("single", "none").read_text(encoding="utf-8"))
    income_index = profiles.INCOMES.index(100000)
    for name, bfs_id in (("Zug", 1711), ("Baar", 1701), ("Wollerau", 1323), ("Bister", 6172)):
        actual = local["rates"][str(bfs_id)][income_index]
        expected = fresh["rates"][str(bfs_id)][income_index]
        assert actual == expected, f"{name}: local {actual} != fresh ESTV {expected}"
        print(f"{name}: {actual}, total CHF {sum(actual):,.0f}")
    print("Fresh ESTV benchmark comparison passed")


if __name__ == "__main__":
    main()
