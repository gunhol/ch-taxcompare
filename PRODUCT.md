# Product

## Platform

Static web application built with React, TypeScript, and Vite. GitHub Actions builds and deploys the app to GitHub Pages. There is no backend, database, account system, or runtime tax API.

## Users

Private individuals in Switzerland comparing personal income tax across municipalities, typically when relocating or evaluating where to live.

## Product purpose

Make current, municipality-level tax comparison publicly accessible through a real administrative map and linked rankings. The product uses official 2026 ESTV household profiles rather than maintaining a separate tax calculation engine.

## Core experience

- Select gross income, household model, church option, and canton.
- Explore the real municipal map through search, hover, selection, zoom, and pan.
- Compare rankings and pin up to four municipalities.
- Export the current ranking as CSV.
- Share the current comparison through URL parameters.
- Inspect methodology, coverage, limitations, and source links.

## Tax scope

The app covers annual cantonal, communal, and selected church income tax for 2026. Standard deductions are included in the official ESTV profiles. Federal direct tax and personal taxes are excluded.

Six household models cover single people and married couples, without children or with two children. Married models support one earner or equal 50/50 earnings. Four church options are available.

Results are comparison estimates, not personal tax assessments or tax advice. Individual deductions, wealth tax, corporate taxes, credits, and every personal circumstance are not modeled.

## Data and operating context

- All 2,110 political municipalities are ranked; three special areas remain visible only for geographic completeness.
- Twenty-four static profiles cover six household models, four church options, and 27 official income brackets.
- Runtime data is committed as static JSON. Data maintenance is separate from the site build and deployment.
- Geography, commune names, and tax results must retain documented source provenance.
- The interface is in English in the current release.

## Product principles

1. Comparison first: map, rankings, and pinned places are linked views of the same evidence.
2. Real geography: administrative boundaries are central to the product.
3. Static and accessible: the complete site works without a runtime service.
4. Show the method: source, year, coverage, and exclusions stay easy to find.
5. Never fabricate data or imply official endorsement.
