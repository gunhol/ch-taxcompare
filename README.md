# CH Tax Compare

Compare official 2026 cantonal, communal, selected church, and optional federal direct income tax across all 2,110 Swiss political municipalities on an interactive administrative map.

CH Tax Compare is a fully static React and TypeScript application. It needs no account, database, backend, tracking service, or runtime tax API.

## Features

- Real 2026 Swiss municipal, cantonal, and lake geometry.
- Six household models, four church options, and 27 gross-income brackets from CHF 15,000 to CHF 100,000,000.
- Optional federal direct tax for the same official household profile.
- Linked map and rankings with municipality search, selection, and scope-aware CSV export.
- Up to four pinned municipalities for side-by-side comparison.
- Mouse, keyboard, touch, pinch-to-zoom, and bounded pan controls.
- Shareable URLs that preserve income, household, church, federal selection, canton, and selected municipality.
- Responsive desktop and mobile layouts.

## Run locally

Use Node.js 26 LTS, matching the deployment workflow. The included `.nvmrc` selects the 26.x line for nvm users.

```sh
cd app
npm ci
npm run dev
```

Vite prints the local development URL. To create and preview a production build:

```sh
npm run build
npm run preview
```

## Verify

Run from `app/`:

```sh
npm run lint
npm test
npm run build
```

Validate the bundled income data without changing it:

```sh
python scripts/verify_income_profiles.py
```

That validator checks all 24 profiles and compares selected municipalities with fresh ESTV results, so it requires network access. For an offline parser check, run `python scripts/prepare_income_profiles.py --self-test`.

## Data and methodology

The app bundles 24 official ESTV gross-income profiles: six household models multiplied by four church options. Each profile covers 2,110 political municipalities and 27 income brackets.

The six models cover single people and married couples, without children or with two children. Married models support one earner or equal 50/50 earnings. Church options are none, Protestant, Roman Catholic, and Christian Catholic.

The Federal Tax Administration calculates the profiles using official 2026 tariffs, standard deductions, household rules, and local tax multipliers. The app stores those results directly instead of recreating cantonal formulas.

Displayed totals include annual cantonal, communal, and selected church income tax. The federal tax toggle adds official federal direct tax results for the same household profile. CSV exports include an `include_federal` scope field, a `federal_tax_chf` column only when enabled, and the selected total in both modes. Personal taxes remain excluded. Individual deductions, wealth tax, corporate taxes, credits, and every personal circumstance are not modeled. Results are comparison estimates, not a personal tax assessment or tax advice.

Three special areas are shown on the map but excluded from tax rankings, pinning, and exports because the ESTV dataset has no municipal records for them.

## Source index

| Data | Authoritative source | How it is used |
| --- | --- | --- |
| Income tax profiles | [ESTV Swiss Tax Calculator: tax scales](https://swisstaxcalculator.estv.admin.ch/#/taxdata/tax-scales) and [municipality tax data](https://swisstaxcalculator.estv.admin.ch/#/taxdata/tax-rates) | Official 2026 gross-income results, requested through the calculator's [income-tax-values endpoint](https://swisstaxcalculator.estv.admin.ch/delegate/ost-integration/v1/maps/income-tax-values/EN) and bundled as static JSON. |
| Administrative geometry | [Swiss Maps 4.7.0](https://github.com/interactivethings/swiss-maps), [2026 combined TopoJSON](https://unpkg.com/swiss-maps@4.7.0/2026/ch-combined.json) | Municipalities, cantons, and lakes, derived by Interactive Things from Swisstopo administrative boundaries. |
| Names and administrative membership | [Federal Statistical Office commune directory](https://www.agvchapp.bfs.admin.ch/de/communes/query) | Municipality names, BFS identifiers, districts, and canton membership at the 1 January 2026 municipal status. |

Machine-readable provenance and coverage details are in [`app/public/data/metadata.json`](app/public/data/metadata.json). All runtime source data is committed under `app/public/data/`.

### Data maintenance

Run from `app/`:

```sh
python scripts/prepare_income_profiles.py
python scripts/verify_income_profiles.py
```

The preparation script downloads missing or invalid income profiles and validates complete BFS and income coverage. Existing valid profiles are left unchanged. The normal site build never downloads or regenerates data.

`scripts/prepare_geography.py` documents the geography join. It is a maintenance script that requires local source captures not included in the repository; it is not needed to run, test, build, or deploy the app.

## Shareable URLs

Filters use root query parameters. For example:

```text
?income=125000&household=marriedDualWithChildren&church=none&federal=1&canton=ZG&municipality=1711
```

Default values, including excluded federal tax, are omitted. `municipality=0` represents no selected municipality. Invalid values fall back safely, and browser back, forward, and reload preserve the comparison.

## GitHub Pages deployment

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs on every push to `main` and on manual dispatch. It installs dependencies, lints, tests, builds, and publishes `app/dist` with the official GitHub Pages actions.

For the first deployment:

1. Push this repository to GitHub.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Run the workflow manually if it did not start automatically.

Relative Vite asset paths support both project subpaths and custom domains.

## Project layout

```text
app/
  public/data/          Bundled geography, metadata, and income profiles
  scripts/              Data preparation and validation
  src/components/       Map, rankings, filters, and method view
  src/hooks/            Geography and income-profile loading
  src/lib/              Tax, income, and URL-state logic with tests
  src/App.tsx           Application state and navigation
.github/workflows/      GitHub Pages deployment
```

See [`AGENTS.md`](AGENTS.md) for contributor rules and [`DESIGN.md`](DESIGN.md) for the design system.

## Disclaimer

This is an independent comparison tool. It is not affiliated with or endorsed by ESTV, BFS, Swisstopo, or Interactive Things. Source data remains attributable to its respective providers.
