# Marvel Timeline

MCU & Marvel connections tracker. React (via `htm`, no build step) + Firebase Auth, Firestore and Hosting.

## Structure

```
.
├── index.html               Entry point (import map, stylesheets, favicons)
├── app.js                   App shell, page state and routing
├── favicon.ico, site.webmanifest
├── firebase.json, .firebaserc, firestore.rules, firestore.indexes.json
├── assets/icons/            Favicons, apple-touch-icon, PWA icons
├── css/                     styles, auth, settings, command-center, fun, improve, hq, theme-overrides
├── services/                firebase.js (init) and auth.js (auth hooks)
├── store/                   userData, siteConfig (themes), admin
├── data/                    projects, universes, franchises
├── utils/                   helpers, achievements, recommend, hq (Marvel HQ data layer), roadmap (Catch-up Roadmap), tmdb
├── components/              Shared UI; components/hq/ holds the Marvel HQ tabs
├── pages/                   One file per page (Home, Timeline, Marvel HQ, ...)
└── vendor/                  react.js wrapper (React 18 + htm via esm.sh)
```

The site root is the project root (`"public": "."` in firebase.json), so `index.html` sits next to `app.js`. Serve the project folder itself when testing locally (e.g. VS Code Live Server opened on this folder, or `firebase emulators:start --only hosting`).

## Deploy

```
firebase deploy --only hosting
```

After deploying, hard-refresh (Ctrl+Shift+R). Bump the `?v=` on `app.js` in `public/index.html` when you change JS to bust caches.

## Notes

- Stylesheet order in `index.html` matters: `theme-overrides.css` must stay last.
- Routes: `/` (SPA pages), `/hq` (Marvel HQ), `/admin`.
- Marvel HQ stores card-seen state and Marvel IQ scores in browser localStorage only; there are no extra Firestore collections.
