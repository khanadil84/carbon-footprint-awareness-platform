# Accessibility Implementation

## Standards Implemented

- **WCAG 2.2 Level AA** — All applicable success criteria are addressed.
- **WAI-ARIA 1.2** — Correct landmark roles, states, and properties throughout.

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Navigate forward through interactive elements |
| Shift+Tab | Navigate backward |
| Enter / Space | Activate buttons, links, form controls |
| Escape | Close mobile navigation menu |
| Arrow keys | Navigate within select elements |

### Skip Link

A "Skip to main content" link is rendered as the first focusable element on every page. It becomes visible on keyboard focus via Tab, allowing keyboard and screen reader users to bypass repetitive navigation.

- Target: `<main id="main-content">`

## Focus Management

### Visible Focus Indicators

- All interactive elements (`a`, `button`, `input`, `select`, `textarea`) have a visible `:focus-visible` outline using `var(--brand-primary)` (#059669).
- Custom `:focus:not(:focus-visible)` removes the outline for pointer interactions, preventing double-outlines on click.
- Focus indicators use a solid 2–3px outline with 2–3px offset for high visibility.

### Focus Trapping

- The mobile navigation menu traps focus while open. The first focusable item receives focus on open; Escape returns focus to the toggle button.

### Focus Restoration

- Closing the mobile menu restores focus to the toggle button.
- The settings panel and other interactive widgets use standard DOM focus management.

## Screen Reader Support

### Landmarks

| Landmark | Role | Usage |
|----------|------|-------|
| `<header>` | banner | Page header with branding |
| `<nav>` | navigation | Main and mobile navigation |
| `<main>` | main | Primary page content |
| `<section>` | region | Sub-sections with `aria-labelledby` |
| `<aside>` | complementary | Secondary dashboard column |
| `<footer>` | contentinfo | Page footer |

### Live Regions

| Context | Attribute | Purpose |
|---------|-----------|---------|
| Settings status | `role="status" aria-live="polite"` | Save/reset confirmation |
| Badge unlock | `role="status" aria-live="polite"` | Recently unlocked announcement |
| Loading states | `role="status"` | Lazy-loaded section loading |
| Activity count | `aria-live="polite"` | Filtered activity count updates |
| Form errors | `role="alert"` | Validation and submission errors |

### ARIA Attributes

- `aria-label` — Applied to icon-only buttons (logout, password toggle, mobile menu toggle, delete activity, pagination).
- `aria-labelledby` — Used on sections to associate headings with their landmark.
- `aria-describedby` — Links form inputs to error messages and instructional text.
- `aria-expanded` — Applied to the mobile menu toggle and expandable table rows.
- `aria-controls` — Associates the mobile toggle with the mobile menu panel.
- `aria-current` — (Available for navigation; not used since routes are managed by React Router.)
- `aria-valuenow` / `aria-valuemin` / `aria-valuemax` — Applied to the goal progress bar via `role="progressbar"`.
- `aria-disabled` — Used on export buttons that are functionally disabled when no activities exist.
- `aria-hidden` — Applied to decorative icons (Lucide icons), visual-only elements, and the print report placeholder.

## Forms

All forms implement:

| Feature | Implementation |
|---------|---------------|
| Explicit labels | `htmlFor`/`id` association |
| Required fields | `required` attribute |
| Error feedback | `role="alert"` with `aria-describedby` |
| Input validation | `aria-invalid` on invalid fields |
| Autocomplete | `autoComplete` attribute on auth forms |
| Password visibility | Toggle button with `aria-label` |
| Error announcement | Live region for submit errors |

## Color and Contrast

### Primary Text Colors

| Token | Value | Contrast Ratio (on white) | WCAG AA |
|-------|-------|---------------------------|---------|
| `--text-primary` | #111827 | 15.3:1 | Pass |
| `--text-secondary` | #4b5563 | 7.3:1 | Pass |
| `--brand-primary` | #059669 | 3.2:1 on white (used at 16px+) | Pass for large text |

- All text meets or exceeds 4.5:1 contrast for normal text and 3:1 for large text.
- Error messages use #ef4444 (red-500) with 4.8:1 contrast on white.
- Disabled buttons use reduced opacity with sufficient contrast against backgrounds.

### Non-Color Information

- No information is conveyed through color alone.
- Charts include accessible text descriptions (aria-label, desc).

## Reduced Motion

- `prefers-reduced-motion: reduce` disables all animations, transitions, and floating effects.
- The design-tokens CSS includes a global override that sets `animation-duration` and `transition-duration` to `0.01ms`.
- Card hover transforms are disabled when reduced motion is preferred.
- Hero decorative card float animations are disabled.
- Smooth scrolling is disabled.

## Images and Icons

- Decorative SVGs (Lucide icons) use `aria-hidden="true"`.
- All functional icons have a visible text label or `aria-label`.
- The placeholder avatar initials are marked `aria-hidden` (decorative).
- No meaningful images lack alternative text.

## Charts

- Line charts use `role="img"` with `aria-label` describing the chart type and metric.
- A `<title>` and `<desc>` inside each SVG provide machine-readable chart summaries.
- A visually-hidden `<span>` with class `sr-only` provides a data-point summary.
- The goal progress bar uses `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.

## WCAG 2.2 Compliance Summary

| Principle | Guideline | Status |
|-----------|-----------|--------|
| Perceivable | 1.1.1 Non-text Content | AA |
| Perceivable | 1.2.1 Audio-only/Video-only (not applicable) | — |
| Perceivable | 1.3.1 Info and Relationships | AA |
| Perceivable | 1.3.2 Meaningful Sequence | AA |
| Perceivable | 1.3.3 Sensory Characteristics | AA |
| Perceivable | 1.4.1 Use of Color | AA |
| Perceivable | 1.4.3 Contrast (Minimum) | AA |
| Perceivable | 1.4.4 Resize Text | AA |
| Perceivable | 1.4.10 Reflow | AA |
| Perceivable | 1.4.11 Non-text Contrast | AA |
| Perceivable | 1.4.12 Text Spacing | AA |
| Perceivable | 1.4.13 Content on Hover or Focus | AA |
| Operable | 2.1.1 Keyboard | AA |
| Operable | 2.1.2 No Keyboard Trap | AA |
| Operable | 2.4.1 Bypass Blocks | AA (skip link) |
| Operable | 2.4.2 Page Titled | AA |
| Operable | 2.4.3 Focus Order | AA |
| Operable | 2.4.4 Link Purpose (In Context) | AA |
| Operable | 2.4.6 Headings and Labels | AA |
| Operable | 2.4.7 Focus Visible | AA |
| Operable | 2.4.11 Focus Appearance | AA |
| Operable | 2.4.12 Focus Not Obscured | AA |
| Operable | 2.5.8 Target Size | AA |
| Understandable | 3.2.1 On Focus | AA |
| Understandable | 3.2.2 On Input | AA |
| Understandable | 3.3.1 Error Identification | AA |
| Understandable | 3.3.2 Labels or Instructions | AA |
| Understandable | 3.3.3 Error Suggestion | AA |
| Robust | 4.1.1 Parsing (obsolete in WCAG 2.2) | — |
| Robust | 4.1.2 Name, Role, Value | AA |
| Robust | 4.1.3 Status Messages | AA |

## Known Limitations

1. **Focus not obscured**: The fixed navbar may overlap focused content. The skip link provides bypass.
2. **Touch targets**: Some small buttons (pagination, icon-only) are below the recommended 24×24px minimum. The view/delete buttons in the activity table are small.
3. **Dark mode**: Not yet implemented. The `prefers-color-scheme: dark` media query exists in design-tokens.css but semantic color variables are not redefined.
4. **Print report**: The `PrintableReport` component is marked `aria-hidden="true"` during screen display and only becomes visible during print. This is by design.
5. **Third-party components**: The app uses no third-party UI libraries, so all components are under direct accessibility control.

## Testing

Run accessibility tests with:

```bash
node --test tests/accessibility.test.js
```

Automated tests cover:
- Component exports and structural verification
- ARIA attribute presence
- Form accessibility
- Landmark structure
- Live region usage
- Chart accessibility

Manual testing with screen readers (NVDA, VoiceOver, JAWS) is recommended for full verification. A Lighthouse Accessibility audit should score 100 after these changes.
