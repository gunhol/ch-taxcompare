# Federal tax toggle design

## Goal

Add an optional federal direct income tax component so users can switch between the current cantonal, communal, and church total and a broader total that also includes federal tax.

## Approved behavior

- The filter bar gains an **Include federal tax** switch.
- Federal tax is excluded by default, preserving current comparisons.
- The selection is shareable. `federal=1` enables it; the parameter is omitted when disabled.
- Every displayed or exported tax total follows the toggle: map colors and legend, both rankings, selected municipality, pinned comparison, and CSV.
- The selected municipality breakdown gains a **Federal** row only when federal tax is enabled.
- Scope labels dynamically state whether federal tax is included or excluded. Personal tax remains excluded in both modes.
- Existing income, household, church, canton, municipality, navigation, pinning, and map interactions remain unchanged.

## Data architecture

The official ESTV `income-tax-values` response already provides `federalTax` beside `cantonalTax`, `municipalityTax`, `churchTax`, and `personalTax`. The current preparation script discards federal tax.

Extend all 24 existing static household and church profiles with federal tax as the fourth numeric component in this order:

1. Cantonal
2. Communal
3. Church
4. Federal

This keeps one profile request and one loading state. A separate federal dataset or a locally reimplemented federal tariff is out of scope.

Update the Python preparation and validation logic to require all four components. Existing three-component profiles must be considered invalid and replaced from fresh ESTV responses. Update dataset metadata so available components include federal tax and only personal tax is excluded from the stored profiles.

The TypeScript dataset and tax breakdown types must expose federal tax. Total calculation adds federal tax only when the toggle is enabled. Effective rates and ranking order derive from that selected total.

## UI and URL integration

`App` owns the federal boolean and passes it to the filter bar and total calculation. URL parsing and serialization include the new setting without changing existing parameter behavior. Browser reload, back, and forward restore it.

The filter control uses a native checkbox or equivalent accessible switch with a visible label and keyboard focus. It fits the existing responsive filter layout without obscuring municipality search or result counts.

`FullRankings` exports the selected total and includes a federal-tax column when enabled. Exported rows must match the visible filters and sorting. Methodology, footer, captions, pinned comparison copy, README, PRODUCT, and AGENTS scope rules are updated to describe the optional federal component accurately.

## Loading and errors

Federal values travel in the existing profile responses, so no additional network request is introduced. Existing profile loading, retry, and error behavior applies. Malformed, missing, negative, or non-finite federal values invalidate the affected profile during data preparation. Unsupported `federal` URL values fall back to disabled.

## Verification

- Unit tests cover disabled and enabled totals, effective rates, ranking changes, URL round trips, malformed URL values, and official federal benchmark values.
- Python self-tests and full validation require four components and complete coverage across 24 profiles, 2,110 municipalities, and 27 incomes.
- Fresh ESTV benchmarks verify all components, including federal tax.
- Browser checks cover the default mode, toggle interaction, URL reload and history, map and ranking updates, selected breakdown, CSV export, method copy, and responsive layouts.
- Run lint, all unit tests, production build, and the full data validator before deployment.
- Deploy through the existing GitHub Pages workflow and verify the live site in both federal modes.
