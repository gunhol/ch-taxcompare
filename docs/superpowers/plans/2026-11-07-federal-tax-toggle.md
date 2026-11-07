# Federal Tax Toggle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an official ESTV federal direct income tax option to every comparison, with a default-off shareable toggle and consistent totals across the map, rankings, breakdowns, and CSV exports.

**Architecture:** Extend the existing 24 static ESTV profiles with a fourth `federalTax` component. Keep one profile request, add `includeFederal` to the existing app and URL state, and derive all displayed totals through the existing income calculation and ranking functions.

**Tech Stack:** Python 3 standard library, React 19, TypeScript, Vite, Node 26 LTS, node:test, GitHub Actions and GitHub Pages.

## Global Constraints

- Federal tax is excluded by default. `federal=1` enables it; the parameter is omitted when disabled.
- Personal tax remains excluded in both modes.
- Use official ESTV results only. Do not recreate federal tariffs or manually patch profile values.
- Every displayed or exported tax total follows the toggle.
- Keep one profile request and the existing loading and retry behavior.
- Follow `DESIGN.md` and run the `impeccable` interface review for visible changes. Use existing colors, typography, focus states, and responsive breakpoints.
- Run Node 26 commands with `npx --yes --package=node@26 --package=npm@11 -c '<command>'` when the local default Node is not 26.
- Do not commit `node_modules`, `dist`, browser artifacts, or local tooling.

---

### Task 1: Add federal tax to the official data pipeline

**Files:**
- Modify: `app/scripts/prepare_income_profiles.py`
- Modify: `app/scripts/verify_income_profiles.py` only if benchmark output needs clearer component labels
- Regenerate: `app/public/data/income-profiles/*.json`
- Modify: `app/public/data/metadata.json`

**Interfaces:**
- Consumes: ESTV response fields `cantonalTax`, `municipalityTax`, `churchTax`, and `federalTax`.
- Produces: Each `rates[bfsId][incomeIndex]` entry becomes `[cantonal, communal, church, federal]`; metadata lists all four components and excludes only `personal`.

- [ ] **Step 1: Add a failing parser self-test for a missing federal component**

At the start of `self_test()`, before the existing incomplete-BFS block that returns early, add a complete one-record payload with valid cantonal, communal, and church series but no `federalTax`. Call `parse_payload(payload, 'single', 'none', {1})` and require a `ValueError` containing `federalTax`. Keep the existing incomplete-BFS test after this new check.

```python
invalid_federal = {
    "data": [{
        "bfsId": 1,
        "income": 100000,
        "cantonalTax": [100],
        "municipalityTax": [50],
        "churchTax": [0],
    }]
}
try:
    parse_payload(invalid_federal, "single", "none", {1})
except ValueError as error:
    assert "federalTax" in str(error), error
else:
    raise AssertionError("A missing federalTax record must be rejected")
```

- [ ] **Step 2: Run the self-test and confirm the new failure**

Run: `cd app && python scripts/prepare_income_profiles.py --self-test`
Expected: FAIL with `AssertionError: A missing federalTax record must be rejected` because `COMPONENTS` currently excludes `federalTax`.

- [ ] **Step 3: Require and store all four official components**

Change the parser constant and tuple-length validation exactly:

```python
COMPONENTS = ("cantonalTax", "municipalityTax", "churchTax", "federalTax")
```

```python
if not isinstance(values, list) or len(values) != 4:
    raise ValueError(f"Profile BFS {bfs_id} has invalid components")
```

Update `update_metadata()`:

```python
metadata["incomeProfileComponents"] = ["cantonal", "communal", "church", "federal"]
metadata["incomeProfileExcludes"] = ["personal"]
```

Add valid `federalTax: [25]` values to fixtures that must pass. Keep all existing coverage, numeric, finite, and non-negative checks applied to every component.

- [ ] **Step 4: Run the self-test and regenerate every profile**

