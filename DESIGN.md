---
name: CH Tax Compare
description: A linked Swiss municipality map and ranking for scenario-based comparison.
colors:
  mineral-navy: "oklch(31% 0.056 233)"
  sea-glass: "oklch(62% 0.095 179)"
  ice: "oklch(96.5% 0.008 175)"
  amber: "oklch(82% 0.13 86)"
  coral: "oklch(66% 0.16 35)"
  paper: "oklch(99.2% 0.003 175)"
  ink-muted: "oklch(43% 0.045 224)"
  border: "oklch(81% 0.025 193)"
typography:
  display:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, sans-serif"
    fontSize: "38px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, sans-serif"
    fontSize: "27px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  label:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.55
    letterSpacing: "0em"
  measurement:
    fontFamily: "Spline Sans Mono, monospace"
    fontSize: "10px"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "0.035em"
rounded:
  sm: "4px"
  md: "5px"
  lg: "6px"
  xl: "7px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.mineral-navy}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "9px 14px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.mineral-navy}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "9px 14px"
    height: "42px"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.mineral-navy}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "8px 9px"
    height: "40px"
  badge-demo:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.mineral-navy}"
    typography: "{typography.measurement}"
    rounded: "{rounded.sm}"
    padding: "6px 9px"
    height: "32px"
  navigation-shell:
    backgroundColor: "{colors.mineral-navy}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    padding: "0 28px"
    height: "68px"
---

# Design System: CH Tax Compare

## Overview

**Creative North Star: "The Regional Observatory"**

The interface treats geography and ranking as two readings of the same evidence. It is dense without becoming cramped, using an administrative map, compact tabular rows, and explicit source labels instead of decorative dashboard cards. The ESTV 2026 income-tax scope is always visible.

The visual character is cool, mineral, and editorial. Navy provides structure, ice opens the working field, and sea-glass, amber, and coral carry data or selection meaning. Precision comes from alignment, typography, and one linked highlight at a time.

**Key Characteristics:**
- Real administrative geometry is the primary visual surface.
- Map polygons and ranking rows share hover, selection, and pinning states.
- Compact evidence labels keep geography, year, and income-tax scope visible.
- Flat working surfaces alternate with sparse floating overlays.

## Colors

The palette separates interface structure from data encoding so neither competes with the real map.

### Primary
- **Mineral Navy**: navigation, table headers, primary actions, boundary lines, and primary text.
- **Sea-glass**: data accents, active structure lines, source markers, and the lower end of the map scale.

### Secondary
- **Amber**: keyboard focus, current selection, ESTV status, and intermediate map values.
- **Coral**: reserved for the upper end of the income-tax scale and destructive hover emphasis.

### Neutral
- **Ice**: the cool page field and map ground.
- **Paper**: filter, ranking, method, and footer working surfaces.
- **Muted Ink**: secondary labels, supporting copy, and metadata.
- **Border**: quiet separators and control outlines.

**The Evidence Before Ornament Rule.** Color must identify geography, data, selection, or interface structure. Do not introduce decorative color fields that compete with the map.

## Typography

**Display Font:** Schibsted Grotesk, with Helvetica Neue and sans-serif fallbacks.
**Body Font:** Schibsted Grotesk.
**Label/Mono Font:** Spline Sans Mono for identifiers, measurements, and compact evidence labels.

The grotesk carries place names and task language with compact, slightly tightened headings. The mono face is a measurement voice, not a general technical styling device. Numeric columns use tabular figures.

### Hierarchy
- **Display**: full rankings and method page headings.
- **Headline**: the comparison surface title and major section headings.
- **Title**: ranking, selected-place, and source-panel headings.
- **Body**: controls, explanatory copy, and table content.
- **Label**: field names, compact actions, and supporting evidence.
- **Measurement**: BFS identifiers, ESTV status, ranks, and legend values.

**The Measurement Voice Rule.** Use Spline Sans Mono only when the content is a number, identifier, or compact measurement label. Keep prose and place names in Schibsted Grotesk.

## Layout

The desktop comparison uses a fluid map column beside a fixed ranking rail. A navy navigation bar and paper filter strip establish the working context above it. At 1200px the ranking narrows and pinned items move to two columns. At 900px the map and ranking stack, navigation wraps, and filters use two columns. At 600px filters and pinned items become single-column flows with larger touch targets.

Page gutters are 28px on wide screens, 20px at intermediate widths, and 16px on phones. Method prose stays within a readable 70ch measure. Tables may scroll inside their own containers, but the page itself must never scroll horizontally.

## Elevation & Depth

Working surfaces are flat and separated by rules or tonal shifts. Shadows belong only to floating elements: search results use `0 12px 32px oklch(24% 0.04 225 / .22)` and map tooltips use `0 8px 24px oklch(24% 0.04 225 / .25)`.

**The Flat-by-Default Rule.** Do not add shadows to tables, pinned places, filter groups, or content panels. Use a shadow only when an element floats above the working surface.

## Shapes

Controls use small, precise radii between 4px and 7px. Panels and pinned comparisons are generally square and divided by fine rules. Circular forms are reserved for the income slider thumb and status dot. The map retains the actual organic geometry of administrative boundaries.

Focus uses a 3px amber outline with a 3px offset. Selection is expressed through amber strokes, tinted row backgrounds, and markers rather than inflated containers.

## Components

### Buttons
- **Primary:** navy fill, paper text, 5px radius, and a 42px minimum height.
- **Secondary:** paper fill with a quiet border; hover and pinned states turn amber.
- **Icon:** transparent square controls with clear accessible names and 44px touch targets on phones.
- **Disabled:** reduced opacity and no pointer action.

### Inputs / Fields
Income pairs a large numeric field with a teal range control. Household, church, canton, and sorting use native selects. Search combines municipality names and BFS identifiers in a keyboard-accessible listbox. Focus remains visible through amber outlines or a teal income underline.

### Navigation
The navy shell contains the brand, three task destinations, and a persistent ESTV income-tax status. The current destination receives a 3px amber underline. On phones the brand and status share the first row and navigation spans the next.

### Map and Ranking
The map uses five data colors, navy canton outlines, lake cutouts, city labels, zoom controls, and pinned markers. Hovering a ranking row outlines the same polygon; selecting either updates the selected-place panel and its cantonal, communal, and church breakdown. Special areas remain visible but cannot be ranked or pinned.

### Pinned Comparison
Up to four municipalities share a ruled comparison grid. Each item exposes its BFS identity, estimated CHF tax, selection action, and removal action. A tonal summary states the pairwise difference and repeats the federal-tax exclusion.

### Method and Provenance
The method view pairs readable explanatory prose with a compact source panel. Geometry, commune names, ESTV scales, multipliers, calculation limits, and local hosting remain directly reachable.

## Do's and Don'ts

### Do:
- **Do** keep the real map and ranking linked through hover, focus, selection, and pinning.
- **Do** label estimates with taxable income, household, church selection, and source year.
- **Do** preserve visible keyboard focus and 44px phone targets for primary touch actions.
- **Do** keep source, year, and geographic coverage easy to find.

### Don't:
- **Don't** replace the administrative map with abstract shapes or decorative cartography.
- **Don't** use coral or amber as general decoration when their data or selection meaning would become ambiguous.
- **Don't** present estimates as final tax assessments or tax advice.
- **Don't** add floating cards, ornamental shadows, or motion that interrupts comparison work.
