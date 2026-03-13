# BigBrother Electron App Branch

Electron-first React starter structure for the BigBrother desktop application.

## Run

- `npm run dev` starts Vite + Electron together.
- `npm run build` builds the renderer.
- `npm run start` starts Electron.
- `npm run lint` runs ESLint.

## Folder layout

- `electron/main.js` Electron main process and window lifecycle.
- `electron/preload.js` safe bridge API exposed to the renderer.
- `src/app/AppRouter.jsx` route definitions and page mounting.
- `src/app/routes.js` centralized route constants and nav links.
- `src/components/PageShell.jsx` shared page wrapper and top navigation.
- `src/pages/loginPage.jsx`
- `src/pages/adminHomePage.jsx`
- `src/pages/userHomePage.jsx`
- `src/pages/userProgressPage.jsx`
- `src/pages/adminTestingPage.jsx`
- `src/pages/adminApprovalPage.jsx`

## Notes

- Routing uses `HashRouter` for Electron compatibility.
- Tailwind is enabled via PostCSS in `postcss.config.mjs`.