Run: `cd app && python scripts/prepare_income_profiles.py --self-test`
Expected: `Self-test passed`.

Run: `cd app && python scripts/prepare_income_profiles.py`
Expected: all 24 old three-component profiles are rejected by validation, downloaded afresh, and reported as `Generated`; final output reports 24 validated profiles and updated metadata.

- [ ] **Step 5: Validate fresh official data and inspect the committed scope**

Run: `cd app && python scripts/verify_income_profiles.py`
Expected: `Validated 24 profiles × 2,110 municipalities × 27 incomes`, correct Zug, Baar, Wollerau, and Bister rows, and `Fresh ESTV benchmark comparison passed`.

Run: `git status --short`
Expected: only the two scripts if changed, 24 profile JSON files, and `app/public/data/metadata.json` are modified.

- [ ] **Step 6: Commit the data pipeline change**

```bash
git add app/scripts/prepare_income_profiles.py app/scripts/verify_income_profiles.py app/public/data
git commit -m "Add official federal tax to income profiles"
```

---

### Task 2: Calculate optional federal totals in TypeScript

**Files:**
- Modify: `app/src/types/geography.ts`
- Modify: `app/src/lib/income.ts`
- Modify: `app/src/lib/tax.ts`
- Test: `app/src/lib/income.test.ts`
- Test: `app/src/lib/tax.test.ts`

**Interfaces:**
- Consumes: Four-component profiles from Task 1.
- Produces: `incomeTaxValue(profile, bfsId, income, includeFederal = false)` and `buildRanking(features, profile, income, includeFederal = false)`; `IncomeTaxBreakdown` always exposes `federalTax` while `total`, `value`, and `effectiveRate` follow the flag.

- [ ] **Step 1: Write failing official benchmark and ranking tests**

Extend the Bister benchmark:

```ts
const local = incomeTaxValue(profile, 6172, 100000)
assert.equal(local.federalTax, 1701)
assert.equal(local.total, 11965)

const federal = incomeTaxValue(profile, 6172, 100000, true)
assert.equal(federal.cantonTax, 6301)
assert.equal(federal.communeTax, 5664)
assert.equal(federal.churchTax, 0)
assert.equal(federal.federalTax, 1701)
assert.equal(federal.total, 13666)
assert.equal(federal.value, 13666)
assert.equal(federal.effectiveRate, 13.666)
```

Change the synthetic ranking row to `[1000, 500, 0, 200]` and add:

```ts
const federal = buildRanking([municipality, special], profile, 100000, true)
assert.equal(federal.length, 1)
assert.equal(federal[0].federalTax, 200)
assert.equal(federal[0].value, 1700)
assert.equal(federal[0].effectiveRate, 1.7)
```

- [ ] **Step 2: Run the unit tests and confirm federal-specific failures**

Run: `cd app && npm test`
Expected: FAIL because `federalTax` is absent and the enabled totals remain unchanged.

- [ ] **Step 3: Implement the minimal type and calculation changes**

Use these exact shapes:

```ts
rates: Record<string, [number, number, number, number][]>
```

```ts
export interface IncomeTaxBreakdown {
  value: number
  total: number
  cantonTax: number
  communeTax: number
  churchTax: number
  federalTax: number
  effectiveRate: number
}
```

Add `includeFederal = false` as the fourth argument to `incomeTaxValue`, destructure all four values, and calculate:

```ts
const [cantonTax, communeTax, churchTax, federalTax] = components
const total = cantonTax + communeTax + churchTax + (includeFederal ? federalTax : 0)
```

Return `federalTax` in the breakdown. Add the same default-false flag to `buildRanking` and pass it to `incomeTaxValue`.

- [ ] **Step 4: Run tests and type checking**

Run: `cd app && npm test && npx tsc -b`
Expected: all unit tests PASS and TypeScript exits 0. If untouched call sites fail, retain compatibility through the default-false argument rather than changing their behavior.

- [ ] **Step 5: Commit calculation changes**

