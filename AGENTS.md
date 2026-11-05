# AGENTS.md

## Scope

These instructions apply to the entire repository. The application lives in `app/`; run npm commands there.

## Project constraints

- Keep the app fully static. Do not add a backend, account system, runtime tax API, analytics, or tracking.
- Use only real administrative geography. Do not replace the Swiss map with abstract shapes.
- Never invent, estimate, or manually patch tax values. Tax figures must come from the documented official sources in `README.md`.
- Keep the current scope: 2026 cantonal, communal, and selected church income tax. Federal and personal taxes remain excluded unless the product scope is deliberately changed and labels are updated everywhere.
- Preserve source attribution, tax year, household scope, and calculation limitations in the interface and documentation.
- Treat results as comparison estimates, never as tax advice or a personal assessment.

## Development commands

```sh
cd app
npm ci
npm run dev
npm run lint
npm test
npm run build
```

Before finishing an application change, run lint, tests, and the production build. For income-data logic changes, also run:

```sh
python scripts/prepare_income_profiles.py --self-test
```

When bundled tax data changes, run `python scripts/verify_income_profiles.py`. It requires network access because it compares selected records with fresh ESTV results.

## Architecture

- `src/App.tsx` owns application state, navigation, and URL synchronization.
- `src/lib/urlState.ts` parses and serializes the shareable comparison state. Defaults are omitted from URLs; `municipality=0` means no selection.
- `src/hooks/` loads static geography and income-profile JSON with loading and error states.
- `src/lib/income.ts` and `src/lib/tax.ts` contain bracket and tax calculations. Add or update unit tests for changes here.
- `src/components/SwissMap.tsx` renders TopoJSON and owns map interaction. Keep zoom bounded and distinguish click selection from drag or pinch gestures.
- `src/components/MethodView.tsx` is the user-facing methodology and source view. Keep it consistent with the root README and dataset metadata.
- `public/data/` contains committed runtime assets. Do not manually edit generated profile or geography files.

## Data updates

- `scripts/prepare_income_profiles.py` downloads missing or invalid ESTV profiles. Existing valid profiles are kept, so a source refresh requires an intentional replacement strategy rather than assuming reruns fetch new values.
- Validate the expected 24 profiles, 27 income brackets, and 2,110 political municipalities after data work.
- `scripts/prepare_geography.py` depends on local source captures that are not committed. Do not make normal builds depend on it.
- Update `public/data/metadata.json`, the Method view, and the README source index when sources, years, coverage, or methodology change.

## UI and accessibility

- Follow `DESIGN.md`. Keep the interface precise, flat, compact, and evidence-led.
- Preserve visible keyboard focus, accessible control names, and phone touch targets.
- Keep map and ranking hover, selection, and pinning synchronized.
- Test desktop and mobile layouts, including long municipality and canton names.
- Do not introduce decorative map colors, ornamental cards, or ambiguous data colors.

## Deployment and repository hygiene

- GitHub Pages deployment is defined in `.github/workflows/deploy.yml` and publishes only `app/dist` after successful checks.
- Keep Vite asset paths relative so project subpaths and custom domains work.
- Commit source files, the lockfile, static runtime data, tests, and documentation. Do not commit `node_modules`, `dist`, logs, caches, local environment files, or agent workspaces.
- Do not add generated build output or local review artifacts to version control.
