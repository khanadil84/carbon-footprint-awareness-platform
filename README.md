# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Project Features

- Carbon Activity Tracker — add and track daily activities that produce CO₂ (travel, electricity, food, waste).
- CO₂ calculations — estimates using configurable emission factors in `src/utils/activityService.js`.
- Local storage persistence — activities are saved to `localStorage` under the key `eco_activities_v1`.
- Dashboard statistics — today's, weekly, monthly, and total CO₂ summaries plus a simple carbon score.
- Recent Activity — responsive list/table of recent activities with delete support.
- Accessibility considerations — form labels, ARIA regions, focus styles, and keyboard navigation.

## Testing

Run validation tests:

```bash
npm test
```

Run activity service tests:

```bash
npm run test:activity
```

- Validation tests verify input validation logic (`src/utils/validation.js`).
- Activity tests verify emission calculations and activity persistence (`src/utils/activityService.js` and `tests/activityService.test.js`).