```bash
git add app/src/types/geography.ts app/src/lib/income.ts app/src/lib/tax.ts app/src/lib/income.test.ts app/src/lib/tax.test.ts
git commit -m "Calculate optional federal income tax totals"
```

---

### Task 3: Add federal state to shareable URLs

**Files:**
- Modify: `app/src/lib/urlState.ts`
- Test: `app/src/lib/urlState.test.ts`

**Interfaces:**
- Produces: `ShareState.includeFederal: boolean`; `DEFAULT_SHARE_STATE.includeFederal === false`; parsing accepts only `federal=1` as enabled and serialization emits only that enabled form.

- [ ] **Step 1: Write failing default, round-trip, and malformed-value tests**

Add `includeFederal: true` to the existing round-trip state and use this expected query:

```ts
const search = '?income=150000&household=marriedDualWithChildren&church=protestant&federal=1&canton=SZ&municipality=1323'
```

Add:

```ts
test('defaults federal tax to excluded and only shares an enabled selection', () => {
  assert.equal(parseShareState('').includeFederal, false)
  assert.equal(parseShareState('?federal=1').includeFederal, true)
  assert.equal(parseShareState('?federal=yes').includeFederal, false)
  assert.equal(createShareSearch({ ...DEFAULT_SHARE_STATE, includeFederal: true }), '?federal=1')
})
```

- [ ] **Step 2: Run URL tests and confirm the failure**

Run: `cd app && node --test src/lib/urlState.test.ts`
Expected: FAIL because `includeFederal` is absent and `federal=1` is not preserved.

- [ ] **Step 3: Implement URL parsing and serialization**

Add `includeFederal: boolean` to `ShareState`, `includeFederal: false` to defaults, then:

```ts
includeFederal: params.get('federal') === '1',
```

Serialize immediately after `church`:

```ts
if (state.includeFederal) params.set('federal', '1')
```

- [ ] **Step 4: Run URL tests and commit**

Run: `cd app && node --test src/lib/urlState.test.ts`
Expected: all URL tests PASS.

```bash
git add app/src/lib/urlState.ts app/src/lib/urlState.test.ts
git commit -m "Share federal tax selection in URLs"
```

---

### Task 4: Add the accessible toggle and update every comparison view

**Files:**
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/FilterBar.tsx`
- Modify: `app/src/components/RankingPanel.tsx`
- Modify: `app/src/components/PinnedComparison.tsx`
- Modify: `app/src/components/FullRankings.tsx`
- Modify: `app/src/App.css`

**Interfaces:**
- Consumes: `includeFederal` URL state and the calculation flag from Tasks 2 and 3.
- Produces: `FilterBarProps.includeFederal: boolean` and `onIncludeFederal(value: boolean)`; all ranking and detail components receive the selected mode and render the corresponding totals.

- [ ] **Step 1: Add a browser regression check before UI implementation**

Extend the existing browser verification script with this scenario:

1. Load the base URL and confirm **Include federal tax** is unchecked and Bister is not required for the initial view.
2. Select `?canton=VS&municipality=6172`, wait for Bister, and record `11'965` CHF.
3. Check **Include federal tax** and confirm the URL contains `federal=1`, the selected total becomes `13'666`, the effective rate becomes `13.67%`, and a **Federal** definition of `1'701` appears.
4. Reload and confirm the toggle, Bister total, and federal breakdown persist.
5. Navigate away and back with browser history and confirm the selected mode restores.
6. Open rankings and confirm Bister's total matches the map mode.
7. Repeat at 390 px and confirm no horizontal overflow and the checkbox remains operable.

Run the scenario against the local app before implementation.
Expected: FAIL because the checkbox and federal breakdown do not exist.

- [ ] **Step 2: Wire app state and calculations**

In `App.tsx` add:

```ts
const [includeFederal, setIncludeFederal] = useState(initialShare.includeFederal)
```

Restore it in `restoreShareState` with `setIncludeFederal(state.includeFederal)`. Pass it to `createShareSearch`, include it in the synchronization effect dependencies, and pass it to `buildRanking`. Add it to the ranking memo dependencies.

Use one scope string for captions and footer:

```ts
const taxScope = includeFederal
  ? 'Federal tax included · personal tax excluded'
  : 'Federal and personal taxes excluded'
```

Pass `includeFederal` and `setIncludeFederal` to `FilterBar`; pass `includeFederal` to `RankingPanel`, `PinnedComparison`, and `FullRankings`. `MethodView` is wired in Task 5 with its methodology copy.

- [ ] **Step 3: Implement the native filter control**

Add the props to `FilterBar` and place a compact field before municipality search:

```tsx
<div className="filter-field federal-field">
  <label className="federal-toggle" htmlFor="federal-filter">Federal tax</label>
  <label className="federal-switch">
    <input
      id="federal-filter"
      type="checkbox"
      checked={props.includeFederal}
      onChange={event => props.onIncludeFederal(event.target.checked)}
    />
    <span>{props.includeFederal ? 'Included in total' : 'Include in total'}</span>
  </label>
</div>
```

Style with existing CSS variables. Keep the native checkbox visible or visually hidden only with a fully keyboard-accessible replacement, a clear checked state, and an amber focus outline. Use at least a 44 px touch target at the 600 px breakpoint. Extend the desktop grid without shrinking search below a usable width; at 900 px and 600 px retain the existing two-column and one-column flows.

- [ ] **Step 4: Update details, pinned comparison, and scope copy**

In `RankingPanel`, render this row after church only when enabled:

```tsx
{includeFederal && <div><dt>Federal</dt><dd>{CHF.format(activeItem.federalTax)}</dd></div>}
```

Replace fixed federal-exclusion sentences in the map caption, pinned comparison, full rankings, and footer with the active scope. Do not change official profile labels, tax year, or personal-tax exclusion.

- [ ] **Step 5: Run browser and responsive verification**

Run the scenario from Step 1 plus the existing complete browser suite.
Expected: all existing interactions and the new federal scenario PASS at desktop, tablet, and 390 px widths. Run the `impeccable` interface review and fix only issues introduced by this feature.

- [ ] **Step 6: Commit the UI integration**

```bash
git add app/src/App.tsx app/src/App.css app/src/components/FilterBar.tsx app/src/components/RankingPanel.tsx app/src/components/PinnedComparison.tsx app/src/components/FullRankings.tsx
git commit -m "Add federal tax toggle to comparison views"
```

---

### Task 5: Make CSV and methodology federal-aware

**Files:**
- Create: `app/src/lib/csv.ts`
- Create: `app/src/lib/csv.test.ts`
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/FullRankings.tsx`
- Modify: `app/src/components/MethodView.tsx`
- Modify: `README.md`
- Modify: `PRODUCT.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Produces: `incomeRankingCsv(items, options): string`, where options contain `income`, `household`, `church`, and `includeFederal`; the header and rows include `federal_tax_chf` only in enabled mode.

- [ ] **Step 1: Write failing CSV unit tests**

Create a synthetic ranked municipality with cantonal `1000`, communal `500`, church `0`, federal `200`, total `1500` or `1700` depending on mode. Test:

```ts
const local = incomeRankingCsv([item], { income: 100000, household: 'single', church: 'none', includeFederal: false })
assert.equal(local.includes('federal_tax_chf'), false)
assert.match(local, /total_income_tax_chf/)
assert.match(local, /1000\.00,500\.00,0\.00,1500\.00/)

const federal = incomeRankingCsv([item], { income: 100000, household: 'single', church: 'none', includeFederal: true })
assert.match(federal, /church_tax_chf,federal_tax_chf,total_income_tax_chf/)
assert.match(federal, /1000\.00,500\.00,0\.00,200\.00,1700\.00/)
```

Also assert quotes in a municipality name such as `Test "North"` are escaped as `"Test ""North"""` in both modes.

- [ ] **Step 2: Run the CSV test and confirm it fails**

Run: `cd app && node --test src/lib/csv.test.ts`
Expected: FAIL because `csv.ts` does not exist.

- [ ] **Step 3: Implement and integrate CSV generation**

Create `CsvOptions` and `incomeRankingCsv` in `csv.ts`. Move the existing `escape` behavior into the module, construct the base header through `church_tax_chf`, append `federal_tax_chf` only when enabled, then append total and effective rate. Use the item's already selected `total` and `effectiveRate`; do not recalculate them in the CSV module.

Replace the inline header and row construction in `FullRankings` with `incomeRankingCsv(items, { income, household, church, includeFederal })`. Add `-federal` to the downloaded filename only when enabled.

- [ ] **Step 4: Update user-facing methodology and project docs**

Pass `includeFederal` from `App` to `MethodView`. Its lead and scope section state that cantonal, communal, selected church, and optional federal direct tax are available. Clearly state that personal tax remains excluded. Explain that the toggle adds official federal results to the same household profile.

Update README, PRODUCT, and AGENTS so the scope is optional federal tax rather than always excluded. Keep source links, static-data architecture, six household models, four church options, and the no-tax-advice disclaimer unchanged.

- [ ] **Step 5: Run CSV, full unit, and browser export checks**

Run: `cd app && npm test`
Expected: all unit tests PASS.

In the browser suite, export the same filtered ranking in both modes. Assert the disabled CSV has no federal column and the enabled CSV includes official federal values and the visible selected total.

- [ ] **Step 6: Commit export and documentation changes**

```bash
git add app/src/App.tsx app/src/lib/csv.ts app/src/lib/csv.test.ts app/src/components/FullRankings.tsx app/src/components/MethodView.tsx README.md PRODUCT.md AGENTS.md
git commit -m "Add federal-aware exports and methodology"
```

---

### Task 6: Full verification and GitHub Pages deployment

**Files:**
- Verify all modified files from Tasks 1 through 5.
- Modify only files required to fix a reproduced verification failure.

**Interfaces:**
- Consumes: Completed data, calculation, URL, UI, and CSV behavior.
- Produces: A verified production deployment with both tax modes working.

- [ ] **Step 1: Run the complete local verification under Node 26**

Run:

```bash
cd app
npx --yes --package=node@26 --package=npm@11 -c 'node --version && npm ci && npm run lint && npm test && npm run build'
python scripts/verify_income_profiles.py
```

Expected: Node 26.x, lint exits 0, all tests PASS, production build succeeds, all 24 profiles validate, and fresh ESTV benchmarks pass.

- [ ] **Step 2: Run final browser and repository checks**

Run the complete browser suite against the production preview, including federal toggle interaction, URL reload and history, both CSV modes, loading recovery, pinch zoom, selection, pinning, and responsive widths.

Run: `git diff --check && git status --short`
Expected: no whitespace errors and no unintended files. The working tree is clean after task commits.

- [ ] **Step 3: Push and deploy**

Run: `git push origin main`
Expected: the existing `Deploy to GitHub Pages` workflow starts for the final commit.

Run: `gh run list --workflow deploy.yml --limit 1`
Then: `gh run watch <run-id> --exit-status`
Expected: `conclusion` is `success` after install, lint, tests, build, Pages setup, upload, and deployment.

- [ ] **Step 4: Verify both live modes**

Open `https://gunhol.github.io/ch-taxcompare/?canton=VS&municipality=6172` and confirm Bister at CHF 100,000 shows CHF 11,965 with federal tax excluded. Enable the toggle and confirm `federal=1`, CHF 13,666, and Federal CHF 1,701. Reload the URL, check rankings and the method page, and confirm no loading error or missing static asset.

If this fails, capture the exact failed step or live symptom, diagnose the root cause, add a regression check, fix it, rerun all affected checks, and redeploy before reporting completion.
